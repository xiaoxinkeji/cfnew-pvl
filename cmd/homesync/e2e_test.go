// 端到端冒烟：起一个模拟 3x-ui，跑完整同步流程，验证真的建出了 inbound。
//
// 这是唯一能证明「抓取 -> 解析 -> 建 inbound」整条链路通的测试：
// 单元测试只验证零件，这个验证组装后的机器能转。
// 用法：go test -run TestEndToEnd -tags=e2e ./cmd/homesync
// 不加 tag 时跳过（要联网抓 PublicVPNList）。
//go:build e2e

package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"sync"
	"testing"
	"time"
)

// mockPanel 模拟 3x-ui 的关键行为：Bearer 校验、success 语义、按 tag 存储。
type mockPanel struct {
	mu        sync.Mutex
	inbounds  map[int]*Inbound
	nextID    int
	restarted bool
	tok       string
}

func (m *mockPanel) handler(t *testing.T) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Authorization") != "Bearer "+m.tok {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		path := r.URL.Path
		m.mu.Lock()
		defer m.mu.Unlock()

		write := func(success bool, msg string, obj interface{}) {
			raw, _ := json.Marshal(obj)
			_ = json.NewEncoder(w).Encode(Response{Success: success, Msg: msg, Obj: raw})
		}

		switch {
		case path == "/panel/api/server/status":
			write(true, "ok", nil)
		case path == "/panel/api/inbounds/list":
			var list []Inbound
			for _, in := range m.inbounds {
				list = append(list, *in)
			}
			write(true, "ok", list)
		case path == "/panel/api/inbounds/add":
			var in Inbound
			if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
				write(false, "坏请求", nil)
				return
			}
			// 像真面板一样校验协议白名单
			if !XUIProtocols[in.Protocol] {
				write(false, "不支持的协议: "+in.Protocol, nil)
				return
			}
			// settings 必须是合法 JSON 字符串，否则面板会拒
			for name, s := range map[string]string{
				"settings": in.Settings, "streamSettings": in.StreamSet, "sniffing": in.Sniffing,
			} {
				var v interface{}
				if err := json.Unmarshal([]byte(s), &v); err != nil {
					write(false, name+" 不是合法 JSON", nil)
					return
				}
			}
			m.nextID++
			in.ID = m.nextID
			m.inbounds[in.ID] = &in
			write(true, "ok", in)
		case strings.HasPrefix(path, "/panel/api/inbounds/del/"):
			id := atoiTail(path)
			if _, ok := m.inbounds[id]; !ok {
				write(false, "不存在", nil)
				return
			}
			delete(m.inbounds, id)
			write(true, "ok", nil)
		case path == "/panel/api/server/restartXrayService":
			m.restarted = true
			write(true, "ok", nil)
		default:
			w.WriteHeader(http.StatusNotFound)
		}
	}
}

func atoiTail(path string) int {
	idx := strings.LastIndex(path, "/")
	n := 0
	for _, r := range path[idx+1:] {
		if r < '0' || r > '9' {
			return -1
		}
		n = n*10 + int(r-'0')
	}
	return n
}

// stubHarvester 本地抓取桩：返回固定的 share URI，完全不碰外网。
//
// 为什么需要它：真抓 PublicVPNList 的 e2e 依赖外网，源站一限流/抽风测试就飘
// （实测踩到：TLS handshake timeout、dial timeout 都让 CI 变红）。
// 链路本身的正确性不该由源站的可用性决定，所以拆一个不联网的版本出来。
type stubHarvester struct {
	uris []ProtoNode
}

func (s *stubHarvester) FetchProtocol(proto string, limit, pages, workers int) ([]ProtoNode, error) {
	var out []ProtoNode
	for _, n := range s.uris {
		if n.Protocol == proto {
			out = append(out, n)
		}
	}
	if limit > 0 && len(out) > limit {
		out = out[:limit]
	}
	return out, nil
}

func (s *stubHarvester) FetchCatalog(refresh bool) ([]VPNRow, error) { return nil, nil }
func (s *stubHarvester) FetchOvpn(id, tries int) (string, error)     { return "", nil }

// 用桩跑完整同步：这条必须每次都过，不受源站影响
func TestSyncXray_OfflineStub(t *testing.T) {
	m := &mockPanel{inbounds: map[int]*Inbound{}, tok: "secret"}
	srv := httptest.NewServer(m.handler(t))
	defer srv.Close()

	dir := t.TempDir()
	c := &config{
		mode: "xray", url: srv.URL, token: "secret", limit: 10,
		protos: "vless,trojan", portStart: 20000, workers: 2,
		cacheDir: dir, statePath: dir + "/state.json",
		skipProbe: true, // 桩里的地址不一定真存在，跳过连通性探测
	}
	stub := &stubHarvester{uris: []ProtoNode{
		{Protocol: "vless", ID: "a", URI: "vless://814bd064-544d-4255-a070-5705c03f6da9@1.2.3.4:443?security=tls&sni=a.com"},
		{Protocol: "vless", ID: "b", URI: "vless://814bd064-544d-4255-a070-5705c03f6da9@5.6.7.8:443?security=tls&sni=b.com"},
		// 故意放一条重复的，验证去重
		{Protocol: "vless", ID: "a2", URI: "vless://814bd064-544d-4255-a070-5705c03f6da9@1.2.3.4:443?security=tls&sni=a.com"},
		{Protocol: "trojan", ID: "c", URI: "trojan://pw@9.9.9.9:443?security=tls&sni=c.com"},
	}}
	pc := newPanelClient(c)
	st := LoadState(c.statePath)
	if err := syncXrayWith(stub, pc, c, st); err != nil {
		t.Fatalf("同步失败: %v", err)
	}

	m.mu.Lock()
	defer m.mu.Unlock()
	if len(m.inbounds) != 3 {
		t.Fatalf("应建 3 个（4 条里去重掉 1 条），实际 %d", len(m.inbounds))
	}
	// 端口不能重复（去重 + 端口避让都要生效）
	ports := map[int]bool{}
	for id, in := range m.inbounds {
		if ports[in.Port] {
			t.Errorf("端口 %d 重复（id=%d）", in.Port, id)
		}
		ports[in.Port] = true
		if !strings.HasPrefix(in.Tag, ManagedPrefix) {
			t.Errorf("id=%d tag 缺前缀: %s", id, in.Tag)
		}
	}
	if !m.restarted {
		t.Error("没重启 xray")
	}
}

// skipIfSourceDown 源站不可达时跳过测试。
//
// 这些 e2e 要真抓 PublicVPNList，源站限流/抽风就会挂。
// 那不是代码的问题——链路正确性由 TestSyncXray_OfflineStub 用桩保证，
// 这里只在源站可用时验证真实数据能走通。
func skipIfSourceDown(t *testing.T) {
	t.Helper()
	if os.Getenv("HOMESYNC_E2E_REQUIRE_NET") == "1" {
		return // CI 显式要求联网时才强制跑
	}
	// 先用一次裸的 HTTP 探活，超时给短点。
	// 不能直接用 FetchProtocol 探：它内部的重试和 30s 超时会让「源站挂了」
	// 变成每个测试各等 60 秒，整套 e2e 慢得没法用。
	client := &http.Client{Timeout: 8 * time.Second}
	resp, err := client.Get(publicVPNList + "/vless/?per_page=100")
	if err != nil {
		t.Skipf("PublicVPNList 不可达，跳过联网 e2e: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		t.Skipf("PublicVPNList 返回 %d，跳过联网 e2e", resp.StatusCode)
	}
}

func TestEndToEnd_SyncXray(t *testing.T) {
	skipIfSourceDown(t)
	m := &mockPanel{inbounds: map[int]*Inbound{}, tok: "secret"}
	srv := httptest.NewServer(m.handler(t))
	defer srv.Close()

	dir := t.TempDir()
	c := &config{
		mode:      "xray",
		url:       srv.URL,
		token:     "secret",
		limit:     3,
		protos:    "vless",
		portStart: 20000,
		workers:   4,
		cacheDir:  dir,
		statePath: dir + "/state.json",
	}

	h, err := NewHarvester(dir)
	if err != nil {
		t.Fatalf("抓取器创建失败: %v", err)
	}
	pc := newPanelClient(c)

	if err := pc.Ping(); err != nil {
		t.Fatalf("面板连通失败: %v", err)
	}

	st := LoadState(c.statePath)
	if err := syncXray(h, pc, c, st); err != nil {
		t.Fatalf("同步失败: %v", err)
	}

	m.mu.Lock()
	defer m.mu.Unlock()
	if len(m.inbounds) == 0 {
		t.Fatal("一个 inbound 都没建出来 —— 整条链路断了")
	}
	t.Logf("建出 %d 个 inbound", len(m.inbounds))
	for id, in := range m.inbounds {
		if !strings.HasPrefix(in.Tag, ManagedPrefix) {
			t.Errorf("id=%d tag=%q 缺管理前缀", id, in.Tag)
		}
		if !XUIProtocols[in.Protocol] {
			t.Errorf("id=%d 协议 %s 不在白名单", id, in.Protocol)
		}
		if !in.Enable {
			t.Errorf("id=%d 未启用", id)
		}
		t.Logf("  #%d %s %s:%d tag=%s", id, in.Protocol, in.Listen, in.Port, in.Tag)
	}
	if !m.restarted {
		t.Error("建完没重启 xray")
	}
}

// 第二轮同步必须清掉上一轮的，不能无限堆积
func TestEndToEnd_SyncTwiceDoesNotAccumulate(t *testing.T) {
	skipIfSourceDown(t)
	m := &mockPanel{inbounds: map[int]*Inbound{}, tok: "secret"}
	srv := httptest.NewServer(m.handler(t))
	defer srv.Close()

	dir := t.TempDir()
	c := &config{
		mode: "xray", url: srv.URL, token: "secret", limit: 2,
		protos: "vless", portStart: 20000, workers: 4,
		cacheDir: dir, statePath: dir + "/state.json",
	}
	h, _ := NewHarvester(dir)
	pc := newPanelClient(c)

	st := LoadState(c.statePath)
	if err := syncXray(h, pc, c, st); err != nil {
		t.Fatalf("第一轮失败: %v", err)
	}
	first := countInbounds(m)
	if first == 0 {
		t.Fatal("第一轮没建出任何 inbound")
	}

	if err := syncXray(h, pc, c, st); err != nil {
		t.Fatalf("第二轮失败: %v", err)
	}
	second := countInbounds(m)
	if second > first {
		t.Errorf("第二轮反而变多了: %d -> %d（应清理上一轮）", first, second)
	}
	t.Logf("第一轮 %d 个，第二轮 %d 个", first, second)
}

func countInbounds(m *mockPanel) int {
	m.mu.Lock()
	defer m.mu.Unlock()
	return len(m.inbounds)
}

// 清理必须只删自己建的
func TestEndToEnd_CleanLeavesManualAlone(t *testing.T) {
	skipIfSourceDown(t)
	m := &mockPanel{inbounds: map[int]*Inbound{}, tok: "secret"}
	// 预置一个手工建的
	m.inbounds[99] = &Inbound{ID: 99, Tag: "my-own-vless", Protocol: "vless"}

	srv := httptest.NewServer(m.handler(t))
	defer srv.Close()

	dir := t.TempDir()
	c := &config{
		mode: "xray", url: srv.URL, token: "secret", limit: 1,
		protos: "vless", portStart: 20000, workers: 4,
		cacheDir: dir, statePath: dir + "/state.json",
	}
	h, _ := NewHarvester(dir)
	pc := newPanelClient(c)

	st := LoadState(c.statePath)
	if err := syncXray(h, pc, c, st); err != nil {
		t.Fatalf("同步失败: %v", err)
	}

	n, err := pc.ClearManaged(ManagedPrefix)
	if err != nil {
		t.Fatalf("清理失败: %v", err)
	}
	if n == 0 {
		t.Error("清理没删掉任何东西")
	}

	m.mu.Lock()
	defer m.mu.Unlock()
	if _, ok := m.inbounds[99]; !ok {
		t.Error("手工建的 inbound 被误删了")
	}
	for id := range m.inbounds {
		if id != 99 {
			t.Errorf("还残留自建 inbound id=%d", id)
		}
	}
}

// 源站抽风时不能崩，也不能把面板清空。
// 这是 e2e 依赖外网的代价：源站一限流测试就飘。所以单独覆盖降级路径——
// 就算抓不到节点，面板上原有的东西也必须原样留着。
func TestEndToEnd_SourceDownKeepsPanel(t *testing.T) {
	m := &mockPanel{inbounds: map[int]*Inbound{}, tok: "secret"}
	// 预置一个手工建的，确认它不会被清掉
	m.inbounds[99] = &Inbound{ID: 99, Tag: "my-own-vless", Protocol: "vless", Port: 20000}

	srv := httptest.NewServer(m.handler(t))
	defer srv.Close()

	dir := t.TempDir()
	c := &config{
		mode: "xray", url: srv.URL, token: "secret", limit: 1,
		// 指向一个必然连不上的地址，模拟源站挂掉
		protos:    "vless",
		portStart: 20000, workers: 1,
		cacheDir: dir, statePath: dir + "/state.json",
	}
	pc := newPanelClient(c)

	// 抓不到时 syncXray 应当正常返回（不是 error），且不删任何东西。
	// 用桩模拟「源站返回空」，避免真等 30 秒超时。
	stub := &stubHarvester{uris: nil}
	err := syncXrayWith(stub, pc, c, LoadState(c.statePath))
	if err != nil {
		t.Logf("空结果时返回 error（可接受，但不应 panic）: %v", err)
	}

	m.mu.Lock()
	defer m.mu.Unlock()
	if _, ok := m.inbounds[99]; !ok {
		t.Error("源站挂掉时把手工建的 inbound 也清了 —— 这是数据丢失")
	}
}

func TestEndToEnd_BadTokenRejected(t *testing.T) {
	m := &mockPanel{inbounds: map[int]*Inbound{}, tok: "secret"}
	srv := httptest.NewServer(m.handler(t))
	defer srv.Close()

	dir := t.TempDir()
	c := &config{
		mode: "xray", url: srv.URL, token: "wrong-token",
		cacheDir: dir, statePath: dir + "/state.json",
	}
	pc := newPanelClient(c)
	if err := pc.Ping(); err != ErrBadToken {
		t.Errorf("错 token 应返回 ErrBadToken，实际: %v", err)
	}
	_ = os.RemoveAll(dir)
}
