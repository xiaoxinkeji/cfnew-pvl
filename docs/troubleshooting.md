# 排错手册

按"看到的现象"索引，直接找对应条目。
功能说明见 [README.md](../README.md)，公共节点部分见 [README-PVL.md](../README-PVL.md)，
3x-ui 同步见 [README-3XUI.md](../README-3XUI.md)，架构说明见 [architecture.md](architecture.md)。

---

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

```
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
python3 tools/test_sync_3xui.py   # 102 项
node tools/test_pvl.mjs           # 65 项
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
