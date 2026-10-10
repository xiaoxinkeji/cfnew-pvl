#!/usr/bin/env python3
"""把 明文源吗 还原成"全占位"版本 —— 重构时反复需要，所以固化成脚本。

为什么需要它：主文件在 git 里存的是**构建产物**（CI 会重新内联并提交），
所以 `git checkout -- 明文源吗` 拿到的不是占位版。手工重做抽取极易出错，
这个脚本一次把所有可外置的块都换成占位。

用法：
    python3 tools/make_placeholders.py     # 需要主文件当前是构建产物（无占位）
"""
import io
import re
import sys
from pathlib import Path

根 = Path(__file__).resolve().parent.parent
主路径 = 根 / '明文源吗'
行 = io.open(主路径, encoding='utf-8').read().splitlines()

if any('__' in l and '_MODULE__' in l for l in 行):
    print('主文件已经含占位标记，跳过（先跑 node tools/build.js 得到产物再来）')
    sys.exit(0)


def 定位(pred):
    for i, l in enumerate(行):
        if pred(l):
            return i
    return None


def 模板范围(变量):
    起 = 定位(lambda l: l.strip().startswith(f'const {变量} = `'))
    if 起 is None:
        return None
    止 = 起
    while not 行[止].rstrip().endswith('`;'):
        止 += 1
    return 起, 止


# 收集所有要替换的区间：[(起, 止, 占位行)]
块 = []

# ① pvl：公共节点整段
起 = 定位(lambda l: l.startswith('// ======================= 公共节点'))
止 = 定位(lambda l: l.startswith('// ======================= 家宽链式'))
块.append((起 + 1, 止 - 1, '/* __PVL_MODULE__ */'))

# ② i18n 字典（整条语句换成带等号的占位）
i1 = 定位(lambda l: l.strip().startswith('const 本地值235 = {'))
i2 = i1
while 行[i2].strip() != '};':
    i2 += 1
块.append((i1, i2, '  const 本地值235 = /* __I18N_MODULE__ */;'))

# ③ 订阅首页模板 值页面：CSS / HTML / JS×4
起页, 止页 = 模板范围('值页面')
体 = 行[起页 + 1:止页]
s_end = next(i for i, l in enumerate(体) if l.strip() == '</style>')
h_end = next(i for i, l in enumerate(体) if l.strip() == '<script>')
js = 体[h_end:]
可切 = [i for i, l in enumerate(js) if l and not l[0].isspace()]
if len(可切) < 4:
    浅 = min(len(l) - len(l.lstrip()) for l in js if l.strip())
    可切 = [i for i, l in enumerate(js)
            if l.strip() and len(l) - len(l.lstrip()) == 浅]
段数 = max(1, min(4, -(-len(js) // 600)))   # 向上取整，最多 4 段
切 = []
for k in range(1, 段数):
    目标 = len(js) * k // 段数
    候选 = [x for x in 可切 if x > (切[-1] if 切 else 0)]
    切.append(min(候选, key=lambda x: abs(x - 目标)) if 候选 else None)
切 = [x for x in 切 if x]
js边界 = [0] + sorted(set(切)) + [len(js)]
块.append((起页 + 1, 起页 + s_end, '/* __PAGE_CSS_MODULE__ */'))
块.append((起页 + s_end + 1, 起页 + h_end - 1, '/* __PAGE_HTML_MODULE__ */'))
for n in range(len(切) + 1):
    a0 = js边界[n]
    b0 = js边界[n + 1] - 1
    块.append((起页 + 1 + h_end + a0, 起页 + 1 + h_end + b0,
               f'/* __PAGE_JS_{"ABCD"[n]}_MODULE__ */'))

# ④ 管理面板模板 终端页面
r2 = 模板范围('终端页面')
if r2:
    起t, 止t = r2
    块.append((起t + 1, 止t - 1, '/* __PANEL_MODULE__ */'))

# 应用：逐区间替换，从后往前做，避免行号漂移。
# 同时把每块原文写到 src/ 下对应的模块文件，作为内联的来源。
源映射 = {
    'PVL': 'pvl.js', 'I18N': 'i18n.js',
    'PAGE_CSS': 'page-css.js', 'PAGE_HTML': 'page-html.js',
    'PAGE_JS_A': 'page-js-a.js', 'PAGE_JS_B': 'page-js-b.js',
    'PAGE_JS_C': 'page-js-c.js', 'PAGE_JS_D': 'page-js-d.js',
    'PANEL': 'panel.js',
    'SUB_A': 'sub-a.js', 'SUB_B': 'sub-b.js', 'SUB_C': 'sub-c.js',
    'SUB_D': 'sub-d.js', 'SUB_E': 'sub-e.js', 'SUB_F': 'sub-f.js',
    'SUB_G': 'sub-g.js',
}
模板类 = {'PAGE_CSS', 'PAGE_HTML', 'PAGE_JS_A', 'PAGE_JS_B', 'PAGE_JS_C',
          'PAGE_JS_D', 'PANEL'}
for 起x, 止x, 占 in 块:
    m = re.search(r'__([A-Z_]+)_MODULE__', 占)
    if not m:
        continue
    键 = m.group(1)
    文件名 = 源映射.get(键)
    if not 文件名:
        continue
    原文 = 行[起x:止x + 1]
    if 键 == 'I18N':
        正文 = '\n'.join(原文).strip() + '\n'
    elif 键 in 模板类:
        正文 = 'const X = `\n' + '\n'.join(原文).rstrip() + '\n`;\n'
    else:
        正文 = '\n'.join(原文).rstrip() + '\n'
    io.open(根 / 'src' / 文件名, 'w', encoding='utf-8').write(正文)


# 注意不能"先合并连续覆盖区再逐个填占位"——相邻区间会被压成一个槽，
# 导致占位数量对不上 src 模块数。
块.sort(key=lambda x: -x[0])
for 起x, 止x, 占 in 块:
    行[起x:止x + 1] = [占]

新 = 行
print(f'✅ 占位版已生成：{len(新)} 行，{len(块)} 个占位')
for 起x, 止x, 占 in sorted(块):
    print(f'   {占:38} 原 {止x - 起x + 1:5} 行')

io.open(主路径, 'w', encoding='utf-8').write('\n'.join(新) + '\n')
print(f'✅ 占位版已生成：{len(新)} 行，{len(块)} 个占位')
for 起x, 止x, 占 in 块:
    print(f'   {占:38} 原 {止x - 起x + 1:5} 行')
