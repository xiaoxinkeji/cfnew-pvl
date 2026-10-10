# CFnew 公共节点版 —— PublicVPNList 全量直出

> **⚠️ 重要：部署后请将兼容日期设置为 `2026-01-20`**
>
> **Pages 部署：**
> 1. 登录 [Cloudflare 控制台](https://dash.cloudflare.com/)
> 2. 进入 **Workers 和 Pages** → 选择你的 Pages 项目
> 3. 点击 **设置** → **运行时**
> 4. 找到 **兼容性日期**，选择 `2026-01-20`，点击 **保存**
> 5. 返回 **部署** → **创建部署** → 上传文件
>
> **Worker 部署：**
> 1. 登录 [Cloudflare 控制台](https://dash.cloudflare.com/)
> 2. 进入 **Workers 和 Pages** → 选择你的 Worker
> 3. 点击 **设置** → **运行时**
> 4. 找到 **兼容性日期**，选择 `2026-01-20`，点击 **保存**

基于 [byJoey/cfnew](https://github.com/byJoey/cfnew) v3.1 改造。原项目的「家宽链式」靠 VPN Gate 志愿者共享的住宅宽带做落地，节点是别人的、随时会掉，还得自己有 CF 节点当前置。

这一版换了思路：**直接吃 PublicVPNList 的全量实测清单**。那边按小时对几万个第三方端点跑真实隧道检测（握手、HTTPS 首字节、下载吞吐、出口 IP 变化），我们通过它的两个公开接口把节点全量扒下来，原样直出订阅 —— **不需要自己搭服务器，也不需要 CF 前置**。

---

## 这次加了什么

### 1. 两种新的订阅格式

| 订阅链接 | 输出 | 用途 |
| --- | --- | --- |
| `?target=pvl`（同 `pv`、`public`） | Clash / Mihomo YAML | 客户端列表里的「CLASH 公共」按钮 |
| `?target=pvluri` | 纯 URI 文本（base64 之前） | 客户端列表里的「公共连接」按钮，可再喂给任意转换器 |

跟家宽链式（`target=vg`）的区别：**不做链式**。节点原样出去，出口就是节点自己的 IP，不套 CF 前置。想要家宽落地继续用 `vg`，两个功能互不干扰。

### 2. 数据源：两条抓取路线

**OpenVPN** —— 一次请求拿全量清单，再逐条换配置原文：

```
GET  /local/api/vpn-data.php?status=all     → 45,722 行全量清单（约 33 MB，3,874 个实测在线）
POST /get_token.php         {id}            → 300 秒有效的下载令牌
GET  /download.php?token=…                  → .ovpn 配置原文
```

**多协议**（VLESS / Trojan / VMess / Shadowsocks / Hysteria2）—— 翻列表页拿稳定 ID，再直接取 share URI：

```
GET  /{protocol}/?per_page=100              → 列表页，抠出 64 位十六进制配置 ID
GET  /protocols/download.php?protocol=…&id=…&format=json
                                            → {"config_uri": "vless://…"} 直接可用
```

第二条路线是关键：拿到的就是客户端能直接导入的 share URI，**不用解 base64、不用猜参数、不碰 REALITY 的公钥**。

### 3. 配套抓取器

`tools/fetch_publicvpnlist.py` —— 把整套流程做成命令行工具，本地跑一遍就能拿到全量节点和成品订阅，不用部署 Worker 也能用：

```bash
python3 tools/fetch_publicvpnlist.py                    # 全量
python3 tools/fetch_publicvpnlist.py --proto-only        # 只抓多协议（快）
python3 tools/fetch_publicvpnlist.py --country jp,kr,us  # 只留这几个国家
python3 tools/fetch_publicvpnlist.py --limit 200         # 每种来源最多 200 个
python3 tools/fetch_publicvpnlist.py --min-speed 3       # OpenVPN 最低实测 3 Mbps
python3 tools/fetch_publicvpnlist.py --no-ovpn           # 不逐条换 .ovpn 原文
python3 tools/fetch_publicvpnlist.py --refresh           # 忽略本地清单缓存重拉
```

产出：

```
pvl/nodes/openvpn.json     OpenVPN 全量元数据（含实测速度/延迟/来源）
pvl/nodes/protocols.json   多协议 share URI 全集
pvl/sub/all.txt            全协议合并订阅
pvl/sub/clash.yaml         Clash / Mihomo 配置
pvl/sub/singbox.json       sing-box 出站配置
pvl/nodes/report.md        抓取报告
```

> 全量清单（33 MB）会落到 `tools/.cache/vpn-data.json`，**这个文件不进 git**（已加 `.gitignore`）。要刷新加 `--refresh`。
>
> 单条 `.ovpn` 要换一次令牌，全量做会触发限流。抓取器默认并发 8 + 失败退避，Worker 里则只给最快的前 60 个换原文。

### 4. 配置面板新增「公共节点」区块

开启后客户端列表多出两个按钮，并且能细调：

| 配置项 | 键 | 说明 |
| --- | --- | --- |
| 启用公共节点 | `pvl` | 不开就返回 403 |
| 节点清单地址 | `pvlURL` | 留空用官方接口，可换成自己的镜像 |
| 最低实测速度 | `pvlmin` | Mbps，低于此值的剔除 |
| 最高实测延迟 | `pvlmax` | ms，高于此值的剔除 |
| 每种协议最多取 | `pvllimit` | 默认 120，防止订阅撑爆客户端 |
| 只留这些国家 | `pvlcountry` | 逗号分隔 slug，如 `japan,south-korea,usa` |
| 只取这些协议 | `pvlproto` | 逗号分隔，如 `openvpn,vless,trojan` |
| 抓取 OpenVPN 原文 | `pvlraw` | 关掉则只出端点元数据，省掉令牌请求 |

环境变量同名（大写亦可）：`pvl=yes`、`pvlcountry=japan,usa` …

---

## 跟原版的关系

原项目所有功能**全部保留**：多协议支持、自定义路径、延迟测试、订阅转换、KV 图形化管理、API 动态增删优选 IP、10 种客户端、应用唤醒、中波斯双语。

新增部分：

- `明文源吗` 里新增「公共节点（PublicVPNList）」模块（在家宽链式之前）
- 新增 9 个配置键、2 个订阅目标、2 个客户端按钮、1 个配置区块
- 新增 `tools/` 目录（抓取器 + 离线测试），`pvl/` 目录（抓取产物）
- 混淆版 `少年你相信光吗` 由 GitHub Actions 从 `明文源吗` 自动生成，已同步

---

## 离线验证

Worker 里的解析逻辑可以在本地直接跑，不需要 Cloudflare 环境：

```bash
node tools/test_pvl.mjs
```

覆盖：`.ovpn` 解析（remote/proto/cipher/auth/ca/cert/key）、清单筛选与排序、国家码映射、五种协议的 share URI → Clash 节点行（含 REALITY 公钥、short-id、SS 的 base64 用户段、VMess 的 base64 JSON）、订阅整体结构、证书 YAML 锚点复用、以及空配置/坏数据/未知协议等异常输入。

---

## 已知边界

- **节点是第三方共享的**。`pvl/sub/all.txt` 里那条会被反复扫描，掉线、限速、改端口是常态。自动回落组会往下换。
- **OpenVPN 节点需要 Clash Meta / mihomo 1.19.25 以上内核**，老内核不认 `openvpn` 这个 proxy 类型。VLESS / Trojan / SS / VMess / Hysteria2 任意内核都能用。
- **PublicVPNList 只做技术检测**（能否建隧道、出口 IP 是否变化、吞吐和延迟），不验证运营者身份、日志策略或司法管辖。别拿公共端点跑敏感账号。
- **限流真实存在**。OpenVPN 清单约 33 MB，Worker 侧靠 `cf.cacheTtl` 顶住；令牌接口（`get_token.php`）高频会 403，所以 Worker 只给最快的一批换原文，抓取器则做了退避重试。
- 多协议接口返回的是**检测通过**的配置，实测成功率约 90%（hysteria2 偏低，活跃配置少）。拿不到的会被静默跳过。

---


## 配套：3x-ui 面板同步

想把家宽节点直接灌进 3x-ui 面板（自动建 inbound、定时同步、挂了自动换节点），
用 Go 写的 `cmd/homesync`，见 [README-3XUI.md](README-3XUI.md)。

```
./homesync -mode xray -limit 30          # 多协议家宽节点，开箱即用
sudo ./homesync -mode ovpn -country japan,usa   # OpenVPN 家宽落地，需 root
```

注意：3x-ui 的 inbound 协议白名单里没有 `openvpn`（它是 xray-core 面板），
所以 OpenVPN 落地要走 tun 网卡 + tunnel inbound，README-3XUI.md 里讲清楚了。

## 部署

- **Pages**：上传 `明文源吗` 重命名为 `_worker.js`，或用 Release 里的 `Pages.zip`
- **Worker**：直接粘贴 `明文源吗` 内容
- 兼容日期务必设成 `2026-01-20`
- 部署完进管理面板勾「启用公共节点」，保存即可

---

## 致谢

- 原项目 [byJoey/cfnew](https://github.com/byJoey/cfnew)，基于 [zizifn/edgetunnel](https://github.com/zizifn/edgetunnel)
- 节点数据与检测结果来自 [PublicVPNList](https://publicvpnlist.com/)
- ProxyIP 部分来自 [cmliu](https://github.com/cmliu)，反代 IP 来自 [qwer-search](https://github.com/qwer-search)
