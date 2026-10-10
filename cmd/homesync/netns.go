package main

// 每条家宽隧道跑在自己的 network namespace 里。
//
// 为什么不直接用 tun：tun 是全局的，一条隧道一根 tun 网卡，母机的路由表
// 只能有一条默认路由，多隧道会互相顶掉。netns 给每条隧道一套独立的
// 路由表，隧道之间互不干扰，母机侧只暴露一个 SOCKS5 端口。
//
// 结构（每条隧道一个槽位 N）：
//
//	netns fo<N>
//	  ├─ veth fo<N>h  （母机侧 10.<base>.N.1/30）
//	  └─ veth fo<N>n  （netns 侧 10.<base>.N.2/30，默认路由指向母机侧）
//	       └─ openvpn 在这个 netns 里跑 → 流量经家宽出去
//
// 母机侧做 NAT，netns 内的流量才能出去。

import (
	"fmt"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"sync"
	"syscall"
)

// 默认网段第二段。多实例时按工作目录挑别的段，避开冲突。
const (
	defaultNetBase = 99
	netBaseMin     = 100
	netBaseMax     = 255
)

// nsName 这个槽位的 netns 名字。
func nsName(slot int) string { return fmt.Sprintf("fo%d", slot) }

// vethNames 返回母机侧与 netns 侧的网卡名。
// 两个都带槽位号，便于 teardown 时精确清理。
func vethNames(slot int) (host, peer string) {
	return fmt.Sprintf("fo%dh", slot), fmt.Sprintf("fo%dn", slot)
}

// subnet 这个槽位用的 /30 网段（去掉主机位）。
func subnet(slot, base int) string { return fmt.Sprintf("10.%d.%d", base, slot) }

// SetupNetns 建立 netns 与 veth 链路，配好 NAT 与转发放行。
// 幂等：已经建好就直接返回。
func SetupNetns(slot, base int) error {
	ns := nsName(slot)
	veth, peer := vethNames(slot)
	sub := subnet(slot, base)

	if NetnsExists(ns) {
		return nil
	}

	// 建之前先清一次：上次异常退出可能留下半个 netns（有 veth 没路由）
	TeardownNetns(slot, base)

	steps := [][]string{
		{"ip", "netns", "add", ns},
		{"ip", "netns", "exec", ns, "ip", "link", "set", "lo", "up"},
		{"ip", "link", "add", veth, "type", "veth", "peer", "name", peer},
		{"ip", "link", "set", peer, "netns", ns},
		{"ip", "addr", "add", sub + ".1/30", "dev", veth},
		{"ip", "link", "set", veth, "up"},
		{"ip", "netns", "exec", ns, "ip", "addr", "add", sub + ".2/30", "dev", peer},
		{"ip", "netns", "exec", ns, "ip", "link", "set", peer, "up"},
		// netns 内的默认路由先指向母机侧。openvpn 起来后会在 netns 内
		// 加自己的路由覆盖它；ovpn 配置里带 route-nopull，不会把整表抢走。
		{"ip", "netns", "exec", ns, "ip", "route", "add", "default", "via", sub + ".1"},
	}
	for _, args := range steps {
		if out, err := exec.Command(args[0], args[1:]...).CombinedOutput(); err != nil {
			// 失败就整体拆掉，别留残骸
			TeardownNetns(slot, base)
			return fmt.Errorf("%s 失败: %v: %s", strings.Join(args, " "), err, strings.TrimSpace(string(out)))
		}
	}

	// 转发与 NAT：netns 内的流量靠 masquerade 出去
	if err := ensureRule("filter", "FORWARD", "-i", veth, "-j", "ACCEPT"); err != nil {
		return err
	}
	if err := ensureRule("filter", "FORWARD", "-o", veth, "-j", "ACCEPT"); err != nil {
		return err
	}
	if err := ensureRule("nat", "POSTROUTING", "-s", sub+".0/30", "-j", "MASQUERADE"); err != nil {
		return err
	}

	// netns 内的 DNS：只给 openvpn 解析远端主机名用。
	// 不然 netns 里没有 resolv.conf，ovpn 起不来。
	if err := writeNsResolv(ns); err != nil {
		return err
	}
	return nil
}

// writeNsResolv 给 netns 写一份 resolv.conf。
// openvpn 解析远端主机名时是在 netns 内解析的，那里默认是空的。
func writeNsResolv(ns string) error {
	dir := filepath.Join("/etc/netns", ns)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("建 netns resolv 目录失败: %w", err)
	}
	// 借用母机的 DNS，openvpn 只用它解析一次远端地址
	host, err := os.ReadFile("/etc/resolv.conf")
	if err != nil {
		host = []byte("nameserver 1.1.1.1\n")
	}
	return os.WriteFile(filepath.Join(dir, "resolv.conf"), host, 0644)
}

// TeardownNetns 拆掉一个槽位的 netns、veth、NAT 规则。
// 每一步都独立容错：清理时某一项不存在是正常的（可能上次没建成）。
func TeardownNetns(slot, base int) {
	ns := nsName(slot)
	veth, _ := vethNames(slot)
	sub := subnet(slot, base)

	// veth 对删一头另一头自动消失，但 netns 还在时要在里面删
	if NetnsExists(ns) {
		_, _ = exec.Command("ip", "netns", "exec", ns,
			"ip", "link", "del", fmt.Sprintf("fo%dn", slot)).CombinedOutput()
		_, _ = exec.Command("ip", "netns", "del", ns).CombinedOutput()
	}
	_, _ = exec.Command("ip", "link", "del", veth).CombinedOutput()

	_, _ = exec.Command("iptables", "-t", "filter", "-D", "FORWARD",
		"-i", veth, "-j", "ACCEPT").CombinedOutput()
	_, _ = exec.Command("iptables", "-t", "filter", "-D", "FORWARD",
		"-o", veth, "-j", "ACCEPT").CombinedOutput()
	_, _ = exec.Command("iptables", "-t", "nat", "-D", "POSTROUTING",
		"-s", sub+".0/30", "-j", "MASQUERADE").CombinedOutput()

	_ = os.RemoveAll(filepath.Join("/etc/netns", ns))
}

// NetnsExists 判断 netns 是否已存在。
func NetnsExists(ns string) bool {
	_, err := os.Stat(filepath.Join("/var/run/netns", ns))
	return err == nil
}

// ensureRule 加一条 iptables 规则，已经存在就不重复加。
// 重复加会让表里堆一堆一样的规则，清理时也要删很多次。
func ensureRule(table, chain string, spec ...string) error {
	check := append([]string{"-t", table, "-C", chain}, spec...)
	if err := exec.Command("iptables", check...).Run(); err == nil {
		return nil // 已经有了
	}
	args := append([]string{"-t", table, "-A", chain}, spec...)
	if out, err := exec.Command("iptables", args...).CombinedOutput(); err != nil {
		return fmt.Errorf("iptables %s 失败: %v: %s", strings.Join(args, " "), err, strings.TrimSpace(string(out)))
	}
	return nil
}

// setns 切换调用线程所在的 network namespace。
//
// Go 标准库没有导出 Setns（它只在内部用），所以直接发系统调用。
// fd 是 /proc/self/ns/net 或 /var/run/netns/<name> 打开的句柄。
//
// 注意：Setns 作用于**当前线程**。Go 的 goroutine 会在线程间迁移，
// 所以调用方必须先 runtime.LockOSThread()，否则切完可能被调度到别的
// 线程上，netns 白切了。
// dialerInNetns 返回一个在指定 netns 内建立出站连接的 dial 函数。
//
// 这是整套方案的关键：socket 的 netns 归属在**创建时**确定，
// 所以每次拨号都要切进去、建连接、再切回来。
//
// 两个必须注意的点：
//  1. runtime.LockOSThread —— Setns 作用于当前线程，而 Go 的 goroutine
//     会在线程间迁移。不锁的话切完 netns 这个 goroutine 可能就被调度
//     到别的线程上，netns 白切了，还可能把整个进程带进隧道里。
//  2. 强制 tcp4 —— 隧道内只有 IPv4 路由。不限定的话 net.Dial 选中
//     AAAA 记录时那条连接会从母机的 IPv6 出去，**暴露真实地址**。
func dialerInNetns(ns string) func(network, addr string) (net.Conn, error) {
	return func(network, addr string) (net.Conn, error) {
		type result struct {
			conn net.Conn
			err  error
		}
		ch := make(chan result, 1)

		go func() {
			runtime.LockOSThread()

			origin, err := os.Open("/proc/self/ns/net")
			if err != nil {
				runtime.UnlockOSThread()
				ch <- result{nil, err}
				return
			}
			defer origin.Close()

			target, err := os.Open(filepath.Join("/var/run/netns", ns))
			if err != nil {
				runtime.UnlockOSThread()
				ch <- result{nil, fmt.Errorf("netns %s 不存在: %w", ns, err)}
				return
			}
			defer target.Close()

			if err := setns(int(target.Fd()), syscall.CLONE_NEWNET); err != nil {
				runtime.UnlockOSThread()
				ch <- result{nil, fmt.Errorf("切入 netns %s 失败: %w", ns, err)}
				return
			}

			conn, dialErr := net.Dial(forceIPv4Network(network), addr)

			// 切回母机。失败要关掉连接：它属于隧道，留在手上会串流量
			if err := setns(int(origin.Fd()), syscall.CLONE_NEWNET); err != nil {
				if conn != nil {
					conn.Close()
				}
				runtime.UnlockOSThread()
				ch <- result{nil, fmt.Errorf("切回母机 netns 失败: %w", err)}
				return
			}

			runtime.UnlockOSThread()
			ch <- result{conn, dialErr}
		}()

		r := <-ch
		return r.conn, r.err
	}
}

// forceIPv4Network 把 tcp/udp 收敛成 tcp4/udp4，已指定版本的原样返回。
func forceIPv4Network(network string) string {
	switch network {
	case "tcp":
		return "tcp4"
	case "udp":
		return "udp4"
	}
	return network
}

// hostUsedNetBases 收集母机上已经配出去的 10.X 段。
// 既避开另一个实例，也避开机器上本来就有的 10.x（容器网桥、别的 VPN），
// 免得配上去把人家的路由顶掉。
func hostUsedNetBases() map[int]bool {
	used := map[int]bool{defaultNetBase: true}
	out, err := exec.Command("ip", "-4", "-o", "addr", "show").Output()
	if err != nil {
		return used
	}
	for _, line := range strings.Split(string(out), "\n") {
		fields := strings.Fields(line)
		for i, f := range fields {
			if f != "inet" || i+1 >= len(fields) {
				continue
			}
			addr := fields[i+1]
			if idx := strings.IndexByte(addr, '/'); idx > 0 {
				addr = addr[:idx]
			}
			parts := strings.Split(addr, ".")
			if len(parts) != 4 || parts[0] != "10" {
				continue
			}
			if n, err := strconv.Atoi(parts[1]); err == nil {
				used[n] = true
			}
		}
	}
	return used
}

// freeNetBase 挑一个没被占用的网段第二段。
func freeNetBase() (int, error) {
	used := hostUsedNetBases()
	for b := netBaseMin; b <= netBaseMax; b++ {
		if !used[b] {
			return b, nil
		}
	}
	return 0, fmt.Errorf("10.%d.x 到 10.%d.x 都被占用了", netBaseMin, netBaseMax)
}

// workDirLock 保证一个工作目录同时只有一个进程在用。
// 两个实例共用会让 state.json 互相覆盖，隧道记录直接丢。
// flock 是进程级的：进程没了内核自动释放，不会留下死锁文件。
func workDirLock(dir string) (*os.File, error) {
	f, err := os.OpenFile(filepath.Join(dir, "lock"), os.O_CREATE|os.O_RDWR, 0600)
	if err != nil {
		return nil, fmt.Errorf("打开锁文件失败: %w", err)
	}
	if err := syscall.Flock(int(f.Fd()), syscall.LOCK_EX|syscall.LOCK_NB); err != nil {
		f.Close()
		return nil, fmt.Errorf("另一个 homesync 正在用工作目录 %s", dir)
	}
	return f, nil
}

var _ = sync.Mutex{} // 预留：多槽位并发建 netns 时的串行化
