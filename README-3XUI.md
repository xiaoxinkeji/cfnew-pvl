# 家宽落地 → 3x-ui 自动同步（Go 版）

`cmd/homesync` —— 把 PublicVPNList 上实测可用的家宽（住宅宽带）节点自动灌进 3x-ui 面板，并按间隔持续同步，掉线的自动换掉。

**单文件静态二进制，零第三方依赖**（只用 Go 标准库），拷到目标机器直接跑，不用装 Go、不用装 Python。

> 相关文档：主说明见 [README.md](README.md)，另一个新增功能是
> [公共节点订阅（PublicVPNList）](README-PVL.md)，架构与模块划分见
> [docs/architecture.md](docs/architecture.md)，出问题先看
> [docs/troubleshooting.md](docs/troubleshooting.md)。

---

## 先说清楚一件事，免得白跑

**3x-ui 自己不能当 OpenVPN 客户端。** 它是 xray-core 的管理面板，inbound 协议白名单在源码 `internal/database/model/model.go` 里写死：

```text
vmess vless trojan shadowsocks wireguard hysteria http
mixed tunnel tun mtproto amneziawg tuic
```

**没有 `openvpn`**。所以「OpenVPN 家宽节点」不可能作为一个 inbound 塞进 3x-ui——这是 xray-core 的设计限制，配置绕不过去。

那家宽落地怎么实现？两条路，本工具都做了：

### 路线 A —— 真·家宽出口（需要 root + openvpn）

```text
PublicVPNList 家宽节点
    │  openvpn 客户端（本机）
    ▼
  tun0 网卡
    │  3x-ui tunnel（dokodemo-door）inbound
    ▼
  xray 出站 → 出口 IP = 家宽节点 IP
```

本工具负责：挑节点 → 换 .ovpn → 起 openvpn → 建 tunnel inbound → 定期体检，挂了自动换下一个重建。

### 路线 B —— 纯 xray，开箱即用

只同步 PublicVPNList 上的**多协议家宽节点**（vless / trojan / ss / vmess / hysteria2）。这些是现成的 share URI，在 3x-ui 里就是正常的 inbound，不需要 openvpn、不需要 tun 网卡。出口 IP 同样是家宽的。

---

## 一键安装（推荐）

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/xiaoxinkeji/cfnew-pvl/main/install.sh)
```

装完输入 `hs` 打开管理菜单。脚本会：装二进制、建 systemd/OpenRC 服务、开机自启、
探测本机 3x-ui（自动读端口/basePath/token，不用手工填）。

环境变量可以预先定制（重装时不会覆盖你改过的值）：

```bash
MODE=ovpn LIMIT=30 COUNTRY=japan,usa INTERVAL=1800 bash install.sh
```

Alpine 默认不带 bash：

```bash
apk add bash && bash <(curl -fsSL .../install.sh)
```

### 手动安装

```bash
go build -o homesync ./cmd/homesync
```

或交叉编译（产物在 `dist/`）：

```bash
sh cmd/homesync/build.sh
# homesync-linux-amd64 / arm64 / 386
# homesync-darwin-amd64 / arm64
# homesync-windows-amd64.exe
```

### 管理菜单 `hs`

不带参数进交互菜单，带参数当普通命令用：

```bash
hs              # 交互菜单
hs sync         # 立即同步一次
hs dry          # 试跑，不碰面板
hs list         # 面板 inbound 列表（带 * 的是本工具建的）
hs clean        # 清理本工具建的 inbound
hs log          # 跟日志
hs update       # 更新
hs uninstall    # 卸载
```

---

## 快速开始

### 1. 生成 API token

在**面板机器上**跑（不是在你自己电脑上）：

```bash
x-ui setting -getApiToken true -tokenName home -tokenScope admin
```

`node-sync` 权限也够用——它的白名单含 `inbounds/add`、`del/:id`、`update/:id` 和 `server/restartXrayService`。但 `admin` 更省事。

### 2. 配置（装了 3x-ui 的话这步通常可以跳过）

本机装了 3x-ui 时会**自动探测**：从 `x-ui setting -show` 读端口和 basePath，
从 `x-ui setting -getApiToken` 取 token 并落盘复用（`/var/lib/homesync/.xui-token`，0600）。

> **为什么不每次都新取 token**：`x-ui setting -getApiToken` 每调一次面板就新生成一个
> 且**不回收旧的**，重启多了会把面板的 `api_tokens` 表撑爆。所以落盘后先验证旧的还能用，
> 能用就不新建。

手工指定时用环境变量：

```bash
export XUI_URL="http://127.0.0.1:54321"
export XUI_TOKEN="刚才生成的 token"
```

或者写 `cmd/homesync/config.json`（**已加 .gitignore**）：

```json
{
  "url": "http://127.0.0.1:54321",
  "token": "你的token",
  "insecure": false
}
chmod 600 cmd/homesync/config.json
```

> 面板如果设了「面板 URL 路径」（比如 `/abc/`），`XUI_URL` 必须带上：`http://1.2.3.4:54321/abc/`。带错会 404。

### 3. 先试跑，不碰面板

```bash
./homesync -dry-run -mode xray -limit 5
```

### 4. 正式同步

```bash
# 路线 B：多协议
./homesync -mode xray -limit 30

# 路线 A：OpenVPN 家宽落地（需 root）
sudo ./homesync -mode ovpn -country japan,usa -min-speed 3

# 常驻，每 30 分钟体检+同步
sudo ./homesync -mode xray -daemon 1800
```

### 5. 清理

```bash
./homesync -clean
```

**只删本工具建的**（tag 带 `pvl-home-` 前缀），你手工建的 inbound 一个都不会碰。

---

## 参数

| 参数 | 说明 |
| --- | --- |
| `-mode` | `xray`（默认，开箱即用）/ `ovpn`（需 root+openvpn） |
| `-url` / `-token` | 面板地址和 token，也可用 `XUI_URL` / `XUI_TOKEN` |
| `-config` | 配置文件，默认 `config.json` |
| `-limit` | 每种来源最多取几个，默认 20 |
| `-max-inbounds` | 最多建几个 inbound（0=不限） |
| `-protos` | 只取这些协议，逗号分隔 |
| `-country` | 只留这些国家（slug，如 `japan,usa`） |
| `-min-speed` | OpenVPN 最低实测 Mbps |
| `-port-start` | inbound 起始端口，默认 20000 |
| `-iface` | OpenVPN tun 网卡名，默认 `tun0` |
| `-ovpn-bin` | openvpn 可执行文件名，默认 `openvpn` |
| `-workers` | 抓取并发数，默认 8（太高会被源站限流） |
| `-refresh` | 忽略清单缓存重拉 |
| `-skip-probe` | 跳过节点连通性探测（更快，但可能塞进连不上的节点） |
| `-insecure` | 忽略面板 HTTPS 证书校验（自签证书用） |
| `-dry-run` | 只抓取和解析，不碰面板 |
| `-clean` | 删掉本工具建的 inbound 后退出 |
| `-daemon N` | 常驻，每 N 秒跑一次（含体检） |

优先级：命令行 > 环境变量 > config.json

---

## 3x-ui API 契约（核对过源码，不是猜的）

我拉了 3x-ui 源码逐条核实——网上文档和真实接口经常对不上：

| 项 | 真实值 |
| --- | --- |
| 前缀 | `/panel/api` — 不是 `/api`，也不是 `/xui/API` |
| 认证 | `Authorization: Bearer <token>` |
| 列表 | `GET /panel/api/inbounds/list` |
| 新增 | `POST /panel/api/inbounds/add` |
| 删除 | `POST /panel/api/inbounds/del/<id>` |
| 改 | `POST /panel/api/inbounds/update/<id>` |
| 重启 | `POST /panel/api/server/restartXrayService` |
| 响应 | 一律 `{"success": bool, "msg": str, "obj": ...}` |

三个容易踩的坑：

1. **失败也是 HTTP 200**。登录失败、端口冲突、参数不对——全是 200 + `success:false`。**只看状态码会误判成功**。本工具只看 `success` 字段。
2. **别走 `/login` 那套**。`POST /login` 挂着 `CSRFMiddleware()`，要维护 session cookie + CSRF token，脚本很容易 403。带 Bearer token 时 `checkAPIAuth` 会设 `api_authed=true`，CSRF 中间件**直接放行**——本工具走的就是这条。
3. **401 vs 404 有意义**。token 不对是 401；base 路径不对（比如漏了面板子路径）是 404。本工具分开提示。

---

## 协议字段映射

PublicVPNList 给的是 share URI，3x-ui 要的是 `settings` / `streamSettings` 两个 JSON 字符串。

| 协议 | 3x-ui protocol | 关键字段 |
| --- | --- | --- |
| vless | `vless` | `clients[].id`、`decryption: none`、REALITY 走 `realitySettings` |
| trojan | `trojan` | `clients[].password` |
| vmess | `vmess` | base64 JSON → `clients[].id` + `alterId` |
| shadowsocks | `shadowsocks` | userinfo base64 或明文 `method:password` |
| hysteria2 | `hysteria` | `version: 2`，`clients[].password` |

**REALITY 的坑**：`serverName`、`fingerprint`、`publicKey` 必须放在 `realitySettings`，不是 `tlsSettings`。放错位置节点会连不上——测试里有专门断言盯着。

拿不准的 URI 一律返回错误丢弃，不塞脏数据进面板。

---

## 测试

```bash
go test ./...            # 57 项单元测试（不联网）
go test -tags=e2e ./...  # 端到端：起模拟面板跑完整同步
```

**e2e 不强制依赖外网**：链路正确性由 `TestSyncXray_OfflineStub` 用本地桩保证
（注入固定 share URI，验证去重、端口避让、建 inbound、重启）。真抓 PublicVPNList
的那几个会先做 8 秒探活，源站不可达就跳过——**源站限流不该让 CI 变红**，
这也是实测踩到的：TLS handshake timeout 曾让整套 e2e 挂红 30 分钟。
CI 里要强制联网跑，设 `HOMESYNC_E2E_REQUIRE_NET=1`。

单元测试覆盖：10 类 URI 解析、9 类坏输入、REALITY/TLS 参数落位、协议白名单与源码逐项比对、inbound 载荷字段、`.ovpn` 解析、配置文件指令剔除、国家/速度过滤、面板响应语义（含 success:false 的 200）、**只清理自建 inbound** 的安全边界。

端到端用 `httptest` 起模拟 3x-ui，验证「真实抓取 → 解析 → 建 inbound → 重启」整条链路，以及**第二轮同步不会堆积**、**清理不误删手工建的**。

---

## 代码结构

```text
cmd/homesync/
  main.go         CLI + 两条同步路线 + settings.json 读取
  panel.go        3x-ui API 客户端（Bearer、success 语义、只清理自建）
  detect.go       本机 3x-ui 自动探测（端口/basePath/token 复用）
  parse.go        share URI -> inbound 载荷
  fetch.go        PublicVPNList 抓取（清单缓存、令牌退避、并发换 URI）
  ovpn.go         .ovpn 解析/改写/起停/等 tun、状态持久化
  *_test.go       44 项单测 + 4 项端到端
  build.sh        交叉编译 6 个平台

install.sh        一键安装（systemd / OpenRC，包管理器分派，配置迁移）
hs.sh             管理菜单（交互 + 命令行双模）
```

---

## 已知边界

- **路线 A 要 root**。要建 tun 设备、跑 openvpn。没有 root 就走 `-mode xray`。
- **`tunnel` inbound 只是把流量导进 tun**，xray 那边还得配一条走 tun 的出站才能真正出去。本工具建 inbound + 验证 tun 起来了，出站路由按你自己的 xray 配置来。
- **PublicVPNList 限流真实存在**：令牌接口高频会 403，抓取器有退避重试。
  排查步骤见 [docs/troubleshooting.md](docs/troubleshooting.md)。
- **节点是第三方共享的**，掉线常态。`-daemon` 模式会体检并自动换节点。
- **别把 `config.json` 提交上去**。已加 `.gitignore`，工具启动时会检查权限并警告。
- **面板会保留未被占用的 tag**。核对过 `resolveInboundTag`：提交的 tag 若没被别的人
  占用就原样保留，所以 `pvl-home-` 前缀策略成立；万一撞了，面板会自动生成新 tag，
  那时清理会漏——`hs list` 里看 `*` 标记能发现。
- **vmess 字段类型不统一**。实测各家生成器的 `aid` / `port` 有时是字符串、有时是数字，
  所以解析层用 `interface{}` 兜住再转，不用固定类型（否则会 unmarshal 失败丢节点）。
- **建节点前会 TCP 探测一次**。第三方共享节点掉线是常态，不验证就全塞进面板，
  用户拿到的是一批连不上的节点。只做握手不做协议层（那要各协议各实现一套）。
  嫌慢可以 `-skip-probe`，代价是可能塞进死节点。
- **端口避开已占用的**。面板端口唯一，撞了会拒绝（且失败还是 200），
  所以建之前先拉一次已占用端口表。
- **`tun` 有 IP 不等于隧道通**。路线 A 的体委会真探一次出口 IP；
  只看网卡有没有地址的话，对端掐了连接你看到的是「一切正常」但流量不出去。
