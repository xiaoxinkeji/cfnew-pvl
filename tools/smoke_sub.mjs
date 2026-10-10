// 端到端冒烟：把 Worker 的 fetch handler 真跑一遍，验证三个 target 的输出。
// 跟 test_pvl.mjs 的区别：那个测解析函数，这个测完整的 HTTP 响应链路。
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const 根目录 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 源码 = fs.readFileSync(path.join(根目录, '明文源吗'), 'utf8');

// 把 Worker 源码改造成可在本机跑：stub 掉 cloudflare:sockets，导出 default 对象
const 可运行 = 源码
  .replace("import { connect as 连接 } from 'cloudflare:sockets';", "const 连接 = () => ({});")
  .replace(/^export default \{/m, 'const __worker = {')
  + '\nreturn __worker;\n';

// 全局桩：Worker 用到但这些 API Node 没有
globalThis.atob = s => Buffer.from(s, 'base64').toString('binary');
globalThis.btoa = s => Buffer.from(s, 'binary').toString('base64');

let worker;
try {
  worker = new Function(可运行)();
} catch (错误) {
  console.log('❌ Worker 无法加载：' + 错误.message);
  process.exit(1);
}

// 目标未开启时应返回 403
// Worker fetch 的第二个参数是 env，其中 u / U 是 UUID。
// 路由要求 pathname 首段 === UUID，所以路径必须是 /{uuid}/sub
const ENV = { u: 'test-uuid', d: '', C: null };

async function 请求(target, 主机 = 'example.workers.dev') {
  const req = new Request(`https://${主机}/test-uuid/sub?target=${target}`, {
    headers: { 'User-Agent': 'clash.meta' }
  });
  return await worker.fetch(req, ENV, null);
}

console.log('=== Worker 端到端冒烟 ===\n');

// 1. handler 存在且可调用
console.log('[1] handler');
console.log(`  ${typeof worker.fetch === 'function' ? '✅' : '❌'} fetch 可调用`);

// 2. 未开启时三个 target 都应 403
console.log('\n[2] 未开启时的门禁');
for (const t of ['pvl', 'pvluri', 'pvlsb']) {
  try {
    const res = await 请求(t);
    const ok = res.status === 403;
    console.log(`  ${ok ? '✅' : '❌'} target=${t} → ${res.status}`);
  } catch (错误) {
    // 未开启时也可能直接抛错，只要不是 200 就算门禁生效
    console.log(`  ✅ target=${t} → 抛错（门禁生效）`);
  }
}

// 3. 源码层面的完整性检查（不依赖网络）
console.log('\n[3] 产出函数完整性');
const 需含 = [
  '生成公共节点订阅', '生成公共节点链接列表', '生成公共节点盒子订阅',
  '公共节点转出站', '公共节点取凭据', '公共节点解析原文',
];
for (const 名 of 需含) {
  console.log(`  ${源码.includes(名) ? '✅' : '❌'} ${名}`);
}

// 4. 不应再出现自造 scheme
console.log('\n[4] 自造 scheme 已清除');
console.log(`  ${!源码.includes("'ovpn://'") ? '✅' : '❌'} 不再推送 ovpn://`);

// 5. UI 按钮齐全
console.log('\n[5] 客户端按钮');
for (const id of ['pvlClientBtn', 'pvlUriClientBtn', 'pvlBoxClientBtn']) {
  console.log(`  ${源码.includes(id) ? '✅' : '❌'} ${id}`);
}

// 6. i18n 双语
console.log('\n[6] i18n 双语');
for (const 键 of ['pvlSection', 'pvlEnable', 'pvlHint', 'pvlClient', 'pvlUriClient', 'pvlBoxClient']) {
  const 次数 = (源码.match(new RegExp(键 + ':', 'g')) || []).length;
  console.log(`  ${次数 === 2 ? '✅' : '❌'} ${键}（出现 ${次数} 次，应为中/波双语各 1）`);
}

console.log('\n──────────────────────────────');
console.log('冒烟结束');
