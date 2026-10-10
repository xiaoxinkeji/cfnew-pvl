package main

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLoadSettings(t *testing.T) {
	dir := t.TempDir()
	p := filepath.Join(dir, "settings.json")
	body := `{"mode":"ovpn","limit":7,"country":"japan,usa","interval":600}`
	if err := os.WriteFile(p, []byte(body), 0o600); err != nil {
		t.Fatal(err)
	}
	s, err := loadSettings(p)
	if err != nil {
		t.Fatalf("读取失败: %v", err)
	}
	if s.Mode != "ovpn" || s.Limit != 7 || s.Country != "japan,usa" || s.Interval != 600 {
		t.Errorf("解析结果不对: %+v", s)
	}
}

func TestLoadSettings_Missing(t *testing.T) {
	if _, err := loadSettings(filepath.Join(t.TempDir(), "nope.json")); err == nil {
		t.Error("文件不存在应当报错")
	}
}

func TestLoadSettings_BadJSON(t *testing.T) {
	dir := t.TempDir()
	p := filepath.Join(dir, "settings.json")
	_ = os.WriteFile(p, []byte("{not json"), 0o600)
	if _, err := loadSettings(p); err == nil {
		t.Error("坏 JSON 应当报错")
	}
}

func TestSaveAndReadToken(t *testing.T) {
	dir := t.TempDir()
	if err := saveToken(dir, "abc123XYZ"); err != nil {
		t.Fatalf("保存失败: %v", err)
	}
	// 权限必须是 0600 —— 这是面板的管理凭据
	info, err := os.Stat(filepath.Join(dir, tokenFileName))
	if err != nil {
		t.Fatal(err)
	}
	if perm := info.Mode().Perm(); perm != 0o600 {
		t.Errorf("token 文件权限 = %o, 要 600", perm)
	}
	if got := readSavedToken(dir); got != "abc123XYZ" {
		t.Errorf("读回 = %q", got)
	}
	if got := readSavedToken(t.TempDir()); got != "" {
		t.Errorf("无文件时应当返回空, 得到 %q", got)
	}
}

func TestSavePanelURL(t *testing.T) {
	dir := t.TempDir()
	savePanelURL(dir, "http://127.0.0.1:54321/abc")
	raw, err := os.ReadFile(filepath.Join(dir, ".xui-url"))
	if err != nil {
		t.Fatalf("没写出来: %v", err)
	}
	if string(raw) != "http://127.0.0.1:54321/abc\n" {
		t.Errorf("内容 = %q", string(raw))
	}
}

// 面板设了子路径时，basePath 必须拼进地址，漏了就 404
func TestXUIBasePathParsing(t *testing.T) {
	cases := map[string]string{
		"port: 54321\nwebBasePath: /":     "",
		"port: 54321\nwebBasePath: /abc/": "/abc",
		"port: 54321\nwebBasePath: /a/b/": "/a/b",
	}
	for text, want := range cases {
		bm := reXUIBase.FindStringSubmatch(text)
		if bm == nil {
			t.Fatalf("解析不出 basePath: %q", text)
		}
		got := trimSuffixSlash(bm[1])
		if got != want {
			t.Errorf("basePath = %q, 要 %q", got, want)
		}
	}
}

// 值必须限定在本行内取：空值时不能把下一行内容当成值
func TestXUIRegex_SameLineOnly(t *testing.T) {
	// webBasePath 为空时，下一行是别的字段
	text := "port: 54321\nwebBasePath: \ncertFile: /etc/x.crt\nabc: def"
	m := reXUIBase.FindStringSubmatch(text)
	if m != nil {
		t.Errorf("空 basePath 不该匹配到值, 得到 %q", m[1])
	}
	// 端口能正常取到
	pm := reXUIPort.FindStringSubmatch(text)
	if pm == nil || pm[1] != "54321" {
		t.Errorf("端口解析 = %v", pm)
	}
}

func TestXUIRegex_Token(t *testing.T) {
	m := reXUIToken.FindStringSubmatch("apiToken: abc123XYZ\nother: zzz")
	if m == nil || m[1] != "abc123XYZ" {
		t.Errorf("token 解析 = %v", m)
	}
	// 提示文字里的长单词不该被当成 token
	if m := reXUIToken.FindStringSubmatch("run x-ui setting -getApiToken to obtain"); m != nil {
		t.Errorf("不该匹配提示文字, 得到 %q", m[1])
	}
}

// "not secure" 包含 "secure"，必须先排除否定的那种
func TestXUISSLFromSettings(t *testing.T) {
	if on, stated := xuiSSLFromSettings("Warning: Panel is not secure with SSL"); on || !stated {
		t.Errorf("not secure 应返回 (false,true)，得到 (%v,%v)", on, stated)
	}
	if on, stated := xuiSSLFromSettings("Panel is secure with SSL"); !on || !stated {
		t.Errorf("secure 应返回 (true,true)，得到 (%v,%v)", on, stated)
	}
	if _, stated := xuiSSLFromSettings("port: 54321"); stated {
		t.Error("没提 SSL 时 stated 应为 false")
	}
}

func TestStripANSI(t *testing.T) {
	got := stripANSI("\x1b[0;32mAccess URL:\x1b[0m http://1.2.3.4:54321/abc/")
	want := "Access URL: http://1.2.3.4:54321/abc/"
	if got != want {
		t.Errorf("剥 ANSI = %q, 要 %q", got, want)
	}
}

func TestXUIAccessURLRegex(t *testing.T) {
	m := reXUIAccess.FindStringSubmatch("Access URL: https://panel.example.com:54321/abc/")
	if m == nil {
		t.Fatal("没匹配上")
	}
	if m[1] != "https" || m[2] != "panel.example.com" || m[3] != "54321" {
		t.Errorf("解析 = %v", m)
	}
}

// DetectXUI 在没装 3x-ui 的机器上必须报错而不是 panic
func TestDetectXUI_NotInstalled(t *testing.T) {
	if _, err := os.Stat(xuiBinary); err == nil {
		t.Skip("本机装了 3x-ui，跳过")
	}
	if _, _, err := DetectXUI(t.TempDir()); err == nil {
		t.Error("没装 3x-ui 时应当报错")
	}
}
