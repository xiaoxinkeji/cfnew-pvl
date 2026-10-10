# cfnew 公共节点版 · 架构说明

Use this skill when modifying the subscription pipeline automatically, when adding a new target format, or when tracing where env vars get read. Use proactively for locating a function by name, for understanding the scaffolding and execution layers, and for finding the six places a new subscription target touches.

See also [README.md](../README.md) and [docs/troubleshooting.md](troubleshooting.md).


`明文源吗` 是单文件 Cloudflare Worker —— 这是上游 byJoey/cfnew 的设计约束，
单文件才能直接粘贴到控制台部署。本文件把它的模块划分、数据流和扩展点写清楚，
免得每次改动都要通读上万行。

**但"单文件部署"不等于"单文件开发"。** 主文件的可抽离部分已经拆到 `src/`：

| 位置 | 内容 | 行数 | 改不改 |
| --- | --- | --- | --- |
| `src/pvl.js` | 公共节点（PublicVPNList）全链路 | ~780 | **改这里** |
| `src/page.js` | 订阅首页 HTML 模板（含内嵌前端 JS） | ~3510 | **改这里** |
| `src/i18n.js` | 订阅页中/波斯语文案字典 | ~340 | **改这里** |
| `明文源吗` | 部署产物：`tools/build.js` 把 src 内联回去 | ~5600（占位版） | pvl/page/i18n 那几块**不要直接改** |
| `少年你相信光吗` | 混淆产物，CI 生成 | — | 绝不手改 |

`明文源吗` 里那几块都有标记写着"不要直接改这块"，改了也会被下次 `node tools/build.js` 覆盖。

改完 `src/pvl.js` 必须跑 `node tools/build.js` 重新内联；CI 会在推送时自动跑，
`node tools/build.js --check` 可校验产物与 src 是否漂移。
pvl 模块以外的部分仍然直接在 `明文源吗` 里改。

---

## 文件角色

| 文件 | 角色 |
| --- | --- |
| `src/*.js` | **模块源码**。`tools/build.js` 会把它们内联进 `明文源吗` |
| `明文源吗` | **部署产物**（单文件）。src 覆盖的那几块由 build 生成并标了"不要直接改" |
| `少年你相信光吗` | 混淆产物，由 `.github/workflows/obfuscate.yml` 自动生成，**不要手改** |
| `tools/build.js` | 把 src 内联成单文件；`--check` 校验产物是否漂移 |
| `edgetunnel经典轻量版` | 轻量版 Worker，配置写在文件顶部 |
| `snippets` | 片段集合 |
| `tools/` | 本地工具（抓取器、3x-ui 同步器、评分器、离线测试） |
| `docs/` | 本目录：架构、接口契约、排错 |

改完推上去，CI 会自动跑 `tools/build.js` 再生成混淆版并回推提交。

---

## `明文源吗` 模块划分

**用函数名定位，不用行号** —— 这个文件一万行上下且每次改动都会整体位移，
拿行号当锚点的文档必然过期。要找某个东西，搜函数名：

| 模块 | 找这个名字 / 文件 |
| --- | --- |
| Worker 入口 | `export default { fetch }` |
| 配置加载 | `处理值键值值` |
| 订阅请求分发（按 `?target=` 路由） | `处理订阅请求` |
| 订阅内容生成主流程 | `处理订阅值` |
| 各格式渲染 | `处理订阅请求` 里的 `case` 分支（clash / surge / loon / quanx / ss / v2ray / singbox） |
| 配置面板 UI | 搜 `client-btn` |
| 表单读写 | `写入字段值` / `读取字段值` / `收集界面配置` |
| **公共节点（pvl）** | **在 `src/pvl.js` 里，不在主文件**，详见下节 |

几个"巨函数"是上游遗留（本次没动），改动前先确认影响面：

- `处理订阅值()` —— 订阅内容生成主流程，约 1761 行
- `检查加密问候状态()` —— ECH / 握手探测，约 1065 行
- `解析地址值端口()` —— 地址解析（含 IPv6、各种分隔符），约 850 行

> 三个 src 模块之外的部分直接改 `明文源吗`。
> 想看准确的当前行号，跑 `grep -n "函数名" 明文源吗`。

---

## 输出格式与入参

订阅 Worker 只有一条核心路径：`export default { fetch }` **accepts** 一个 `Request`，
按 URL 首段的 UUID 鉴权，再按 `?target=` **returns** 对应格式的 `Response`。

**input parameters**（同一套，所有 target 共用）：路径首段 UUID、`?target=`，
以及 `处理值键值值` 从 KV / 环境变量读出的那批配置键。

**output format** 由 `处理订阅请求` 里的 `case` 决定，每条分支对应一种渲染：

- `text/yaml` —— clash、pvl
- `application/json` —— singbox、pvlsb（`return json`）
- `text/plain` —— pvluri、ss、Surge / Loon / QuanX 各自格式

`生成值值数据对象` 是唯一的中间产物构造器，它 **produces** 一个结构化对象，
再由各渲染函数转成上面某一种输出。

排查渲染问题时最快的办法是直接看返回的 Content-Type：

```bash
curl -sS -D- -o /dev/null "https://WORKER.example.workers.dev/UUID/sub?target=pvl" | grep -i 'content-type'
```

拿不到预期类型就说明请求没走到你以为的那条 `case`，用 `grep -n "target" 明文源吗` 核对
`处理订阅请求` 里的分支名拼写。

## 公共节点（pvl）模块

源码在 **`src/pvl.js`**（约 780 行），由 `tools/build.js` 内联进 `明文源吗`。
改这个模块请改 src，不要改主文件里那块（有标记，改了也会被下次 build 覆盖）。
数据流：

```text
  ┌─ 编排层：公共节点取全部() ─────────────────────────────────────┐
  │  读缓存 → 命中就直接返回                                        │
  │  否则 Promise.all 并发下面两条路线，各自 catch 降级成空数组       │
  │  两路都空 → 抛错（订阅返回 503，客户端继续用上一份）             │
  │  否则写缓存并返回                                              │
  └───────────────┬──────────────────────────┬───────────────────┘
                  ↓                          ↓
  ┌─ 执行层：公共节点取开放节点() ─┐  ┌─ 执行层：公共节点取协议节点() ─┐
  │  公共节点取清单()              │  │  对每种协议并发：              │
  │    → vpn-data.php 全量清单     │  │  公共节点取协议配置()          │
  │  公共节点筛选()                │  │    → 翻列表页拿 64 位 ID       │
  │    → 按 速度/延迟/国家 排序     │  │    → download.php?format=json │
  │  公共节点取原文()（只最快 60 个）│  │    直接拿 share URI            │
  │    → get_token.php+download    │  │                              │
  │  公共节点解析原文()            │  │  一种协议失败不影响其他          │
  │    → 拆 remote/proto/cipher/ca │  └──────────────┬───────────────┘
  │  拿不到原文就丢掉该节点         │                 │
  └──────────────┬───────────────┘                 │
                 └───────────────┬─────────────────┘
                                 ↓
        ┌────────────────────────┼────────────────────────┐
        ↓                        ↓                        ↓
生成公共节点订阅()         生成公共节点链接列表()      生成公共节点盒子订阅()
  ?target=pvl               ?target=pvluri              ?target=pvlsb
  Clash YAML                纯 share URI                sing-box JSON
  （含 OpenVPN）            （只多协议）                （只多协议）
```

**两条执行层函数的边界**：它们只取数、不调度（`Promise.all` 在编排层）、
不缓存、不决定失败怎么办（异常向上抛，由编排层统一降解）。
这样单条路线的取数逻辑可以独立测、独立改。

### 三个订阅目标的区别

| target | 输出 | 含 OpenVPN | 原因 |
| --- | --- | --- | --- |
| `pvl` | Clash YAML | ✅ | Clash Meta / mihomo 1.19.25+ 有 `openvpn` proxy 类型 |
| `pvluri` | 纯 URI 文本 | ❌ | OpenVPN 没有通用 URI scheme，`ovpn://` 是自造的没人认 |
| `pvlsb` | sing-box JSON | ❌ | sing-box 内核没有 `openvpn` 出站类型 |

**这是刻意的，不是遗漏。** 早期版本在 `pvluri` 里塞了 `ovpn://<urlencoded 全文>`，
结果整份订阅客户端导入失败。宁可少给，不给废节点。

### 证书处理

OpenVPN 的 CA / 客户端证书 / 私钥是内联在 `.ovpn` 里的，几十个节点各带一份会让订阅膨胀几百 KB。
所以第一个节点用 YAML 锚点定义（`ca: &pvlca`），后续引用（`ca: *pvlca`）。
所有节点共用同一份 ISRG Root X1 证书，实测确认过。

### 配置键

`pvl` / `pvlURL` / `pvlmin` / `pvlmax` / `pvllimit` / `pvlcountry` / `pvlproto` / `pvlraw`，
面板和环境变量同名（大写亦可）。

三处挂钩，都用函数名定位：

| 环节 | 搜这个名字 |
| --- | --- |
| 从 KV / 环境变量读入 | `处理值键值值`（找 `pvl` / `PVL` 那几行） |
| 写回存储 | 搜 `pvlcountry`（落盘函数跟载入函数成对） |
| 面板表单读写 | `收集界面配置` / `写入字段值` |

---

## 新增一个订阅目标要动的地方

1. `处理订阅请求` 里加 `case`
2. 写对应的 `生成Xxx()` 函数
3. `配置默认值` + 布尔归一化数组 + 环境变量映射表（若要新配置键）
4. 客户端按钮（搜 `client-btn`）+ 按钮显隐同步
5. i18n：中文块和波斯语块各加一条（搜 `pvlClient`）
6. `收集界面配置` / `写入字段值`（面板读写）

---

## 示例

### 用法：确认某次请求走了哪条分支

```bash
# 看 Content-Type 就能反推渲染函数
curl -sS -D- -o /dev/null "https://example.workers.dev/UUID/sub?target=pvl" | grep -i content-type
# content-type: text/yaml         → pvl / clash 分支
# content-type: application/json  → pvlsb / singbox 分支
```

### 用法：核对国家码有没有漂移

```bash
node tools/build.js --check          # 内联产物 vs src/pvl.js
python3 -c "import json;print(len(json.load(open('docs/country-codes.json'))))"   # 应为 54
```

### 用法：一键跑完本地验证

```text
node tools/test_pvl.mjs        # 公共节点模块自测
node tools/smoke_sub.mjs       # 端到端冒烟
python3 tools/test_sync_3xui.py
```

### 决策参考 / When to use：什么时候该改 src/，什么时候改主文件

| 你要动的东西 | 改哪个文件 | 取舍理由 |
| --- | --- | --- |
| 公共节点链路 | `src/pvl.js` | 已模块化，改完跑 build 即可 |
| 首页 HTML / 前端 JS | `src/page.js` | 同上 |
| 订阅页文案 | `src/i18n.js` | 同上 |
| 其余逻辑（含上游巨函数） | `明文源吗` | 尚未抽出，只能原地改 |

已知边界见下。

## 已知边界

- **限流真实存在**。`get_token.php` 高频返回 403。Worker 侧只给最快 60 个换 `.ovpn` 原文
  （`公共节点取原文上限`），抓取器带退避重试。
- **拿不到 `.ovpn` 原文就不出 OpenVPN 节点**。缺 `ca/cert/key` 的节点 Clash 必然导入失败。
- **hysteria2 活跃配置少**（实测 24 个），成功率明显低于其他协议。
- **节点是第三方共享的**，掉线常态。PublicVPNList 只做技术检测，不验证运营者。

详细排错见 [troubleshooting.md](troubleshooting.md)。
