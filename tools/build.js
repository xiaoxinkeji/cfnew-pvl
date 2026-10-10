#!/usr/bin/env node
/**
 * 把 src/ 下的模块内联进 明文源吗，产出可部署的单文件。
 *
 * 为什么这么绕：Cloudflare Worker 部署要的是单文件（粘贴到控制台就能跑），
 * 但万行的单文件没法维护。所以——
 *   - 源码：src/*.js 各自独立可读，明文源吗 里只留占位标记
 *   - 产物：本脚本把 src 内联回 明文源吗，它仍然是一个可以直接部署的单文件
 *
 * 两种内联形态：
 *   - 语句式（模块是一段完整代码）：占位独占一行，内联后包在边界注释里
 *   - 赋值式（模块是 `const X = <值>;` 的值）：占位在等号右侧，只替换成值
 *
 * 用法：
 *   node tools/build.js          # 构建
 *   node tools/build.js --check  # 只检查产物是否漂移，不改文件（CI 用）
 */

const fs = require('fs');
const path = require('path');

const 根 = path.resolve(__dirname, '..');
const 主文件 = path.join(根, '明文源吗');
const 片段分隔符 = '// ---- 片段分隔 ----';

const 模块表 = [
  {
    名: 'pvl',
    占位: '/* __PVL_MODULE__ */',
    源: 'pvl.js',
    开始: '// ↓↓↓ 公共节点模块由 tools/build.js 从 src/pvl.js 内联而来，不要直接改这块 ↓↓↓',
    结束: '// ↑↑↑ 公共节点模块结束 ↑↑↑',
    加工: 注入国家码,
  },
  {
    名: 'i18n',
    占位: '/* __I18N_MODULE__ */',
    源: 'i18n.js',
    赋值式: true,      // 占位出现在 `const X = <占位>;` 的右侧
    加工: 剥声明,      // src 里存整条语句，内联时只要对象字面量
  },
  {
    名: 'page-css',
    占位: '/* __PAGE_CSS_MODULE__ */',
    源: 'page-css.js',
    赋值式: true,
    加工: 剥模板壳,
  },
  {
    名: 'page-html',
    占位: '/* __PAGE_HTML_MODULE__ */',
    源: 'page-html.js',
    赋值式: true,
    加工: 剥模板壳,
  },
  // 前端 JS 拆成 4 段，每段都在 600 行以内 —— 整块塞进一个模板字符串有 2100 行，
  // 单独看不清结构。内联时按顺序拼回同一个模板字符串，产物与拆分前完全一致。
  { 名: 'page-js-a', 槽: 'page', 占位: '/* __PAGE_JS_A_MODULE__ */', 源: 'page-js-a.js', 赋值式: true, 加工: 剥模板壳 },
  { 名: 'page-js-b', 槽: 'page', 占位: '/* __PAGE_JS_B_MODULE__ */', 源: 'page-js-b.js', 赋值式: true, 加工: 剥模板壳 },
  { 名: 'page-js-c', 槽: 'page', 占位: '/* __PAGE_JS_C_MODULE__ */', 源: 'page-js-c.js', 赋值式: true, 加工: 剥模板壳 },
  { 名: 'page-js-d', 槽: 'page', 占位: '/* __PAGE_JS_D_MODULE__ */', 源: 'page-js-d.js', 赋值式: true, 加工: 剥模板壳 },
  {
    名: 'panel',
    占位: '/* __PANEL_MODULE__ */',
    源: 'panel.js',
    赋值式: true,
    加工: 剥模板壳,   // 管理面板脚本同样是 HTML 模板片段，只取内容拼进外层模板
    // 锚点必须唯一：`<html lang="...">` 这行在首页模板里也有一份，一字不差。
    // 所以除了锚串，还要指定取第几次出现——面板那份排在首页那份之后。
    锚起: '<html lang="${语言值}" dir="${是否值236 ?',
    锚止: 'var 本地值20198 = false;',
    锚序: 2,
  },
];

// 同一个槽里的多个模块按顺序拼进一个模板字符串。槽起/槽止用来在"主文件已内联"
// 时把整块还原回占位——只靠逐段匹配会失败：段内容一旦在 src 侧改过就对不上了。
const 槽表 = {
  page: {
    起: '  const 值页面 = `',
    // 不能只用 `` `; `` 当止点——模板内部可能出现同样的两字符，会切错位置。
    // 用整块模板唯一的收尾串来定界。
    止: '</html>`;',
    成员: ['page-css', 'page-html', 'page-js-a', 'page-js-b', 'page-js-c', 'page-js-d'],
  },
};

/** 主文件已经内联过某个槽时，把整块换回占位串 */
function 还原槽(主, 槽名) {
  const 槽 = 槽表[槽名];
  const 起位 = 主.indexOf(槽.起);
  if (起位 === -1) return 主;
  const 止位 = 主.indexOf(槽.止, 起位 + 槽.起.length);
  if (止位 === -1) return 主;
  const 占位串 = 槽.成员
    .map(n => 模块表.find(m => m.名 === n).占位)
    .join('');
  return 主.slice(0, 起位 + 槽.起.length) + 占位串 + 主.slice(止位);
}

// 多个赋值式模块拼进同一个模板字符串时的连接顺序。
// 每个片段剥掉外壳后是纯文本（不含反引号），拼接时直接相邻即可。
const 页拼接 = ['page-css', 'page-html', 'page-js-a', 'page-js-b', 'page-js-c', 'page-js-d'];

function 读模块(名) {
  const p = path.join(根, 'src', 名);
  if (!fs.existsSync(p)) throw new Error(`缺少模块源文件 src/${名}`);
  return fs.readFileSync(p, 'utf8').replace(/\s+$/, '');
}

function 转义正则(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 国家码映射：从单一真源 docs/country-codes.json 注入，三处共用同一份表 */
function 注入国家码(模块源码) {
  const json路径 = path.join(根, 'docs', 'country-codes.json');
  const 表 = JSON.parse(fs.readFileSync(json路径, 'utf8'));
  const 字面 = Object.entries(表)
    .map(([k, v]) => `  ${JSON.stringify(k)}: '${v}'`).join(',\n');
  const 正则 = /const 公共节点国家码映射 = \{[\s\S]*?\n\};/;
  if (!正则.test(模块源码)) throw new Error('模块里找不到 公共节点国家码映射，无法注入');
  return 模块源码.replace(正则, `const 公共节点国家码映射 = {\n${字面}\n};`);
}

/**
 * 剥掉 `const X = <值>;` 的外壳，只留值本身。
 * 不能用 `([\s\S]*);` 贪到行尾——值内部的每条 key/value 都以 `;` 或 `,` 结尾，
 * 贪婪匹配会把 `{ ... }` 的花括号一起吃掉。改用括号计数找值真正的结束位置。
 */
function 剥声明(模块源码) {
  const 代码 = 模块源码.split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
  const 等号 = 代码.match(/^\s*const\s+[^\s=]+\s*=\s*/);
  if (!等号) throw new Error('src 模块里找不到顶层的 const 声明');
  const 起点 = 等号[0].length;
  const 首字符 = 代码[起点];
  const 配对 = { '{': '}', '`': '`', '[': ']' }[首字符];
  if (!配对) throw new Error(`不认识的值形态：${首字符}`);
  if (首字符 === '`') {
    // 模板字符串内部可能还有 ${`...`} 嵌套，按"最后一个以 `; 收尾的位置"取值更可靠
    const 收尾 = 代码.lastIndexOf('`;');
    if (收尾 < 起点) throw new Error('src 模块里的模板字符串没有闭合');
    return 代码.slice(起点, 收尾 + 1);
  }
  let 深度 = 0;
  for (let i = 起点; i < 代码.length; i++) {
    const c = 代码[i];
    if (c === '\\') { i++; continue; }               // 跳过转义字符
    if (c === 首字符) 深度++;
    else if (c === 配对) {
      深度--;
      if (深度 === 0) return 代码.slice(起点, i + 1);
    }
  }
  throw new Error('src 模块里的值没有闭合');
}

/**
 * 剥掉模板字面量的反引号外壳，只留模板内容。
 * 用于"多个片段拼进同一个模板字符串"的场景——每个片段自带反引号的话，
 * 拼出来会是 `a``b``c` 这种语法错误。
 */
function 剥模板壳(模块源码) {
  const 值 = 剥声明(模块源码);
  if (!值.startsWith('`') || !值.endsWith('`')) {
    throw new Error('src 模块不是模板字面量，无法用 剥模板壳');
  }
  return 值.slice(1, -1);
}

/** 取模块期望的内联正文列表（一个模块可能占多段） */
function 期望片段(模块) {
  const 正文 = 模块.加工 ? 模块.加工(读模块(模块.源)) : 读模块(模块.源);
  const 分隔 = new RegExp('^' + 转义正则(片段分隔符) + '$', 'm');
  return 正文.split(分隔).map(x => x.trim()).filter(x => x);
}

/** 把单个模块内联进主文件 */
function 内联一个(主, 模块, 片段列表) {
  if (!主.includes(模块.占位)) {
    if (模块.赋值式) {
      // 赋值式没有边界注释。优先按首末行锚点还原（最稳，内容改过也对得上），
      // 锚点不够时才退回逐段匹配。
      if (模块.锚起 && 模块.锚止
          && 主.includes(模块.锚起) && 主.includes(模块.锚止)) {
        // 锚串可能在正文里出现多次（首页和面板的 <html> 头一字不差），
        // 用 锚序 指定取第几次出现，避免切到另一份模板上。
        let 起 = -1;
        for (let k = 0; k < (模块.锚序 || 1); k++) {
          起 = 主.indexOf(模块.锚起, 起 + 1);
          if (起 === -1) break;
        }
        const 止 = 起 === -1 ? -1 : 主.indexOf(模块.锚止, 起);
        if (起 !== -1 && 止 !== -1 && 止 > 起) {
          主 = 主.slice(0, 起) + 模块.占位 + 主.slice(止 + 模块.锚止.length);
        }
      }
      if (!主.includes(模块.占位)) {
        for (const 段 of 片段列表) {
          if (主.includes(段)) 主 = 主.replace(段, () => 模块.占位);
        }
      }
      if (!主.includes(模块.占位)) return null;
    } else {
      if (!(主.includes(模块.开始) && 主.includes(模块.结束))) return null;
      // 已内联：先还原成占位，再走同一条路径，保证重复构建幂等
      主 = 主.replace(
        new RegExp(转义正则(模块.开始) + '[\\s\\S]*?' + 转义正则(模块.结束), 'g'),
        () => 模块.占位);
    }
  }
  let 序号 = 0;
  return 主.replace(new RegExp(转义正则(模块.占位), 'g'), () => {
    const 正文 = 片段列表[序号++] || '';
    // 赋值式不能插边界注释，会破坏语法
    return 模块.赋值式 ? 正文 : 模块.开始 + '\n' + 正文 + '\n' + 模块.结束;
  });
}

/** 从主文件里取出某模块当前内联的各段正文（没内联则 null） */
function 读内联片段(主, 模块) {
  if (主.includes(模块.占位)) return null;
  const 片段 = [];
  let 位置 = 0;
  for (; ;) {
    const 起 = 主.indexOf(模块.开始, 位置);
    if (起 === -1) break;
    const 止 = 主.indexOf(模块.结束, 起);
    if (止 === -1) break;
    片段.push(主.slice(起 + 模块.开始.length, 止).trim());
    位置 = 止 + 模块.结束.length;
  }
  return 片段.length ? 片段 : null;
}

function 构建() {
  let 主 = fs.readFileSync(主文件, 'utf8');
  // 先按槽整体还原，再逐模块内联 —— 这样重复构建一定幂等
  for (const 槽名 of Object.keys(槽表)) {
    const 成员 = 槽表[槽名].成员.map(n => 模块表.find(m => m.名 === n));
    if (成员.every(m => !主.includes(m.占位))) 主 = 还原槽(主, 槽名);
  }
  for (const 模块 of 模块表) {
    const 结果 = 内联一个(主, 模块, 期望片段(模块));
    if (结果 === null) {
      console.error(`❌ ${模块.名}：明文源吗 里找不到占位标记 ${模块.占位}`);
      return false;
    }
    主 = 结果;
  }
  fs.writeFileSync(主文件, 主);
  const 条数 = Object.keys(JSON.parse(
    fs.readFileSync(path.join(根, 'docs', 'country-codes.json'), 'utf8'))).length;
  console.log(`✅ 已内联 ${模块表.map(m => 'src/' + m.源).join(' + ')}`
    + ` → 明文源吗（${主.split('\n').length} 行，国家码 ${条数} 条）`);
  return true;
}

/**
 * 检查产物是否漂移。
 * 不能只看占位标记在不在——src 改了但没重新构建时，标记早被替换掉了。
 * 赋值式模块没有边界注释可反解，改为直接比对 src 正文是否出现在主文件里。
 */
function 检查是否漂移() {
  const 主 = fs.readFileSync(主文件, 'utf8');
  let 漂移 = false;
  for (const 模块 of 模块表) {
    const 期望 = 期望片段(模块);
    if (模块.赋值式) {
      const 缺段 = 期望.filter(段 => !主.includes(段));
      if (缺段.length) {
        console.error(`❌ ${模块.名}：src/${模块.源} 的内容没内联进 明文源吗，请跑 node tools/build.js`);
        漂移 = true;
      } else {
        console.log(`✅ ${模块.名} 模块与 src/${模块.源} 一致`);
      }
      continue;
    }
    const 内联 = 读内联片段(主, 模块);
    if (内联 === null) {
      console.error(`❌ ${模块.名}：明文源吗 里没有该模块，没跑过 node tools/build.js`);
      漂移 = true;
      continue;
    }
    if (内联.length !== 期望.length) {
      console.error(`❌ ${模块.名} 段数不符：产物 ${内联.length} / src ${期望.length}`);
      漂移 = true;
      continue;
    }
    let 有差异 = false;
    for (let n = 0; n < 期望.length; n++) {
      if (内联[n] === 期望[n]) continue;
      const a = 内联[n].split('\n');
      const b = 期望[n].split('\n');
      let 行号 = -1;
      for (let i = 0; i < Math.max(a.length, b.length); i++) {
        if (a[i] !== b[i]) { 行号 = i + 1; break; }
      }
      console.error(`❌ ${模块.名} 第 ${n + 1} 段不一致（首个差异第 ${行号} 行）`);
      console.error(`   产物: ${(a[行号 - 1] || '(无此行)').slice(0, 70)}`);
      console.error(`   src : ${(b[行号 - 1] || '(无此行)').slice(0, 70)}`);
      有差异 = true;
    }
    if (有差异) 漂移 = true;
    else console.log(`✅ ${模块.名} 模块与 src/${模块.源} 一致（${期望.length} 段）`);
  }
  return 漂移;
}

/**
 * 把主文件还原成占位版（开发时用）。
 * 赋值式模块反解不出来，所以直接从 git 里的占位版重新导出不可行时，
 * 这个命令会用 src 反向重建：把内联块整段删掉再插回占位。
 */
function 还原占位() {
  let 主 = fs.readFileSync(主文件, 'utf8');
  for (const 模块 of 模块表) {
    if (模块.赋值式) {
      // 值形态：`const X = <值>;` —— 把 <值> 换成占位
      const 片段 = 期望片段(模块);
      let 序号 = 0;
      for (const 段 of 片段) {
        if (!主.includes(段)) { 序号++; continue; }
        主 = 主.replace(段, () => 模块.占位);
        序号++;
      }
    } else {
      if (!(主.includes(模块.开始) && 主.includes(模块.结束))) continue;
      主 = 主.replace(
        new RegExp(转义正则(模块.开始) + '[\\s\\S]*?' + 转义正则(模块.结束), 'g'),
        () => 模块.占位);
    }
  }
  fs.writeFileSync(主文件, 主);
  console.log(`✅ 已还原为占位版（${主.split('\n').length} 行）`);
}

const 模式 = process.argv[2];
if (模式 === '--占位') {
  还原占位();
  process.exit(0);
}
if (模式 === '--check') {
  process.exit(检查是否漂移() ? 1 : 0);
} else if (模式 && 模式 !== 'build') {
  console.error('用法: node tools/build.js [--check]');
  process.exit(2);
} else {
  process.exit(构建() ? 0 : 1);
}
