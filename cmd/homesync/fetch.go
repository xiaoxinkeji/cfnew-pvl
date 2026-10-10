// PublicVPNList 抓取器
//
// 两条路线（都实测通过）：
//  1. OpenVPN —— /local/api/vpn-data.php?status=all 一次拿全量清单（4.5 万行 / 33MB），
//     再对每条调 get_token.php 换 300 秒有效令牌取 .ovpn 原文。
//  2. 多协议 —— 翻 /{protocol}/ 列表页拿 64 位 ID，再调
//     /protocols/download.php?format=json 直接拿 share URI。
//
// 限流真实存在：令牌接口高频会 403，所以有退避重试 + 本地缓存。
package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"
)

const (
	publicVPNList = "https://publicvpnlist.com"
	vpnDataAPI    = publicVPNList + "/local/api/vpn-data.php?status=all"
	tokenAPI      = publicVPNList + "/get_token.php"
	downloadAPI   = publicVPNList + "/download.php"
	protoAPI      = publicVPNList + "/protocols/download.php"
)

// ProtocolPages PublicVPNList 的列表页就是协议名小写。
var ProtocolPages = []string{"vless", "trojan", "vmess", "shadowsocks", "hysteria2"}

var idRe = regexp.MustCompile(`id=([a-f0-9]{64})`)

// Harvester 带 cookie 的抓取器。publicvpnlist 会下 cookie，不带容易被 403。
type Harvester struct {
	client   *http.Client
	cacheDir string
	mu       sync.Mutex
	lastHit  time.Time
}

func NewHarvester(cacheDir string) (*Harvester, error) {
	jar, err := cookiejar.New(nil)
	if err != nil {
		return nil, err
	}
	if err := os.MkdirAll(cacheDir, 0o700); err != nil {
		return nil, err
	}
	return &Harvester{
		client:   &http.Client{Jar: jar, Timeout: 60 * time.Second},
		cacheDir: cacheDir,
	}, nil
}

// throttle 简单的串行节流，避免把源站打挂。
func (h *Harvester) throttle() {
	h.mu.Lock()
	defer h.mu.Unlock()
	if d := time.Since(h.lastHit); d < 200*time.Millisecond {
		time.Sleep(200*time.Millisecond - d)
	}
	h.lastHit = time.Now()
}

func (h *Harvester) get(rawURL string, headers map[string]string, timeout time.Duration) ([]byte, error) {
	return h.req(http.MethodGet, rawURL, nil, headers, timeout)
}

func (h *Harvester) req(method, rawURL string, body io.Reader, headers map[string]string, timeout time.Duration) ([]byte, error) {
	h.throttle()
	req, err := http.NewRequest(method, rawURL, body)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", userAgent)
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	client := h.client
	if timeout > 0 {
		c := *h.client
		c.Timeout = timeout
		client = &c
	}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(io.LimitReader(resp.Body, 64<<20))
	if err != nil {
		return nil, err
	}
	if resp.StatusCode == http.StatusForbidden || resp.StatusCode == http.StatusTooManyRequests {
		return nil, errors.New("被限流（HTTP " + strconv.Itoa(resp.StatusCode) + "），稍后重试")
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("HTTP %d", resp.StatusCode)
	}
	return raw, nil
}

// VPNRow 是 OpenVPN 清单里的一行。
type VPNRow struct {
	ID           int     `json:"id"`
	IP           string  `json:"ip"`
	Host         string  `json:"host"`
	Port         int     `json:"port"`
	Proto        string  `json:"proto"`
	Country      string  `json:"country"`
	Active       bool    `json:"active"`
	Downloadable bool    `json:"downloadable"`
	Throughput   float64 `json:"checkerMeasuredThroughputMbps"`
	RTT          float64 `json:"checkerMeasuredTunnelRttMs"`
}

// FetchCatalog 全量清单，落本地缓存（33MB，1 小时内复用）。
func (h *Harvester) FetchCatalog(refresh bool) ([]VPNRow, error) {
	cache := filepath.Join(h.cacheDir, "vpn-data.json")
	if !refresh {
		if info, err := os.Stat(cache); err == nil && time.Since(info.ModTime()) < time.Hour {
			logf("复用本地清单缓存（%.0f 分钟前），加 -refresh 强制重拉", time.Since(info.ModTime()).Minutes())
			raw, err := os.ReadFile(cache)
			if err == nil {
				var rows []VPNRow
				if err := json.Unmarshal(raw, &rows); err == nil {
					return rows, nil
				}
			}
		}
	}
	logf("拉取全量 OpenVPN 清单（约 33MB，慢）…")
	// 先访问首页拿 cookie
	_, _ = h.get(publicVPNList+"/", nil, 30*time.Second)
	raw, err := h.get(vpnDataAPI, map[string]string{
		"Accept":          "application/json",
		"Accept-Encoding": "identity", // gzip 分块会截断 JSON，必须关掉
		"Referer":         publicVPNList + "/",
	}, 180*time.Second)
	if err != nil {
		return nil, err
	}
	var rows []VPNRow
	if err := json.Unmarshal(raw, &rows); err != nil {
		return nil, fmt.Errorf("清单 JSON 解析失败: %w", err)
	}
	_ = os.WriteFile(cache, raw, 0o600)
	logf("清单 %d 行", len(rows))
	return rows, nil
}

// FetchOvpn 一条配置换一次令牌（300 秒有效），拿到 .ovpn 原文。
func (h *Harvester) FetchOvpn(id int, tries int) (string, error) {
	if tries <= 0 {
		tries = 2
	}
	var lastErr error
	for i := 0; i < tries; i++ {
		text, err := func() (string, error) {
			form := url.Values{"id": {strconv.Itoa(id)}}
			raw, err := h.req(http.MethodPost, tokenAPI, strings.NewReader(form.Encode()), map[string]string{
				"Content-Type":     "application/x-www-form-urlencoded",
				"X-Requested-With": "XMLHttpRequest",
				"Accept":           "application/json",
				"Referer":          fmt.Sprintf("%s/download/%d/", publicVPNList, id),
			}, 30*time.Second)
			if err != nil {
				return "", err
			}
			var tok struct {
				Token string `json:"token"`
				URL   string `json:"url"`
			}
			if err := json.Unmarshal(raw, &tok); err != nil {
				return "", fmt.Errorf("令牌响应解析失败: %w", err)
			}
			if tok.Token == "" {
				return "", errors.New("令牌为空")
			}
			cfg, err := h.get(downloadAPI+"?token="+url.QueryEscape(tok.Token), map[string]string{
				"Accept": "application/x-openvpn-profile",
			}, 30*time.Second)
			if err != nil {
				return "", err
			}
			s := string(cfg)
			if !strings.Contains(s, "remote ") {
				return "", errors.New("配置里没有 remote 行")
			}
			return s, nil
		}()
		if err == nil {
			return text, nil
		}
		lastErr = err
		// 403/429 退避
		if strings.Contains(err.Error(), "限流") && i < tries-1 {
			time.Sleep(time.Duration(3+rand.Intn(4)) * time.Second) //nolint:gosec // 退避不需要密码学随机
			continue
		}
		break
	}
	return "", lastErr
}

// ProtoNode 多协议节点。
type ProtoNode struct {
	Protocol string `json:"protocol"`
	ID       string `json:"id"`
	URI      string `json:"uri"`
}

// FetchProtocol 翻列表页拿 ID，再并发换 share URI。
func (h *Harvester) FetchProtocol(proto string, limit, pages, workers int) ([]ProtoNode, error) {
	if pages <= 0 {
		pages = 3
	}
	if workers <= 0 {
		workers = 8
	}
	var ids []string
	seen := map[string]bool{}
	for page := 1; page <= pages; page++ {
		u := fmt.Sprintf("%s/%s/?per_page=100", publicVPNList, proto)
		if page > 1 {
			u += "&page=" + strconv.Itoa(page)
		}
		raw, err := h.get(u, map[string]string{"Accept": "text/html"}, 60*time.Second)
		if err != nil {
			logf("%s 第 %d 页失败：%v", proto, page, err)
			break
		}
		pageText := string(raw)
		found := 0
		for _, m := range idRe.FindAllStringSubmatch(pageText, -1) {
			if !seen[m[1]] {
				seen[m[1]] = true
				ids = append(ids, m[1])
				found++
			}
		}
		if found == 0 {
			break
		}
		if limit > 0 && len(ids) >= limit*2 {
			break
		}
		if !strings.Contains(pageText, `rel="next nofollow"`) {
			break
		}
	}
	if limit > 0 && len(ids) > limit*2 {
		ids = ids[:limit*2]
	}
	logf("%s 收集到 %d 个配置 ID", proto, len(ids))

	type result struct {
		node ProtoNode
		ok   bool
	}
	jobs := make(chan string)
	results := make(chan result)
	var wg sync.WaitGroup
	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for id := range jobs {
				node, err := func() (ProtoNode, error) {
					u := fmt.Sprintf("%s?protocol=%s&id=%s&format=json", protoAPI, proto, id)
					raw, err := h.get(u, map[string]string{
						"Accept":  "application/json",
						"Referer": fmt.Sprintf("%s/%s/", publicVPNList, proto),
					}, 30*time.Second)
					if err != nil {
						return ProtoNode{}, err
					}
					var data struct {
						ConfigURI string `json:"config_uri"`
					}
					if err := json.Unmarshal(raw, &data); err != nil {
						return ProtoNode{}, err
					}
					if data.ConfigURI == "" {
						return ProtoNode{}, errors.New("config_uri 为空")
					}
					return ProtoNode{Protocol: proto, ID: id, URI: data.ConfigURI}, nil
				}()
				if err != nil {
					results <- result{ok: false}
					continue
				}
				results <- result{node: node, ok: true}
			}
		}()
	}
	go func() {
		for _, id := range ids {
			jobs <- id
		}
		close(jobs)
		wg.Wait()
		close(results)
	}()

	var out []ProtoNode
	for r := range results {
		if !r.ok {
			continue
		}
		out = append(out, r.node)
		if limit > 0 && len(out) >= limit {
			break
		}
	}
	logf("%s 拿到 %d 条可用配置", proto, len(out))
	return out, nil
}
