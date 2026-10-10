package main

// SOCKS5 服务端：每条隧道在母机上暴露一个端口，连这个端口的流量
// 从对应隧道的家宽出口出去。
//
// 只实现必要的部分：
//   - CONNECT（TCP）—— 主要用途
//   - RFC1929 用户名/口令认证
//
// 认证是**必需**的而不是可选项：这些端口对公网敞开，没有口令等于
// 谁扫到谁就能用这条家宽出口。

import (
	"crypto/subtle"
	"encoding/binary"
	"errors"
	"fmt"
	"io"
	"net"
	"strconv"
	"time"
)

const (
	socksVer5       = 0x05
	authNone        = 0x00
	authUserPass    = 0x02
	authNoAccept    = 0xff
	authSubVer      = 0x01
	authOK          = 0x00
	cmdConnect      = 0x01
	cmdUDPAssociate = 0x03
	atypIPv4        = 0x01
	atypDomain      = 0x03
	atypIPv6        = 0x04
	repSuccess      = 0x00
	repGenFail      = 0x01
	repNotAllowed   = 0x02
	repHostUnre     = 0x04
	repCmdNotSupp   = 0x07
)

var errCmdNotSupported = errors.New("socks: 不支持的命令")

// SocksCred 一个 SOCKS5 端口的访问凭据。
type SocksCred struct {
	User string `json:"user"`
	Pass string `json:"pass"`
}

// valid 两个字段都非空才算有效凭据。
func (c SocksCred) valid() bool { return c.User != "" && c.Pass != "" }

// serveSocks 处理一条 SOCKS5 连接。
// dial 决定流量从哪条链路出去（隧道内拨号 → 家宽出口）。
func serveSocks(client net.Conn, cred *SocksCred, dial func(network, addr string) (net.Conn, error)) {
	defer client.Close()
	// 握手阶段给个短超时，防止半开连接占着不放
	_ = client.SetDeadline(time.Now().Add(30 * time.Second))

	if err := socksHandshake(client, cred); err != nil {
		return
	}

	cmd, addr, err := socksReadRequest(client)
	if err != nil {
		if errors.Is(err, errCmdNotSupported) {
			_ = socksReply(client, repCmdNotSupp)
		} else {
			_ = socksReply(client, repGenFail)
		}
		return
	}

	if cmd != cmdConnect {
		// UDP ASSOCIATE 不做：隧道里多数只有 TCP 转发，
		// 做了也容易因 UDP 不通而给出「通了」的假象
		_ = socksReply(client, repCmdNotSupp)
		return
	}

	remote, err := dial("tcp", addr)
	if err != nil {
		_ = socksReply(client, repHostUnre)
		return
	}
	defer remote.Close()

	// 回成功。之后就是纯转发，握手超时要撤掉
	if err := socksReply(client, repSuccess); err != nil {
		return
	}
	_ = client.SetDeadline(time.Time{}) // 转发阶段不设超时

	// 双向拷贝，任一方结束就关掉
	done := make(chan struct{}, 2)
	go func() {
		_, _ = io.Copy(remote, client)
		done <- struct{}{}
	}()
	go func() {
		_, _ = io.Copy(client, remote)
		done <- struct{}{}
	}()
	<-done
}

// socksHandshake 协商认证方式并校验凭据。
func socksHandshake(c net.Conn, cred *SocksCred) error {
	var hdr [2]byte
	if _, err := io.ReadFull(c, hdr[:]); err != nil {
		return err
	}
	if hdr[0] != socksVer5 {
		return fmt.Errorf("socks 版本 %d 不支持", hdr[0])
	}
	n := int(hdr[1])
	methods := make([]byte, n)
	if _, err := io.ReadFull(c, methods); err != nil {
		return err
	}

	// 没有凭据就拒绝所有认证方式：宁可不可用，也不开无认证的公网端口
	if cred == nil || !cred.valid() {
		_, _ = c.Write([]byte{socksVer5, authNoAccept})
		return errors.New("socks: 未配置凭据，拒绝连接")
	}

	want := byte(authUserPass)
	found := false
	for _, m := range methods {
		if m == want {
			found = true
			break
		}
	}
	if !found {
		_, _ = c.Write([]byte{socksVer5, authNoAccept})
		return errors.New("socks: 客户端不支持用户名口令认证")
	}
	if _, err := c.Write([]byte{socksVer5, authUserPass}); err != nil {
		return err
	}
	return socksAuth(c, cred)
}

// socksAuth 按 RFC1929 校验用户名口令。
// 用 ConstantTimeCompare 防时序侧信道。
func socksAuth(c net.Conn, cred *SocksCred) error {
	var ver [1]byte
	if _, err := io.ReadFull(c, ver[:]); err != nil {
		return err
	}
	if ver[0] != authSubVer {
		return fmt.Errorf("socks 认证子版本 %d 不对", ver[0])
	}
	ulen := make([]byte, 1)
	if _, err := io.ReadFull(c, ulen); err != nil {
		return err
	}
	user := make([]byte, int(ulen[0]))
	if _, err := io.ReadFull(c, user); err != nil {
		return err
	}
	plen := make([]byte, 1)
	if _, err := io.ReadFull(c, plen); err != nil {
		return err
	}
	pass := make([]byte, int(plen[0]))
	if _, err := io.ReadFull(c, pass); err != nil {
		return err
	}

	okU := subtle.ConstantTimeCompare([]byte(cred.User), user) == 1
	okP := subtle.ConstantTimeCompare([]byte(cred.Pass), pass) == 1
	if !okU || !okP {
		_, _ = c.Write([]byte{authSubVer, 0x01}) // 失败
		return errors.New("socks: 凭据不对")
	}
	_, err := c.Write([]byte{authSubVer, authOK})
	return err
}

// socksReadRequest 读 CONNECT 请求，返回目标地址（host:port 形式）。
func socksReadRequest(c net.Conn) (cmd byte, addr string, err error) {
	var hdr [4]byte
	if _, err := io.ReadFull(c, hdr[:]); err != nil {
		return 0, "", err
	}
	if hdr[0] != socksVer5 {
		return 0, "", fmt.Errorf("socks 版本 %d 不支持", hdr[0])
	}
	cmd = hdr[1]
	// hdr[2] 是保留字段，忽略
	atyp := hdr[3]

	var host string
	switch atyp {
	case atypIPv4:
		b := make([]byte, 4)
		if _, err := io.ReadFull(c, b); err != nil {
			return 0, "", err
		}
		host = net.IP(b).String()
	case atypIPv6:
		b := make([]byte, 16)
		if _, err := io.ReadFull(c, b); err != nil {
			return 0, "", err
		}
		host = net.IP(b).String()
	case atypDomain:
		l := make([]byte, 1)
		if _, err := io.ReadFull(c, l); err != nil {
			return 0, "", err
		}
		b := make([]byte, int(l[0]))
		if _, err := io.ReadFull(c, b); err != nil {
			return 0, "", err
		}
		host = string(b)
	default:
		return 0, "", fmt.Errorf("socks 地址类型 %d 不支持", atyp)
	}

	portB := make([]byte, 2)
	if _, err := io.ReadFull(c, portB); err != nil {
		return 0, "", err
	}
	port := int(binary.BigEndian.Uint16(portB))

	if cmd != cmdConnect && cmd != cmdUDPAssociate {
		return cmd, "", errCmdNotSupported
	}
	if host == "" || port <= 0 {
		return cmd, "", fmt.Errorf("socks 目标地址不合法: %q:%d", host, port)
	}
	return cmd, net.JoinHostPort(host, strconv.Itoa(port)), nil
}

// socksReply 回一个响应。绑定地址全零表示「由服务端决定」。
func socksReply(c net.Conn, rep byte) error {
	_, err := c.Write([]byte{
		socksVer5, rep, 0x00, atypIPv4,
		0, 0, 0, 0, // 绑定地址
		0, 0, // 绑定端口
	})
	return err
}
