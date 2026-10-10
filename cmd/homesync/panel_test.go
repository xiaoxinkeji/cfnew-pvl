package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"
)

// fakePanel 起一个假 3x-ui，验证客户端行为
func fakePanel(t *testing.T, handler http.HandlerFunc) *Client {
	t.Helper()
	srv := httptest.NewServer(handler)
	t.Cleanup(srv.Close)
	return NewClient(srv.URL, "tok", true)
}

func okJSON(w http.ResponseWriter, obj string) {
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(Response{Success: true, Msg: "ok", Obj: json.RawMessage(obj)})
}

// 3x-ui 失败也是 HTTP 200，只看 success 字段
func TestClient_FailureIsHTTP200(t *testing.T) {
	c := fakePanel(t, func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(Response{Success: false, Msg: "端口冲突"})
	})
	_, err := c.AddInbound(&Inbound{Remark: "x"})
	if err == nil {
		t.Fatal("success:false 必须报错，不能因为 200 就当成功")
	}
	if !strings.Contains(err.Error(), "端口冲突") {
		t.Errorf("错误信息要带出面板的 msg，实际: %v", err)
	}
}

func TestClient_AddInbound_Success(t *testing.T) {
	c := fakePanel(t, func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/panel/api/inbounds/add" {
			t.Errorf("路径 = %s, 要 /panel/api/inbounds/add", r.URL.Path)
		}
		if got := r.Header.Get("Authorization"); got != "Bearer tok" {
			t.Errorf("Authorization = %q, 要 Bearer tok", got)
		}
		if r.Method != http.MethodPost {
			t.Errorf("方法 = %s, 要 POST", r.Method)
		}
		okJSON(w, `{"id":42}`)
	})
	id, err := c.AddInbound(&Inbound{Remark: "r", Tag: "t", Protocol: "vless", Port: 20000})
	if err != nil {
		t.Fatalf("应成功: %v", err)
	}
	if id != 42 {
		t.Errorf("id = %d, 要 42", id)
	}
}

func TestClient_TokenInvalid_401(t *testing.T) {
	c := fakePanel(t, func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
	})
	if err := c.Ping(); err != ErrBadToken {
		t.Errorf("401 应返回 ErrBadToken，实际: %v", err)
	}
}

func TestClient_WrongPath_404(t *testing.T) {
	c := fakePanel(t, func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	})
	if err := c.Ping(); err != ErrBadBasePath {
		t.Errorf("404 应返回 ErrBadBasePath，实际: %v", err)
	}
}

// 核心安全边界：只删自己建的，手工建的一个不碰
func TestClient_ClearManaged_OnlyTouchesOurs(t *testing.T) {
	inbounds := []Inbound{
		{ID: 1, Tag: ManagedPrefix + "vless-20000"},
		{ID: 2, Tag: ManagedPrefix + "trojan-20001"},
		{ID: 3, Tag: "my-own-vless"},  // 手工建的，绝不能删
		{ID: 4, Tag: "my-own-trojan"}, // 手工建的，绝不能删
		{ID: 5, Tag: ""},              // 无 tag，绝不能删
	}
	var deleted []int
	c := fakePanel(t, func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/panel/api/inbounds/list" {
			obj, _ := json.Marshal(inbounds)
			_ = json.NewEncoder(w).Encode(Response{Success: true, Obj: obj})
			return
		}
		// /panel/api/inbounds/del/<id>
		if idx := strings.LastIndex(r.URL.Path, "/"); idx >= 0 {
			if id, err := strconv.Atoi(r.URL.Path[idx+1:]); err == nil {
				deleted = append(deleted, id)
			}
		}
		okJSON(w, `{}`)
	})
	n, err := c.ClearManaged(ManagedPrefix)
	if err != nil {
		t.Fatalf("清理失败: %v", err)
	}
	if n != 2 {
		t.Errorf("删了 %d 个, 要 2 个", n)
	}
	if len(deleted) != 2 || deleted[0] != 1 || deleted[1] != 2 {
		t.Errorf("删的 id = %v, 要 [1 2]", deleted)
	}
	for _, d := range deleted {
		if d == 3 || d == 4 || d == 5 {
			t.Errorf("误删了不该碰的 inbound id=%d", d)
		}
	}
}

func TestClient_ListInbounds(t *testing.T) {
	c := fakePanel(t, func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/panel/api/inbounds/list" {
			t.Errorf("路径 = %s", r.URL.Path)
		}
		okJSON(w, `[{"id":1,"tag":"a"},{"id":2,"tag":"b"}]`)
	})
	list, err := c.ListInbounds()
	if err != nil {
		t.Fatalf("应成功: %v", err)
	}
	if len(list) != 2 || list[0].Tag != "a" {
		t.Errorf("列表 = %+v", list)
	}
}

func TestClient_RestartXray(t *testing.T) {
	c := fakePanel(t, func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/panel/api/server/restartXrayService" {
			t.Errorf("路径 = %s, 要 /panel/api/server/restartXrayService", r.URL.Path)
		}
		okJSON(w, `{}`)
	})
	if err := c.RestartXray(); err != nil {
		t.Errorf("重启失败: %v", err)
	}
}

func TestClient_NonJSONResponse(t *testing.T) {
	c := fakePanel(t, func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte("<html>登录页</html>"))
	})
	if err := c.Ping(); err == nil {
		t.Error("非 JSON 响应应当报错（通常说明地址指向了别的页面）")
	}
}

// 路径必须带 /panel/api 前缀 —— 网上流传的 /api、/xui/API 都是错的
func TestClient_UsesPanelAPIPrefix(t *testing.T) {
	var seen []string
	c := fakePanel(t, func(w http.ResponseWriter, r *http.Request) {
		seen = append(seen, r.URL.Path)
		okJSON(w, `{}`)
	})
	_ = c.Ping()
	_, _ = c.ListInbounds()
	_ = c.RestartXray()
	for _, p := range seen {
		if !strings.HasPrefix(p, "/panel/api/") {
			t.Errorf("路径缺 /panel/api/ 前缀: %s", p)
		}
	}
}
