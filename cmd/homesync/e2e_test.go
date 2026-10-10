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

func TestEndToEnd_SyncXray(t *testing.T) {
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
