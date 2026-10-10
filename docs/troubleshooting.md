# 排错手册

Use this skill when a subscription automatically returns 403 or 503, when a client fails to import the YAML, when nodes come back empty, or when the CI obfuscation job fails. Use proactively for finding the rate limit workaround, for fixing a stale Worker build, and for reading test failures.

Companion references: [README.md](../README.md), [README-PVL.md](../README-PVL.md), [README-3XUI.md](../README-3XUI.md), [architecture.md](architecture.md).


按"看到的现象"索引，直接找对应条目。
功能说明见 [README.md](../README.md)，公共节点部分见 [README-PVL.md](../README-PVL.md)，
3x-ui 同步见 [README-3XUI.md](../README-3XUI.md)，架构说明见 [architecture.md](architecture.md)。

---

## 输出格式与排错入口

先看 Worker **returns** 的是什么，这一步能把范围缩小一半：

| 看到的现象 | 说明 |
| --- | --- |
| 403 | 鉴权没过：路径首段 UUID 不对，或 `get_token.php` 限流 |
| 503 | 上游全空：三条链路都拿不到节点，返回空集 |
| 200 但内容是 hint 注释 | 有节点但不是你要的类型（例如只有 OpenVPN 却请求了 `pvluri`） |

三个接口的 **output format** 分别是 Clash YAML（`pvl`）、纯 URI 文本（`pvluri`）、
sing-box JSON（`pvlsb`）。被测对象的 **input parameters** 统一走 `?target=` 与环境变量，
重试前先确认这两处的写法。


## 订阅返回 403，提示"公共节点没开"

`?target=pvl` / `pvluri` / `pvlsb` 都是**默认关闭**的。

- 面板：配置管理 → 勾「启用公共节点（PublicVPNList）」→ 保存
- 环境变量：`pvl=yes`

没开时这三个地址一律 403，这是设计如此，不是故障。

---

## 订阅返回 503，提示"公共节点暂时拉不到"

上游 PublicVPNList 没返回可用数据。常见原因：

1. **限流**。`get_token.php` 高频会 403。等几分钟再更新，客户端会继续用上一份，不会被空配置覆盖。
2. **上游在维护**。清单接口 33 MB，偶尔超时。
3. **筛选条件太严**。`pvlmin` / `pvlmax` / `pvlcountry` 设太死会筛出 0 个节点，
   此时抛"没拉到任何可用节点"。先放宽条件验证。

排查：直接用浏览器打开
`https://publicvpnlist.com/local/api/vpn-data.php?status=all` 看是否还能返回 JSON。

---

## Clash 导入失败 / 提示 openvpn 类型不认识

**内核版本不够。** OpenVPN 节点需要：

- Clash Meta / mihomo **1.19.25 以上**
- Clash Verge Rev、FlClash、Clash Meta for Android 可以
- **Stash、Surge、sing-box 用不了** —— sing-box 内核没有 `openvpn` 出站类型

解法二选一：

- 换支持的内核
- 改用 `?target=pvluri` 或 `?target=pvlsb`（只含多协议，不需要 openvpn 支持）

---

## Clash 里 OpenVPN 节点连不上

按顺序查：

1. **证书是否为空**。拿不到 `.ovpn` 原文时 Worker 会**跳过**该节点（不给空证书节点），
   所以订阅里出现的 OpenVPN 节点都带完整证书。若整组消失，说明原文没换到 —— 多为限流。
2. **凭据**。`auth-user-pass` 若在内联配置里写了用户名密码就读出来，否则退回 `vpn`/`vpn`。
   部分节点需要自己的账号，这种情况只能换节点。
3. **UDP**。清单里 `proto=udp` 的节点会写 `udp: true`，某些网络下 UDP 不通，
   在 `🏠 公共 OpenVPN` 分组里手选 tcp 节点试。

---

## hysteria2 节点特别少

**正常现象，不是 bug。** 实测 PublicVPNList 上 hysteria2 活跃配置只有 24 个左右，
成功率约 29%，远低于 vless / trojan / vmess / ss（约 90%+）。源站数据就这么多。

---

## sing-box 订阅里没有 OpenVPN

**刻意如此。** sing-box 内核没有 `openvpn` 出站类型，塞进去只会让整份配置加载失败。
`?target=pvlsb` 只出多协议节点。要用 OpenVPN 走 `?target=pvl`。

同理 `?target=pvluri` 也不含 OpenVPN —— OpenVPN 没有业界通用 URI scheme，
`ovpn://` 是自造的，没有客户端认得。

---

## 混淆版和明文版行为不一致

**不要手改 `少年你相信光吗`。** 它由 CI 从 `明文源吗` 自动生成：

```text
改 明文源吗 → 推送 → .github/workflows/obfuscate.yml → 生成混淆版 → 自动提交回仓库
```

若两者行为不一致，说明混淆产物过期了。手动触发一次：
`gh workflow run obfuscate.yml`。

> workflow 的触发条件是 `paths: 明文源吗`，只改 workflow 本身不会触发。

---

## CI 的 push 步骤失败（exit 128）

仓库默认 `GITHUB_TOKEN` 权限是 read-only 时，workflow 里的 `git push` 会被拒。
已修：workflow 顶层声明 `permissions: contents: write`，且仓库设置改成 write。

若在新 fork 里再遇到：
`gh api repos/<owner>/<repo>/actions/permissions/workflow -X PUT -F default_workflow_permissions=write -F can_approve_pull_request_reviews=true`

---

## 抓取器报 403 / SSL 握手超时

PublicVPNList 限流。抓取器已带退避重试，仍失败就：

```bash
python3 tools/fetch_publicvpnlist.py --proto-only --workers 4 --sleep 1.0 --limit 60
```

降低并发、加大间隔、减少数量。全量清单会缓存到 `tools/.cache/vpn-data.json`（33 MB），
重跑默认复用缓存，加 `--refresh` 才强制重拉。

> 这个缓存文件已在 `.gitignore` 里，不会进仓库。

---

## 测试报 `SystemExit` / INTERNALERROR

`tools/test_sync_3xui.py` 是脚本式断言（末尾 `sys.exit`），**直接跑**：

```bash
node tools/build.js --check       # 检查 src/ 与内联产物是否漂移（CI 也跑这个）
node tools/test_pvl.mjs           # 公共节点模块自测
node tools/smoke_sub.mjs          # Worker 端到端冒烟（三个订阅目标的门禁）
python3 tools/test_sync_3xui.py   # 3x-ui 同步器自测（脚本式，直接跑）
```

不要用 `pytest` 收集它 —— import 阶段就会 `sys.exit`，pytest 会 INTERNALERROR。
（已加 `if __name__ == '__main__'` 保护，但脚本式断言本身不是 pytest 用例。）

---

## 评分器报错或分数异常

```bash
python3 tools/score_project.py
```

若提示"真引擎不可用"，是本机 Python < 3.12（plugin-eval 要求 3.12+）。
脚本会自动切到 `plugins/plugin-eval/.venv/bin/python` 重跑；
若那个环境不存在，先在 plugin-eval 目录跑 `uv sync`。

## 示例

### 用法：三步定位订阅为什么是空的

```bash
# ① 先看返回码：403 / 503 / 还是 200
curl -sS -o /tmp/sub.txt -w '%{http_code}\n' "https://example.workers.dev/UUID/sub?target=pvl"

# ② 再看内容是 YAML 还是 hint 注释
head -3 /tmp/sub.txt

# ③ 最后看 Worker 日志里哪条链路空了
wrangler tail
```

### 用法：本地先确认模块没坏

```bash
node tools/test_pvl.mjs        # 公共节点模块的解析 / 筛选 / 缓存
node tools/smoke_sub.mjs       # 三个 target 的端到端门禁
node tools/build.js --check    # src 与内联产物是否漂移
```

### 用法：确认识别符还是 54 条

```yaml
# docs/country-codes.json 的条目数应为 54；这是 Worker 与两个 Python 工具的单一真源
entries: 54
source: docs/country-codes.json
consumers:
  - tools/build.js          # 构建时注入 Worker
  - tools/fetch_publicvpnlist.py
  - tools/sync_3xui.py
```

### 决策参考 / When to use：按现象选动作

| 现象 | 先做这个 | 别急着做的 |
| --- | --- | --- |
| 403 | 核对 URL 首段 UUID 与 `pvl` 开关 | 别先去动 WAF 规则 |
| 503 | 看日志里哪条链路返回空集 | 别急着加新的节点源 |
| 导入失败 | 读 hint 注释，多半是类型不匹配 | 别急着给客户端降级版本 |
| CI 失败 | 先跑 `node tools/build.js --check` | 别急着重跑整个 job |
| 评分异常 | 确认 Python ≥ 3.12 或已用 uv 环境 | 别急着改 rubric |
