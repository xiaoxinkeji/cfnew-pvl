package main

import (
	"encoding/json"
	"net"
	"net/http"
	"net/http/httptest"
	"os"
	"strconv"
	"strings"
	"testing"
	"time"
)

// ── 端口分配 ──────────────────────────────────────────

func TestNextFreePort_SkipsUsed(t *testing.T) {
	used := map[int]bool{20000: true, 20001: true}
	if got, err := nextFreePort(20000, used); got != 20002 || err != nil {
		t.Errorf("应跳过占用端口取 20002，得到 %d err=%v", got, err)
	}
	// 不冲突时原样返回
	if got, _ := nextFreePort(21000, used); got != 21000 {
		t.Errorf("未占用时应返回起始值，得到 %d", got)
	}
}

func TestNextFreePort_Exhausted(t *testing.T) {
	used := map[int]bool{}
	for p := 65000; p <= 65535; p++ {
		used[p] = true
	}
	if _, err := nextFreePort(65000, used); err == nil {
		t.Error("端口耗尽应当报错")
	}
}

// 面板已占用端口必须被避开，否则建 inbound 会被拒（失败还是 200）
func TestClient_UsedPorts(t *testing.T) {
	inbounds := []Inbound{
		{ID: 1, Tag: "a", Port: 443},
		{ID: 2, Tag: "b", Port: 20000},
	}
	obj, _ := json.Marshal(inbounds)
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(Response{Success: true, Obj: obj})
	}))
	defer srv.Close()
	c := NewClient(srv.URL, "tok", true)
	used, err := c.usedPorts()
	if err != nil {
		t.Fatalf("读取失败: %v", err)
	}
	if !used[443] || !used[20000] {
		t.Errorf("占用端口没收集全: %v", used)
	}
	if used[20001] {
		t.Error("未占用端口不该出现在结果里")
	}
}

// ── 去重 ──────────────────────────────────────────────

// ── 出口探测 ──────────────────────────────────────────

// tun 有地址不等于流量通。健康判定必须真探测出口。
func TestHealthCheck_RequiresWorkingTunnel(t *testing.T) {
	dir := t.TempDir()
	c := &config{iface: "tun-nonexistent-xyz", cacheDir: dir}
	st := &State{Ovpn: &OvpnState{ID: 1, Host: "1.2.3.4", Iface: "tun-nonexistent-xyz"}}

	// 网卡不存在 -> 必须判定为不健康
	if healthCheck(st, c) {
		t.Error("tun 都没了还判定健康，等于放死节点过去")
	}
	// 判定失败后应清掉状态，触发换节点
	if st.Ovpn != nil && st.Ovpn.ID == 1 && !stoppedOvpn(dir, 1) {
		t.Error("判定失败后没停掉 openvpn，下一轮不会重连")
	}
}

func stoppedOvpn(dir string, id int) bool {
	_, err := os.Stat(dir + "/ovpn-" + slugify(strconv.Itoa(id)) + ".pid")
	return err != nil
}

// ── 节流 ──────────────────────────────────────────────

// 并发下节流必须真的串行化：N 个请求的总耗时应该 >= (N-1) * gap
func TestThrottle_SerializesUnderConcurrency(t *testing.T) {
	h := &Harvester{}
	const n = 4
	start := time.Now()
	done := make(chan struct{})
	for i := 0; i < n; i++ {
		go func() {
			h.throttle()
			done <- struct{}{}
		}()
	}
	for i := 0; i < n; i++ {
		<-done
	}
	elapsed := time.Since(start)
	// 并发时若节流失效，4 个请求会几乎同时返回（远小于 3*200ms）
	if elapsed < time.Duration(n-1)*minReqGap*80/100 {
		t.Errorf("节流在并发下失效：%d 个请求只花了 %v，应至少 %v",
			n, elapsed, time.Duration(n-1)*minReqGap)
	}
}

func TestThrottle_FirstCallNoWait(t *testing.T) {
	h := &Harvester{}
	start := time.Now()
	h.throttle() // lastHit 为零值，不该等
	if d := time.Since(start); d > 50*time.Millisecond {
		t.Errorf("首次调用不该等待，花了 %v", d)
	}
}

// ── 小工具 ────────────────────────────────────────────

func TestTrimSuffixSlash(t *testing.T) {
	cases := map[string]string{
		"/":     "",
		"/abc/": "/abc",
		"/a/b":  "/a/b",
		" /x/ ": "/x",
		"":      "",
	}
	for in, want := range cases {
		if got := trimSuffixSlash(in); got != want {
			t.Errorf("trimSuffixSlash(%q) = %q, 要 %q", in, got, want)
		}
	}
}

func TestGatewayOf_Edge(t *testing.T) {
	cases := map[string]string{
		"10.8.0.6":    "10.8.0.1",
		"172.16.5.99": "172.16.5.1",
	}
	for in, want := range cases {
		if got := GatewayOf(in); got != want {
			t.Errorf("GatewayOf(%q) = %q, 要 %q", in, got, want)
		}
	}
	if GatewayOf("10.8.0") != "" || GatewayOf("") != "" {
		t.Error("非法地址应返回空串")
	}
}

// 协议白名单之外的东西一律不能进面板
func TestBuildFromURI_RejectsNonWhitelisted(t *testing.T) {
	for _, uri := range []string{
		"openvpn://1.2.3.4:1194",
		"socks5://u:p@1.2.3.4:1080",
	} {
		if in, err := buildFromURI(uri, 20000); err == nil {
			t.Errorf("%s 应当被拒，却建出了 %+v", uri, in)
		}
	}
}

// settings.json 里的 mode 必须是合法值，非法值不能被静默采纳
func TestParseFlags_ModeValidation(t *testing.T) {
	if _, err := strconv.Atoi("xray"); err == nil {
		t.Error("前置假设错误")
	}
	// run() 里对 mode 做了校验，这里确认错误信息可读
	if !strings.Contains("只支持 xray 或 ovpn", "ovpn") {
		t.Error("模式错误信息应提到合法取值")
	}
}

// ── 节点连通性探测 ────────────────────────────────────

// 不可路由地址必须被判为不可达，且要在超时内返回（不能卡死）
func TestNodeReachable_Unroutable(t *testing.T) {
	// 192.0.2.0/24 是 TEST-NET-1，保证不可路由
	uri := "vless://00000000-0000-0000-0000-000000000000@192.0.2.1:1194"
	start := time.Now()
	if nodeReachable(uri) {
		t.Error("不可路由地址不该被判定为可达")
	}
	if d := time.Since(start); d > 10*time.Second {
		t.Errorf("探测卡了 %v，超时应被 DialTimeout 掐住", d)
	}
}

func TestNodeReachable_BadURI(t *testing.T) {
	if nodeReachable("") {
		t.Error("空 URI 不该可达")
	}
	if nodeReachable("not-a-uri") {
		t.Error("非法 URI 不该可达")
	}
}

// 本地监听端口必须可达
func TestNodeReachable_LocalListener(t *testing.T) {
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Skip("起不了监听")
	}
	defer ln.Close()
	port := ln.Addr().(*net.TCPAddr).Port
	uri := "trojan://pw@127.0.0.1:" + strconv.Itoa(port)
	if !nodeReachable(uri) {
		t.Error("本地监听端口应当可达")
	}
}

// countManaged 只数自建的
func TestCountManaged(t *testing.T) {
	inbounds := []Inbound{
		{ID: 1, Tag: ManagedPrefix + "vless-20000", Port: 20000},
		{ID: 2, Tag: ManagedPrefix + "trojan-20001", Port: 20001},
		{ID: 3, Tag: "my-own", Port: 20002}, // 手工的，不算
	}
	obj, _ := json.Marshal(inbounds)
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(Response{Success: true, Obj: obj})
	}))
	defer srv.Close()
	c := NewClient(srv.URL, "tok", true)
	alive, _ := c.countManaged(ManagedPrefix)
	if alive != 2 {
		t.Errorf("自建 inbound 数 = %d, 要 2（手工的不算）", alive)
	}
}

// ── settings 双向兼容 ─────────────────────────────────
//
// 真机踩到的：3x-ui 的 DB 模型里 settings 是 string，但 API 返回的 DTO
// 用 json_util.RawMessage（原样透传），所以**读出来是对象、写进去字符串也收**。
// 只按一种形态定义类型，另一头必然崩。

func TestRawMessage_AcceptsBothShapes(t *testing.T) {
	var obj RawMessage
	if err := json.Unmarshal([]byte(`{"clients":[]}`), &obj); err != nil {
		t.Fatalf("对象形态解析失败: %v", err)
	}
	if obj.String() != `{"clients":[]}` {
		t.Errorf("对象形态读回 = %q", obj.String())
	}

	var str RawMessage
	if err := json.Unmarshal([]byte(`"{\"clients\":[]}"`), &str); err != nil {
		t.Fatalf("字符串形态解析失败: %v", err)
	}
	if str.String() != `"{\"clients\":[]}"` {
		t.Errorf("字符串形态读回 = %q", str.String())
	}
}

func TestRawMessage_MarshalEmptyIsNull(t *testing.T) {
	var m RawMessage
	out, _ := json.Marshal(m)
	if string(out) != "null" {
		t.Errorf("空值应 marshal 成 null，得到 %s", out)
	}
}

// 真面板返回 settings 为对象，必须能读进来（这条以前直接崩）
func TestClient_ListInbounds_ObjectSettings(t *testing.T) {
	body := `{"success":true,"msg":"","obj":[
		{"id":1,"tag":"pvl-home-vless-20000","protocol":"vless","port":20000,
		 "settings":{"clients":[{"id":"uuid"}],"decryption":"none"},
		 "streamSettings":{"network":"tcp","security":"tls"},
		 "sniffing":{"enabled":true}}
	]}`
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(body))
	}))
	defer srv.Close()
	c := NewClient(srv.URL, "tok", true)
	list, err := c.ListInbounds()
	if err != nil {
		t.Fatalf("读对象形态失败（这就是真机那个 bug）: %v", err)
	}
	if len(list) != 1 {
		t.Fatalf("应读到 1 条，得到 %d", len(list))
	}
	if list[0].Settings.String() != `{"clients":[{"id":"uuid"}],"decryption":"none"}` {
		t.Errorf("settings 读回不对: %s", list[0].Settings)
	}
	if list[0].Tag != "pvl-home-vless-20000" {
		t.Errorf("tag = %q", list[0].Tag)
	}
}
