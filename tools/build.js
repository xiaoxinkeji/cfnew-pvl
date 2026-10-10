#!/usr/bin/env node
/**
 * 把 src/ 下的模块内联进 明文源吗，产出可部署的单文件。
 *
 * 为什么这么绕：Cloudflare Worker 部署要的是单文件（粘贴到控制台就能跑），
 * 但一万行的单文件没法维护。所以——
 *   - 源码：src/pvl.js 独立可读，明文源吗 里只留一行占位标记
 *   - 产物：本脚本把 src 内联回 明文源吗，它仍然是一个可以直接部署的单文件
 *
 * 用法：
 *   node tools/build.js          # 构建（把 src 内联进 明文源吗）
 *   node tools/build.js --check  # 只检查产物是否过期，不改文件（CI 用）
 */

const fs = require('fs');
const path = require('path');

const 根 = path.resolve(__dirname, '..');
const 主文件 = path.join(根, '明文源吗');
const 占位 = '/* __PVL_MODULE__ */';

function 读模块(名) {
  const p = path.join(根, 'src', 名);
  if (!fs.existsSync(p)) throw new Error(`缺少模块源文件 src/${名}`);
  return fs.readFileSync(p, 'utf8').replace(/\s+$/, '');
}

const 开始标记 = '// ↓↓↓ 公共节点模块由 tools/build.js 从 src/pvl.js 内联而来，不要直接改这块 ↓↓↓';
const 结束标记 = '// ↑↑↑ 公共节点模块结束 ↑↑↑';

/** 国家码映射：从单一真源 docs/country-codes.json 注入，三处共用一份表 */
function 注入国家码(模块源码) {
  const json路径 = path.join(根, 'docs', 'country-codes.json');
  const 表 = JSON.parse(fs.readFileSync(json路径, 'utf8'));
  const 字面 = Object.entries(表)
    .map(([k, v]) => `  ${JSON.stringify(k)}: '${v}'`).join(',\n');
  const 正则 = /const 公共节点国家码映射 = \{[\s\S]*?\n\};/;
  if (!正则.test(模块源码)) throw new Error('模块里找不到 公共节点国家码映射，无法注入');
  return 模块源码.replace(正则,
    `const 公共节点国家码映射 = {\n${字面}\n};`);
}

function 构建() {
  let 主 = fs.readFileSync(主文件, 'utf8');
  const 模块 = 注入国家码(读模块('pvl.js'));

  // 三种状态：① 占位版（直接替换）② 已内联（先还原成占位再替换）③ 都没有 → 报错
  // 三条分支都必须产出完整的「开始标记 + 模块 + 结束标记」，否则 --check 认不出来
  if (主.includes(占位)) {
    主 = 主.replace(占位, () => 模块 + '\n' + 结束标记);
  } else if (主.includes(开始标记) && 主.includes(结束标记)) {
    const 起 = 主.indexOf(开始标记);
    const 止 = 主.indexOf(结束标记) + 结束标记.length;
    主 = 主.slice(0, 起) + 开始标记 + '\n' + 模块 + '\n' + 结束标记 + 主.slice(止);
  } else {
    console.error('❌ 明文源吗 里既没有占位标记也没有模块边界注释，无法构建');
    return false;
  }
  fs.writeFileSync(主文件, 主);
  console.log(`✅ 已内联 src/pvl.js → 明文源吗（${主.split('\n').length} 行，国家码 ${Object.keys(JSON.parse(fs.readFileSync(path.join(根, 'docs', 'country-codes.json'), 'utf8'))).length} 条）`);
  return true;
}

/** 从主文件里取出当前内联的模块正文（没有则 null） */
function 读内联模块(主) {
  if (主.includes(占位)) return null;               // 还没构建
  const 起 = 主.indexOf(开始标记);
  const 止 = 主.indexOf(结束标记);
  if (起 === -1 || 止 === -1) return null;
  return 主.slice(起 + 开始标记.length, 止).trim();
}

/**
 * 检查产物是否过期。
 * 不能只看占位标记在不在——src 改了但没重新构建时，标记早被替换掉了，
 * 那样会误判成"最新"。真正要比的是：内联进去的那份，跟 src 现在的这份是否一致。
 */
function 检查是否过期() {
  const 主 = fs.readFileSync(主文件, 'utf8');
  const 内联 = 读内联模块(主);
  if (内联 === null) {
    console.error('❌ 明文源吗 里没有内联模块，没跑过 node tools/build.js');
    return true;
  }
  const 期望 = 注入国家码(读模块('pvl.js')).trim();
  if (内联 === 期望) {
    console.log('✅ 内联产物与 src/pvl.js 一致');
    return false;
  }
  // 定位第一处差异，方便排查
  const a = 内联.split('\n');
  const b = 期望.split('\n');
  let 行号 = -1;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) { 行号 = i + 1; break; }
  }
  console.error(`❌ 内联产物与 src/pvl.js 不一致（首个差异在第 ${行号} 行），请跑 node tools/build.js`);
  console.error(`   产物: ${(a[行号 - 1] || '(无此行)').slice(0, 80)}`);
  console.error(`   src : ${(b[行号 - 1] || '(无此行)').slice(0, 80)}`);
  return true;
}

const 模式 = process.argv[2];
if (模式 === '--check') {
  process.exit(检查是否过期() ? 1 : 0);
} else if (模式 && 模式 !== 'build') {
  console.error('用法: node tools/build.js [--check]');
  process.exit(2);
} else {
  构建();
}
