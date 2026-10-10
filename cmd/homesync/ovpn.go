// OpenVPN 家宽落地（路线 A）
//
// 3x-ui 的 inbound 协议白名单里没有 openvpn —— 它是 xray-core 面板，
// 不能当 OpenVPN 客户端。所以「OpenVPN 家宽落地」必须这样搭：
//
//	PublicVPNList 家宽节点
//	    │  openvpn 客户端（本机，需 root）
//	    ▼
//	  tun0 网卡
//	    │  3x-ui tunnel（dokodemo-door）inbound 把流量导进去
//	    ▼
//	  xray 出站 → 出口 IP = 家宽节点 IP
//
// 这个文件负责：解析 .ovpn、写成能用的配置文件、起 openvpn、等 tun 起来、体检。
package main

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

// OvpnConfig 从 .ovpn 原文里抽出来的关键信息。
type OvpnConfig struct {
	Host   string
	Port   int
	Proto  string
	Cipher string
	Auth   string
	CA     string
	Cert   string
	Key    string
	Raw    string
}

// directive 取单行指令的值，如 "remote 1.2.3.4 1194" -> "1.2.3.4 1194"。
func directive(text, name string) string {
	for _, line := range strings.Split(text, "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") || strings.HasPrefix(line, ";") {
			continue
		}
		fields := strings.Fields(line)
		if len(fields) >= 2 && fields[0] == name {
			return strings.Join(fields[1:], " ")
		}
	}
	return ""
}

// block 取 <tag>...</tag> 里的内容。
func block(text, tag string) string {
	open := "<" + tag + ">"
	close := "</" + tag + ">"
	s := strings.Index(text, open)
	if s == -1 {
		return ""
	}
	e := strings.Index(text[s:], close)
	if e == -1 {
		return ""
	}
	return strings.TrimSpace(text[s+len(open) : s+e])
}

// ParseOvpn 解析 .ovpn 原文。缺 remote 的一律当废配置丢掉。
func ParseOvpn(text string) (*OvpnConfig, error) {
	if strings.TrimSpace(text) == "" {
		return nil, fmt.Errorf("配置为空")
	}
	remote := directive(text, "remote")
	if remote == "" {
		return nil, fmt.Errorf("配置里没有 remote 行")
	}
	fields := strings.Fields(remote)
	port := 1194
	if len(fields) > 1 {
		if p, err := strconv.Atoi(fields[1]); err == nil {
			port = p
		}
	}
	proto := strings.ToLower(directive(text, "proto"))
	if proto == "" {
		proto = "tcp"
	}
	cipher := directive(text, "cipher")
	if cipher == "" {
		cipher = "AES-128-CBC"
	}
	auth := directive(text, "auth")
	if auth == "" {
		auth = "SHA1"
	}
	return &OvpnConfig{
		Host:   fields[0],
		Port:   port,
		Proto:  proto,
		Cipher: cipher,
		Auth:   auth,
		CA:     block(text, "ca"),
		Cert:   block(text, "cert"),
		Key:    block(text, "key"),
		Raw:    text,
	}, nil
}

// ovpnDropPrefix 这些指令会跟我们的路由/守护方式打架，写配置时剔掉。
var ovpnDropPrefix = []string{
	"up ", "down ", "script-security", "route ", "redirect-gateway",
	"dhcp-option", "block-outside-dns", "register-dns", "setenv",
	"route-ipv6", "pull",
}

// WriteOvpnConf 把 .ovpn 原文写成能用的配置文件。
// 原站配置常带 up/down 脚本和 redirect-gateway，会抢全局路由，必须剔掉。
func WriteOvpnConf(cfg *OvpnConfig, path string) error {
	var keep []string
	for _, line := range strings.Split(cfg.Raw, "\n") {
		s := strings.TrimSpace(line)
		drop := false
		for _, p := range ovpnDropPrefix {
			if strings.HasPrefix(s, p) {
				drop = true
				break
			}
		}
		if !drop {
			keep = append(keep, line)
		}
	}
	keep = append(keep,
		"",
		"# --- 由 homesync 追加 ---",
		"route-nopull", // 不接管全局路由，流量按需导入
		"script-security 2",
		"ping 10",
		"ping-restart 60",
		"persist-tun",
		"persist-key",
		"resolv-retry infinite",
		"verb 3",
		"")
	return os.WriteFile(path, []byte(strings.Join(keep, "\n")), 0o600)
}

// StartOvpn 后台起 openvpn（--daemon 模式），返回是否启动成功。
func StartOvpn(confPath, name, ovpnBin, logDir string) error {
	if _, err := exec.LookPath(ovpnBin); err != nil {
		return fmt.Errorf("找不到 %s：路线 A 需要本机装 openvpn（apt install openvpn）；"+
			"不想装就用 -mode xray 走路线 B", ovpnBin)
	}
	logPath := filepath.Join(logDir, "ovpn-"+slugify(name)+".log")
	pidPath := filepath.Join(logDir, "ovpn-"+slugify(name)+".pid")
	cmd := exec.Command(ovpnBin, "--config", confPath, "--daemon",
		"--writepid", pidPath, "--log-append", logPath)
	out, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("openvpn 启动失败: %v %s", err, string(out))
	}
	return nil
}

// StopOvpn 按 pid 文件停掉 openvpn。
func StopOvpn(name, logDir string) {
	pidPath := filepath.Join(logDir, "ovpn-"+slugify(name)+".pid")
	raw, err := os.ReadFile(pidPath)
	if err != nil {
		return
	}
	pid, err := strconv.Atoi(strings.TrimSpace(string(raw)))
	if err != nil {
		return
	}
	proc, err := os.FindProcess(pid)
	if err != nil {
		return
	}
	_ = proc.Kill()
	_ = os.Remove(pidPath)
}

// WaitTun 等 tun 网卡起来并拿到 IPv4，返回虚拟地址。
func WaitTun(iface string, timeout time.Duration) (string, error) {
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		if ip, ok := tunAddr(iface); ok {
			return ip, nil
		}
		time.Sleep(2 * time.Second)
	}
	return "", fmt.Errorf("tun 网卡 %s 在 %.0f 秒内没起来", iface, timeout.Seconds())
}

// tunAddr 读一次 tun 网卡的 IPv4。
func tunAddr(iface string) (string, bool) {
	out, err := exec.Command("ip", "-4", "-o", "addr", "show", iface).Output()
	if err != nil {
		return "", false
	}
	// 形如 "2: tun0    inet 10.8.0.6/24 ..."
	for _, f := range strings.Fields(string(out)) {
		if strings.HasPrefix(f, "inet") {
			continue
		}
		if strings.Count(f, ".") == 3 && strings.Contains(f, "/") {
			return strings.SplitN(f, "/", 2)[0], true
		}
	}
	return "", false
}

// GatewayOf 由 tun 虚拟地址推出对端网关（通常是 .1）。
// dokodemo-door 要把流量发到这个网关才会真的走隧道出去。
func GatewayOf(tunIP string) string {
	parts := strings.Split(tunIP, ".")
	if len(parts) != 4 {
		return ""
	}
	return strings.Join(parts[:3], ".") + ".1"
}

// State 记录本工具建了什么，供下次清理和体检用。
type State struct {
	Managed []string   `json:"managed"`
	Ovpn    *OvpnState `json:"ovpn,omitempty"`
	Updated time.Time  `json:"updated"`
}

type OvpnState struct {
	ID    int    `json:"id"`
	Host  string `json:"host"`
	Port  int    `json:"port"`
	Conf  string `json:"conf"`
	Iface string `json:"iface"`
	TS    int64  `json:"ts"`
}

func LoadState(path string) *State {
	st := &State{}
	if raw, err := os.ReadFile(path); err == nil {
		_ = json.Unmarshal(raw, st)
	}
	return st
}

func SaveState(path string, st *State) error {
	st.Updated = time.Now()
	raw, err := json.MarshalIndent(st, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, raw, 0o600)
}
