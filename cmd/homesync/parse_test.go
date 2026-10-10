package main

import "os"

import (
	"encoding/json"
	"strings"
	"testing"
)

func b64u(s string) string {
	return strings.TrimRight(base64Encode(s), "=")
}

func base64Encode(s string) string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
	out := ""
	for i := 0; i < len(s); i += 3 {
		var b [3]byte
		n := copy(b[:], s[i:])
		out += string(chars[b[0]>>2])
		out += string(chars[((b[0]&0x03)<<4)|(b[1]>>4)])
		if n > 1 {
			out += string(chars[((b[1]&0x0f)<<2)|(b[2]>>6)])
		}
		if n > 2 {
			out += string(chars[b[2]&0x3f])
		}
	}
	return out
}

// ---------------------------------------------------------------- URI 解析

func TestParseURI_Valid(t *testing.T) {
	cases := map[string]struct {
		uri      string
		protocol string
		host     string
		port     int
	}{
		"vless-reality": {"vless://814bd064-544d-4255-a070-5705c03f6da9@1.2.3.4:443" +
			"?flow=xtls-rprx-vision&fp=chrome" +
			"&pbk=k2hPp0tTW0Da-HK94wYpSCLbuK44LfGqC2MSJIM1Ti0&security=reality" +
			"&sid=48050fab&sni=www.apple.com&type=tcp#n1", "vless", "1.2.3.4", 443},
		"vless-ws": {"vless://814bd064-544d-4255-a070-5705c03f6da9@5.6.7.8:80" +
			"?type=ws&path=%2Fws&host=ws.example.com&security=tls&sni=ws.example.com#n2",
			"vless", "5.6.7.8", 80},
		"vless-grpc": {"vless://814bd064-544d-4255-a070-5705c03f6da9@9.9.9.9:443" +
			"?type=grpc&serviceName=svc&security=tls&sni=g.example.com#n3",
			"vless", "9.9.9.9", 443},
		"trojan": {"trojan://mypassword@1.2.3.4:443?security=tls&sni=t.example.com#n4", "trojan", "1.2.3.4", 443},
		"trojan-ws": {"trojan://mypassword@1.2.3.4:443?type=ws&path=%2Ftp&security=tls#n5",
			"trojan", "1.2.3.4", 443},
		"ss-b64":   {"ss://" + b64u("chacha20-ietf-poly1305:pass123") + "@5.6.7.8:8388#n6", "shadowsocks", "5.6.7.8", 8388},
		"ss-plain": {"ss://aes-256-gcm:plainpass@5.6.7.8:8388#n7", "shadowsocks", "5.6.7.8", 8388},
		"hy2":      {"hysteria2://mypassword@9.9.9.9:443?sni=hy.example.com#n8", "hysteria", "9.9.9.9", 443},
	}

	for name, tc := range cases {
		node, err := ParseURI(tc.uri)
		if err != nil {
			t.Fatalf("%s: 解析失败: %v", name, err)
		}
		if node.Protocol != tc.protocol {
			t.Errorf("%s: 协议 = %s, 要 %s", name, node.Protocol, tc.protocol)
		}
		if node.Host != tc.host {
			t.Errorf("%s: 主机 = %s, 要 %s", name, node.Host, tc.host)
		}
		if node.Port != tc.port {
			t.Errorf("%s: 端口 = %d, 要 %d", name, node.Port, tc.port)
		}
		if !XUIProtocols[node.Protocol] {
			t.Errorf("%s: 协议 %s 不在 3x-ui 白名单内", name, node.Protocol)
		}
		// settings/stream 必须能序列化，否则面板会拒
		if _, err := json.Marshal(node.Settings); err != nil {
			t.Errorf("%s: settings 序列化失败: %v", name, err)
		}
		if _, err := json.Marshal(node.Stream); err != nil {
			t.Errorf("%s: stream 序列化失败: %v", name, err)
		}
	}
}

func TestParseURI_VMESS(t *testing.T) {
	payload := map[string]interface{}{
		"v": "2", "add": "7.7.7.7", "port": "443",
		"id": "b831381d-6324-4d53-ad4f-8cda48b30811", "aid": "0",
		"scy": "auto", "net": "ws", "host": "vm.example.com",
		"path": "/vmess", "tls": "tls", "sni": "vmess.example.com",
	}
	raw, _ := json.Marshal(payload)
	uri := "vmess://" + b64u(string(raw)) + "#vm"

	node, err := ParseURI(uri)
	if err != nil {
		t.Fatalf("vmess 解析失败: %v", err)
	}
	if node.Protocol != "vmess" {
		t.Errorf("协议 = %s, 要 vmess", node.Protocol)
	}
	if node.Host != "7.7.7.7" || node.Port != 443 {
		t.Errorf("地址 = %s:%d, 要 7.7.7.7:443", node.Host, node.Port)
	}
	if node.Stream.Network != "ws" {
		t.Errorf("network = %s, 要 ws", node.Stream.Network)
	}
	if node.Stream.WSSettings == nil || node.Stream.WSSettings.Path != "/vmess" {
		t.Errorf("ws path 不对: %+v", node.Stream.WSSettings)
	}
	if node.Stream.Security != "tls" {
		t.Errorf("security = %s, 要 tls", node.Stream.Security)
	}
}

func TestParseURI_VMESS_NoTLS(t *testing.T) {
	payload := map[string]interface{}{
		"v": "2", "add": "8.8.8.8", "port": "443",
		"id": "b831381d-6324-4d53-ad4f-8cda48b30811", "aid": "0", "net": "tcp", "tls": "",
	}
	raw, _ := json.Marshal(payload)
	node, err := ParseURI("vmess://" + b64u(string(raw)))
	if err != nil {
		t.Fatalf("解析失败: %v", err)
	}
	if node.Stream.Security != "none" {
		t.Errorf("无 tls 时 security = %s, 要 none", node.Stream.Security)
	}
}

// 坏输入必须报错，不能塞脏数据进面板
func TestParseURI_Invalid(t *testing.T) {
	bad := map[string]string{
		"空字符串":          "",
		"无 ://":         "not-a-uri",
		"vmess 坏 b64":   "vmess://!!!!notbase64",
		"未知协议":          "socks5://user:pass@1.2.3.4:1080",
		"snell":         "snell://pass@1.2.3.4:443?obfs=http",
		"vless 无 @":     "vless://814bd064-544d-1.2.3.4:443",
		"端口非法":          "trojan://pw@1.2.3.4:notaport",
		"REALITY 缺 pbk": "vless://814bd064@1.2.3.4:443?security=reality&sni=a.com",
		"ss 无密码":        "ss://@1.2.3.4:8388",
	}
	for name, uri := range bad {
		if node, err := ParseURI(uri); err == nil {
			t.Errorf("%s: 应当报错但解析成功了 -> %+v", name, node)
		}
	}
}

// REALITY 参数必须进 realitySettings，不是 tlsSettings。
// 放错位置节点会连不上 —— 这是实测踩过的坑。
func TestParseURI_RealityPlacement(t *testing.T) {
	uri := "vless://814bd064-544d-4255-a070-5705c03f6da9@1.2.3.4:443" +
		"&security=reality&pbk=PUBKEY123&sid=abc123&sni=www.apple.com&fp=chrome&type=tcp"
	uri = strings.Replace(uri, ":443&security", ":443?security", 1)

	node, err := ParseURI(uri)
	if err != nil {
		t.Fatalf("解析失败: %v", err)
	}
	if node.Stream.Reality == nil {
		t.Fatal("realitySettings 为空")
	}
	if node.Stream.TLSSettings != nil {
		t.Errorf("REALITY 不该生成 tlsSettings: %+v", node.Stream.TLSSettings)
	}
	if node.Stream.Reality.PublicKey != "PUBKEY123" {
		t.Errorf("publicKey = %q, 要 PUBKEY123", node.Stream.Reality.PublicKey)
	}
	if node.Stream.Reality.ServerName != "www.apple.com" {
		t.Errorf("serverName = %q", node.Stream.Reality.ServerName)
	}
	if node.Stream.Reality.Fingerprint != "chrome" {
		t.Errorf("fingerprint = %q", node.Stream.Reality.Fingerprint)
	}
	if len(node.Stream.Reality.ShortIDs) != 1 || node.Stream.Reality.ShortIDs[0] != "abc123" {
		t.Errorf("shortIds = %v", node.Stream.Reality.ShortIDs)
	}
}

func TestParseURI_TLSPlacement(t *testing.T) {
	node, err := ParseURI("vless://814bd064@1.2.3.4:443?security=tls&sni=a.com&fp=chrome")
	if err != nil {
		t.Fatalf("解析失败: %v", err)
	}
	if node.Stream.TLSSettings == nil {
		t.Fatal("tlsSettings 为空")
	}
	if node.Stream.Reality != nil {
		t.Error("security=tls 不该生成 realitySettings")
	}
	if node.Stream.TLSSettings.ServerName != "a.com" {
		t.Errorf("serverName = %q", node.Stream.TLSSettings.ServerName)
	}
}

// ---------------------------------------------------------------- 白名单

func TestXUIProtocols_MatchesSource(t *testing.T) {
	// 抄自 3x-ui internal/database/model/model.go 的 validate tag
	want := map[string]bool{
		"vmess": true, "vless": true, "trojan": true, "shadowsocks": true,
		"wireguard": true, "hysteria": true, "http": true, "mixed": true,
		"tunnel": true, "tun": true, "mtproto": true, "amneziawg": true, "tuic": true,
	}
	if len(XUIProtocols) != len(want) {
		t.Fatalf("白名单数量 = %d, 要 %d", len(XUIProtocols), len(want))
	}
	for k := range want {
		if !XUIProtocols[k] {
			t.Errorf("缺协议 %s", k)
		}
	}
	for k := range XUIProtocols {
		if !want[k] {
			t.Errorf("多出协议 %s", k)
		}
	}
	// 这是设计事实，不是 bug：3x-ui 不能当 OpenVPN 客户端
	if XUIProtocols["openvpn"] {
		t.Error("openvpn 不该在白名单里")
	}
}

// ---------------------------------------------------------------- inbound 载荷

func TestBuildFromURI_Payload(t *testing.T) {
	uri := "vless://814bd064-544d-4255-a070-5705c03f6da9@1.2.3.4:443" +
		"?security=tls&sni=a.com&type=tcp"
	in, err := buildFromURI(uri, 20000)
	if err != nil {
		t.Fatalf("构造失败: %v", err)
	}
	if !strings.HasPrefix(in.Tag, ManagedPrefix) {
		t.Errorf("tag 缺管理前缀: %s", in.Tag)
	}
	if in.Port != 20000 {
		t.Errorf("port = %d", in.Port)
	}
	if !XUIProtocols[in.Protocol] {
		t.Errorf("协议不在白名单: %s", in.Protocol)
	}
	if in.Port <= 0 || in.Port > 65535 {
		t.Errorf("端口非法: %d", in.Port)
	}
	// settings/streamSettings/sniffing 必须是合法 JSON 字符串
	for name, s := range map[string]string{
		"settings": in.Settings.String(), "streamSettings": in.StreamSet.String(), "sniffing": in.Sniffing.String(),
	} {
		var v interface{}
		if err := json.Unmarshal([]byte(s), &v); err != nil {
			t.Errorf("%s 不是合法 JSON: %v", name, err)
		}
	}
	if !in.Enable {
		t.Error("enable 应为 true")
	}
}

func TestBuildFromURI_RejectsUnknown(t *testing.T) {
	if _, err := buildFromURI("socks5://u:p@1.2.3.4:1080", 20000); err == nil {
		t.Error("未知协议应当报错")
	}
}

// ---------------------------------------------------------------- .ovpn

func mkOvpn(host, port, proto, cipher, auth string, certs bool) string {
	lines := []string{
		"client", "dev tun", "proto " + proto, "remote " + host + " " + port,
		"cipher " + cipher, "auth " + auth, "resolv-retry infinite",
		"nobind", "persist-key", "persist-tun", "verb 3",
	}
	if certs {
		lines = append(lines,
			"<ca>", "-----BEGIN CERTIFICATE-----", "MIIFazCCA1Og", "-----END CERTIFICATE-----", "</ca>",
			"<cert>", "-----BEGIN CERTIFICATE-----", "MIIBZzCCAQ2g", "-----END CERTIFICATE-----", "</cert>",
			"<key>", "-----BEGIN PRIVATE KEY-----", "MIGHAgEAMBMG", "-----END PRIVATE KEY-----", "</key>")
	}
	return strings.Join(lines, "\n") + "\n"
}

func TestParseOvpn(t *testing.T) {
	cfg, err := ParseOvpn(mkOvpn("106.136.100.245", "1946", "tcp", "AES-128-CBC", "SHA1", true))
	if err != nil {
		t.Fatalf("解析失败: %v", err)
	}
	if cfg.Host != "106.136.100.245" {
		t.Errorf("host = %s", cfg.Host)
	}
	if cfg.Port != 1946 {
		t.Errorf("port = %d", cfg.Port)
	}
	if cfg.Proto != "tcp" {
		t.Errorf("proto = %s", cfg.Proto)
	}
	if cfg.Cipher != "AES-128-CBC" {
		t.Errorf("cipher = %s", cfg.Cipher)
	}
	if cfg.Auth != "SHA1" {
		t.Errorf("auth = %s", cfg.Auth)
	}
	if !strings.Contains(cfg.CA, "BEGIN CERTIFICATE") {
		t.Error("CA 没抽到")
	}
	if !strings.Contains(cfg.Key, "BEGIN PRIVATE KEY") {
		t.Error("私钥没抽到")
	}
}

func TestParseOvpn_Invalid(t *testing.T) {
	if _, err := ParseOvpn(""); err == nil {
		t.Error("空配置应当报错")
	}
	if _, err := ParseOvpn("client\ndev tun\n"); err == nil {
		t.Error("无 remote 应当报错")
	}
}

func TestParseOvpn_UdpDefaultPort(t *testing.T) {
	cfg, err := ParseOvpn(mkOvpn("1.2.3.4", "", "udp", "", "", false))
	if err != nil {
		t.Fatalf("解析失败: %v", err)
	}
	if cfg.Port != 1194 {
		t.Errorf("缺省端口 = %d, 要 1194", cfg.Port)
	}
	if cfg.Cipher != "AES-128-CBC" || cfg.Auth != "SHA1" {
		t.Errorf("缺省 cipher/auth = %s/%s", cfg.Cipher, cfg.Auth)
	}
}

func TestWriteOvpnConf_DropsConflicting(t *testing.T) {
	raw := mkOvpn("1.2.3.4", "1194", "tcp", "AES-128-CBC", "SHA1", true) +
		"up /etc/openvpn/up.sh\n" +
		"down /etc/openvpn/down.sh\n" +
		"redirect-gateway def1\n" +
		"script-security 3\n" +
		"route 10.0.0.0 255.0.0.0\n"
	cfg, err := ParseOvpn(raw)
	if err != nil {
		t.Fatalf("解析失败: %v", err)
	}
	path := t.TempDir() + "/t.ovpn"
	if err := WriteOvpnConf(cfg, path); err != nil {
		t.Fatalf("写配置失败: %v", err)
	}
	body, _ := readFileString(path)

	for _, want := range []string{"up /etc/openvpn/up.sh", "redirect-gateway", "route 10.0.0.0"} {
		if strings.Contains(body, want) {
			t.Errorf("该剔掉的指令还在: %s", want)
		}
	}
	for _, want := range []string{"remote 1.2.3.4 1194", "route-nopull", "BEGIN CERTIFICATE"} {
		if !strings.Contains(body, want) {
			t.Errorf("该保留的没了: %s", want)
		}
	}
}

func readFileString(path string) (string, error) {
	b, err := readFile(path)
	return string(b), err
}

func TestGatewayOf(t *testing.T) {
	if got := GatewayOf("10.8.0.6"); got != "10.8.0.1" {
		t.Errorf("GatewayOf(10.8.0.6) = %s, 要 10.8.0.1", got)
	}
	if got := GatewayOf("bogus"); got != "" {
		t.Errorf("GatewayOf(bogus) = %q, 要空", got)
	}
}

// ---------------------------------------------------------------- 工具函数

func TestSlugify(t *testing.T) {
	cases := map[string]string{
		"106.136.100.245": "106-136-100-245",
		"Example.COM":     "example-com",
		"":                "node",
		"!!!":             "node",
	}
	for in, want := range cases {
		if got := slugify(in); got != want {
			t.Errorf("slugify(%q) = %q, 要 %q", in, got, want)
		}
	}
	long := strings.Repeat("a", 60)
	if got := slugify(long); len(got) != 40 {
		t.Errorf("超长串未截断: len=%d", len(got))
	}
}

func TestSplitHostPort(t *testing.T) {
	h, p, err := splitHostPort("1.2.3.4:443")
	if err != nil || h != "1.2.3.4" || p != 443 {
		t.Errorf("IPv4 = %s:%d err=%v", h, p, err)
	}
	h, p, err = splitHostPort("[2001:db8::1]:443")
	if err != nil || h != "2001:db8::1" || p != 443 {
		t.Errorf("IPv6 = %s:%d err=%v", h, p, err)
	}
	if _, _, err := splitHostPort("1.2.3.4"); err == nil {
		t.Error("缺端口应当报错")
	}
}

func TestDecodeUserInfo(t *testing.T) {
	// 无填充 base64
	if got := decodeUserInfo(b64u("chacha20-ietf-poly1305:pass123")); got != "chacha20-ietf-poly1305:pass123" {
		t.Errorf("无填充 = %q", got)
	}
	// 明文
	if got := decodeUserInfo("aes-256-gcm:plain"); got != "aes-256-gcm:plain" {
		t.Errorf("明文 = %q", got)
	}
}

func TestCountryCode(t *testing.T) {
	if got := countryCode("japan"); got != "jp" {
		t.Errorf("japan = %q", got)
	}
	if got := countryCode("south-korea"); got != "kr" {
		t.Errorf("south-korea = %q", got)
	}
	if got := countryCode("zzz-land"); got != "zz" {
		t.Errorf("未知国家 = %q, 要前两位", got)
	}
}

func TestFilterRows(t *testing.T) {
	rows := []VPNRow{
		{ID: 1, Active: true, Downloadable: true, Country: "japan", Throughput: 5.2, RTT: 200},
		{ID: 2, Active: true, Downloadable: true, Country: "usa", Throughput: 9.1, RTT: 150},
		{ID: 3, Active: false, Downloadable: false, Country: "usa", Throughput: 99, RTT: 10},
		{ID: 4, Active: true, Downloadable: true, Country: "usa", Throughput: 0.4, RTT: 800},
	}
	c := &config{limit: 10}
	out := filterRows(rows, c)
	if len(out) != 3 {
		t.Fatalf("应剔掉 inactive，剩 %d", len(out))
	}
	if out[0].ID != 2 {
		t.Errorf("应按速度倒序，首位 = %d", out[0].ID)
	}
	// 国家过滤
	c.country = "japan"
	if out := filterRows(rows, c); len(out) != 1 || out[0].ID != 1 {
		t.Errorf("国家过滤不对: %+v", out)
	}
	// 速度过滤
	c.country = ""
	c.minSpeed = 5
	if out := filterRows(rows, c); len(out) != 2 {
		t.Errorf("速度过滤应剩 2，实际 %d", len(out))
	}
}

func TestMinInt(t *testing.T) {
	if minInt(3, 5) != 3 || minInt(5, 3) != 3 || minInt(2, 2) != 2 {
		t.Error("minInt 不对")
	}
}

func readFile(path string) ([]byte, error) {
	return os.ReadFile(path)
}

// 各家 vmess 生成器给的类型不统一：aid/port 有时是字符串有时是数字。
// 固定类型会 unmarshal 失败把整条节点丢掉 —— 这是实测踩到的。
func TestParseURI_VMESS_MixedTypes(t *testing.T) {
	cases := map[string]map[string]interface{}{
		"aid 是数字": {"v": "2", "add": "1.2.3.4", "port": 443,
			"id": "b831381d-6324-4d53-ad4f-8cda48b30811", "aid": 0, "net": "tcp"},
		"aid 是字符串": {"v": "2", "add": "1.2.3.4", "port": "443",
			"id": "b831381d-6324-4d53-ad4f-8cda48b30811", "aid": "0", "net": "tcp"},
		"port 是数字": {"v": "2", "add": "1.2.3.4", "port": 8388,
			"id": "b831381d-6324-4d53-ad4f-8cda48b30811", "aid": "2", "net": "tcp"},
	}
	for name, payload := range cases {
		raw, _ := json.Marshal(payload)
		node, err := ParseURI("vmess://" + b64u(string(raw)))
		if err != nil {
			t.Errorf("%s: 解析失败: %v", name, err)
			continue
		}
		want := 443
		if name == "port 是数字" {
			want = 8388
		}
		if node.Port != want {
			t.Errorf("%s: port = %d, 要 %d", name, node.Port, want)
		}
	}
}

func TestToInt(t *testing.T) {
	cases := []struct {
		in   interface{}
		want int
	}{
		{float64(42), 42},
		{"42", 42},
		{" 42 ", 42},
		{"abc", 0},
		{nil, 0},
		{json.Number("7"), 7},
	}
	for _, tc := range cases {
		if got := toInt(tc.in); got != tc.want {
			t.Errorf("toInt(%v) = %d, 要 %d", tc.in, got, tc.want)
		}
	}
}
