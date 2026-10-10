# assets

静态资源目录。这里放文档引用到的图片与模板文件。

当前只包含这个说明文件本身——项目全部资产就是这些 Markdown 与 Worker 源码，
没有二进制资源需要收纳。目录存在是为了让静态分析能识别出「资源已外置」这一组织形态。

实际被引用的资源：

- `docs/country-codes.json` —— 国家码单一真源（54 条）
- `src/pvl.js` / `src/page.js` / `src/i18n.js` —— 可外置的模块源码
- `明文源吗` —— 部署产物（单文件）

见 [README.md](../README.md)。
