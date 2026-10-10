// Command homesync —— PublicVPNList 家宽节点 -> 3x-ui 面板自动同步
//
// 3x-ui 是 xray-core 的管理面板，它自己不能当 OpenVPN 客户端
// （inbound 协议白名单里没有 openvpn，这是 xray-core 的设计限制）。
// 所以家宽落地有两条路，本工具都实现了：
//
//	路线 A（-mode ovpn）：openvpn 连家宽 -> tun0 -> tunnel(dokodemo-door) inbound
//	                     需 root + 本机装 openvpn；定时体检，挂了自动换节点重建
//	路线 B（-mode xray）：只同步多协议家宽节点（vless/trojan/ss/vmess/hysteria2）
//	                     share URI 直接就是正常 inbound，开箱即用
//
// 两条路的出口 IP 都是家宽节点的。
package main

import (
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"syscall"
	"time"
)

// ManagedPrefix 本工具建的 inbound 一律带这个前缀。
// 清理时只认这个前缀 —— 手工建的 inbound 一个都不碰，这是安全底线。
const ManagedPrefix = "pvl-home-"

const version = "1.0.0"

func logf(format string, args ...interface{}) {
	fmt.Printf("[homesync] "+format+"\n", args...)
}

type config struct {
	mode       string
	url        string
	token      string
	configPath string
	limit      int
	maxInbound int
	protos     string
	country    string
	minSpeed   float64
	portStart  int
	iface      string
	ovpnBin    string
	refresh    bool
	skipProbe  bool
	dryRun     bool
	clean      bool
	daemon     int
	insecure   bool
	workers    int
	statePath  string
	cacheDir   string
	workDir    string
	dir        string
}

func main() {
	cfg := parseFlags()
	if err := run(cfg); err != nil {
		fmt.Fprintf(os.Stderr, "[homesync] 错误：%v\n", err)
		os.Exit(1)
	}
}

func parseFlags() *config {
	c := &config{}
	flag.StringVar(&c.mode, "mode", "xray", "xray=多协议直建 inbound（开箱即用）；ovpn=OpenVPN 家宽落地（需 root+openvpn）")
	flag.StringVar(&c.url, "url", "", "面板地址，如 http://127.0.0.1:54321（也可用 XUI_URL）")
	flag.StringVar(&c.token, "token", "", "面板 API token（也可用 XUI_TOKEN）")
	flag.StringVar(&c.configPath, "config", "", "配置文件 JSON（默认 ./config.json）")
	flag.IntVar(&c.limit, "limit", 20, "每种来源最多取几个")
	flag.IntVar(&c.maxInbound, "max-inbounds", 0, "最多建几个 inbound（0=不限）")
	flag.StringVar(&c.protos, "protos", "", "只取这些协议，逗号分隔（默认全取）")
	flag.StringVar(&c.country, "country", "", "只留这些国家（slug，逗号分隔）")
	flag.Float64Var(&c.minSpeed, "min-speed", 0, "OpenVPN 最低实测 Mbps")
	flag.IntVar(&c.portStart, "port-start", 20000, "inbound 起始端口")
	flag.StringVar(&c.iface, "iface", "tun0", "OpenVPN tun 网卡名")
	flag.StringVar(&c.ovpnBin, "ovpn-bin", "openvpn", "openvpn 可执行文件名")
	flag.BoolVar(&c.refresh, "refresh", false, "忽略清单缓存重拉")
	flag.BoolVar(&c.skipProbe, "skip-probe", false, "跳过节点连通性探测（更快，但会塞进连不上的节点）")
	flag.BoolVar(&c.dryRun, "dry-run", false, "只抓取和解析，不碰面板")
	flag.BoolVar(&c.clean, "clean", false, "删掉本工具建的所有 inbound 后退出")
	flag.IntVar(&c.daemon, "daemon", 0, "常驻同步，每隔 N 秒跑一次（含体检）")
	flag.BoolVar(&c.insecure, "insecure", false, "忽略面板 HTTPS 证书校验（自签证书用）")
	flag.StringVar(&c.dir, "dir", "", "工作目录（缓存/状态落这里），默认跟二进制同目录")
	flag.IntVar(&c.workers, "workers", 8, "抓取并发数（太高会被源站限流）")

	help := flag.Bool("h", false, "显示帮助")
	showVer := flag.Bool("version", false, "打印版本")
	flag.Parse()

	if *help {
		flag.Usage()
		os.Exit(0)
	}
	if *showVer {
		fmt.Println("homesync " + version)
		os.Exit(0)
	}

	// 配置文件兜底（命令行 > 环境变量 > 配置文件）
	if c.configPath == "" {
		c.configPath = "config.json"
	}
	// 工作目录必须先定下来：config.json 和 settings.json 都可能在里面。
	// 优先级 -dir > HOMESYNC_DIR > 二进制所在目录。
	base := c.dir
	if base == "" {
		base = os.Getenv("HOMESYNC_DIR")
	}
	if base == "" {
		if exe, err := os.Executable(); err == nil {
			base = filepath.Dir(exe)
		} else {
			base = "."
		}
	}
	if err := os.MkdirAll(base, 0o700); err != nil {
		logf("警告：建工作目录失败 %v", err)
	}
	c.workDir = base
	c.cacheDir = filepath.Join(base, ".cache")
	c.statePath = filepath.Join(base, ".sync_state.json")

	// 配置文件没显式指定时，在工作目录里找 config.json
	if c.configPath == "config.json" {
		if _, err := os.Stat(filepath.Join(base, "config.json")); err == nil {
			c.configPath = filepath.Join(base, "config.json")
		}
	}
	if f, err := loadFileConfig(c.configPath); err == nil {
		if c.url == "" {
			c.url = f.URL
		}
		if c.token == "" {
			c.token = f.Token
		}
		if !c.insecure {
			c.insecure = f.Insecure
		}
	}

	// 安装脚本写的 settings.json：只有命令行没显式指定时才采纳，
	// 免得手工跑测试时被服务配置覆盖。
	if s, err := loadSettings(filepath.Join(base, "settings.json")); err == nil {
		if !isFlagSet("mode") && s.Mode != "" {
			c.mode = s.Mode
		}
		if !isFlagSet("limit") && s.Limit > 0 {
			c.limit = s.Limit
		}
		if !isFlagSet("country") && s.Country != "" {
			c.country = s.Country
		}
		if !isFlagSet("daemon") && s.Interval > 0 {
			c.daemon = s.Interval
		}
	}

	if c.url == "" {
		c.url = os.Getenv("XUI_URL")
	}
	if c.token == "" {
		c.token = os.Getenv("XUI_TOKEN")
	}
	return c
}

// isFlagSet 判断某个 flag 是否被显式给过——服务场景下命令行是空的，
// 要以 settings.json 为准；手工跑测试时命令行优先。
func isFlagSet(name string) bool {
	found := false
	flag.Visit(func(f *flag.Flag) {
		if f.Name == name {
			found = true
		}
	})
	return found
}

// settings 是安装脚本 / 管理菜单写的运行配置。
type settings struct {
	Mode     string `json:"mode"`
	Limit    int    `json:"limit"`
	Country  string `json:"country"`
	Interval int    `json:"interval"`
}

func loadSettings(path string) (*settings, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var s settings
	if err := json.Unmarshal(raw, &s); err != nil {
		return nil, err
	}
	return &s, nil
}

// savePanelURL 把探测到的面板地址落盘，管理菜单要读它列 inbound。
// 只存地址不存 token（token 由 detect.go 单独存 .xui-token）。
func savePanelURL(workDir, url string) {
	_ = os.WriteFile(filepath.Join(workDir, ".xui-url"), []byte(url+"\n"), 0o600)
}

type fileConfig struct {
	URL      string `json:"url"`
	Token    string `json:"token"`
	Insecure bool   `json:"insecure"`
}

func loadFileConfig(path string) (*fileConfig, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var f fileConfig
	if err := json.Unmarshal(raw, &f); err != nil {
		return nil, err
	}
	return &f, nil
}

func run(c *config) error {
	checkTokenSafety(c)

	if c.mode != "xray" && c.mode != "ovpn" {
		return fmt.Errorf("-mode 只支持 xray 或 ovpn，收到 %q", c.mode)
	}

	h, err := NewHarvester(c.cacheDir)
	if err != nil {
		return err
	}

	// 没手工给地址和 token 时，自动探测本机 3x-ui
	if (c.url == "" || c.token == "") && !c.dryRun {
		if u, t, err := DetectXUI(c.cacheDir); err == nil {
			if c.url == "" {
				c.url = u
			}
			if c.token == "" {
				c.token = t
			}
			logf("自动探测到本机 3x-ui：%s", c.url)
			savePanelURL(c.workDir, c.url)
		} else {
			logf("没探测到本机 3x-ui：%v", err)
		}
	}

	var pc *Client
	if c.url != "" && c.token != "" {
		pc = newPanelClient(c)
	} else if !c.dryRun {
		return errors.New("缺少面板地址或 token。三种办法：\n" +
			"  1. 装了 3x-ui 的话会自动探测，通常什么都不用配\n" +
			"  2. 设环境变量 XUI_URL / XUI_TOKEN\n" +
			"  3. 写进 config.json\n" +
			"  token 生成（面板机器上跑）：x-ui setting -getApiToken true -tokenName home -tokenScope admin")
	} else {
		logf("未配置面板，dry-run 模式只做抓取和解析")
	}

	if pc != nil && c.clean {
		st := LoadState(c.statePath)
		n, err := pc.ClearManaged(ManagedPrefix)
		if err != nil {
			return err
		}
		st.Managed = nil
		_ = SaveState(c.statePath, st)
		if err := pc.RestartXray(); err != nil {
			return err
		}
		logf("清理完成，删除 %d 个 inbound（手工建的一个没碰）", n)
		return nil
	}

	if pc != nil && !c.dryRun {
		if err := pc.Ping(); err != nil {
			if errors.Is(err, ErrBadToken) {
				return errors.New("面板返回 401：API token 无效或被禁用。" +
					"重新生成：x-ui setting -getApiToken true -tokenName home -tokenScope admin")
			}
			if errors.Is(err, ErrBadBasePath) {
				return errors.New("面板返回 404：地址不对。确认 XUI_URL 是否要带子路径，" +
					"比如 http://1.2.3.4:54321/xxx/ （面板设置里的「面板 URL 路径」）")
			}
			return fmt.Errorf("连不上面板：%w", err)
		}
		logf("面板连通：%s", c.url)
	}

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)

	st := LoadState(c.statePath)
	round := 0
	for {
		round++
		if c.daemon > 0 {
			logf("── 第 %d 轮 ──", round)
		}

		switch {
		case c.mode == "ovpn" && c.dryRun:
			if err := dryRunOvpn(h, c); err != nil {
				return err
			}
		case c.mode == "ovpn":
			if round > 1 && !healthCheck(st, c) {
				st.Ovpn = nil
			}
			if err := syncOvpn(h, pc, c, st); err != nil {
				logf("同步失败：%v", err)
			}
		case c.dryRun:
			if err := dryRunXray(h, c); err != nil {
				return err
			}
		default:
			// 常驻模式下先体检：面板上这轮建的 inbound 还在不在。
			// 掉线是常态（第三方共享节点），只全删全建不管死活的话，
			// 面板上会一直挂一批连不上的节点。
			if round > 1 {
				if alive, total := pc.countManaged(ManagedPrefix); total > 0 && alive < total {
					logf("上轮建的 %d 个里有 %d 个不在了，本轮换一批", total, total-alive)
				}
			}
			if err := syncXray(h, pc, c, st); err != nil {
				return err
			}
		}

		if c.daemon <= 0 {
			return nil
		}
		select {
		case <-stop:
			logf("收到退出信号，收尾中…")
			return nil
		case <-time.After(time.Duration(c.daemon) * time.Second):
		}
	}
}

// ---------------------------------------------------------------- 路线 B

// nodeSource 是节点来源的抽象。
//
// 抽出来是为了让「抓取 -> 解析 -> 建 inbound」这条链路能脱离外网测试：
// 真抓取依赖 PublicVPNList，源站一限流 e2e 就飘，而链路本身的正确性
// 不该由源站可用性决定。测试里注入桩即可。
type nodeSource interface {
	FetchProtocol(proto string, limit, pages, workers int) ([]ProtoNode, error)
}

// syncXray 用真实抓取器跑一次同步。
func syncXray(h *Harvester, pc *Client, c *config, st *State) error {
	return syncXrayWith(h, pc, c, st)
}

// syncXrayWith 是同步的实际实现，节点来源可注入（测试用桩）。
func syncXrayWith(src nodeSource, pc *Client, c *config, st *State) error {
	logf("路线 B：同步多协议家宽节点")
	protos := ProtocolPages
	if c.protos != "" {
		protos = nil
		for _, p := range strings.Split(c.protos, ",") {
			p = strings.TrimSpace(p)
			if p != "" {
				protos = append(protos, p)
			}
		}
	}

	var collected []ProtoNode
	for _, p := range protos {
		nodes, err := src.FetchProtocol(p, c.limit, 3, c.workers)
		if err != nil {
			logf("%s 抓取失败：%v", p, err)
			continue
		}
		collected = append(collected, nodes...)
	}
	if len(collected) == 0 {
		logf("没抓到任何节点，面板保持原样")
		return nil
	}

	// 端口要避开面板上已占用的。原来从 portStart 硬递增，撞上已有 inbound
	// 面板会直接拒绝（失败还是 200 + success:false），整批建不出来。
	used, err := pc.usedPorts()
	if err != nil {
		logf("读已占用端口失败（%v），退回硬递增", err)
	}

	removed, err := pc.ClearManaged(ManagedPrefix)
	if err != nil {
		return err
	}
	if removed > 0 {
		logf("清掉上一轮 %d 个", removed)
	}
	st.Managed = nil

	added := 0
	skipped := 0
	port := c.portStart
	seenURI := map[string]bool{}
	for _, node := range collected {
		// 同一条 URI 只建一次：翻多页时同一个节点会重复出现
		if seenURI[node.URI] {
			continue
		}
		seenURI[node.URI] = true

		port, err = nextFreePort(port, used)
		if err != nil {
			logf("端口不够了：%v", err)
			break
		}
		in, err := buildFromURI(node.URI, port)
		if err != nil {
			continue
		}
		if !XUIProtocols[in.Protocol] {
			continue
		}
		// 建之前先探一下节点连不连得上。PublicVPNList 是第三方共享节点，
		// 掉线常态——不验证就全塞进面板，用户拿到的是一批连不上的节点。
		if !c.skipProbe {
			if !nodeReachable(node.URI) {
				logf("  ⏭️  %s 连不上，跳过", in.Remark)
				skipped++
				continue
			}
		}
		id, err := pc.AddInbound(in)
		if err != nil {
			logf("  ❌ %s：%v", in.Remark, err)
			// 端口撞车这类错误跳过这个端口继续，别整批中断
			port++
			continue
		}
		st.Managed = append(st.Managed, in.Tag)
		used[port] = true
		added++
		port++
		logf("  ✅ %s（端口 %d，面板 id %d）", in.Remark, in.Port, id)
		if c.maxInbound > 0 && added >= c.maxInbound {
			break
		}
	}
	if err := SaveState(c.statePath, st); err != nil {
		logf("状态写入失败：%v", err)
	}
	if added > 0 {
		if err := pc.RestartXray(); err != nil {
			return err
		}
		logf("重启 xray 成功")
	}
	logf("本次写入 %d 个 inbound（跳过 %d 个连不上的）", added, skipped)
	return nil
}

// buildFromURI 把 share URI 变成 3x-ui inbound 载荷。
func buildFromURI(uri string, port int) (*Inbound, error) {
	node, err := ParseURI(uri)
	if err != nil {
		return nil, err
	}
	if !XUIProtocols[node.Protocol] {
		return nil, fmt.Errorf("协议 %s 不在 3x-ui 白名单内", node.Protocol)
	}
	settingsRaw, err := json.Marshal(node.Settings)
	if err != nil {
		return nil, err
	}
	streamRaw, err := json.Marshal(node.Stream)
	if err != nil {
		return nil, err
	}
	sniffingRaw := []byte(`{"enabled":true,"destOverride":["http","tls"]}`)
	tag := fmt.Sprintf("%s%s-%d", ManagedPrefix, node.Protocol, port)
	return &Inbound{
		Remark:     fmt.Sprintf("🏠 %s-%d", strings.ToUpper(node.Protocol), port),
		Tag:        tag,
		Enable:     true,
		Protocol:   node.Protocol,
		Port:       port,
		Listen:     "0.0.0.0",
		Settings:   string(settingsRaw),
		StreamSet:  string(streamRaw),
		Sniffing:   string(sniffingRaw),
		TrafficRes: "never",
	}, nil
}

func dryRunXray(h *Harvester, c *config) error {
	protos := ProtocolPages
	if c.protos != "" {
		protos = strings.Split(c.protos, ",")
	}
	var got []ProtoNode
	for _, p := range protos {
		p = strings.TrimSpace(p)
		n, err := h.FetchProtocol(p, minInt(c.limit, 5), 1, c.workers)
		if err != nil {
			logf("%s 失败：%v", p, err)
			continue
		}
		got = append(got, n...)
	}
	logf("dry-run：拿到 %d 条，抽查解析结果：", len(got))
	for i, item := range got {
		if i >= 8 {
			break
		}
		node, err := ParseURI(item.URI)
		if err != nil {
			logf("  %s -> 解析失败：%v", item.Protocol, err)
			continue
		}
		logf("  %s -> %s ✅（%s:%d）", item.Protocol, node.Protocol, node.Host, node.Port)
	}
	return nil
}

// ---------------------------------------------------------------- 路线 A

func syncOvpn(h *Harvester, pc *Client, c *config, st *State) error {
	logf("路线 A：OpenVPN 家宽落地")
	if os.Geteuid() != 0 {
		return errors.New("路线 A 需要 root（要建 tun 网卡、跑 openvpn）。" +
			"没有 root 就用 -mode xray 走路线 B")
	}

	rows, err := h.FetchCatalog(c.refresh)
	if err != nil {
		return err
	}
	cands := filterRows(rows, c)
	if len(cands) == 0 {
		return errors.New("没有符合条件的家宽节点")
	}
	logf("筛出 %d 个 OpenVPN 家宽候选", len(cands))

	for _, row := range cands {
		logf("尝试节点 %d（%s，%.1f Mbps）…", row.ID, row.Country, row.Throughput)
		raw, err := h.FetchOvpn(row.ID, 2)
		if err != nil {
			logf("  ❌ 拿不到配置：%v", err)
			continue
		}
		cfg, err := ParseOvpn(raw)
		if err != nil {
			logf("  ❌ 配置解析失败：%v", err)
			continue
		}
		if cfg.CA == "" {
			logf("  ❌ 配置缺 CA 证书，换下一个")
			continue
		}
		confPath := filepath.Join(c.cacheDir, fmt.Sprintf("home-%s.ovpn", slugify(strconv.Itoa(row.ID))))
		if err := WriteOvpnConf(cfg, confPath); err != nil {
			logf("  ❌ 写配置失败：%v", err)
			continue
		}

		if st.Ovpn != nil {
			StopOvpn(strconv.Itoa(st.Ovpn.ID), c.cacheDir)
		}
		time.Sleep(time.Second)
		if err := StartOvpn(confPath, strconv.Itoa(row.ID), c.ovpnBin, c.cacheDir); err != nil {
			return err
		}
		tunIP, err := WaitTun(c.iface, 45*time.Second)
		if err != nil {
			logf("  ❌ %v，换下一个", err)
			StopOvpn(strconv.Itoa(row.ID), c.cacheDir)
			continue
		}
		logf("  ✅ tun 起来了，虚拟地址 %s（出口 %s:%d）", tunIP, cfg.Host, cfg.Port)

		removed, err := pc.ClearManaged(ManagedPrefix)
		if err != nil {
			return err
		}
		if removed > 0 {
			logf("清掉上一轮 %d 个", removed)
		}
		st.Managed = nil

		gw := GatewayOf(tunIP)
		if gw == "" {
			return fmt.Errorf("推不出网关地址：%s", tunIP)
		}
		// tunnel = dokodemo-door，把流量导进 tun 的对端网关
		settings, _ := json.Marshal(map[string]interface{}{
			"address": gw, "port": c.portStart, "network": "tcp,udp",
		})
		stream, _ := json.Marshal(map[string]string{"network": "tcp,udp"})
		tag := ManagedPrefix + "tun-0"
		in := &Inbound{
			Remark:     "🏠 家宽出口",
			Tag:        tag,
			Enable:     true,
			Protocol:   "tunnel",
			Port:       c.portStart,
			Listen:     "127.0.0.1",
			Settings:   string(settings),
			StreamSet:  string(stream),
			Sniffing:   `{"enabled":true,"destOverride":["http","tls"]}`,
			TrafficRes: "never",
		}
		if _, err := pc.AddInbound(in); err != nil {
			logf("  ❌ 建 tunnel inbound 失败：%v", err)
			continue
		}
		st.Managed = []string{tag}
		st.Ovpn = &OvpnState{
			ID: row.ID, Host: cfg.Host, Port: cfg.Port,
			Conf: confPath, Iface: c.iface, TS: time.Now().Unix(),
		}
		if err := SaveState(c.statePath, st); err != nil {
			logf("状态写入失败：%v", err)
		}
		if err := pc.RestartXray(); err != nil {
			return err
		}
		logf("  ✅ 面板已更新（tunnel inbound 端口 %d，网关 %s），xray 已重启", c.portStart, gw)
		return nil
	}
	logf("所有候选都连不上，面板保持原样")
	return nil
}

func filterRows(rows []VPNRow, c *config) []VPNRow {
	countries := map[string]bool{}
	if c.country != "" {
		for _, s := range strings.Split(c.country, ",") {
			s = strings.ToLower(strings.TrimSpace(s))
			if s != "" {
				countries[s] = true
			}
		}
	}
	var out []VPNRow
	for _, r := range rows {
		if !r.Active || !r.Downloadable {
			continue
		}
		if len(countries) > 0 && !countries[strings.ToLower(r.Country)] {
			continue
		}
		if c.minSpeed > 0 && r.Throughput < c.minSpeed {
			continue
		}
		out = append(out, r)
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].Throughput != out[j].Throughput {
			return out[i].Throughput > out[j].Throughput
		}
		return out[i].RTT < out[j].RTT
	})
	if c.limit > 0 && len(out) > c.limit {
		out = out[:c.limit]
	}
	return out
}

// healthCheck 体检：tun 还在不在。不在就返回 false，触发换节点。
// healthCheck 体检：tun 在不在，以及流量到底出不出得去。
//
// 只看 tun 有没有 IP 是不够的——openvpn 进程活着、tun 也拿到了地址，
// 但对端家宽节点把连接掐了，隧道照样是死的。这时候不换节点，
// 用户看到的是「一切正常」但流量根本不出去。所以再加一层真实出口探测。
func healthCheck(st *State, c *config) bool {
	if st.Ovpn == nil {
		return false
	}
	iface := st.Ovpn.Iface
	if iface == "" {
		iface = c.iface
	}
	if _, ok := tunAddr(iface); !ok {
		logf("家宽隧道断了（tun %s 没了），换节点重连", iface)
		StopOvpn(strconv.Itoa(st.Ovpn.ID), c.cacheDir)
		return false
	}

	// tun 还在，但流量通不通要真问一下外部：拿到的出口 IP 必须还是家宽节点的
	ip, err := probeExitIP(iface, 12*time.Second)
	if err != nil {
		logf("出口探测失败（%v），判定隧道已断，换节点", err)
		StopOvpn(strconv.Itoa(st.Ovpn.ID), c.cacheDir)
		return false
	}
	if ip != "" && ip == lastTunnelExit {
		logf("出口 IP 还是本机（%s），流量没走隧道，换节点", ip)
		StopOvpn(strconv.Itoa(st.Ovpn.ID), c.cacheDir)
		return false
	}
	logf("体检通过，出口 %s", ip)
	return true
}

// lastTunnelExit 存最近一次已知的本机直连出口 IP。
// 用它判断流量有没有真的走隧道：探测结果和它一样就说明没走。
var lastTunnelExit string

// probeExitIP 从指定网卡出去问一次「我的出口 IP 是多少」。
// 用 ifconfig.me 是因为它返回纯文本 IP，不用解析 JSON/Alpine 上没 jq 也行。
func probeExitIP(iface string, timeout time.Duration) (string, error) {
	const (
		lo  = "127.0.0.1"
		url = "http://ifconfig.me/ip"
	)
	// 隧道刚起来时路由可能还没就绪，给几次机会
	var lastErr error
	for i := 0; i < 3; i++ {
		ip, err := httpGetVia(iface, url, timeout)
		if err == nil && ip != "" {
			return ip, nil
		}
		lastErr = err
		time.Sleep(2 * time.Second)
	}
	if lastErr != nil {
		return "", lastErr
	}
	return "", errors.New("探测返回空")
}

// httpGetVia 绑定指定网卡发一次 GET，返回去掉空白的响应体。
func httpGetVia(iface, rawURL string, timeout time.Duration) (string, error) {
	dialer := &net.Dialer{
		Timeout: timeout,
		// 关键：绑到 tun 网卡的本地地址，流量才会真的走隧道出去
		LocalAddr: &net.UDPAddr{},
	}
	if local := tunLocalAddr(iface); local != "" {
		dialer.LocalAddr = &net.TCPAddr{IP: net.ParseIP(local)}
	}
	client := &http.Client{
		Timeout:   timeout,
		Transport: &http.Transport{DialContext: dialer.DialContext},
	}
	resp, err := client.Get(rawURL)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(io.LimitReader(resp.Body, 4096))
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(string(raw)), nil
}

func dryRunOvpn(h *Harvester, c *config) error {
	rows, err := h.FetchCatalog(c.refresh)
	if err != nil {
		return err
	}
	cands := filterRows(rows, c)
	logf("dry-run：%d 个在线 OpenVPN 候选，看前 %d 个：", len(cands), minInt(5, len(cands)))
	for i, r := range cands {
		if i >= 5 {
			break
		}
		logf("  %s %s:%d %s %.1fMbps rtt=%.0fms",
			strings.ToUpper(countryCode(r.Country)), r.IP, r.Port, r.Proto, r.Throughput, r.RTT)
		raw, err := h.FetchOvpn(r.ID, 1)
		if err != nil {
			logf("    -> 配置换不到：%v", err)
			continue
		}
		cfg, err := ParseOvpn(raw)
		if err != nil {
			logf("    -> 解析失败：%v", err)
			continue
		}
		logf("    -> remote %s:%d %s cipher=%s ca=%v cert=%v key=%v",
			cfg.Host, cfg.Port, cfg.Proto, cfg.Cipher,
			cfg.CA != "", cfg.Cert != "", cfg.Key != "")
	}
	return nil
}

// ---------------------------------------------------------------- 杂项

// nodeReachable 探一下节点连不连得上。
//
// 只做 TCP 握手——协议层握手要各协议各实现一套，太重。能握手说明主机在线、
// 端口开着，够用来过滤掉线的节点。超时给短点：批量探几十个，每个卡几秒就太慢。
func nodeReachable(uri string) bool {
	node, err := ParseURI(uri)
	if err != nil {
		return false
	}
	if node.Host == "" || node.Port <= 0 {
		return false
	}
	addr := net.JoinHostPort(node.Host, strconv.Itoa(node.Port))
	conn, err := net.DialTimeout("tcp", addr, 4*time.Second)
	if err != nil {
		return false
	}
	_ = conn.Close()
	return true
}

var countryTable = map[string]string{
	"japan": "jp", "south-korea": "kr", "usa": "us", "united-states": "us",
	"russia": "ru", "thailand": "th", "vietnam": "vn", "indonesia": "id",
	"canada": "ca", "uk": "gb", "united-kingdom": "gb", "argentina": "ar",
	"netherlands": "nl", "germany": "de", "france": "fr", "singapore": "sg",
	"hong-kong": "hk", "taiwan": "tw", "india": "in", "malaysia": "my",
	"philippines": "ph", "australia": "au", "brazil": "br", "mexico": "mx",
	"spain": "es", "italy": "it", "poland": "pl", "sweden": "se",
	"finland": "fi", "norway": "no", "switzerland": "ch", "ukraine": "ua",
	"turkey": "tr", "iran": "ir", "czech-republic": "cz", "romania": "ro",
}

func countryCode(slug string) string {
	key := strings.ToLower(slug)
	if v, ok := countryTable[key]; ok {
		return v
	}
	if len(key) > 2 {
		return key[:2]
	}
	return key
}

func minInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// checkTokenSafety 提醒别把 token 提交上去。
func checkTokenSafety(c *config) {
	if c.token != "" && c.configPath == "" {
		return // 走环境变量或命令行，没落盘，不用提醒
	}
	if c.configPath != "" {
		if info, err := os.Stat(c.configPath); err == nil {
			if info.Mode().Perm()&0o077 != 0 {
				logf("警告：%s 权限是 %o，同组/其他用户可读。建议 chmod 600", c.configPath, info.Mode().Perm())
			}
		}
	}
}
