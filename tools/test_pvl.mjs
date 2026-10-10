// 公共节点（pvl）逻辑离线验证：把 Worker 里的那几个函数抠出来，跑真实数据
// 用法：node tools/test_pvl.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const 根目录 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 源码 = fs.readFileSync(path.join(根目录, '明文源吗'), 'utf8');

// 把 Worker 里 pvl 相关的函数体抠出来单独 eval（Cloudflare 的 fetch/KV 走桩）
function 抽取(开始标记, 结束标记) {
  const 起点 = 源码.indexOf(开始标记);
  if (起点 === -1) throw new Error('没找到：' + 开始标记);
  const 终点 = 源码.indexOf(结束标记, 起点);
  if (终点 === -1) throw new Error('没找到结束：' + 结束标记);
  return 源码.slice(起点, 终点);
}

const 解码64定义 = `
function 解码64(文本) {
  const 二进制 = atob(文本);
  const 字节 = new Uint8Array(二进制.length);
  for (let i = 0; i < 二进制.length; i++) 字节[i] = 二进制.charCodeAt(i);
  return new TextDecoder().decode(字节);
}
`;

// 从「公共节点清单源」那一行一直截到「家宽链式」之前，包含全部 pvl 函数
const 模块源码 = 抽取('const 公共节点清单源', '// ======================= 家宽链式');

// 生成订阅要用到 自定义域名系统，桩一个
const 桩 = `
let 自定义域名系统 = 'https://223.5.5.5/dns-query';
`;

const 包装 = `
${解码64定义}
${桩}
${模块源码}
return {
  公共节点取指令, 公共节点取内联块, 公共节点解析原文, 公共节点筛选,
  公共节点国家码, 公共节点转节点行, 公共节点去重名, 公共节点缩进证书,
  生成公共节点订阅, 生成公共节点链接列表, 生成公共节点盒子订阅, 公共节点转出站, 公共节点取全部,
  set 自定义域名系统值(v) { 自定义域名系统 = v; },
  set 缓存(v) { 公共节点缓存 = v; },
  set 缓存时间(v) { 公共节点缓存时间 = v; },
  set 开放节点(v) { 公共节点缓存 = { 开放节点: v, 协议节点: [] }; },
  set 协议节点(v) { 公共节点缓存 = { 开放节点: [], 协议节点: v }; },
  get 配置() { return { 公共节点最低速度, 公共节点最高延迟, 公共节点取数上限, 公共节点国家过滤, 公共节点只取协议 }; }
};
`;

const 模块 = new Function(包装)();

// ---------------------------------------------------------------- 测试数据

const 真实配置 = `# Downloaded from https://ipspeed.info
ignore-unknown-option data-ciphers
data-ciphers AES-128-GCM:AES-128-CBC
dev tun
proto tcp
remote 106.136.100.245 1946
cipher AES-128-CBC
data-ciphers AES-128-CBC
auth SHA1
resolv-retry infinite
nobind
persist-key
persist-tun
client
verb 3
<ca>
-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw
TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh
cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4
-----END CERTIFICATE-----
</ca>
<cert>
-----BEGIN CERTIFICATE-----
MIIBZzCCAQ2gAwIBAgIRAOQpGfQ0PwWJKxTLnKfzHnUwCgYIKoZIzj0EAwIwOjES
-----END CERTIFICATE-----
</cert>
<key>
-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgAAAAAAAAAAAAAAAA
-----END PRIVATE KEY-----
</key>
`;

const 清单样本 = [
  { id: 1, active: true, downloadable: true, country: 'japan', ip: '1.1.1.1', port: 1946, proto: 'tcp', checkerMeasuredThroughputMbps: 5.2, checkerMeasuredTunnelRttMs: 200 },
  { id: 2, active: true, downloadable: true, country: 'south-korea', ip: '2.2.2.2', port: 995, proto: 'tcp', checkerMeasuredThroughputMbps: 9.1, checkerMeasuredTunnelRttMs: 150 },
  { id: 3, active: false, downloadable: false, country: 'usa', ip: '3.3.3.3', port: 443, proto: 'tcp', checkerMeasuredThroughputMbps: 99, checkerMeasuredTunnelRttMs: 10 },
  { id: 4, active: true, downloadable: true, country: 'usa', ip: '4.4.4.4', port: 1195, proto: 'udp', checkerMeasuredThroughputMbps: 0.4, checkerMeasuredTunnelRttMs: 800 },
  { id: 5, active: true, downloadable: true, country: 'germany', ip: '5.5.5.5', port: 443, proto: 'tcp', checkerMeasuredThroughputMbps: 7.7, checkerMeasuredTunnelRttMs: 120 },
];

const 协议样本 = [
  { 协议: 'vless', 编号: 'a'.repeat(64), 链接: 'vless://814bd064-544d-4255-a070-5705c03f6da9@3.39.4.109:13672?flow=xtls-rprx-vision&fp=chrome&pbk=k2hPp0tTW0Da-HK94wYpSCLbuK44LfGqC2MSJIM1Ti0&security=reality&sid=48050fab&sni=www.apple.com&type=raw#vless-1104491030' },
  { 协议: 'trojan', 编号: 'b'.repeat(64), 链接: 'trojan://password@1.2.3.4:443?security=tls&sni=example.com&type=ws&path=%2Fws#trojan-01' },
  { 协议: 'shadowsocks', 编号: 'c'.repeat(64), 链接: 'ss://' + Buffer.from('chacha20-ietf-poly1305:pass123').toString('base64').replace(/=+$/, '') + '@5.6.7.8:8388#ss-01' },
  { 协议: 'hysteria2', 编号: 'd'.repeat(64), 链接: 'hysteria2://mypassword@9.9.9.9:443?sni=hy.example.com&insecure=1#hy2-01' },
];

// VMess 是 base64 JSON，构造一个真的
const vmess对象 = { v: '2', ps: 'vmess-01', add: '7.7.7.7', port: '443', id: 'b831381d-6324-4d53-ad4f-8cda48b30811', aid: '0', scy: 'auto', net: 'ws', type: 'none', host: 'ws.example.com', path: '/vmess', tls: 'tls', sni: 'vmess.example.com' };
协议样本.push({ 协议: 'vmess', 编号: 'e'.repeat(64), 链接: 'vmess://' + Buffer.from(JSON.stringify(vmess对象)).toString('base64').replace(/=+$/, '') + '#vmess-01' });

let 通过 = 0;
let 失败 = 0;

function 断言(名称, 条件, 详情 = '') {
  if (条件) {
    通过++;
    console.log('  ✅ ' + 名称);
  } else {
    失败++;
    console.log('  ❌ ' + 名称 + (详情 ? ' — ' + 详情 : ''));
  }
}

// ---------------------------------------------------------------- 1. .ovpn 解析
console.log('\n[1] .ovpn 配置解析');
const 解析 = 模块.公共节点解析原文(真实配置);
断言('remote 主机正确', 解析 && 解析.地址 === '106.136.100.245', 解析 && 解析.地址);
断言('端口正确', 解析 && 解析.端口 === 1946, 解析 && String(解析.端口));
断言('协议正确', 解析 && 解析.协议 === 'tcp');
断言('加密套件正确', 解析 && 解析.加密 === 'AES-128-CBC');
断言('摘要正确', 解析 && 解析.摘要 === 'SHA1');
断言('CA 证书抽到', 解析 && 解析.证书.includes('BEGIN CERTIFICATE'));
断言('客户端证书抽到', 解析 && 解析.公钥.includes('BEGIN CERTIFICATE'));
断言('私钥抽到', 解析 && 解析.私钥.includes('BEGIN PRIVATE KEY'));

// ---------------------------------------------------------------- 2. 清单筛选
console.log('\n[2] 清单筛选与排序');
const 选中 = 模块.公共节点筛选(清单样本);
断言('剔掉 inactive', 选中.every(行 => 行.active && 行.downloadable), JSON.stringify(选中.map(r => r.id)));
断言('按速度倒序', 选中[0].id === 2 && 选中[1].id === 5 && 选中[2].id === 1,
  JSON.stringify(选中.map(r => r.id)));

// ---------------------------------------------------------------- 3. 国家码
console.log('\n[3] 国家 slug -> 两字母码');
断言('japan -> JP', 模块.公共节点国家码('japan') === 'JP');
断言('south-korea -> KR', 模块.公共节点国家码('south-korea') === 'KR');
断言('united-states -> US', 模块.公共节点国家码('united-states') === 'US');
断言('未知国家回退', 模块.公共节点国家码('zzz-land') === 'ZZ', 模块.公共节点国家码('zzz-land'));
断言('空值不崩', 模块.公共节点国家码('') === 'XX');

// ---------------------------------------------------------------- 4. share URI -> Clash 节点行
console.log('\n[4] share URI 转 Clash 节点行');
for (const 项 of 协议样本) {
  const 行 = 模块.公共节点转节点行(项.协议, '⚡ ' + 项.协议.toUpperCase() + '-01', 项.链接);
  const 文本 = 行.join('\n');
  const 有类型 = 行.some(l => /^    type: /.test(l));
  const 有地址 = 行.some(l => /^    server: \S/.test(l));
  const 有端口 = 行.some(l => /^    port: [1-9]/.test(l));
  断言(项.协议 + ' 输出非空且含 type/server/port', 行.length > 2 && 有类型 && 有地址 && 有端口,
    JSON.stringify(行));
  console.log('     ── ' + 项.协议 + ' ──');
  console.log(行.map(l => '        ' + l).join('\n'));
}

// 具体字段校验
const vless行 = 模块.公共节点转节点行('vless', 'T', 协议样本[0].链接).join('\n');
断言('VLESS REALITY 出 public-key', vless行.includes('public-key: k2hPp0tTW0Da-HK94wYpSCLbuK44LfGqC2MSJIM1Ti0'));
断言('VLESS 出 short-id', vless行.includes('short-id: 48050fab'));
断言('VLESS 出 servername', vless行.includes('servername: www.apple.com'));
断言('VLESS 出 flow', vless行.includes('flow: xtls-rprx-vision'));

const hy行 = 模块.公共节点转节点行('hysteria2', 'T', 协议样本[3].链接).join('\n');
断言('Hysteria2 密码', hy行.includes('password: "mypassword"'));
断言('Hysteria2 SNI', hy行.includes('sni: hy.example.com'));

const ss行 = 模块.公共节点转节点行('shadowsocks', 'T', 协议样本[2].链接).join('\n');
断言('SS 解密出方法', ss行.includes('cipher: chacha20-ietf-poly1305'), ss行);
断言('SS 解密出密码', ss行.includes('password: "pass123"'));

const vmess行 = 模块.公共节点转节点行('vmess', 'T', 协议样本[4].链接).join('\n');
断言('VMess 地址', vmess行.includes('server: 7.7.7.7'));
断言('VMess UUID', vmess行.includes('uuid: b831381d-6324-4d53-ad4f-8cda48b30811'));
断言('VMess ws path', vmess行.includes('path: /vmess'));

// ---------------------------------------------------------------- 5. 整体订阅生成
console.log('\n[5] Clash 订阅整体生成');
模块.缓存 = null;
模块.缓存时间 = 0;
// 直接灌缓存并盖上时间戳，让它命中缓存而不是去联网
const 开放节点 = 模块.公共节点筛选(清单样本).map(行 => ({ 行, 解析: 模块.公共节点解析原文(真实配置) }));
开放节点[0].解析.地址 = '1.1.1.1';
开放节点[1].解析.地址 = '2.2.2.2';
开放节点[2].解析.地址 = '5.5.5.5';
模块.缓存 = { 开放节点, 协议节点: 协议样本, 时间: Date.now() };
模块.缓存时间 = Date.now();

const 订阅 = await 模块.生成公共节点订阅();
断言('订阅非空', 订阅.length > 500, String(订阅.length));
断言('含 proxies 段', 订阅.includes('proxies:'));
断言('含 proxy-groups 段', 订阅.includes('proxy-groups:'));
断言('含 rules 段', 订阅.includes('rules:'));
断言('含 OpenVPN 分组', 订阅.includes('🏠 公共 OpenVPN'));
断言('含 VLESS 分组', 订阅.includes('⚡ VLESS'));
断言('证书锚点只出现在第一个', (订阅.match(/ca: &pvlca/g) || []).length === 1,
  String((订阅.match(/ca: &pvlca/g) || []).length));
断言('后续节点用锚点引用', 订阅.includes('ca: *pvlca'));
断言('含自动回落组', 订阅.includes('♻️ 公共自动'));
断言('含节点选择组', 订阅.includes('🚀 节点选择'));

// YAML 结构合理性：缩进必须是 2 空格的倍数，且没有 Tab
const 有Tab = /\t/.test(订阅);
断言('无 Tab 缩进', !有Tab);

// ---------------------------------------------------------------- 6. URI 订阅
console.log('\n[6] 纯 URI 订阅');
const 链接列表 = await 模块.生成公共节点链接列表();
断言('协议 URI 原样输出', 链接列表.some(l => l.startsWith('vless://')), JSON.stringify(链接列表.slice(0, 2)));
// ovpn:// 是自造 scheme，没有任何客户端认得，必须不再出现
断言('不再出自造的 ovpn:// scheme', !链接列表.some(l => l.startsWith('ovpn://')),
  JSON.stringify(链接列表.filter(l => l.startsWith('ovpn://'))[0] || ''));
断言('只出客户端能导入的协议', 链接列表.every(l =>
  /^(vless|trojan|vmess|ss|hysteria2):\/\//.test(l) || l.startsWith('#')),
  JSON.stringify(链接列表.filter(l => !/^(vless|trojan|vmess|ss|hysteria2):\/\//.test(l) && !l.startsWith('#'))));

// ---------------------------------------------------------------- 6b. sing-box 订阅
console.log('\n[6b] sing-box 订阅');
const 盒子订阅 = await 模块.生成公共节点盒子订阅();
let 盒子对象 = null;
try { 盒子对象 = JSON.parse(盒子订阅); } catch (错误) { /* 下面断言会报出来 */ }
断言('是合法 JSON', 盒子对象 !== null);
if (盒子对象) {
  const 出站 = 盒子对象.outbounds || [];
  断言('含 urltest 自动组', 出站.some(o => o.type === 'urltest' && o.tag === 'auto'));
  断言('含 selector 选择组', 出站.some(o => o.type === 'selector' && o.tag === 'select'));
  断言('含 direct 出站', 出站.some(o => o.type === 'direct'));
  const 协议的 = 出站.filter(o => ['vless', 'trojan', 'vmess', 'shadowsocks', 'hysteria2'].includes(o.type));
  断言('五种协议都有出站', 协议的.length >= 5, String(协议的.length));
  const vless出站 = 出站.find(o => o.type === 'vless');
  断言('VLESS REALITY 公钥', vless出站 && vless出站.tls && vless出站.tls.reality &&
    vless出站.tls.reality.public_key === 'k2hPp0tTW0Da-HK94wYpSCLbuK44LfGqC2MSJIM1Ti0',
    JSON.stringify(vless出站 && vless出站.tls && vless出站.tls.reality));
  断言('VLESS REALITY short_id', vless出站 && vless出站.tls.reality.short_id === '48050fab');
  断言('VLESS utls 指纹', vless出站 && vless出站.tls.utls.fingerprint === 'chrome');
  断言('VLESS flow', vless出站 && vless出站.flow === 'xtls-rprx-vision');
  断言('不出 openvpn 类型（sing-box 无此出站）', !出站.some(o => o.type === 'openvpn'));
  断言('tag 不重复', new Set(出站.map(o => o.tag)).size === 出站.length);
  const hy出站 = 出站.find(o => o.type === 'hysteria2');
  断言('Hysteria2 insecure 布尔归一', hy出站 && hy出站.tls && hy出站.tls.insecure === true,
    JSON.stringify(hy出站));
  console.log('     ── 出站样例 ──');
  console.log('        ' + JSON.stringify(出站.find(o => o.type === 'vless')));
}

// ---------------------------------------------------------------- 6c. 凭据解析
console.log('\n[6c] OpenVPN 凭据解析');
const 带凭据 = 真实配置 + 'auth-user-pass\n';
const 带内联凭据 = 真实配置 + 'auth-user-pass myuser mypass\n';
断言('无凭据时退回 vpn/vpn',
  (() => { const r = 模块.公共节点解析原文(带凭据); return r.用户名 === 'vpn' && r.密码 === 'vpn'; })());
断言('内联凭据被读出',
  (() => { const r = 模块.公共节点解析原文(带内联凭据); return r.用户名 === 'myuser' && r.密码 === 'mypass'; })(),
  JSON.stringify(模块.公共节点解析原文(带内联凭据)));

// ---------------------------------------------------------------- 7. 异常输入
console.log('\n[7] 异常输入不崩');
断言('空配置返回 null', 模块.公共节点解析原文('') === null);
断言('无 remote 返回 null', 模块.公共节点解析原文('client\ndev tun\n') === null);
断言('坏 VMess 返回空行', 模块.公共节点转节点行('vmess', 'T', 'vmess://!!!!').length === 0);
断言('未知协议返回空行', 模块.公共节点转节点行('wireguard', 'T', 'wireguard://x').length === 0);
断言('空清单筛选不崩', Array.isArray(模块.公共节点筛选([])));
断言('缺字段行不崩', Array.isArray(模块.公共节点筛选([{ active: true, downloadable: true }])));

// ---------------------------------------------------------------- 汇总
console.log('\n──────────────────────────────');
console.log('通过 ' + 通过 + ' / 失败 ' + 失败);
console.log('\n生成的订阅前 40 行：');
console.log(订阅.split('\n').slice(0, 40).map(l => '  ' + l).join('\n'));

process.exit(失败 ? 1 : 0);
