# 家宽落地 → 3x-ui 自动同步

`tools/sync_3xui.py` —— 把 PublicVPNList 上实测可用的家宽（住宅宽带）节点自动灌进 3x-ui 面板，并按间隔持续同步，掉线的自动换掉。

---

## 先说清楚一件事，免得白跑

**3x-ui 自己不能当 OpenVPN 客户端。** 它是 xray-core 的管理面板，inbound 协议白名单在源码 `internal/database/model/model.go` 里写死：

```
vmess vless trojan shadowsocks wireguard hysteria http
mixed tunnel tun mtproto amneziawg tuic
```

**没有 `openvpn`**。所以「OpenVPN 家宽节点」不可能作为一个 inbound 塞进 3x-ui——这个限制是 xray-core 的设计，不是配置能绕的。

那家宽落地怎么实现？两条路，本工具都做了：

### 路线 A —— 真·家宽出口（需要 root + openvpn）

```
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

```bash
python3 tools/sync_3xui.py --mode xray --limit 30
```

---

## 快速开始

### 1. 生成 API token

在**面板机器上**跑（不是在你自己电脑上）：

```bash
x-ui setting -getApiToken true -tokenName home -tokenScope admin
```

`node-sync` 权限也够用——它的白名单含 `inbounds/add`、`del/:id`、`update/:id` 和 `server/restartXrayService`。但 `admin` 更省事。

### 2. 配置

```bash
export XUI_URL="http://127.0.0.1:54321"
export XUI_TOKEN="刚才生成的 token"
```

或者写 `tools/config.json`（**已加 .gitignore，别改**）：

```json
{
  "url": "http://127.0.0.1:54321",
  "token": "你的token",
  "insecure": false
}
chmod 600 tools/config.json
```

> 面板如果设了「面板 URL 路径」（比如 `/abc/`），`XUI_URL` 必须带上：`http://1.2.3.4:54321/abc/`。带错会 404。

### 3. 先试跑，不碰面板

```bash
python3 tools/sync_3xui.py --dry-run --mode xray --limit 5
```

### 4. 正式同步

```bash
# 路线 B：多协议
python3 tools/sync_3xui.py --mode xray --limit 30

# 路线 A：OpenVPN 家宽落地（需 root）
sudo python3 tools/sync_3xui.py --mode ovpn --country japan,usa --min-speed 3

# 常驻，每 30 分钟体检+同步
sudo python3 tools/sync_3xui.py --mode xray --daemon 1800
```

### 5. 清理

```bash
python3 tools/sync_3xui.py --clean
```

**只删本工具建的**（tag 带 `pvl-home-` 前缀），你手工建的 inbound 一个都不会碰。

---

## 参数

| 参数 | 说明 |
| --- | --- |
| `--mode` | `xray`（默认，开箱即用）/ `ovpn`（需 root+openvpn） |
| `--url` / `--token` | 面板地址和 token，也可用 `XUI_URL` / `XUI_TOKEN` |
| `--config` | 配置文件，默认 `config.json` |
| `--limit` | 每种来源最多取几个，默认 20 |
| `--max-inbounds` | 最多建几个 inbound（0=不限） |
| `--protos` | 只取这些协议，逗号分隔 |
| `--country` | 只留这些国家（slug，如 `japan,usa`） |
| `--min-speed` | OpenVPN 最低实测 Mbps |
| `--port-start` | inbound 起始端口，默认 20000 |
| `--iface` | OpenVPN tun 网卡名，默认 `tun0` |
| `--ovpn-bin` | openvpn 可执行文件名，默认 `openvpn` |
| `--refresh` | 忽略清单缓存重拉 |
| `--dry-run` | 只抓取和解析，不碰面板 |
| `--clean` | 删掉本工具建的 inbound 后退出 |
| `--daemon N` | 常驻，每 N 秒跑一次（含体检） |

优先级：命令行 > 环境变量 > config.json

---

## 3x-ui API 契约（核对过源码，不是猜的）

我拉了 3x-ui 源码逐条核实，因为网上文档和真实接口经常对不上：

| 项 | 真实值 |
| --- | --- |
| API 前缀 | `/panel/api`（不是 `/api`，也不是 `/xui/API`） |
| 认证 | `Authorization: Bearer <token>` |
| 列表 | `GET /panel/api/inbounds/list` |
| 新增 | `POST /panel/api/inbounds/add` |
| 删除 | `POST /panel/api/inbounds/del/<id>` |
| 改 | `POST /panel/api/inbounds/update/<id>` |
| 重启 | `POST /panel/api/server/restartXrayService` |
| 响应 | 一律 `{"success": bool, "msg": str, "obj": ...}` |

三个容易踩的坑：

1. **失败也是 HTTP 200**。登录失败、端口冲突、参数不对——全是 200 + `success:false`。**只看状态码会误判成功**。本工具的 `check_api()` 只看 `success` 字段。
2. **别走 `/login` 那套**。`POST /login` 挂着 `CSRFMiddleware()`，要维护 session cookie + CSRF token，脚本很容易 403。带 Bearer token 时 `checkAPIAuth` 会设 `api_authed=true`，CSRF 中间件**直接放行**——本工具走的就是这条。
3. **401 vs 404 有意义**。token 不对是 401；base 路径不对（比如漏了面板子路径）是 404。本工具分开提示。

---

## 协议字段映射

PublicVPNList 给的是 share URI，3x-ui 要的是 `settings` / `streamSettings` 两个 JSON 字符串。映射规则：

| 协议 | 3x-ui protocol | 关键字段 |
| --- | --- | --- |
| vless | `vless` | `clients[].id`、`decryption: none`、REALITY 走 `realitySettings` |
| trojan | `trojan` | `clients[].password` |
| vmess | `vmess` | base64 JSON → `clients[].id` + `alterId` |
| shadowsocks | `shadowsocks` | userinfo base64 或明文 `method:password` |
| hysteria2 | `hysteria` | `version: 2`，`clients[].password` |

**REALITY 的坑**：`serverName` 和 `fingerprint` 要放在 `realitySettings` 里，不是 `tlsSettings`。放错位置节点会连不上。测试里有专门断言盯着这个。

拿不准的 URI 一律丢弃，不塞脏数据进面板。

---

## 自测

```bash
python3 tools/test_sync_3xui.py
```

**102 项断言**，覆盖：10 种 URI 解析、5 种坏输入、inbound 载荷字段、协议白名单与源码对齐、面板响应处理（含 success:false 的 200）、只清理自建 inbound、`.ovpn` 解析、配置文件指令剔除。

```bash
node tools/test_pvl.mjs    # Worker 侧解析逻辑，51 项
```

---

## 已知边界

- **路线 A 要 root**。要建 tun 设备、跑 openvpn。没有 root 就走 `--mode xray`。
- **`tunnel` inbound 只是把流量导进 tun**，xray 那边还得配一条走 tun 的出站才能真正出去。本工具建 inbound + 验证 tun 起来了，出站路由按你自己的 xray 配置来。
- **PublicVPNList 限流真实存在**。令牌接口高频会 403，抓取器有退避重试；清单（33 MB）落本地缓存 `tools/.cache/`，1 小时内复用。
- **节点是第三方共享的**，掉线常态。`--daemon` 模式会体检并自动换节点。
- **别把 `config.json` 提交上去**。已加 `.gitignore`，工具启动时会检查权限并警告。
