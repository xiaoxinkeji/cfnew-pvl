# docs/references

[docs/architecture.md](../architecture.md) 与 [docs/troubleshooting.md](../troubleshooting.md)
引用但不适合塞进正文的补充材料。

## 函数索引

主文件一万行上下，行号每次改动都会漂移，所以用函数名定位。
跑 `grep -n "<函数名>" 明文源吗` 取当前行号。

| 想找什么 | 函数名 |
| --- | --- |
| Worker 入口 | `export default { fetch }` |
| 订阅分发 | `处理订阅请求` |
| 订阅生成主流程 | `处理订阅值` |
| 配置加载 | `处理值键值值` |
| 面板表单读写 | `收集界面配置` / `写入字段值` |
| 公共节点编排 | `公共节点取全部`（在 `src/pvl.js`） |

## 国家码

单一真源是 [country-codes.json](../country-codes.json)（54 条）。
`tools/build.js` 在构建时把它注入 Worker，两个 Python 工具直接读它。

## 相关

Related: [../architecture.md](../architecture.md) · [../troubleshooting.md](../troubleshooting.md)
