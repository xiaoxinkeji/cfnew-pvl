package main

// 一条隧道 = 一个 netns + 一个跑在里面的 openvpn + 母机上一个 SOCKS5 端口。
//
// 用户连 SOCKS5 端口，流量经 netns 内的 openvpn 从家宽出去，
// 所以「一个端口 = 一个家宽出口 IP」。

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"
)

// Tunnel 是一条运行中的隧道。
type Tunnel struct {
	Slot   int       `json:"slot"`
	Port   int       `json:"port"`    // 母机上的 SOCKS5 端口
	Host   string    `json:"host"`    // 家宽节点主机名
	ExitIP string    `json:"exit_ip"` // 实测到的出口 IP
	Status string    `json:"status"`  // up / starting / failed
	Err    string    `json:"err"`     // 失败原因
	Since  time.Time `json:"since"`
	Cred   SocksCred `json:"cred"` // SOCKS5 凭据

	listener net.Listener
	stopCh   chan struct{}
	mu       sync.Mutex
}

// newSocksCred 随机生成一组 SOCKS5 凭据。
// 端口对公网敞开，凭据是必需的——没口令等于谁扫到谁就能用这条出口。
func newSocksCred() (SocksCred, error) {
	var b [8]byte
	if _, err := rand.Read(b[:]); err != nil {
		return SocksCred{}, fmt.Errorf("生成随机凭据失败: %w", err)
	}
	s := hex.EncodeToString(b[:])
	return SocksCred{User: "hs" + s[:6], Pass: s[6:]}, nil
}

// StartTunnel 建 netns、起 openvpn、监听 SOCKS5。
//
// 顺序不能乱：netns 要先建好（openvpn 要在里面跑），
// openvpn 要起来并拿到出口（不然 SOCKS5 端口开了也走不通）。
func StartTunnel(slot, port, netBase int, host string, confPath, ovpnBin, workDir string) (*Tunnel, error) {
	t := &Tunnel{
		Slot:   slot,
		Port:   port,
		Host:   host,
		Status: "starting",
		Since:  time.Now(),
		stopCh: make(chan struct{}),
	}

	cred, err := newSocksCred()
	if err != nil {
		return nil, err
	}
	t.Cred = cred

	// 1. netns + veth
	if err := SetupNetns(slot, netBase); err != nil {
		t.Status, t.Err = "failed", err.Error()
		return t, err
	}

	// 2. 在 netns 内起 openvpn
	ns := nsName(slot)
	logPath := filepath.Join(workDir, fmt.Sprintf("ovpn-%d.log", slot))
	pidPath := filepath.Join(workDir, fmt.Sprintf("ovpn-%d.pid", slot))

	// openvpn 必须在 netns 里跑，否则它建的是母机的路由。
	// ip netns exec 会切 netns 再 exec，正是我们要的。
	args := []string{"netns", "exec", ns, ovpnBin,
		"--config", confPath,
		"--writepid", pidPath,
		"--log", logPath,
		"--daemon",
	}
	cmd := exec.Command("ip", args...)
	if out, err := cmd.CombinedOutput(); err != nil {
		t.Status, t.Err = "failed", fmt.Sprintf("openvpn 启动失败: %v: %s", err, strings.TrimSpace(string(out)))
		TeardownNetns(slot, netBase)
		return t, fmt.Errorf("%s", t.Err)
	}

	// 3. 等隧道真的通：在 netns 内探一次出口 IP
	// 只等进程起来是不够的——openvpn 进程活着但没连上，端口开了也走不通
	ip, err := waitForExitIP(ns, 60*time.Second)
	if err != nil {
		t.Status, t.Err = "failed", fmt.Sprintf("隧道没起来: %v", err)
		StopTunnel(t, netBase)
		return t, fmt.Errorf("%s", t.Err)
	}
	t.ExitIP = ip

	// 4. 起 SOCKS5 监听
	if err := t.listen(); err != nil {
		t.Status, t.Err = "failed", err.Error()
		StopTunnel(t, netBase)
		return t, err
	}

	t.Status = "up"
	return t, nil
}

// listen 在母机上监听 SOCKS5 端口，每条连接用 netns 内拨号。
func (t *Tunnel) listen() error {
	// 进程刚重启时旧监听可能还在 TIME_WAIT，给几秒重试窗口
	var ln net.Listener
	var err error
	for i := 0; i < 6; i++ {
		ln, err = net.Listen("tcp", net.JoinHostPort("0.0.0.0", strconv.Itoa(t.Port)))
		if err == nil {
			break
		}
		time.Sleep(time.Second)
	}
	if err != nil {
		// 确实被别的进程长期占用，换一个
		alt, ferr := freeRandomPort(map[int]bool{t.Port: true})
		if ferr != nil {
			return fmt.Errorf("监听 %d 失败且无备用端口: %w", t.Port, err)
		}
		ln, err = net.Listen("tcp", net.JoinHostPort("0.0.0.0", strconv.Itoa(alt)))
		if err != nil {
			return fmt.Errorf("监听 %d 失败: %w", alt, err)
		}
		t.Port = alt
	}

	t.mu.Lock()
	t.listener = ln
	t.mu.Unlock()

	dial := dialerInNetns(nsName(t.Slot))
	go func() {
		for {
			conn, err := ln.Accept()
			if err != nil {
				return
			}
			// 每次连接现取凭据：改口令后不必重建监听
			t.mu.Lock()
			cred := t.Cred
			t.mu.Unlock()
			go serveSocks(conn, &cred, dial)
		}
	}()
	return nil
}

// StopTunnel 停监听、停 openvpn、拆 netns。
func StopTunnel(t *Tunnel, netBase int) {
	select {
	case <-t.stopCh:
		// 已经停过
		return
	default:
		close(t.stopCh)
	}

	t.mu.Lock()
	if t.listener != nil {
		t.listener.Close()
		t.listener = nil
	}
	t.mu.Unlock()

	// openvpn：有 pid 文件就用它，没有就按配置名兜底
	pidPath := filepath.Join(pidDirOf(t.Slot), fmt.Sprintf("ovpn-%d.pid", t.Slot))
	if raw, err := os.ReadFile(pidPath); err == nil {
		if pid, err := strconv.Atoi(strings.TrimSpace(string(raw))); err == nil && pid > 0 {
			_ = exec.Command("kill", strconv.Itoa(pid)).Run()
		}
		_ = os.Remove(pidPath)
	}
	TeardownNetns(t.Slot, netBase)
	t.Status = "down"
}

// pidDirOf 隧道 pid 文件所在目录。
// 单独抽成变量是为了让 StopTunnel 在测试里能指向临时目录。
// defaultWorkDir 是 install.sh 用的工作目录。
const defaultWorkDir = "/var/lib/homesync"

var pidDirOf = func(slot int) string { return defaultWorkDir }

// waitForExitIP 在 netns 内反复探出口 IP，直到拿到或超时。
//
// 只等 openvpn 进程起来不够：它可能还在握手，这时候探不到出口，
// 端口开了也走不通。
func waitForExitIP(ns string, timeout time.Duration) (string, error) {
	deadline := time.Now().Add(timeout)
	dial := dialerInNetns(ns)
	for time.Now().Before(deadline) {
		if ip, err := probeIPWith(dial, 8*time.Second); err == nil && ip != "" {
			return ip, nil
		}
		time.Sleep(2 * time.Second)
	}
	return "", fmt.Errorf("%v 内没探到出口 IP", timeout)
}

// probeIPWith 用给定 dial 问一次「我的出口 IP」。
//
// 用 ifconfig.me：返回纯文本，不用解析 JSON，Alpine 上没 jq 也能用。
// 关键是把 Dial 换成隧道内的拨号器——用默认的会从母机出去，
// 探到的是母机 IP，等于没验证。
func probeIPWith(dial func(string, string) (net.Conn, error), timeout time.Duration) (string, error) {
	client := &http.Client{
		Timeout: timeout,
		Transport: &http.Transport{
			DialContext: func(ctx context.Context, network, addr string) (net.Conn, error) {
				return dial(network, addr)
			},
			// 每条请求新建连接，别复用：复用的连接可能属于母机
			DisableKeepAlives: true,
		},
	}
	resp, err := client.Get("http://ifconfig.me/ip")
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(io.LimitReader(resp.Body, 1024))
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(string(raw)), nil
}

// freeRandomPort 挑一个没被占用的端口。
func freeRandomPort(used map[int]bool) (int, error) {
	const (
		lo    = 20000
		hi    = 60000
		tries = 200
	)
	for i := 0; i < tries; i++ {
		var b [2]byte
		if _, err := rand.Read(b[:]); err != nil {
			return 0, err
		}
		p := lo + int(b[0])<<8 | int(b[1])
		if p < lo || p > hi {
			continue
		}
		if used[p] {
			continue
		}
		// 真试一下能不能监听：端口表可能过期
		ln, err := net.Listen("tcp", net.JoinHostPort("0.0.0.0", strconv.Itoa(p)))
		if err != nil {
			used[p] = true
			continue
		}
		ln.Close()
		return p, nil
	}
	return 0, fmt.Errorf("试了 %d 次没找到空闲端口", tries)
}
