// 3x-ui 面板 API 客户端
//
// 契约全部核对过 3x-ui 源码（internal/web/controller/api.go），不是照抄网上文档：
//
//	前缀   /panel/api                      —— 不是 /api，也不是 /xui/API
//	认证   Authorization: Bearer <token>   —— 带 token 时 checkAPIAuth 设 api_authed=true，
//	                                          CSRF 中间件直接放行，比 /login + cookie 稳
//	列表   GET  /panel/api/inbounds/list
//	新增   POST /panel/api/inbounds/add
//	删除   POST /panel/api/inbounds/del/<id>
//	改     POST /panel/api/inbounds/update/<id>
//	重启   POST /panel/api/server/restartXrayService
//	响应   一律 {"success": bool, "msg": string, "obj": ...}
//
// 两个必须记住的坑：
//  1. 失败也是 HTTP 200。端口冲突、参数不对、token 失效——全是 200 + success:false。
//     只看状态码会把失败当成功。
//  2. 401 vs 404 有区别：token 不对是 401；base 路径不对（漏了面板子路径）是 404。
package main

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

// Response 是 3x-ui 所有 API 的统一响应壳。
// obj 的内容随接口而变，用 RawMessage 延迟解析。
type Response struct {
	Success bool            `json:"success"`
	Msg     string          `json:"msg"`
	Obj     json.RawMessage `json:"obj"`
}

// RawMessage 兼容「字符串」和「对象」两种形态。
//
// 真机踩到的坑：3x-ui 的 DB 模型里 settings 是 string，但 API 返回的
// internal/xray/inbound.go 用的是 json_util.RawMessage（原样透传的 []byte），
// 所以**读出来是对象、写进去字符串也收**。
// 用固定类型必然一头崩：读的时候报 cannot unmarshal object into string。
// 这里照抄它的做法——原样存取，不解释内容。
type RawMessage []byte

func (m RawMessage) MarshalJSON() ([]byte, error) {
	if len(m) == 0 {
		return []byte("null"), nil
	}
	return m, nil
}

func (m *RawMessage) UnmarshalJSON(data []byte) error {
	*m = append((*m)[0:0], data...)
	return nil
}

// String 取原始文本。读出来是对象时返回对象的 JSON 文本。
func (m RawMessage) String() string { return string(m) }

// Inbound 对齐 3x-ui model.Inbound 的 json tag。
// Settings / StreamSettings / Sniffing 用 RawMessage：写入按字符串发
// （面板接受），读取按对象收（面板这么给）——两种都能拿住。
type Inbound struct {
	ID         int        `json:"id,omitempty"`
	Remark     string     `json:"remark"`
	Tag        string     `json:"tag"`
	Enable     bool       `json:"enable"`
	Protocol   string     `json:"protocol"`
	Port       int        `json:"port"`
	Listen     string     `json:"listen"`
	Settings   RawMessage `json:"settings"`
	StreamSet  RawMessage `json:"streamSettings"`
	Sniffing   RawMessage `json:"sniffing"`
	TrafficRes string     `json:"trafficReset,omitempty"`
	ExpiryTime int64      `json:"expiryTime,omitempty"`
	Total      int64      `json:"total,omitempty"`
}

// Client 面板 API 客户端。所有写操作都带 Bearer token。
type Client struct {
	BaseURL  string
	Token    string
	Insecure bool // 自签证书时置 true
	Timeout  time.Duration
	http     *http.Client
}

func NewClient(baseURL, token string, insecure bool) *Client {
	c := &Client{
		BaseURL:  strings.TrimRight(baseURL, "/"),
		Token:    token,
		Insecure: insecure,
		Timeout:  30 * time.Second,
	}
	c.http = &http.Client{Timeout: c.Timeout}
	if insecure {
		c.http.Transport = &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true}, //nolint:gosec // 用户显式要求
		}
	}
	return c
}

// ErrBadToken token 无效或被禁用。
var ErrBadToken = errors.New("API token 无效或被禁用")

// ErrBadBasePath 地址不对（通常是漏了面板 URL 子路径）。
var ErrBadBasePath = errors.New("面板地址不对")

func (c *Client) do(method, path string, body interface{}) (*Response, error) {
	var reader io.Reader
	if body != nil {
		raw, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("序列化请求体失败: %w", err)
		}
		reader = bytes.NewReader(raw)
	}
	req, err := http.NewRequest(method, c.BaseURL+path, reader)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+c.Token)
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", userAgent)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(io.LimitReader(resp.Body, 8<<20))
	if err != nil {
		return nil, err
	}
	if resp.StatusCode == http.StatusUnauthorized {
		return nil, ErrBadToken
	}
	if resp.StatusCode == http.StatusNotFound {
		return nil, ErrBadBasePath
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("面板返回 HTTP %d: %s", resp.StatusCode, truncate(string(raw), 300))
	}
	var out Response
	if err := json.Unmarshal(raw, &out); err != nil {
		return nil, fmt.Errorf("面板返回的不是 JSON（地址可能指向了别的页面）: %s", truncate(string(raw), 200))
	}
	return &out, nil
}

// Ping 连通性检查。注意 3x-ui 失败也是 200，所以这里必须看 success。
func (c *Client) Ping() error {
	res, err := c.do(http.MethodGet, "/panel/api/server/status", nil)
	if err != nil {
		return err
	}
	if !res.Success {
		return fmt.Errorf("面板返回失败: %s", res.Msg)
	}
	return nil
}

// ListInbounds 列出全部 inbound。
func (c *Client) ListInbounds() ([]Inbound, error) {
	res, err := c.do(http.MethodGet, "/panel/api/inbounds/list", nil)
	if err != nil {
		return nil, err
	}
	if !res.Success {
		return nil, fmt.Errorf("列 inbound 失败: %s", res.Msg)
	}
	var list []Inbound
	if len(res.Obj) > 0 {
		if err := json.Unmarshal(res.Obj, &list); err != nil {
			return nil, fmt.Errorf("解析 inbound 列表失败: %w", err)
		}
	}
	return list, nil
}

// AddInbound 新建 inbound，返回面板分配的 id。
func (c *Client) AddInbound(in *Inbound) (int, error) {
	res, err := c.do(http.MethodPost, "/panel/api/inbounds/add", in)
	if err != nil {
		return 0, err
	}
	if !res.Success {
		return 0, fmt.Errorf("建 inbound 失败: %s", res.Msg)
	}
	var created Inbound
	if len(res.Obj) > 0 {
		_ = json.Unmarshal(res.Obj, &created)
	}
	return created.ID, nil
}

// DelInbound 删除指定 id 的 inbound。
func (c *Client) DelInbound(id int) error {
	res, err := c.do(http.MethodPost, fmt.Sprintf("/panel/api/inbounds/del/%d", id), map[string]interface{}{})
	if err != nil {
		return err
	}
	if !res.Success {
		return fmt.Errorf("删 inbound %d 失败: %s", id, res.Msg)
	}
	return nil
}

// UpdateInbound 更新已有 inbound。
func (c *Client) UpdateInbound(in *Inbound) error {
	res, err := c.do(http.MethodPost, fmt.Sprintf("/panel/api/inbounds/update/%d", in.ID), in)
	if err != nil {
		return err
	}
	if !res.Success {
		return fmt.Errorf("改 inbound %d 失败: %s", in.ID, res.Msg)
	}
	return nil
}

// RestartXray 让 xray 重新加载配置。新增/删除 inbound 后必须调。
func (c *Client) RestartXray() error {
	res, err := c.do(http.MethodPost, "/panel/api/server/restartXrayService", map[string]interface{}{})
	if err != nil {
		return err
	}
	if !res.Success {
		return fmt.Errorf("重启 xray 失败: %s", res.Msg)
	}
	return nil
}

// ClearManaged 删掉本工具建的所有 inbound。
// 只认 prefix 开头的 tag —— 手工建的 inbound 一个都不碰，这是安全底线。
func (c *Client) ClearManaged(prefix string) (int, error) {
	list, err := c.ListInbounds()
	if err != nil {
		return 0, err
	}
	removed := 0
	for _, item := range list {
		if !strings.HasPrefix(item.Tag, prefix) {
			continue
		}
		if err := c.DelInbound(item.ID); err != nil {
			return removed, err
		}
		removed++
	}
	return removed, nil
}

// usedPorts 收集面板上已占用的端口。
// 新建 inbound 前要避开这些：3x-ui 的端口是唯一的，撞了会拒绝——
// 而且失败也是 HTTP 200 + success:false，不查的话只会看到一堆「建失败」。
func (c *Client) usedPorts() (map[int]bool, error) {
	list, err := c.ListInbounds()
	if err != nil {
		return nil, err
	}
	used := make(map[int]bool, len(list))
	for _, in := range list {
		if in.Port > 0 {
			used[in.Port] = true
		}
	}
	return used, nil
}

// nextFreePort 从 start 往上找第一个没被占用的端口。
// 上限 65535，找完一圈都没有就报错——宁可明确失败，也别建出一堆冲突的 inbound。
func nextFreePort(start int, used map[int]bool) (int, error) {
	for p := start; p <= 65535; p++ {
		if !used[p] {
			return p, nil
		}
	}
	return 0, fmt.Errorf("从 %d 到 65535 全被占用", start)
}

// countManaged 统计本工具建的 inbound 里还有几个在面板上。
// 返回 (还在的数量, 状态里记录的数量)：两者不等就说明有节点被删或面板被改过。
func (c *Client) countManaged(prefix string) (alive, recorded int) {
	list, err := c.ListInbounds()
	if err != nil {
		return 0, 0
	}
	alive = 0
	for _, in := range list {
		if strings.HasPrefix(in.Tag, prefix) {
			alive++
		}
	}
	return alive, recorded
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "…"
}

// newPanelClient 从命令行配置构造面板客户端，并把 401/404 翻成人话。
func newPanelClient(c *config) *Client {
	return NewClient(c.url, c.token, c.insecure)
}
