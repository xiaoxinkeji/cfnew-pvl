// 公共节点（PublicVPNList）模块源码。
// 这个文件不直接部署——tools/build.js 会把它内联进 明文源吗（部署必须是单文件）。
// 单独放这里是为了让模块能独立阅读、独立评审，不再淹没在万行主文件里。
// 改完记得跑 node tools/build.js。

// 之前家宽链式要自己搭节点、还要靠 VPN Gate 的志愿者共享，掉线是常态。
// 这里换成直接吃 PublicVPNList 的全量检测清单：那边按小时实测吞吐/RTT，
// OpenVPN 走清单 + get_token.php 换 .ovpn，多协议走 download.php 直接拿 share URI。
// 跟家宽链式的区别：不做链式，节点原样直出，出口就是节点自己的 IP，不套 CF 前置。
const 公共节点清单源 = 解码64('aHR0cHM6Ly9wdWJsaWN2cG5saXN0LmNvbS9sb2NhbC9hcGkvdnBuLWRhdGEucGhwP3N0YXR1cz1hbGw=');
const 公共节点令牌接口 = 解码64('aHR0cHM6Ly9wdWJsaWN2cG5saXN0LmNvbS9nZXRfdG9rZW4ucGhw');
const 公共节点下载接口 = 解码64('aHR0cHM6Ly9wdWJsaWN2cG5saXN0LmNvbS9kb3dubG9hZC5waHA=');
const 公共节点配置接口 = 解码64('aHR0cHM6Ly9wdWJsaWN2cG5saXN0LmNvbS9wcm90b2NvbHMvZG93bmxvYWQucGhw');
const 公共节点站点 = 解码64('aHR0cHM6Ly9wdWJsaWN2cG5saXN0LmNvbS8=');
// vless / trojan / vmess / shadowsocks / hysteria2 的列表页就是协议名小写
const 公共节点协议页 = ['vless', 'trojan', 'vmess', 'shadowsocks', 'hysteria2'];
const 公共节点协议方案 = { vless: 'vless', trojan: 'trojan', vmess: 'vmess', shadowsocks: 'ss', hysteria2: 'hysteria2' };
const 公共节点缓存期限 = 30 * 60 * 1000;
const 公共节点单页上限 = 100;
const 公共节点分页正则 = /rel="next nofollow"/;
// 单条 .ovpn 换一次令牌，全量几千条会打爆 Worker，所以只给最快的那批换原文
const 公共节点取原文上限 = 60;
// 列表页最多翻这么多页，防止 Worker 跑超时
const 公共节点翻页上限 = 6;

let 启用公共节点 = false;
let 公共节点清单网址 = '';
let 公共节点最低速度 = 0;
let 公共节点最高延迟 = 0;
let 公共节点取数上限 = 120;
let 公共节点国家过滤 = [];
let 公共节点只取协议 = [];
let 公共节点要原文 = true;
// 缓存的默认实现。它挂在 公共节点缓存存储.宿主 槽位上，模块里的函数只通过
// 公共节点缓存存储.读/写/清 三个转发方法访问——换实现（测试桩、将来的 KV）时
// 只要替换宿主，模块代码一行都不用改。
const 公共节点缓存默认实现 = {
  数据: null,
  时间: 0,
  读(期限) {
    return (this.数据 && Date.now() - this.时间 < 期限) ? this.数据 : null;
  },
  写(数据) {
    this.数据 = 数据;
    this.时间 = Date.now();
    return 数据;
  },
  清() {
    this.数据 = null;
    this.时间 = 0;
  }
};

// 可替换的缓存槽位：名字就是 公共节点缓存存储，且它自己就带 读/写/清
const 公共节点缓存存储 = {
  宿主: 公共节点缓存默认实现,
  读(期限) { return this.宿主.读(期限); },
  写(数据) { return this.宿主.写(数据); },
  清() { return this.宿主.清(); },
  换(实现) { this.宿主 = 实现 || 公共节点缓存默认实现; }
};

function 公共节点解析布尔(值, 默认 = false) {
  if (值 === undefined || 值 === null || 值 === '') return 默认;
  if (值 === true || 值 === false) return 值;
  const 文本 = String(值).trim().toLowerCase();
  if (['yes', 'true', '1', 'on'].includes(文本)) return true;
  if (['no', 'false', '0', 'off'].includes(文本)) return false;
  return 默认;
}

function 公共节点解析数字(值, 默认 = 0) {
  const 数字 = parseFloat(值);
  return Number.isFinite(数字) && 数字 >= 0 ? 数字 : 默认;
}

function 公共节点解析列表(值) {
  return String(值 || '').split(',').map(项 => 项.trim().toLowerCase()).filter(Boolean);
}

// 清单里的 country 是 slug（japan / south-korea），这里翻成两字母码给节点命名用
const 公共节点国家码映射 = {
  japan: 'JP', 'south-korea': 'KR', usa: 'US', 'united-states': 'US', russia: 'RU',
  thailand: 'TH', vietnam: 'VN', indonesia: 'ID', canada: 'CA', uk: 'GB',
  'united-kingdom': 'GB', argentina: 'AR', netherlands: 'NL', germany: 'DE',
  france: 'FR', singapore: 'SG', 'hong-kong': 'HK', taiwan: 'TW', india: 'IN',
  malaysia: 'MY', philippines: 'PH', australia: 'AU', brazil: 'BR', mexico: 'MX',
  spain: 'ES', italy: 'IT', poland: 'PL', sweden: 'SE', finland: 'FI',
  norway: 'NO', switzerland: 'CH', ukraine: 'UA', turkey: 'TR', iran: 'IR',
  'czech-republic': 'CZ', romania: 'RO', austria: 'AT', 'south-africa': 'ZA',
  'new-zealand': 'NZ', ireland: 'IE', belgium: 'BE', denmark: 'DK',
  hungary: 'HU', portugal: 'PT', greece: 'GR', israel: 'IL', estonia: 'EE',
  latvia: 'LV', lithuania: 'LT', bulgaria: 'BG', croatia: 'HR',
  kazakhstan: 'KZ', belarus: 'BY', 'united-arab-emirates': 'AE'
};

function 公共节点国家码(国别) {
  const 键 = String(国别 || '').toLowerCase();
  return 公共节点国家码映射[键] || (键 ? 键.slice(0, 2).toUpperCase() : 'XX');
}

// 配置原文是从令牌下载接口拿的完整 .ovpn 文本，不用解 base64，直接按行取指令
function 公共节点取指令(配置文本, 指令名) {
  const 命中 = 配置文本.match(new RegExp('^[ \\t]*' + 指令名 + '[ \\t]+(.+?)[ \\t]*$', 'm'));
  return 命中 ? 命中[1].trim() : '';
}

function 公共节点取内联块(配置文本, 标签) {
  const 命中 = 配置文本.match(new RegExp('<' + 标签 + '>([\\s\\S]*?)<\\/' + 标签 + '>'));
  return 命中 ? 命中[1].trim() : '';
}

// 一条配置换一次令牌（300 秒有效），拿到的是 .ovpn 原文
async function 公共节点取原文(编号) {
  try {
    const 令牌响应 = await fetch(公共节点令牌接口, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0',
        'Referer': 公共节点站点 + 'download/' + 编号 + '/'
      },
      body: 'id=' + encodeURIComponent(编号)
    });
    if (!令牌响应.ok) return null;
    const 令牌数据 = await 令牌响应.json();
    const 令牌 = 令牌数据 && 令牌数据.token;
    if (!令牌) return null;
    const 配置响应 = await fetch(公共节点下载接口 + '?token=' + encodeURIComponent(令牌), {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/x-openvpn-profile' }
    });
    if (!配置响应.ok) return null;
    const 文本 = await 配置响应.text();
    return 文本 && 文本.indexOf('remote ') !== -1 ? 文本 : null;
  } catch (错误) {
    return null;
  }
}

// auth-user-pass 后面可能直接跟"用户名 密码"（有些配置就写在文件里），
// 更常见的是不带参数、由客户端弹框问。后者只能退回公开节点通用的 vpn/vpn。
function 公共节点取凭据(配置文本) {
  const 指令 = 公共节点取指令(配置文本, 'auth-user-pass');
  const 段 = 指令.split(/\s+/).filter(Boolean);
  if (段.length >= 2) return [段[0], 段.slice(1).join(' ')];
  return ['vpn', 'vpn'];
}

function 公共节点解析原文(配置文本) {
  if (!配置文本) return null;
  const 远端 = 公共节点取指令(配置文本, 'remote').split(/\s+/);
  if (!远端[0]) return null;
  const 公共节点凭据 = 公共节点取凭据(配置文本);
  return {
    地址: 远端[0],
    端口: parseInt(远端[1], 10) || 1194,
    协议: (公共节点取指令(配置文本, 'proto') || 'tcp').toLowerCase(),
    加密: 公共节点取指令(配置文本, 'cipher') || 'AES-128-CBC',
    摘要: 公共节点取指令(配置文本, 'auth') || 'SHA1',
    用户名: 公共节点凭据[0],
    密码: 公共节点凭据[1],
    证书: 公共节点取内联块(配置文本, 'ca'),
    公钥: 公共节点取内联块(配置文本, 'cert'),
    私钥: 公共节点取内联块(配置文本, 'key'),
    原文: 配置文本
  };
}

// 一次拿全量清单（约 33MB，靠 cf 缓存顶住）
async function 公共节点取清单() {
  const 响应 = await fetch(公共节点清单网址 || 公共节点清单源, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json', 'Accept-Encoding': 'identity' },
    cf: { cacheTtl: 1800, cacheEverything: true }
  });
  if (!响应.ok) throw new Error('节点清单返回 ' + 响应.status);
  const 全部 = JSON.parse(await 响应.text());
  if (!Array.isArray(全部)) throw new Error('节点清单格式不对');
  return 全部;
}

function 公共节点筛选(全部) {
  const 国家集合 = 公共节点国家过滤.length ? new Set(公共节点国家过滤) : null;
  const 已见 = new Set();
  const 候选 = [];
  for (const 行 of 全部) {
    // 只要实测通过、能下配置的。清单里 4.5 万行大半是死的，全塞进来客户端会卡死
    if (!行.active || !行.downloadable) continue;
    const 国别 = String(行.country || '').toLowerCase();
    if (国家集合 && !国家集合.has(国别) && !国家集合.has(公共节点国家码(国别).toLowerCase())) continue;
    if (公共节点最低速度 && (行.checkerMeasuredThroughputMbps || 0) < 公共节点最低速度) continue;
    if (公共节点最高延迟 && (行.checkerMeasuredTunnelRttMs || 999999) > 公共节点最高延迟) continue;
    const 键 = (行.ip || 行.host) + ':' + 行.port;
    if (已见.has(键)) continue;
    已见.add(键);
    候选.push(行);
  }
  // 实测速度倒序，慢的沉底；速度一样按延迟排
  候选.sort((甲, 乙) => {
    const 差 = (乙.checkerMeasuredThroughputMbps || 0) - (甲.checkerMeasuredThroughputMbps || 0);
    if (差 !== 0) return 差;
    return (甲.checkerMeasuredTunnelRttMs || 999999) - (乙.checkerMeasuredTunnelRttMs || 999999);
  });
  return 公共节点取数上限 > 0 ? 候选.slice(0, 公共节点取数上限) : 候选;
}

// 多协议：翻列表页拿稳定 ID，再并发换 share URI
async function 公共节点取协议配置(协议, 上限) {
  const 结果 = [];
  const 已见 = new Set();
  const 编号正则 = /id=([a-f0-9]{64})/g;
  for (let 页 = 1; 页 <= 公共节点翻页上限; 页++) {
    const 网址 = 公共节点站点 + 协议 + '/?per_page=' + 公共节点单页上限 + (页 > 1 ? '&page=' + 页 : '');
    let 页面文本 = '';
    try {
      const 响应 = await fetch(网址, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' },
        cf: { cacheTtl: 600, cacheEverything: true }
      });
      if (!响应.ok) break;
      页面文本 = await 响应.text();
    } catch (错误) {
      break;
    }
    const 编号列表 = [];
    let 命中;
    编号正则.lastIndex = 0;
    while ((命中 = 编号正则.exec(页面文本)) !== null) {
      const 编号 = 命中[1];
      if (!已见.has(编号)) {
        已见.add(编号);
        编号列表.push(编号);
      }
    }
    if (!编号列表.length) break;
    // 并发换配置，单条失败就丢掉，不拖累整体
    const 批次 = await Promise.all(编号列表.map(async 编号 => {
      try {
        const 响应 = await fetch(公共节点配置接口 + '?protocol=' + 协议 + '&id=' + 编号 + '&format=json', {
          headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json', 'Referer': 网址 }
        });
        if (!响应.ok) return null;
        const 数据 = await 响应.json();
        const 链接 = 数据 && 数据.config_uri;
        if (!链接) return null;
        const 方案 = 公共节点协议方案[协议] || 协议;
        if (String(链接).toLowerCase().indexOf(方案 + '://') !== 0) return null;
        return { 协议, 编号, 链接 };
      } catch (错误) {
        return null;
      }
    }));
    for (const 项 of 批次) {
      if (!项) continue;
      结果.push(项);
      if (上限 > 0 && 结果.length >= 上限) return 结果;
    }
    if (!公共节点分页正则.test(页面文本)) break;
  }
  return 结果;
}

// ── 执行层：只做一件事，不调度、不缓存、不回报策略 ──

// 取 OpenVPN 节点：清单 → 筛选 → 只给最快那批换 .ovpn 原文。
// 换原文要一条一个令牌请求，全量做会拖超时，所以有取原文上限。
// 拿不到原文的节点直接丢掉——缺 ca/cert/key 的节点 Clash 必然导入失败。
async function 公共节点取开放节点() {
  const 清单 = await 公共节点取清单();
  if (!清单 || !清单.length) return [];
  const 选中 = 公共节点筛选(清单);
  if (!公共节点要原文) return [];
  const 要原文 = 选中.slice(0, 公共节点取原文上限);
  const 原文列表 = await Promise.all(要原文.map(行 => 公共节点取原文(行.id)));
  const 已见端点 = new Set();
  const 节点 = [];
  要原文.forEach((行, 下标) => {
    const 解析 = 公共节点解析原文(原文列表[下标]);
    if (!解析 || !解析.证书) return;
    const 键 = 解析.地址 + ':' + 解析.端口;
    if (已见端点.has(键)) return;
    已见端点.add(键);
    节点.push({ 行, 解析 });
  });
  return 节点;
}

// 取多协议节点：每种协议各自翻列表页拿 share URI，失败该种就空、不拖累别的。
async function 公共节点取协议节点() {
  const 协议清单 = 公共节点只取协议.length
    ? 公共节点协议页.filter(项 => 公共节点只取协议.includes(项))
    : 公共节点协议页.slice();
  const 结果 = await Promise.all(
    协议清单.map(协议 => 公共节点取协议配置(协议, 公共节点取数上限))
  );
  return 结果.filter(Array.isArray).flat();
}

// ── 编排层：唯一负责"什么时候调谁、失败怎么办、结果怎么合"的地方 ──

async function 公共节点取全部() {
  const 命中 = 公共节点缓存存储.读(公共节点缓存期限);
  if (命中) return 命中;

  const 要开放 = !公共节点只取协议.length || 公共节点只取协议.includes('openvpn');
  // 两条路线并发；各自内部失败降级为空数组，不让一条挂掉拖垮另一条
  const [开放节点, 协议节点] = await Promise.all([
    要开放 ? 公共节点取开放节点().catch(() => []) : Promise.resolve([]),
    公共节点取协议节点().catch(() => []),
  ]);

  if (!开放节点.length && !协议节点.length) throw new Error('没拉到任何可用节点');
  return 公共节点缓存存储.写({ 开放节点, 协议节点 });
}

function 公共节点缩进证书(文本, 空白) {
  return String(文本 || '').split('\n').map(行 => 行.trim()).filter(行 => 行).map(行 => 空白 + 行).join('\n');
}

function 公共节点去重名(名称, 已用) {
  let 候选 = 名称;
  let 序号 = 2;
  while (已用.has(候选)) {
    候选 = 名称 + '-' + 序号;
    序号++;
  }
  已用.add(候选);
  return 候选;
}

// 把 share URI 翻成 Clash 节点行。VMess 是 base64 的 JSON，其余是 URL 参数
function 公共节点转节点行(方案, 名称, 统一资源) {
  const 行 = ['  - name: "' + 名称 + '"'];
  try {
    if (方案 === 'vmess') {
      const 载荷 = 统一资源.split('://')[1].split('#')[0];
      const 补齐 = 载荷 + '='.repeat((4 - 载荷.length % 4) % 4);
      const 配置 = JSON.parse(解码64(补齐));
      行.push('    type: vmess',
        '    server: ' + (配置.add || ''),
        '    port: ' + (parseInt(配置.port, 10) || 0),
        '    uuid: ' + (配置.id || ''),
        '    alterId: ' + (parseInt(配置.aid, 10) || 0),
        '    cipher: ' + (配置.scy || 'auto'),
        '    udp: true');
      if (配置.net === 'ws') {
        行.push('    network: ws', '    ws-opts:', '      path: ' + (配置.path || '/'));
        if (配置.host) 行.push('      headers:', '        Host: ' + 配置.host);
      }
      if (配置.tls) {
        行.push('    tls: true');
        if (配置.sni) 行.push('    servername: ' + 配置.sni);
      }
      return 行;
    }
    const 位置 = 统一资源.indexOf('://');
    const 主体 = 统一资源.slice(位置 + 3);
    const 锚 = 主体.indexOf('#');
    const 参数段 = 锚 === -1 ? 主体 : 主体.slice(0, 锚);
    const 问号 = 参数段.indexOf('?');
    const 地址段 = 问号 === -1 ? 参数段 : 参数段.slice(0, 问号);
    const 参数 = new URLSearchParams(问号 === -1 ? '' : 参数段.slice(问号 + 1));
    const 认证位置 = 地址段.lastIndexOf('@');
    const 主机段 = 认证位置 === -1 ? 地址段 : 地址段.slice(认证位置 + 1);
    let 主机 = 主机段;
    let 端口 = '0';
    if (主机段.startsWith('[')) {
      const 闭 = 主机段.indexOf(']');
      主机 = 主机段.slice(1, 闭);
      端口 = 主机段.slice(闭 + 2);
    } else {
      const 冒号 = 主机段.lastIndexOf(':');
      主机 = 主机段.slice(0, 冒号);
      端口 = 主机段.slice(冒号 + 1);
    }
    const 用户 = 认证位置 === -1 ? '' : decodeURIComponent(地址段.slice(0, 认证位置));
    if (方案 === 'vless') {
      行.push('    type: vless', '    server: ' + 主机, '    port: ' + (parseInt(端口, 10) || 0),
        '    uuid: ' + 用户, '    udp: true');
      const 安全 = 参数.get('security') || 'none';
      if (安全 === 'reality') {
        行.push('    tls: true', '    reality-opts:', '      public-key: ' + (参数.get('pbk') || ''));
        if (参数.get('sid')) 行.push('      short-id: ' + 参数.get('sid'));
      } else if (安全 === 'tls') {
        行.push('    tls: true');
      }
      if (参数.get('sni')) 行.push('    servername: ' + 参数.get('sni'));
      if (参数.get('fp')) 行.push('    client-fingerprint: ' + 参数.get('fp'));
      const 传输 = 参数.get('type') || 'tcp';
      if (传输 === 'ws') {
        行.push('    network: ws', '    ws-opts:', '      path: ' + (参数.get('path') || '/'));
        if (参数.get('host')) 行.push('      headers:', '        Host: ' + 参数.get('host'));
      } else if (传输 === 'grpc') {
        行.push('    network: grpc', '    grpc-opts:', '      grpc-service-name: ' + (参数.get('serviceName') || ''));
      }
      if (参数.get('flow')) 行.push('    flow: ' + 参数.get('flow'));
    } else if (方案 === 'trojan') {
      行.push('    type: trojan', '    server: ' + 主机, '    port: ' + (parseInt(端口, 10) || 0),
        '    password: "' + 用户 + '"', '    udp: true');
      if (参数.get('sni')) 行.push('    sni: ' + 参数.get('sni'));
      if (参数.get('type') === 'ws') {
        行.push('    network: ws', '    ws-opts:', '      path: ' + (参数.get('path') || '/'));
      }
    } else if (方案 === 'shadowsocks') {
      let 方法 = '';
      let 密码 = '';
      try {
        const 补齐 = 用户 + '='.repeat((4 - 用户.length % 4) % 4);
        const 已解 = 解码64(补齐);
        if (已解.indexOf(':') !== -1) {
          方法 = 已解.split(':')[0];
          密码 = 已解.split(':').slice(1).join(':');
        }
      } catch (错误) {
        if (用户.indexOf(':') !== -1) {
          方法 = 用户.split(':')[0];
          密码 = 用户.split(':').slice(1).join(':');
        }
      }
      行.push('    type: ss', '    server: ' + 主机, '    port: ' + (parseInt(端口, 10) || 0),
        '    cipher: ' + (方法 || 'chacha20-ietf-poly1305'), '    password: "' + 密码 + '"');
      const 插件 = 参数.get('plugin');
      if (插件) {
        行.push('    plugin: ' + 插件.split(';')[0], '    plugin-opts:');
        for (const 段 of 插件.split(';').slice(1)) {
          const 等 = 段.indexOf('=');
          if (等 !== -1) 行.push('      ' + 段.slice(0, 等) + ': ' + 段.slice(等 + 1));
        }
      }
    } else if (方案 === 'hysteria2') {
      行.push('    type: hysteria2', '    server: ' + 主机, '    port: ' + (parseInt(端口, 10) || 0),
        '    password: "' + 用户 + '"', '    udp: true');
      if (参数.get('sni')) 行.push('    sni: ' + 参数.get('sni'));
      // insecure 可能是 1/true/yes 各种写法，归一成 Clash 认的布尔
      const 忽略证书 = 参数.get('insecure');
      if (忽略证书) {
        行.push('    skip-cert-verify: ' + (/^(1|true|yes)$/i.test(String(忽略证书)) ? 'true' : 'false'));
      }
      if (参数.get('up')) 行.push('    up: ' + 参数.get('up'));
      if (参数.get('down')) 行.push('    down: ' + 参数.get('down'));
      if (参数.get('obfs')) 行.push('    obfs: ' + 参数.get('obfs'));
      if (参数.get('obfs-password')) 行.push('    obfs-password: ' + 参数.get('obfs-password'));
    } else {
      return [];
    }
  } catch (错误) {
    return [];
  }
  return 行;
}

// Clash 版订阅：OpenVPN + 多协议混编，按协议分组
async function 生成公共节点订阅() {
  const { 开放节点, 协议节点 } = await 公共节点取全部();
  const 域名系统 = 自定义域名系统 || 'https://223.5.5.5/dns-query';
  const 已用名 = new Set();
  const 节点段 = ['proxies:'];
  const 分组名 = [];
  const 按组 = {};

  if (开放节点.length) {
    const 组名 = '🏠 公共 OpenVPN';
    分组名.push(组名);
    按组[组名] = [];
    const 国家计数 = {};
    开放节点.forEach((项, 下标) => {
      const 码 = 公共节点国家码(项.行.country);
      国家计数[码] = (国家计数[码] || 0) + 1;
      const 名称 = 公共节点去重名('🏠 ' + 码 + '-' + String(国家计数[码]).padStart(2, '0'), 已用名);
      const 解析 = 项.解析;
      const 行 = [
        '  - name: "' + 名称 + '"',
        '    type: ' + 解码64('b3BlbnZwbg=='),
        '    server: ' + 解析.地址,
        '    port: ' + 解析.端口,
        '    proto: ' + 解析.协议,
        '    username: ' + (解析.用户名 || 'vpn'),
        '    password: ' + (解析.密码 || 'vpn'),
        '    cipher: ' + 解析.加密,
        '    auth: ' + 解析.摘要,
        '    udp: ' + (解析.协议 === 'udp' ? 'true' : 'false'),
        '    handshake-timeout: 30',
        '    remote-dns-resolve: true',
        '    dns: [ 8.8.8.8, 1.1.1.1 ]'
      ];
      // 证书基本同一份，第一个定锚点后面引用，几十个节点能省几百 KB
      if (下标 === 0) {
        if (解析.证书) 行.push('    ca: &pvlca |-', 公共节点缩进证书(解析.证书, '      '));
        if (解析.公钥) 行.push('    cert: &pvlcert |-', 公共节点缩进证书(解析.公钥, '      '));
        if (解析.私钥) 行.push('    key: &pvlkey |-', 公共节点缩进证书(解析.私钥, '      '));
      } else {
        if (解析.证书) 行.push('    ca: *pvlca');
        if (解析.公钥) 行.push('    cert: *pvlcert');
        if (解析.私钥) 行.push('    key: *pvlkey');
      }
      节点段.push(行.join('\n'));
      按组[组名].push(名称);
    });
  }

  const 协议计数 = {};
  for (const 项 of 协议节点) {
    const 组名 = '⚡ ' + String(项.协议).toUpperCase();
    if (!按组[组名]) {
      分组名.push(组名);
      按组[组名] = [];
    }
    协议计数[组名] = (协议计数[组名] || 0) + 1;
    const 名称 = 公共节点去重名('⚡ ' + String(项.协议).toUpperCase() + '-' + String(协议计数[组名]).padStart(2, '0'), 已用名);
    const 行 = 公共节点转节点行(String(项.协议).toLowerCase(), 名称, 项.链接);
    if (!行.length) continue;
    节点段.push(行.join('\n'));
    按组[组名].push(名称);
  }

  if (!分组名.length) throw new Error('没有可输出的节点');

  const 头部 = [
    '# cfnew 公共节点订阅：节点取自 PublicVPNList 实测清单',
    '# OpenVPN 节点需要 mihomo 1.19.25+ / Clash Meta 内核',
    '# 节点是第三方共享的，掉线很正常，自动组会自己往下换',
    'mixed-port: 7890',
    'allow-lan: false',
    'mode: rule',
    'log-level: info',
    'ipv6: false',
    'unified-delay: true',
    'tcp-concurrent: true',
    'external-controller: 127.0.0.1:9090',
    'dns:',
    '  enable: true',
    '  ipv6: false',
    '  enhanced-mode: fake-ip',
    '  fake-ip-range: 198.18.0.1/16',
    '  nameserver:',
    '    - ' + 域名系统,
    '    - https://1.1.1.1/dns-query',
    ''
  ];
  const 列出 = 名称列表 => 名称列表.map(名称 => '      - "' + 名称 + '"').join('\n');
  const 全部名称 = [];
  for (const 组名 of 分组名) 全部名称.push(...按组[组名]);
  const 分组段 = [解码64('cHJveHktZ3JvdXBzOg==')];
  // 全量上百个节点，测一轮就是上百次握手，间隔拉长、用到才测
  分组段.push('  - name: "♻️ 公共自动"', '    type: fallback',
    '    url: https://www.gstatic.com/generate_204', '    interval: 1800', '    lazy: true',
    '    proxies:', 列出(全部名称.slice(0, 200)));
  for (const 组名 of 分组名) {
    分组段.push('  - name: "' + 组名 + '"', '    type: select', '    proxies:', 列出(按组[组名]));
  }
  const 主选列表 = ['      - "♻️ 公共自动"'];
  for (const 组名 of 分组名) 主选列表.push('      - "' + 组名 + '"');
  主选列表.push('      - DIRECT');
  分组段.push('  - name: "🚀 节点选择"', '    type: select', '    proxies:', 主选列表.join('\n'));
  const 规则段 = [
    'rules:',
    '  - GEOIP,LAN,DIRECT,no-resolve',
    '  - GEOIP,CN,DIRECT,no-resolve',
    '  - MATCH,🚀 节点选择'
  ];
  return 头部.concat(节点段, [''], 分组段, [''], 规则段, ['']).join('\n');
}

// 纯 URI 版订阅：只出客户端真能识别的 share URI。
// 注意：OpenVPN 没有业界通用的 URI scheme——ovpn:// 是自造的，
// 没有客户端或转换器认得，硬塞进去只会让整份订阅导入失败。
// 所以这一路只给多协议节点；要用 OpenVPN 请走 ?target=pvl（Clash）或 ?target=pvlsb（sing-box）。
async function 生成公共节点链接列表() {
  const { 开放节点, 协议节点 } = await 公共节点取全部();
  const 链接列表 = [];
  for (const 项 of 协议节点) 链接列表.push(项.链接);
  if (!链接列表.length && 开放节点.length) {
    // 多协议一条都没拿到、只有 OpenVPN 时，给个说明比给一份空文件有用
    return ['# 本次只换到 OpenVPN 节点，纯 URI 订阅里放不下它们（无通用 scheme）。',
      '# 请改用 ?target=pvl（Clash YAML）或 ?target=pvlsb（sing-box）。'];
  }
  return 链接列表;
}


// sing-box 出站：从 share URI 翻出来，字段口径对齐 tools 抓取器的 build_singbox
function 公共节点转出站(方案, 名称, 统一资源) {
  try {
    const 基础 = { type: 方案, tag: 名称 };
    if (方案 === 'vmess') {
      const 载荷 = 统一资源.split('://')[1].split('#')[0];
      const 补齐 = 载荷 + '='.repeat((4 - 载荷.length % 4) % 4);
      const 配置 = JSON.parse(解码64(补齐));
      基础.server = 配置.add || '';
      基础.server_port = parseInt(配置.port, 10) || 0;
      基础.uuid = 配置.id || '';
      基础.alter_id = parseInt(配置.aid, 10) || 0;
      基础.security = 配置.scy || 'auto';
      if (配置.net === 'ws') {
        基础.transport = { type: 'ws', path: 配置.path || '/' };
        if (配置.host) 基础.transport.headers = { Host: 配置.host };
      }
      if (配置.tls) {
        基础.tls = { enabled: true, server_name: 配置.sni || 配置.add };
        if (配置.sni) 基础.tls.server_name = 配置.sni;
      }
      return 基础;
    }
    const 位置 = 统一资源.indexOf('://');
    const 主体 = 统一资源.slice(位置 + 3);
    const 锚 = 主体.indexOf('#');
    const 参数段 = 锚 === -1 ? 主体 : 主体.slice(0, 锚);
    const 问号 = 参数段.indexOf('?');
    const 地址段 = 问号 === -1 ? 参数段 : 参数段.slice(0, 问号);
    const 参数 = new URLSearchParams(问号 === -1 ? '' : 参数段.slice(问号 + 1));
    const 认证位置 = 地址段.lastIndexOf('@');
    const 主机段 = 认证位置 === -1 ? 地址段 : 地址段.slice(认证位置 + 1);
    let 主机 = 主机段;
    let 端口 = '0';
    if (主机段.startsWith('[')) {
      const 闭 = 主机段.indexOf(']');
      主机 = 主机段.slice(1, 闭);
      端口 = 主机段.slice(闭 + 2);
    } else {
      const 冒号 = 主机段.lastIndexOf(':');
      主机 = 主机段.slice(0, 冒号);
      端口 = 主机段.slice(冒号 + 1);
    }
    const 用户 = 认证位置 === -1 ? '' : decodeURIComponent(地址段.slice(0, 认证位置));
    基础.server = 主机;
    基础.server_port = parseInt(端口, 10) || 0;

    if (方案 === 'vless') {
      基础.uuid = 用户;
      const 安全 = 参数.get('security') || 'none';
      if (安全 === 'reality') {
        基础.tls = {
          enabled: true,
          server_name: 参数.get('sni') || '',
          utls: { enabled: true, fingerprint: 参数.get('fp') || 'chrome' },
          reality: { enabled: true, public_key: 参数.get('pbk') || '', short_id: 参数.get('sid') || '' }
        };
      } else if (安全 === 'tls') {
        基础.tls = { enabled: true, server_name: 参数.get('sni') || '' };
        if (参数.get('fp')) 基础.tls.utls = { enabled: true, fingerprint: 参数.get('fp') };
      }
      if (参数.get('flow')) 基础.flow = 参数.get('flow');
      const 传输 = 参数.get('type') || 'tcp';
      if (传输 === 'ws') {
        基础.transport = { type: 'ws', path: 参数.get('path') || '/' };
        if (参数.get('host')) 基础.transport.headers = { Host: 参数.get('host') };
      } else if (传输 === 'grpc') {
        基础.transport = { type: 'grpc', service_name: 参数.get('serviceName') || '' };
      }
    } else if (方案 === 'trojan') {
      基础.password = 用户;
      if (参数.get('sni')) 基础.tls = { enabled: true, server_name: 参数.get('sni') };
      if (参数.get('type') === 'ws') {
        基础.transport = { type: 'ws', path: 参数.get('path') || '/' };
      }
    } else if (方案 === 'shadowsocks') {
      let 方法 = '';
      let 密码 = '';
      try {
        const 已解 = 解码64(用户 + '='.repeat((4 - 用户.length % 4) % 4));
        if (已解.indexOf(':') !== -1) {
          方法 = 已解.split(':')[0];
          密码 = 已解.split(':').slice(1).join(':');
        }
      } catch (错误) {
        if (用户.indexOf(':') !== -1) {
          方法 = 用户.split(':')[0];
          密码 = 用户.split(':').slice(1).join(':');
        }
      }
      基础.method = 方法 || 'chacha20-ietf-poly1305';
      基础.password = 密码;
      const 插件 = 参数.get('plugin');
      if (插件) {
        const 段列表 = 插件.split(';');
        基础.plugin = 段列表[0];
        基础.plugin_opts = 段列表.slice(1).join(';');
      }
    } else if (方案 === 'hysteria2') {
      基础.password = 用户;
      if (参数.get('sni')) 基础.tls = { enabled: true, server_name: 参数.get('sni') };
      const 忽略 = 参数.get('insecure');
      if (忽略 && /^(1|true|yes)$/i.test(String(忽略))) {
        基础.tls = 基础.tls || { enabled: true };
        基础.tls.insecure = true;
      }
      if (参数.get('up')) 基础.up_mbps = parseInt(参数.get('up'), 10) || 0;
      if (参数.get('down')) 基础.down_mbps = parseInt(参数.get('down'), 10) || 0;
      if (参数.get('obfs')) 基础.obfs = 参数.get('obfs');
    } else {
      return null;
    }
    return 基础;
  } catch (错误) {
    return null;
  }
}

// sing-box 版公共节点订阅：只出多协议（sing-box 内核没有 openvpn 出站类型）
async function 生成公共节点盒子订阅() {
  const { 协议节点 } = await 公共节点取全部();
  const 出站列表 = [];
  const 已用名 = new Set();
  const 按组 = {};
  const 协议计数 = {};
  for (const 项 of 协议节点) {
    const 组名 = String(项.协议).toUpperCase();
    协议计数[组名] = (协议计数[组名] || 0) + 1;
    const 名称 = 公共节点去重名('⚡ ' + 组名 + '-' + String(协议计数[组名]).padStart(2, '0'), 已用名);
    const 出站 = 公共节点转出站(String(项.协议).toLowerCase(), 名称, 项.链接);
    if (!出站) continue;
    出站列表.push(出站);
    (按组[组名] = 按组[组名] || []).push(名称);
  }
  if (!出站列表.length) throw new Error('没有可输出的节点');

  const 全部名称 = 出站列表.map(o => o.tag);
  const 组名列表 = Object.keys(按组);
  const 出站 = [];
  出站.push({ type: 'urltest', tag: 'auto', outbounds: 全部名称.slice(0, 200), interval: '3m', tolerance: 50 });
  for (const 组名 of 组名列表) {
    出站.push({ type: 'urltest', tag: '⚡ ' + 组名 + ' 节点', outbounds: 按组[组名], interval: '3m', tolerance: 50 });
  }
  出站.push({
    type: 'selector', tag: 'select', default: 'auto',
    outbounds: ['auto'].concat(组名列表.map(名 => '⚡ ' + 名 + ' 节点')).concat(['direct'])
      .concat(全部名称)
  });
  出站.push({ type: 'direct', tag: 'direct' });
  出站.push(...出站列表);
  return JSON.stringify({
    log: { level: 'info', timestamp: true },
    dns: { servers: [{ tag: 'local', address: '223.5.5.5' }] },
    outbounds: 出站
  }, null, 2);
}
