package main

// 聚合订阅：一条地址拿到全部家宽出口。
//
// 为什么自己写：3x-ui 的订阅是按 client 分的，一个 subId 只返回它自己
// 那条链接。想「订阅一次拿到所有出口」就得自己聚。
//
// 学作者的做法：只放**绑了出口**的入站，不然走直连的节点混进来，
// 会让人以为那些也是家宽。

import (
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"fmt"
	"net/http"
	"strings"
	"time"
)

// subTokenLen 订阅口令字节数，hex 后 40 字符。
const subTokenLen = 20

// subLinks 收集要放进订阅的链接。
//
// 只收带 ManagedPrefix 的入站——那些是本工具为家宽出口建的。
// 用户手工建的一律不放：它们没绑出口，混进去会误导。
func subLinks(pc *Client, host string) ([]string, error) {
	list, err := pc.ListInbounds()
	if err != nil {
		return nil, err
	}
	var ids []int
	names := map[int]string{}
	for _, in := range list {
		if !in.Enable || !strings.HasPrefix(in.Tag, ManagedPrefix) {
			continue
		}
		ids = append(ids, in.ID)
		names[in.ID] = strings.TrimPrefix(in.Tag, ManagedPrefix)
	}
	if len(ids) == 0 {
		return nil, nil
	}
	links, err := pc.InboundLinks(ids, host)
	if err != nil {
		return nil, err
	}
	// 备注里带上出口名，客户端里一眼能看出走的哪个家宽
	out := make([]string, 0, len(links))
	for i, l := range links {
		out = append(out, relabel(l, names[ids[i]]))
	}
	return out, nil
}

// relabel 把链接的备注换成出口名。
// 3x-ui 给的备注是「🏠 家宽-1-exit1@home」这种，出口信息在中间，
// 客户端列表里看不清。换成「🏠 <出口>」更直观。
func relabel(link, name string) string {
	if name == "" {
		return link
	}
	idx := strings.LastIndex(link, "#")
	if idx < 0 {
		return link + "#🏠 " + name
	}
	return link[:idx] + "#🏠 " + name
}

// encodeSub 转成订阅正文。base64 是各家客户端的通用吃法：整份一次编码。
func encodeSub(links []string, target string) string {
	body := strings.Join(links, "\n")
	if target == "base64" {
		return base64.StdEncoding.EncodeToString([]byte(body))
	}
	return body
}

// subHandler 订阅端点。免登录，所以用口令当门槛。
//
// 参数：
//
//	token  必填，订阅口令
//	target base64（默认）或 links（明文）
//	host   节点地址，默认用请求里的 Host
func subHandler(pc *Client, token string) http.HandlerFunc {
	want := sha256.Sum256([]byte(token))
	return func(w http.ResponseWriter, r *http.Request) {
		got := sha256.Sum256([]byte(r.URL.Query().Get("token")))
		// 口令不对就当这个地址不存在
		if subtle.ConstantTimeCompare(want[:], got[:]) != 1 {
			http.NotFound(w, r)
			return
		}

		target := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("target")))
		switch target {
		case "", "base64", "b64", "v2ray":
			target = "base64"
		case "links", "plain", "text":
			target = "links"
		default:
			http.Error(w, "target 只支持 base64 或 links", http.StatusBadRequest)
			return
		}

		host := r.URL.Query().Get("host")
		if host == "" {
			host = r.Host
		}
		links, err := subLinks(pc, host)
		if err != nil {
			http.Error(w, "生成订阅失败: "+firstLine(err.Error()), http.StatusBadGateway)
			return
		}
		if len(links) == 0 {
			// 回 404 而不是空串：客户端遇到空订阅会把已有节点清空，
			// 非 200 则保留上一份，比被清光好。
			http.Error(w, "还没有可订阅的家宽出口", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("Profile-Update-Interval", "12")
		w.Header().Set("Content-Disposition", "inline; filename=homesync")
		_, _ = w.Write([]byte(encodeSub(links, target)))
	}
}

// firstLine 只留第一行，别把内部路径泄进 HTTP 响应。
func firstLine(s string) string {
	if i := strings.IndexAny(s, "\n\r"); i >= 0 {
		s = s[:i]
	}
	return strings.TrimSpace(s)
}

// serveSub 起订阅服务。
func serveSub(pc *Client, addr, token string) error {
	mux := http.NewServeMux()
	mux.HandleFunc("/sub", subHandler(pc, token))
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.NotFound(w, r)
	})
	srv := &http.Server{
		Addr:              addr,
		Handler:           mux,
		ReadHeaderTimeout: 10 * time.Second,
	}
	logf("订阅服务已起：http://%s/sub?token=%s", addr, token)
	return srv.ListenAndServe()
}

// subURLText 拼出给用户看的订阅地址。
func subURLText(addr, token string) string {
	return fmt.Sprintf("http://%s/sub?token=%s", addr, token)
}
