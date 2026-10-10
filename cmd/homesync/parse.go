// share URI -> 3x-ui inbound 载荷
//
// PublicVPNList 给的是 vless:// / trojan:// / ss:// / vmess:// / hysteria2:// 这类
// share URI，3x-ui 要的却是 settings 和 streamSettings 两个 JSON 字符串。
// 这个文件负责把前者翻成后者。
//
// 原则：拿不准的一律返回错误，绝不塞脏数据进面板。
// 一个字段写错可能让整个 xray 起不来。
package main

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/url"
	"strconv"
	"strings"
)

// XUIProtocols 是 3x-ui inbound 支持的协议白名单。
// 抄自 internal/database/model/model.go 的 validate tag，写死不可配：
//
//	oneof=vmess vless trojan shadowsocks wireguard hysteria http
//	      mixed tunnel tun mtproto amneziawg tuic
//
// 注意：**没有 openvpn**。3x-ui 是 xray-core 面板，不能当 OpenVPN 客户端。
// 这是设计限制，不是配置能绕的。
var XUIProtocols = map[string]bool{
	"vmess":       true,
	"vless":       true,
	"trojan":      true,
	"shadowsocks": true,
	"wireguard":   true,
	"hysteria":    true,
	"http":        true,
	"mixed":       true,
	"tunnel":      true,
	"tun":         true,
	"mtproto":     true,
	"amneziawg":   true,
	"tuic":        true,
}

// TLSLike 是 xray 传输层设置。
type TLSLike struct {
	ServerName  string   `json:"serverName,omitempty"`
	Fingerprint string   `json:"fingerprint,omitempty"`
	PublicKey   string   `json:"publicKey,omitempty"`
	ShortIDs    []string `json:"shortIds,omitempty"`
}

// StreamSettings 是 xray 的 streamSettings。
type StreamSettings struct {
	Network     string        `json:"network"`
	Security    string        `json:"security,omitempty"`
	TLSSettings *TLSLike      `json:"tlsSettings,omitempty"`
	Reality     *TLSLike      `json:"realitySettings,omitempty"`
	WSSettings  *WSSettings   `json:"wsSettings,omitempty"`
	GRPC        *GRPCSettings `json:"grpcSettings,omitempty"`
}

type WSSettings struct {
	Path    string            `json:"path,omitempty"`
	Headers map[string]string `json:"headers,omitempty"`
}

type GRPCSettings struct {
	ServiceName string `json:"serviceName,omitempty"`
}

// VLESSClient vless 客户端条目。
type VLESSClient struct {
	ID      string `json:"id"`
	Flow    string `json:"flow,omitempty"`
	Email   string `json:"email"`
	Decrypt string `json:"decryption,omitempty"`
}

// ParsedNode 解析结果：协议 + settings + streamSettings（均为可序列化结构）。
type ParsedNode struct {
	Protocol string
	Host     string
	Port     int
	Settings interface{}
	Stream   *StreamSettings
}

// userinfo 解码：可能是 base64（含填充或无填充），也可能是明文 method:password。
func decodeUserInfo(s string) string {
	if s == "" {
		return ""
	}
	// 逐尝试补填充
	for _, pad := range []string{"", "=", "==", "==="} {
		if raw, err := base64.StdEncoding.DecodeString(s + pad); err == nil {
			if txt := string(raw); strings.Contains(txt, ":") && isPrintable(txt) {
				return txt
			}
		}
	}
	// URL 变体字符集
	for _, pad := range []string{"", "=", "==", "==="} {
		if raw, err := base64.URLEncoding.DecodeString(s + pad); err == nil {
			if txt := string(raw); strings.Contains(txt, ":") && isPrintable(txt) {
				return txt
			}
		}
	}
	return s
}

func isPrintable(s string) bool {
	for _, r := range s {
		if r < 0x20 || r == 0x7f {
			return false
		}
	}
	return true
}

// splitHostPort 兼容 IPv6 方括号形式。
func splitHostPort(s string) (string, int, error) {
	if strings.HasPrefix(s, "[") {
		close := strings.Index(s, "]")
		if close == -1 {
			return "", 0, fmt.Errorf("IPv6 地址缺少右括号: %s", s)
		}
		host := s[1:close]
		rest := s[close+1:]
		if !strings.HasPrefix(rest, ":") {
			return "", 0, fmt.Errorf("IPv6 地址后缺少端口: %s", s)
		}
		port, err := strconv.Atoi(rest[1:])
		if err != nil {
			return "", 0, fmt.Errorf("端口非法: %s", rest[1:])
		}
		return host, port, nil
	}
	idx := strings.LastIndex(s, ":")
	if idx == -1 {
		return "", 0, fmt.Errorf("地址缺少端口: %s", s)
	}
	port, err := strconv.Atoi(s[idx+1:])
	if err != nil {
		return "", 0, fmt.Errorf("端口非法: %s", s[idx+1:])
	}
	return s[:idx], port, nil
}

// ParseURI 把 share URI 翻成 3x-ui 能吃的 inbound 载荷。
func ParseURI(uri string) (*ParsedNode, error) {
	uri = strings.TrimSpace(uri)
	if uri == "" {
		return nil, fmt.Errorf("空 URI")
	}
	idx := strings.Index(uri, "://")
	if idx == -1 {
		return nil, fmt.Errorf("不是 share URI（缺 ://）")
	}
	scheme := strings.ToLower(uri[:idx])
	rest := uri[idx+3:]

	// 去掉 #备注
	if frag := strings.Index(rest, "#"); frag != -1 {
		rest = rest[:frag]
	}
	// 分离查询串
	var query string
	main := rest
	if q := strings.Index(main, "?"); q != -1 {
		query = main[q+1:]
		main = main[:q]
	}
	params, err := url.ParseQuery(query)
	if err != nil {
		return nil, fmt.Errorf("查询串解析失败: %w", err)
	}
	one := func(k string) string {
		if v := params.Get(k); v != "" {
			return v
		}
		return ""
	}

	switch scheme {
	case "vmess":
		return parseVMESS(main)
	case "vless":
		return parseVLESS(main, one)
	case "trojan":
		return parseTrojan(main, one)
	case "ss", "shadowsocks":
		return parseSS(main)
	case "hysteria2", "hy2":
		return parseHysteria2(main, one)
	default:
		return nil, fmt.Errorf("不支持的协议: %s", scheme)
	}
}

func parseVLESS(main string, one func(string) string) (*ParsedNode, error) {
	at := strings.LastIndex(main, "@")
	if at == -1 {
		return nil, fmt.Errorf("vless 缺少 @")
	}
	uuid := main[:at]
	host, port, err := splitHostPort(main[at+1:])
	if err != nil {
		return nil, err
	}
	if uuid == "" {
		return nil, fmt.Errorf("vless UUID 为空")
	}
	if port <= 0 || port > 65535 {
		return nil, fmt.Errorf("vless 端口非法: %d", port)
	}

	sec := strings.ToLower(one("security"))
	if sec == "" {
		sec = "none"
	}
	stream := &StreamSettings{Network: strings.ToLower(one("type")), Security: sec}
	if stream.Network == "" {
		stream.Network = "tcp"
	}

	switch sec {
	case "reality":
		// REALITY 的 serverName / fingerprint / publicKey 必须放在 realitySettings，
		// 放 tlsSettings 节点会连不上 —— 这是实测踩过的坑。
		r := &TLSLike{
			ServerName:  one("sni"),
			Fingerprint: one("fp"),
			PublicKey:   one("pbk"),
		}
		if sid := one("sid"); sid != "" {
			r.ShortIDs = []string{sid}
		}
		if r.PublicKey == "" {
			return nil, fmt.Errorf("REALITY 缺少 pbk 公钥")
		}
		stream.Reality = r
	case "tls":
		t := &TLSLike{ServerName: one("sni"), Fingerprint: one("fp")}
		stream.TLSSettings = t
	}

	switch stream.Network {
	case "ws":
		ws := &WSSettings{Path: one("path")}
		if ws.Path == "" {
			ws.Path = "/"
		}
		if h := one("host"); h != "" {
			ws.Headers = map[string]string{"Host": h}
		}
		stream.WSSettings = ws
	case "grpc":
		stream.GRPC = &GRPCSettings{ServiceName: one("serviceName")}
	}

	client := map[string]string{
		"id":         uuid,
		"email":      "home@" + slugify(host),
		"decryption": "none",
	}
	if f := one("flow"); f != "" {
		client["flow"] = f
	}
	return &ParsedNode{
		Protocol: "vless",
		Host:     host,
		Port:     port,
		Settings: map[string]interface{}{
			"clients":    []map[string]string{client},
			"decryption": "none",
		},
		Stream: stream,
	}, nil
}

func parseTrojan(main string, one func(string) string) (*ParsedNode, error) {
	at := strings.LastIndex(main, "@")
	if at == -1 {
		return nil, fmt.Errorf("trojan 缺少 @")
	}
	password := main[:at]
	host, port, err := splitHostPort(main[at+1:])
	if err != nil {
		return nil, err
	}
	if password == "" {
		return nil, fmt.Errorf("trojan 密码为空")
	}
	if port <= 0 || port > 65535 {
		return nil, fmt.Errorf("trojan 端口非法: %d", port)
	}

	network := strings.ToLower(one("type"))
	if network == "" {
		network = "tcp"
	}
	sec := strings.ToLower(one("security"))
	if sec == "" {
		sec = "tls"
	}
	stream := &StreamSettings{Network: network, Security: sec}
	if sni := one("sni"); sni != "" {
		stream.TLSSettings = &TLSLike{ServerName: sni}
	}
	if network == "ws" {
		ws := &WSSettings{Path: one("path")}
		if ws.Path == "" {
			ws.Path = "/"
		}
		stream.WSSettings = ws
	}
	return &ParsedNode{
		Protocol: "trojan",
		Host:     host,
		Port:     port,
		Settings: map[string]interface{}{
			"clients": []map[string]string{
				{"password": password, "email": "home@" + slugify(host)},
			},
		},
		Stream: stream,
	}, nil
}

func parseSS(main string) (*ParsedNode, error) {
	at := strings.LastIndex(main, "@")
	if at == -1 {
		return nil, fmt.Errorf("ss 缺少 @")
	}
	userinfo := main[:at]
	host, port, err := splitHostPort(main[at+1:])
	if err != nil {
		return nil, err
	}
	if port <= 0 || port > 65535 {
		return nil, fmt.Errorf("ss 端口非法: %d", port)
	}
	method, password := "", ""
	dec := decodeUserInfo(userinfo)
	if i := strings.Index(dec, ":"); i != -1 {
		method = dec[:i]
		password = dec[i+1:]
	}
	if method == "" || password == "" {
		return nil, fmt.Errorf("ss 方法和密码解析不出来")
	}
	return &ParsedNode{
		Protocol: "shadowsocks",
		Host:     host,
		Port:     port,
		Settings: map[string]interface{}{
			"method":   method,
			"password": password,
			"network":  "tcp",
		},
		Stream: &StreamSettings{Network: "tcp"},
	}, nil
}

func parseHysteria2(main string, one func(string) string) (*ParsedNode, error) {
	at := strings.LastIndex(main, "@")
	if at == -1 {
		return nil, fmt.Errorf("hysteria2 缺少 @")
	}
	password := main[:at]
	host, port, err := splitHostPort(main[at+1:])
	if err != nil {
		return nil, err
	}
	if password == "" {
		return nil, fmt.Errorf("hysteria2 密码为空")
	}
	if port <= 0 || port > 65535 {
		return nil, fmt.Errorf("hysteria2 端口非法: %d", port)
	}
	stream := &StreamSettings{Network: "udp", Security: "tls"}
	if sni := one("sni"); sni != "" {
		stream.TLSSettings = &TLSLike{ServerName: sni}
	}
	return &ParsedNode{
		Protocol: "hysteria",
		Host:     host,
		Port:     port,
		Settings: map[string]interface{}{
			"version":   2,
			"up_mbps":   100,
			"down_mbps": 100,
			"clients": []map[string]string{
				{"password": password, "email": "home@" + slugify(host)},
			},
		},
		Stream: stream,
	}, nil
}

// vmessConfig vmess 的 base64 JSON 载荷。
//
// 字段类型一律用 json.Number / interface{} 兜住：各家生成器给的类型并不统一，
// 实测 aid 有时是字符串 "0"、有时是数字 0，port 同理。用固定类型会直接
// unmarshal 失败，整条节点就被丢掉了。
type vmessConfig struct {
	V    string      `json:"v"`
	Add  string      `json:"add"`
	Port interface{} `json:"port"`
	ID   string      `json:"id"`
	Aid  interface{} `json:"aid"`
	Scy  string      `json:"scy"`
	Net  string      `json:"net"`
	Host string      `json:"host"`
	Path string      `json:"path"`
	TLS  string      `json:"tls"`
	SNI  string      `json:"sni"`
}

// toInt 把可能是数字或字符串的字段统一成 int。
func toInt(v interface{}) int {
	switch n := v.(type) {
	case float64:
		return int(n)
	case string:
		if i, err := strconv.Atoi(strings.TrimSpace(n)); err == nil {
			return i
		}
	case json.Number:
		if i, err := n.Int64(); err == nil {
			return int(i)
		}
	case nil:
		return 0
	}
	return 0
}

func parseVMESS(main string) (*ParsedNode, error) {
	pad := main
	if m := len(pad) % 4; m != 0 {
		pad += strings.Repeat("=", 4-m)
	}
	raw, err := base64.StdEncoding.DecodeString(pad)
	if err != nil {
		return nil, fmt.Errorf("vmess base64 解码失败: %w", err)
	}
	var cfg vmessConfig
	if err := json.Unmarshal(raw, &cfg); err != nil {
		return nil, fmt.Errorf("vmess JSON 解析失败: %w", err)
	}
	if cfg.ID == "" {
		return nil, fmt.Errorf("vmess 缺少 id")
	}
	port := toInt(cfg.Port)
	if port <= 0 || port > 65535 {
		return nil, fmt.Errorf("vmess 端口非法: %v", cfg.Port)
	}
	net := strings.ToLower(cfg.Net)
	if net == "" {
		net = "tcp"
	}
	stream := &StreamSettings{Network: net, Security: "none"}
	if cfg.TLS != "" && cfg.TLS != "none" {
		stream.Security = "tls"
		if cfg.SNI != "" {
			stream.TLSSettings = &TLSLike{ServerName: cfg.SNI}
		}
	}
	if net == "ws" {
		ws := &WSSettings{Path: cfg.Path}
		if ws.Path == "" {
			ws.Path = "/"
		}
		if cfg.Host != "" {
			ws.Headers = map[string]string{"Host": cfg.Host}
		}
		stream.WSSettings = ws
	}
	aid := toInt(cfg.Aid)
	return &ParsedNode{
		Protocol: "vmess",
		Host:     cfg.Add,
		Port:     port,
		Settings: map[string]interface{}{
			"clients": []map[string]interface{}{
				{
					"id":      cfg.ID,
					"alterId": aid,
					"email":   "home@" + slugify(cfg.Add),
				},
			},
		},
		Stream: stream,
	}, nil
}

// slugify 把主机/备注压成能放进 tag 和 email 的安全串。
func slugify(s string) string {
	var b strings.Builder
	for _, r := range s {
		switch {
		case r >= 'a' && r <= 'z', r >= 'A' && r <= 'Z', r >= '0' && r <= '9':
			b.WriteRune(r)
		case r == '-' || r == '_':
			b.WriteRune(r)
		default:
			b.WriteRune('-')
		}
	}
	out := strings.Trim(b.String(), "-")
	if out == "" {
		return "node"
	}
	if len(out) > 40 {
		out = out[:40]
	}
	return strings.ToLower(out)
}
