package main

import (
	"encoding/json"
	"net"
	"net/http"
	"net/http/httptest"
	neturl "net/url"
	"strings"
	"testing"
	"time"
)

// ── SOCKS5 ────────────────────────────────────────────

// 端口对公网敞开，凭据必须强制。没有凭据时应当直接拒绝。
func TestServeSocks_RequiresCredential(t *testing.T) {
	client, srv := net.Pipe()
	defer client.Close()
	go func() {
		// 任何认证方式都不该被接受
		serveSocks(srv, &SocksCred{}, func(string, string) (net.Conn, error) {
			return nil, nil
		})
	}()
	defer srv.Close()

	// 发握手：版本5，1 种方式（无认证）
	if _, err := client.Write([]byte{socksVer5, 0x01, authNone}); err != nil {
		t.Fatalf("写握手失败: %v", err)
	}
	buf := make([]byte, 2)
	if _, err := client.Read(buf); err != nil {
		t.Fatalf("读握手响应失败: %v", err)
	}
	if buf[1] != authNoAccept {
		t.Errorf("无凭据时应拒绝所有方式(0xff)，得到 0x%02x", buf[1])
	}
}

// 正确凭据应当通过认证
func TestSocksAuth_AcceptsGoodCred(t *testing.T) {
	cred := &SocksCred{User: "user1", Pass: "pass1"}

	// 构造 RFC1929 认证报文
	var req []byte
	req = append(req, authSubVer, byte(len(cred.User)))
	req = append(req, []byte(cred.User)...)
	req = append(req, byte(len(cred.Pass)))
	req = append(req, []byte(cred.Pass)...)

	c, s := net.Pipe()
	defer c.Close()
	done := make(chan error, 1)
	go func() {
		done <- socksAuth(s, cred)
		s.Close()
	}()
	if _, err := c.Write(req); err != nil {
		t.Fatalf("写认证失败: %v", err)
	}
	resp := make([]byte, 2)
	if _, err := c.Read(resp); err != nil {
		t.Fatalf("读认证响应失败: %v", err)
	}
	if err := <-done; err != nil {
		t.Fatalf("正确凭据被拒: %v", err)
	}
	if resp[1] != authOK {
		t.Errorf("认证应成功(0x00)，得到 0x%02x", resp[1])
	}
}

func TestSocksCred_Valid(t *testing.T) {
	if (SocksCred{User: "u"}).valid() {
		t.Error("只有用户名不算有效")
	}
	if (SocksCred{Pass: "p"}).valid() {
		t.Error("只有口令不算有效")
	}
	if !(SocksCred{User: "u", Pass: "p"}).valid() {
		t.Error("两个都有才算有效")
	}
}

func TestNewSocksCred_Random(t *testing.T) {
	a, err := newSocksCred()
	if err != nil {
		t.Fatalf("生成失败: %v", err)
	}
	b, _ := newSocksCred()
	if !a.valid() {
		t.Error("生成的凭据无效")
	}
	if a.User == b.User && a.Pass == b.Pass {
		t.Error("两次生成完全一样，随机数有问题")
	}
}

// 端到端：连上 SOCKS5 真发一个 HTTP 请求
func TestServeSocks_ProxiesHTTP(t *testing.T) {
	// 目标站点：返回客户端 IP
	target := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte("proxied"))
	}))
	defer target.Close()

	cred := SocksCred{User: "u", Pass: "p"}
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("起监听失败: %v", err)
	}
	defer ln.Close()

	// 用真实 dial（不走 netns，测试只验证协议层转发）
	go func() {
		conn, err := ln.Accept()
		if err != nil {
			return
		}
		go serveSocks(conn, &cred, net.Dial)
	}()

	// 客户端走 SOCKS5 代理请求目标站点
	proxyURL, _ := neturl.Parse("socks5://u:p@" + ln.Addr().String())
	client := &http.Client{
		Timeout: 10 * time.Second,
		Transport: &http.Transport{
			Proxy: http.ProxyURL(proxyURL),
		},
	}
	resp, err := client.Get(target.URL)
	if err != nil {
		t.Fatalf("经代理请求失败: %v", err)
	}
	defer resp.Body.Close()
	body := make([]byte, 64)
	n, _ := resp.Body.Read(body)
	if string(body[:n]) != "proxied" {
		t.Errorf("经代理拿到的内容不对: %q", string(body[:n]))
	}
}

// ── 出站名 ────────────────────────────────────────────

func TestExitName(t *testing.T) {
	cases := map[string]string{
		"host.example.com": "host-example-com",
		"1.2.3.4":          "1-2-3-4",
		"a_b!c":            "a-b-c",
	}
	for in, want := range cases {
		if got := exitName(in); got != want {
			t.Errorf("exitName(%q) = %q, 要 %q", in, got, want)
		}
	}
	if exitName("!!!") != "exit" {
		t.Error("全非法字符应有兜底名")
	}
	long := strings.Repeat("a", 100)
	if len(exitName(long)) > 32 {
		t.Error("太长会被截断（xray tag 有长度限制）")
	}
}

// 用主机名而不是槽位号：槽位重启后会重新分配，
// 用它做 tag 会让绑定悄悄串到别的节点
func TestExitName_StableAcrossSlots(t *testing.T) {
	a := exitName("node1.example.com")
	b := exitName("node1.example.com")
	if a != b {
		t.Error("同一节点必须得到同一个名字")
	}
}

// ── 面板出站同步 ──────────────────────────────────────

// 只清自建前缀，用户手工加的出站必须原样留着
func TestSyncOutbounds_KeepsManual(t *testing.T) {
	var saved map[string]any
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/xray/update") {
			_ = r.ParseForm()
			_ = json.Unmarshal([]byte(r.PostForm.Get("xraySetting")), &saved)
			okJSON(w, `{}`)
			return
		}
		if strings.HasSuffix(r.URL.Path, "/xray/") {
			obj, _ := json.Marshal(map[string]any{
				"outbounds": []any{
					map[string]any{"tag": "my-own", "protocol": "freedom"},
					map[string]any{"tag": OutboundTagPrefix + "stale", "protocol": "socks"},
				},
			})
			okJSON(w, string(obj))
			return
		}
		okJSON(w, `{}`)
	}))
	defer srv.Close()

	c := NewClient(srv.URL, "tok", true)
	if err := c.SyncOutbounds(map[string]int{"node1": 21001}); err != nil {
		t.Fatalf("同步失败: %v", err)
	}

	list, _ := saved["outbounds"].([]any)
	tags := map[string]bool{}
	for _, ob := range list {
		if m, ok := ob.(map[string]any); ok {
			tags[m["tag"].(string)] = true
		}
	}
	if !tags["my-own"] {
		t.Error("把用户手工加的出站删了")
	}
	if tags[OutboundTagPrefix+"stale"] {
		t.Error("上次建的过期出站没清掉")
	}
	if !tags[OutboundTagPrefix+"node1"] {
		t.Errorf("新出口没写进去: %v", tags)
	}
}

// 绑到已消失出口的路由规则必须清掉，否则流量进黑洞
func TestPruneRouting(t *testing.T) {
	routing := map[string]any{
		"rules": []any{
			map[string]any{"type": "field", "outboundTag": "my-own"},
			map[string]any{"type": "field", "outboundTag": OutboundTagPrefix + "gone"},
		},
	}
	out := pruneRouting(routing, OutboundTagPrefix).(map[string]any)
	rules, _ := out["rules"].([]any)
	if len(rules) != 1 {
		t.Errorf("应只剩 1 条，得到 %d", len(rules))
	}
	if rules[0].(map[string]any)["outboundTag"] != "my-own" {
		t.Error("留下来的应该是用户自己的规则")
	}
}

// ── 工具 ──────────────────────────────────────────────

func TestToStringSlice(t *testing.T) {
	if got := toStringSlice("a"); len(got) != 1 || got[0] != "a" {
		t.Errorf("字符串: %v", got)
	}
	if got := toStringSlice([]any{"a", "b"}); len(got) != 2 {
		t.Errorf("数组: %v", got)
	}
	if got := toStringSlice(123); got != nil {
		t.Errorf("其它类型应返回 nil: %v", got)
	}
}

// 隧道内只有 IPv4 路由。不限定的话 net.Dial 可能选中 AAAA 记录，
// 那条连接会从母机 IPv6 出去，**暴露真实地址**。
func TestForceIPv4Network(t *testing.T) {
	cases := map[string]string{
		"tcp":      "tcp4",
		"udp":      "udp4",
		"tcp4":     "tcp4",
		"ip4:icmp": "ip4:icmp",
	}
	for in, want := range cases {
		if got := forceIPv4Network(in); got != want {
			t.Errorf("forceIPv4Network(%q) = %q, 要 %q", in, got, want)
		}
	}
}

func TestFreeRandomPort(t *testing.T) {
	p, err := freeRandomPort(map[int]bool{})
	if err != nil {
		t.Fatalf("挑端口失败: %v", err)
	}
	if p < 20000 || p > 60000 {
		t.Errorf("端口 %d 落在预期范围外", p)
	}
	// 被占用的不应该被挑中
	p2, err := freeRandomPort(map[int]bool{p: true})
	if err != nil {
		t.Fatalf("第二次失败: %v", err)
	}
	if p2 == p {
		t.Error("挑中了已占用的端口")
	}
}
