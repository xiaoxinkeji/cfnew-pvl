# cfnew-pvl

基于 [byJoey/cfnew](https://github.com/byJoey/cfnew) v3.1 改造。**上游是 Cloudflare Worker 订阅生成器，这个 fork 的重点是把它换成不需要自建服务器的节点获取方式，并补上落地到 3x-ui 的工具链。**

现在仓库里有三块相对独立的东西：

| | 是什么 | 用在哪 |
| --- | --- | --- |
| **Worker 订阅**（上游 v3.1 原样保留） | 一个 Cloudflare Worker / Pages 脚本，产出 Clash / sing-box 订阅 | 部署到 CF，喂给客户端 |
| **PublicVPNList 公共节点** | 直接吃第三方实测清单，不用自己搭服务器、不用 CF 前置 | Worker 的 `pvl` / `pvluri` / `pvlsb` 三个 target |
| **`homesync`**（Go 写的） | 把家宽节点灌进 3x-ui 面板并持续同步，掉线自动换 | 有 root 的 Linux 服务器，配 3x-ui 用 |

三块可以单独用，也可以一起用。

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

**语言:** [中文](README.md) | [فارسی](فارسی.md)


### 一句话说清边界

它是**订阅生成器**，不是代理本身，不转发你的流量。节点是 PublicVPNList 上公开实测的
第三方端点，质量不由本项目保证 —— 所以文档里持续如实记录已知限制（比如 hysteria2
活跃配置偏少、源站接口会变）。

### 现在的状态，先说清楚

**PublicVPNList 的列表接口必须带一个请求头。** 不加 `X-Requested-With: XMLHttpRequest` 就返回：

```
403 {"ok":false,"error":"Dataset is available through site pages only."}
```

它靠这个头区分「网页在拉」和「有人在爬 API」。另外两个坑：不能声明
`Accept-Encoding: identity`（明文响应会被截断成半个 JSON），响应末尾也常是半个对象，
解析必须容忍截断。

**目前能拿到清单，但下载 `.ovpn` 配置的入口还没打通** —— 旧接口
`/protocols/download.php` 现在返回 400，新的走 `/download/?token=xxx`，
而那个 token 不在列表数据里。也就是说：**有约 3900 个节点的清单
（带真实测速和 ping），但还没有能直接连的 OpenVPN 出口。**

要真连上 OpenVPN 节点，目前用
[fork 出去的 fanout](https://github.com/xiaoxinkeji/fanout)：它走 VPN Gate 源，
开出口的完整链路是通的（实测过日本出口，出口 IP 确实变了）。

各块状态：

- Worker 订阅（v3.1）：照常可用，见下面各节
- `homesync`：**实测可用**，能自动探测本机 3x-ui、开出口、定时同步、掉线自动换

**文档导航**

| 想找什么 | 去哪 |
| --- | --- |
| 部署、环境变量、订阅地址 | 本文件 |
| PublicVPNList 公共节点订阅 | [README-PVL.md](README-PVL.md) |
| 家宽节点同步到 3x-ui 面板 | [README-3XUI.md](README-3XUI.md) |
| 模块划分、数据流、怎么加新订阅格式 | [docs/architecture.md](docs/architecture.md) |
| 出错了（403 / 503 / 导入失败 / CI 失败） | [docs/troubleshooting.md](docs/troubleshooting.md) |
| Agent 协作约定（issue tracker / 标签 / 域文档） | [docs/agents/](docs/agents/) |

## 输出格式与入参

每个订阅接口的 **input parameters** 都是同一套：URL 路径首段是 UUID（`u` / `U` 环境变量），
后半段的 `?target=` 决定返回哪种格式。Worker 对每个请求 **returns** 下列之一：

| target | 返回的 output format |
| --- | --- |
| `clash` | Clash / Mihomo YAML |
| `singbox` | sing-box JSON（`return json`） |
| `pvl` | 公共节点 Clash YAML |
| `pvluri` | 纯 share URI 文本 |
| `pvlsb` | 公共节点 sing-box JSON |

管理类端点 **accepts** 的请求：`POST /api/config`（写配置）、`GET /api/config`（读配置）、
`GET /api/latency`（延迟测试）。管理面板页面由 `GET /` 产出 HTML。

## 示例

### 用法：部署后取回订阅链接

```bash
# 1) 粘贴 明文源吗 内容到 Worker，设好 UUID 环境变量后部署
# 2) 打开管理面板 https://<你的域名>/<UUID>/login
# 3) 复制面板给出的订阅地址喂给客户端
curl -sS "https://example.workers.dev/1c2f0e3a-4b5d-6789-abcd-ef0123456789/sub?target=clash"
```

### 用法：用环境变量代替面板开关

```bash
wrangler secret put SUB_TOKEN
wrangler secret put ADD               # 优选订阅地址列表
wrangler secret put ADDNOTV6          # 是否过滤 IPv6
wrangler secret put PVL               # yes 打开公共节点
```

### 决策参考 / When to use：该用哪个 target

| 你的客户端 | 该用的 target | 取舍理由 |
| --- | --- | --- |
| Clash Verge / Mihomo | `clash` | YAML 支持最全，含 rule-providers |
| sing-box | `singbox` | JSON 配置，需要 outbound 类型匹配 |
| 只想拿到 URI 自己转 | `pvluri` | 纯文本，喂给任意转换器 |
| 要公共节点且能识别 OpenVPN | `pvl` | 只有 Clash Meta 1.19.25+ 认 openvpn proxy |

### 已知边界

这里只列会影响使用结论的限制，逐现象排查见
[docs/troubleshooting.md](docs/troubleshooting.md)。

- 公共节点全部来自第三方站点，可用性由对方决定，本项目只负责搬运与转换
- **PublicVPNList 的列表接口需要 `X-Requested-With: XMLHttpRequest`**，缺了就是 403；
  响应还可能末尾截断，解析要容忍（详见上文「现在的状态」）
- **`.ovpn` 下载入口目前打不通**：清单拿得到，但配下不来，所以还没有能直接连的
  OpenVPN 出口。要连上请用 [fanout](https://github.com/xiaoxinkeji/fanout)
- OpenVPN 没有通用 URI scheme，所以 `pvluri` 与 `pvlsb` 刻意不带这类节点
- sing-box 没有 openvpn 出站类型，`pvlsb` 同理
- hysteria2 在公共数据源里活跃配置偏少（约 24 条），成功率低于 vless / trojan
- 列表接口一次要吐 2 分多钟（约 2MB gzip），别指望它快 —— 客户端要缓存

## 主要功能

- 多协议支持：VLESS、Trojan、xhttp，可以同时启用多个
- 自定义路径：不用UUID当路径了，可以自己设置，支持多级路径
- 延迟测试：内置测试工具，测IP延迟，自动获取机场码
- 订阅转换：可以自定义转换服务地址
- 图形化管理：用KV存配置，改完立即生效，不用重新部署
- API管理：支持通过API动态添加/删除优选IP
- 多客户端：支持 CLASH、SURGE、SING-BOX、LOON、QUANTUMULT X、V2RAY、Shadowrocket、STASH、NEKORAY、V2RAYNG
- 应用唤醒：点按钮自动打开对应客户端
- 自动识别：根据User-Agent自动返回对应格式
- 多语言：支持中文和波斯语，根据浏览器语言自动切换

## v3.1 更新

- 新增「家宽链式」：CF 节点带路，落地换成住宅宽带，出网就是家庭宽带的 IP
  - 配置管理里勾「开启家宽链式」（或环境变量 `jk=yes`），客户端列表会多一个「CLASH 家宽」专属订阅
  - 经典轻量版也支持，见「[家宽链式](#家宽链式)」
- SING-BOX 订阅跟上新版内核：原来的配置在 1.14 上直接起不来，现在要求 1.12 以上

## v3.0 更新

- 「指定地区 (wk)」的第一项从「自动检测」改成「官方直连」
  - 留空时直接用内置的官方地址，不再探测 Worker 所在地区去匹配第三方 ProxyIP 域名
  - **不占用 `p` 变量**，`p` 仍然留给你手填自己的 ProxyIP
  - 想指定落地地区，照旧在下拉里选具体国家
- 删掉了地区自动探测逻辑，少一层不确定性，也少一个外部依赖
- 说明：CF 是任播，同一个地址在不同位置访问会落到不同机房，所以按地区挑 IP 没意义

## v2.9.9 更新

- 出站代理支持 HTTP / HTTPS：`s` 变量按前缀区分协议，不写前缀仍是 SOCKS5，老配置不受影响
  - `http://user:pass@host:port` 明文连代理后建立隧道
  - `https://user:pass@host:port` 连代理这一跳走 TLS
  - 认证走 Basic，由 Worker 自动生成；`http` / `https` 可省略端口，默认 80 / 443
  - 节点 path 里的 `s=` 写法一致
- 出站方式改为三选一（`qj`），并把语义正过来
  - 留空：优先走代理（与旧版默认行为一致）
  - `no`：优先直连，失败再走代理（与旧版 `qj=no` 一致）
  - `only`：**只走代理，连不上直接断开**，不回落直连或备用地址，避免出口 IP 泄漏
  - 面板标签由「降级控制」改为「出站方式」，选项文案重写
- 详见「[出站代理](#出站代理)」

## v2.9.8c 更新

- 订阅转换内部实现：Clash / Stash / Sing-box / Surge / Loon / Quantumult X 配置全部由 Worker 直接生成，不再依赖任何外部 sub-converter
  - 完整规则集：Clash 使用 Loyalsoldier `rule-providers`；Sing-box 使用 MetaCubeX SRS；Surge / Loon / QuanX 使用 ACL4SSR / blackmatrix7 远端规则
  - 各策略分组均包含「策略组 + 全部节点」，可直接切换具体节点（已移除「自动选择」url-test，避免周期性测速浪费请求）
  - 修复 Clash IPv6 节点 `server` 被解析为数组、代理组 `🎯 全球直连` ↔ `🚀 节点选择` 循环引用等问题
- 传输优化：参考 GrainTCP 思路优化 WebSocket/TCP 转发，上行小包队列合并、下行小包聚合、大包直发，并优化 VLESS 解析热路径
- 图形化 ALPN：新增 `alpn` 下拉选项，留空时不写 `alpn`，也可选择 `h3`、`h2`、`http/1.1` 或组合值
- 节点别名简化：域名统一为 `优选域名-序号`，IPv6 统一为 `IPv6优选-序号`，IPv4 使用 `isp-colo-序号`
- KV 配置缓存：30s 短窗口 + 跨 isolate 版本键 `c_ver`，保存后无需刷新两次
- SOCKS5 降级超时：直连 3.5s 无数据自动走 fallback
- 标签：「启用 GitHub 默认优选」改为「启用自定义优选」
- 页面特效开关：`FX: ON / OFF`，选择 localStorage 持久化
- 提供混淆版本 `少年你相信光吗`，逻辑与 `明文源吗` 完全一致

## v2.9.7 更新

- 悬浮保存按钮：右下角常驻「保存全部」按钮，支持 `Ctrl+S` / `Cmd+S` 快捷键
  - 编辑任意字段后按钮自动进入「未保存」提示状态
  - 保存中 / 刷新中有进度反馈
- 通知体验优化：所有阻塞式弹窗替换为右上角浮动消息，自动消失、可悬停暂停、支持手动关闭
  - 4 种语义：success / info / warn / error
- 操作按钮整合：将分散在各区块的 4 个保存按钮合并为统一的悬浮操作组
- 提供混淆版本 `少年你相信光吗`，逻辑与 `明文源吗` 完全一致

## v2.9.6 更新

- 兼容 Xray-core v26.3.27
- 新增香港 (HK) 地区 ProxyIP 和地区选择
- KV 读取性能优化：5 小时内存缓存，减少 99% 以上的 KV 读取量
- 无效请求拦截：非法路径直接返回 404，不再触发 KV 读取
- 修复优选列表保存时 SOCKS5 配置 key 错误的问题

## v2.9.5 更新

- GitHub 默认优选地址默认关闭，需自行配置优选IP来源URL
- 新增「启用原生地址」开关，可在管理面板中控制是否生成原生地址节点（默认关闭）
- 兼容日期设置为 `2026-01-20`

## v2.9.4 更新

- 支持客户端通过 WebSocket path 参数覆盖连接级变量（`p`、`wk`、`rm`、`s`）
  - 无需为每个节点单独部署 Worker，在分享链接的 path 里直接写参数即可
  - 优先级：path 参数 > KV/环境变量全局配置 > 自动检测
  - 详见下方「[客户端 path 参数](#客户端-path-参数)」说明

## v2.9.3 更新

- 新增图形化自定义DNS和ECH域名功能
  - 可在界面中自定义DNS服务器地址（DoH格式）
  - 可在界面中自定义ECH域名
  - 支持动态更改，保存后立即生效
  - Clash配置中的ech-opts增加query-server-name参数，与v2ray保持一致

## v2.9.2 更新

- 修复 Clash 配置生成问题

## v2.9.1 更新

- ECH支持：新增 Encrypted Client Hello (ECH) 功能
  - 每次刷新订阅时自动获取最新的 ECH 配置
  - 启用 ECH 时自动启用"仅 TLS"模式，避免 80 端口干扰
  - 图形界面可一键开启/关闭 ECH 功能


## v2.9 更新

- 地区筛选：可以按地区筛选优选结果，支持多选
- 延迟筛选：新增"只显示最快的10个"选项
- 追加/替换模式：添加优选结果时可以追加或替换整个列表
- 结果展示优化：显示地区标签，按延迟排序
- 其他细节优化

---

### 相关工具

- 优选工具：https://github.com/byJoey/yx-tools/releases
- 文字教程：https://joeyblog.net/yuanchuang/1146.html
- Workers视频教程：https://www.youtube.com/watch?v=aYzTr8FafN4
- Pages视频教程：https://www.youtube.com/watch?v=JhVxJChDL-E
- Snippets视频教程：https://www.youtube.com/watch?v=xeFeH3Akcu8

#
### 家宽节点同步到 3x-ui（一键安装）

配套的 Go 工具 `homesync`：把家宽节点自动灌进 3x-ui 面板，定时同步、挂了自动换节点。

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/xiaoxinkeji/cfnew-pvl/main/install.sh)
hs          # 装完打开管理菜单
```

单文件静态二进制、零第三方依赖，会自动探测本机 3x-ui（读端口/basePath/token）。

两种跑法，装的时候选：

| 模式 | 干什么 | 适合 |
| --- | --- | --- |
| `xray`（默认） | 只同步多协议节点（vless/trojan/ss/vmess），面板里直接建 inbound | 开箱即用，大多数情况 |
| `ovpn` | OpenVPN 连家宽 → tun0 → dokodemo-door inbound | 真正要 OpenVPN 落地，需 root + openvpn |

另外它能自己起一个**聚合订阅**服务（`-mode sub`）：3x-ui 的订阅是按客户端的，
一个 `subId` 只返回自己的那条链接，没有聚合端点 —— 所以这个模式把所有出口
合成一个订阅地址，直接喂给 Clash / mihomo。

> 如果你主要想把 OpenVPN 家宽当出口用，也可以看
> [fanout](https://github.com/xiaoxinkeji/fanout)：每个出口一个 netns +
> 一个本地 SOCKS5 端口，开出口的链路是通的。

完整说明见 [README-3XUI.md](README-3XUI.md)。

## 部署

订阅每15分钟自动优选一次

#### 基础配置
| 变量名 | 值 | 说明 |
| :--- | :--- | :--- |
| `u` | 你的 UUID | 必需，用于访问订阅和配置界面 |
| `p` | proxyip | 可选，自定义ProxyIP地址和端口，支持 IPv4/IPv6/域名。设置后 `wk` 地区匹配失效（互斥）。也可在节点 path 里单独指定 |
| `s` | 出站代理地址 | 可选。支持 SOCKS5 和 HTTP/HTTPS 代理，见下方「[出站代理](#出站代理)」。也可在节点 path 里单独指定 |
| `d` | 自定义路径 | 可选，如 `/mypath` 或 `/path/to/sub`，不填用UUID路径。路径没 `/` 开头会自动补上 |
| `wk` | 地区代码 | 可选，手动指定Worker地区，如 `SG`、`HK`、`US`、`JP`。设置 `p` 后此项失效（互斥）。也可在节点 path 里单独指定 |

#### 协议配置

| 变量名 | 值 | 说明 |
| :--- | :--- | :--- |
| `ev` | yes/no | 可选，启用VLESS（默认启用） |
| `et` | yes/no | 可选，启用Trojan（默认禁用） |
| `ex` | yes/no | 可选，启用xhttp（默认禁用） |
| `tp` | 自定义密码 | 可选，Trojan密码，留空用UUID |
| `ech` | yes/no | 可选，启用ECH功能（默认禁用） |
| `alpn` | ALPN列表 | 可选，TLS节点ALPN参数。留空不写，由客户端协商；可选 `h3`、`h2`、`http/1.1`、`h3,h2`、`h2,http/1.1`、`h3,h2,http/1.1` |

#### 图形化配置（推荐）

1. 在Workers中创建KV命名空间，绑定环境变量 `C`
2. 部署后访问 `/{你的UUID}` 使用图形化配置
3. 改完配置立即生效，不用重新部署

#### 高级控制
| 变量名 | 值 | 说明 |
| :--- | :--- | :--- |
| `yx` | 自定义优选IP/域名 | 可选，支持命名，格式：`1.1.1.1:443#香港节点,8.8.8.8:53#Google DNS` |
| `yxURL` | 优选IP来源URL | 可选，自定义IP列表来源，留空用默认 |
| `scu` | 订阅转换地址 | 可选，默认：`https://url.v1.mk/sub` |
| `epd` | yes/no | 可选，启用优选域名（默认启用） |
| `epi` | yes/no | 可选，启用优选IP（默认启用） |
| `egi` | yes/no | 可选，启用GitHub默认优选（默认启用） |
| `qj` | no / only | 可选，出站方式。留空=优先走代理，`no`=优先直连、失败再走代理，`only`=只走代理不回落。见「[出站代理](#出站代理)」 |
| `dkby` | yes | 可选，设为`yes`只生成TLS节点 |
| `ech` | yes/no | 可选，启用ECH功能（默认禁用，启用后自动开启仅TLS模式） |
| `alpn` | ALPN列表 | 可选，只写入TLS节点链接参数，留空则不写 |
| `yxby` | yes | 可选，设为`yes`关闭所有优选功能 |
| `rm` | no | 可选，设为`no`关闭地区智能匹配 |
| `ae` | yes | 可选，设为`yes`允许API管理（默认关闭） |
| `jk` | yes/no | 可选，开启家宽链式（默认关闭），图形化里也能勾。见「[家宽链式](#家宽链式)」 |
| `pvl` | yes/no | 可选，启用公共节点 PublicVPNList（默认关闭）。见「[公共节点](#公共节点publicvpnlist--不用自己搭服务器)」 |
| `pvlURL` | 清单地址 | 可选，留空用官方接口，可换成自己的镜像 |
| `pvlmin` | 数字 | 可选，OpenVPN 最低实测速度（Mbps），低于此值剔除 |
| `pvlmax` | 数字 | 可选，OpenVPN 最高实测延迟（ms），高于此值剔除 |
| `pvllimit` | 数字 | 可选，每种协议最多取多少个（默认 120） |
| `pvlcountry` | 逗号分隔 | 可选，只留这些国家，如 `japan,south-korea,usa` |
| `pvlproto` | 逗号分隔 | 可选，只取这些协议，如 `openvpn,vless,trojan` |
| `pvlraw` | yes/no | 可选，是否抓取 OpenVPN 原文配置（默认开启） |

### 家宽链式

把落地换成别人家的宽带，出网 IP 就是住宅 IP，不再是机房 IP。适合那些一看到机房 IP 就弹验证码的站点。

链路是 `你的客户端 → cfnew(Cloudflare 边缘) → 住宅宽带 → 目标站`。
家宽节点取自 [VPN Gate](https://www.vpngate.net/cn/) 的志愿者共享节点，靠 mihomo 的
`dialer-proxy` 把 OpenVPN 的传输整个塞进 cfnew 节点里走，所以握手走 CF，出口是住宅宽带。

**开启**：配置管理里勾上「开启家宽链式」（或者加环境变量 `jk=yes`），
客户端列表会多出一个「CLASH 家宽」，点它就是家宽专属订阅。也可以直接用：

```text
https://你的域名/{UUID}/sub?target=vg
```

没开的时候这个地址返回 403。

**经典轻量版**：把文件顶部配置区的 `家宽链式` 改成 `true` 再部署，订阅地址后面加 `?target=vg`：

```text
https://你的域名/{UUID}?target=vg
```

前置节点用的是配置区的「优选地址」，其余和上面一样。

几个要注意的地方：

- **内核要 mihomo 1.19.25 以上**，老内核不认 `type: openvpn`。
  Clash Verge Rev、FlClash、Clash Meta for Android 都行；Stash、Surge、sing-box 这类用不了，
  所以家宽只出 Clash 这一种订阅。
- 订阅里是**全量**住宅节点（日本、韩国居多，几十个），不用自己挑国家和数量。
  节点是志愿者共享的，**掉线是常态**，实测大概一半能通。
  `🏠 家宽自动` 是 fallback 组，挂了会自己往下换；想挑国家就在 `🏠 家宽节点` 里手选，已按国家排好。
- 已经自动剔掉 VPN Gate 自营的机房服务器，只留住宅宽带。
- 前置只用 TLS 节点（有的话）。落地隧道的握手特征很明显，套在明文节点里等于裸奔。
- 只走 TCP，UDP 走不了前置，节点上写的是 `udp: false`。
- 节点源拉不到时订阅返回 503，客户端会继续用上一份，不会被空配置覆盖。
- 速度看对方家里的上传，别指望跑满。要稳定高速还是用正常节点。

#### 公共节点（PublicVPNList —— 不用自己搭服务器）

想直接吃 PublicVPNList 的全量实测节点、不套 CF 前置的，用这个：

```text
https://你的域名/{UUID}/sub?target=pvl      # Clash / Mihomo YAML
https://你的域名/{UUID}/sub?target=pvluri   # 纯 share URI 文本
https://你的域名/{UUID}/sub?target=pvlsb    # sing-box JSON
```

**开启**：配置管理里勾上「启用公共节点（PublicVPNList）」（或环境变量 `pvl=yes`），
客户端列表会多出「CLASH 公共」和「公共连接」两个按钮。没开时这三个地址返回 403。

跟上面家宽链式的区别：**不做链式**，节点原样直出，出口就是节点自己的 IP，
不需要 CF 前置，也不需要自己有服务器。能按实测速度、延迟、国家和协议细调。

完整说明见 [README-PVL.md](README-PVL.md)。

#### 家宽节点同步到 3x-ui 面板

想把家宽落地节点灌进 3x-ui 面板自动管理的，见 [README-3XUI.md](README-3XUI.md)。

#### KV存储设置（推荐）

1. 在Cloudflare Workers中创建KV命名空间
2. 在Workers设置中绑定KV，变量名设为 `C`
3. 重新部署
4. 访问 `/{你的UUID}` 使用图形化配置

#### API使用
1. 下载优选软件：https://github.com/byJoey/yx-tools/releases
2. 开启API：访问 `/{UUID}` 或 `/{自定义路径}`，找到"允许API管理"，开启后保存
3. 添加单个IP：
```bash
# 使用UUID路径
curl -X POST "https://your-worker.workers.dev/{UUID}/api/preferred-ips" \
  -H "Content-Type: application/json" \
  -d '{"ip": "1.2.3.4", "port": 443, "name": "香港节点"}'

# 使用自定义路径（如果设置了d变量）
curl -X POST "https://your-worker.workers.dev/{自定义路径}/api/preferred-ips" \
  -H "Content-Type: application/json" \
  -d '{"ip": "1.2.3.4", "port": 443, "name": "香港节点"}'
```
4. 批量添加IP：
```bash
curl -X POST "https://your-worker.workers.dev/{UUID或自定义路径}/api/preferred-ips" \
  -H "Content-Type: application/json" \
  -d '[
    {"ip": "1.2.3.4", "port": 443, "name": "节点1"},
    {"ip": "5.6.7.8", "port": 8443, "name": "节点2"}
  ]'
```
5. 清空所有IP：
```bash
curl -X DELETE "https://your-worker.workers.dev/{UUID或自定义路径}/api/preferred-ips" \
  -H "Content-Type: application/json" \
  -d '{"all": true}'
```

### 功能说明

#### 延迟测试

v2.7开始提供，v2.9增强了筛选功能

- 内置测试工具，不用装其他软件，直接在配置页面测IP延迟
- IP来源：
  - 手动输入：直接输IP或域名，支持批量（逗号分隔）
  - CF随机IP：从Cloudflare IP段随机生成
  - URL获取：从远程URL获取IP列表
- 支持1-50线程并发测试，默认5线程
- 自动获取机场码（如SJC、LAX）
- 自动映射中文机场名（SJC→圣何塞）
- 自动扣除DNS+TLS握手时间，显示真实延迟
- 设置自动保存到浏览器
- 支持按地区筛选
- 支持只显示最快的10个
- 支持追加或替换模式

#### 官方直连

v3.0 开始，「指定地区 (wk)」留空就是官方直连，这也是默认值，什么都不用配。

以前留空叫「自动检测」：Worker 先探测自己在哪个国家，再去匹配第三方的 ProxyIP 域名。
现在留空直接用内置地址，不探测、不联网、不依赖别人的域名。

- 内置 10 个实测可用的 Cloudflare 官方地址，分布在 10 个不同 /24 段，避免整段被墙时全灭
- 每次连接从里面随机取一个，不是固定某一个
- **不占用 `p` 变量**。`p` 是留给你手填自己的 ProxyIP 的，填了就以你的为准，内置地址不会覆盖
- 想指定落地地区，在下拉里选具体国家，那条路径走的还是原来的地区匹配

关于为什么不做「按地区选 IP」：Cloudflare 是任播（anycast），同一个 IP 在不同位置访问，
落到的机房不一样。挑 IP 决定不了你落地在哪，做成地区列表属于误导。

#### 多协议支持

- VLESS：默认启用
- Trojan：支持Trojan-WS-TLS，可以自定义密码，不填就用UUID
- xhttp：基于HTTP POST的伪装协议
- 可以同时启用多个协议，客户端会自动识别
- 图形界面一键开关
- 协议配置有独立保存按钮

#### ECH 功能 (Encrypted Client Hello)

- 支持 Encrypted Client Hello (ECH) 加密客户端握手
- 自动获取：每次刷新订阅时自动从 DoH 获取最新的 ECH 配置
- 优先使用 Google DNS，失败时自动尝试 Cloudflare DNS
- 智能模式：启用 ECH 时自动启用"仅 TLS"模式，避免 80 端口干扰
- 图形界面：可在协议配置区域一键开启/关闭
- 调试信息：在浏览器开发者工具的响应头中可查看详细的 ECH 获取过程
- 响应头信息：
  - `X-ECH-Status`: SUCCESS 或 FAILED
  - `X-ECH-Debug`: 详细的调试信息
  - `X-ECH-Config-Length`: ECH 配置长度（成功时）

#### 出站代理

`s` 变量用来指定出站代理，所有出站流量都会从它走。支持两类协议，靠前缀区分：

| 写法 | 走的协议 | 说明 |
| :--- | :--- | :--- |
| `host:port` | SOCKS5 | 不写前缀就是 SOCKS5，和以前一样 |
| `socks5://host:port` | SOCKS5 | 显式写法，等价于上面 |
| `http://host:port` | HTTP | 明文连代理，再发建隧请求 |
| `https://host:port` | HTTPS | 连代理这一跳走 TLS，适合代理本身要求加密的场景 |

带认证就在前面加 `用户名:密码@`：

```text
user:pass@1.2.3.4:1080
socks5://user:pass@1.2.3.4:1080
http://user:pass@1.2.3.4:8080
https://user:pass@proxy.example.com:8443
```

说明几点：

- HTTP/HTTPS 代理的认证走 Basic，由 Worker 自动生成，不用自己拼。
- 只有 `http://` 和 `https://` 可以省略端口，分别默认 80 和 443；SOCKS5 必须写端口。
- 地址后面多写的路径会被忽略，`http://1.2.3.4:8080/xxx` 等同于 `http://1.2.3.4:8080`。
- 代理必须支持隧道转发（也就是能代理任意 TCP）。只能转发网页请求的代理用不了。
- 在节点 path 里单独指定时写法完全一样，如 `s=http://user:pass@host:8080`。

**出站方式（`qj`）**

配好 `s` 之后，用 `qj` 决定流量怎么走。面板里对应「出站方式」下拉框：

| `qj` | 行为 | 什么时候用 |
| :--- | :--- | :--- |
| 留空（默认） | 优先走代理，代理不通再回落 | 想走代理，但断了也别断网 |
| `no` | 优先直连，失败再走代理 | 只把代理当备用线路 |
| `only` | 只走代理，连不上直接断开 | 要求出口 IP 固定，不接受回落 |

`only` 和默认的区别在**失败时**：默认会回落到备用地址或直连，这时出口就变成 Worker
自己的 IP 了；`only` 宁可断开也不回落，出口 IP 不会漏。

没填 `s` 时三个选项都一样，都是直连。

#### 自定义路径（d变量）

- 不用UUID当路径了，可以自己设置
- 支持多级路径，如 `/path/to/sub`
- 路径没 `/` 开头会自动补上
- 自定义路径后UUID路径自动禁用
- 可以随时在图形界面改路径

#### 图形化配置

- 用Cloudflare KV存配置
- 访问 `/{你的UUID}` 或 `/{自定义路径}` 就能用
- 改完立即生效，不用重新部署
- 优先级：KV配置 > 环境变量 > 默认值

#### 多语言支持

- 根据浏览器语言自动选择中文或波斯语
- 右上角可以手动切换
- 语言选择会保存到浏览器
- 波斯语自动启用RTL布局

#### 订阅转换控制

- 可以自定义转换服务URL
- 可以单独控制优选域名、优选IP、GitHub优选
- 默认全部启用
- 改完立即生效

#### API管理

- 通过RESTful API管理优选IP，不用改代码
- 支持批量添加
- 支持清空所有IP
- 默认关闭，需要在图形界面开启
- API添加的IP和手动配置的yx变量会自动合并
- API端点：
  - `GET /{UUID或路径}/api/preferred-ips` - 查询列表
  - `POST /{UUID或路径}/api/preferred-ips` - 添加（单个/批量）
  - `DELETE /{UUID或路径}/api/preferred-ips` - 删除（单个/全部）

#### 客户端 path 参数

v2.9.4 新增。在 VLESS/Trojan 分享链接的 `path` 字段里追加查询参数，即可为**单个节点**单独指定连接级配置，无需额外部署 Worker。

| 参数 | 作用 | 示例 |
| :--- | :--- | :--- |
| `p` | 覆盖 ProxyIP（支持带端口） | `p=1.1.1.1` 或 `p=1.2.3.4:8443` |
| `wk` | 覆盖 Worker 地区 | `wk=jp`、`wk=us`、`wk=sg` |
| `rm` | 关闭地区智能匹配 | `rm=no` |
| `s` | 覆盖出站代理 | `s=user:pass@host:1080`、`s=http://user:pass@host:8080` |

**优先级：path 参数 > KV/环境变量 > 自动检测**

> ⚠️ **`p` 和 `wk` 互斥**：设置 `p` 后会直接使用指定的 ProxyIP，`wk` 的地区匹配逻辑被完全跳过，两者同时写只有 `p` 生效。

path 示例：
```text
# 指定 ProxyIP（不要同时写 wk）
/?ed=2048&p=1.1.1.1
/?ed=2048&p=proxy.example.com:443
/?ed=2048&p=[2001:db8::1]:443

# 指定地区（让 Worker 自动选该地区的 ProxyIP）
/?ed=2048&wk=jp
/?ed=2048&wk=sg&rm=no

# 指定出站代理（可与 wk 搭配）
/?ed=2048&s=user:pass@proxy.host:1080&wk=us
/?ed=2048&s=http://user:pass@proxy.host:8080&wk=us
```

> 不在上表中的变量（如 `ev`、`et`、`yx` 等）属于订阅生成级配置，在 WebSocket 握手阶段已过路由，放在 path 里无效，仍需在环境变量或 KV 中设置。

#### 手动指定地区

- 可以手动指定Worker地区，覆盖自动检测
- 设置方式：`wk=SG` 或图形界面选择，或在节点 path 里加 `wk=SG`
- 支持：US、SG、JP、HK、KR、DE、SE、NL、FI、GB

#### 优选节点命名

- 订阅别名默认使用短名称，不再追加端口、协议、TLS/WS 等信息
- 域名节点：`优选域名-01`、`优选域名-02`
- IPv6节点：`IPv6优选-01`、`IPv6优选-02`
- IPv4节点：优先使用 `isp-colo-序号`，缺少运营商信息时回退为 `IPv4优选-序号`

#### 系统状态

- 显示Worker地区、检测方式、ProxyIP状态
- 选择逻辑：同地区 → 邻近地区 → 其他地区

#### 高级控制

- `rm=no` 关闭地区智能匹配
- `qj=no` 优先直连，失败再走代理；`qj=only` 只走代理，连不上直接断开
- `dkby=yes` 只生成TLS节点
- `ech=yes` 启用ECH功能（启用后自动开启仅TLS模式）
- `alpn=h3,h2` 指定TLS节点ALPN，留空则不写
- `yxby=yes` 关闭所有优选功能

#### 多客户端支持

支持10种客户端：CLASH、SURGE、SING-BOX、LOON、QUANTUMULT X、V2RAY、Shadowrocket、STASH、NEKORAY、V2RAYNG

- 根据客户端类型自动生成配置
- 图形界面一键生成订阅链接
- 点按钮自动打开对应客户端
- 根据User-Agent自动识别并返回对应格式
- 不同客户端自动适配最佳协议组合
- TLS 链接默认不写 `alpn`，可在图形界面或通过 `alpn` 配置指定

#### 性能优化

- 每15分钟自动优选一次
- 多重备用方案
- 智能缓存，减少重复计算

### 致谢

- 基于 [zizifn/edgetunnel](https://github.com/zizifn/edgetunnel) 修改
- ProxyIP部分来自 [cmliu](https://github.com/cmliu)
- 反代IP来自 [qwer-search](https://github.com/qwer-search)
- 在线优选接口为第三方公开接口


## Star History

[![Star History Chart](https://star-history.dera.page/svg?repos=byJoey/cfnew&type=Timeline)](https://star-history.dera.page/#byJoey/cfnew&Timeline&LogScale)
