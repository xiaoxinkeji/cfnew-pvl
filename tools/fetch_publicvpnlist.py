#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PublicVPNList 全量节点抓取器
============================
从 publicvpnlist.com 把全部已检测节点扒下来，输出成 cfnew 能直接喂的订阅文件。

两条抓取路线：
  1. OpenVPN  —— 走 /local/api/vpn-data.php?status=all，一次性拿到全量清单（4.5万+ 行），
                 再对每一行调 get_token.php 换 300 秒有效的 .ovpn 原文。
  2. 多协议   —— VLESS / Trojan / VMess / Shadowsocks / Hysteria2，
                 翻 /{protocol}/ 列表页拿稳定 ID，再调 /protocols/download.php?format=json
                 直接拿 share URI，不用解 base64、不用猜参数。

产出：
  nodes/openvpn.json     全量 OpenVPN 元数据（供筛选/统计）
  nodes/protocols.json   多协议 share URI 全集
  sub/all.txt            纯 URI 订阅（只含多协议：OpenVPN 无通用 URI scheme）
  sub/all_base64.txt     同上，base64 整包
  sub/clash.yaml         Clash/Mihomo 配置（OpenVPN 节点需要 1.19.25+）
  sub/singbox.json       sing-box 出站配置
  nodes/report.md        抓取报告

用法：
  python3 fetch_publicvpnlist.py                     # 全量
  python3 fetch_publicvpnlist.py --vpn-only          # 只抓 OpenVPN
  python3 fetch_publicvpnlist.py --proto-only        # 只抓多协议
  python3 fetch_publicvpnlist.py --country jp,kr,us  # 只留这几个国家
  python3 fetch_publicvpnlist.py --limit 200         # 每种协议最多取 N 个
  python3 fetch_publicvpnlist.py --min-speed 3       # OpenVPN 最低实测 Mbps
  python3 fetch_publicvpnlist.py --max-latency 300   # OpenVPN 最高实测 RTT
  python3 fetch_publicvpnlist.py --no-ovpn           # 不逐条换 .ovpn 原文（快很多，只出元数据）
"""

import argparse
import base64
import concurrent.futures as futures
import json
import os
import random
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

BASE = 'https://publicvpnlist.com'
UA = ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36')

# 列表页路径 -> 协议名（publicvpnlist 的 URL 就是小写协议名）
PROTO_PAGES = ['vless', 'trojan', 'vmess', 'shadowsocks', 'hysteria2']
# share URI 的 scheme
URI_SCHEME = {
    'vless': 'vless',
    'trojan': 'trojan',
    'vmess': 'vmess',
    'shadowsocks': 'ss',
    'hysteria2': 'hysteria2',
}

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'pvl')
NODES_DIR = os.path.join(OUT_DIR, 'nodes')
SUB_DIR = os.path.join(OUT_DIR, 'sub')

# 国家代码 -> 中文名（订阅里显示用）
CN_NAME = {
    'japan': '日本', 'south-korea': '韩国', 'usa': '美国', 'russia': '俄罗斯',
    'thailand': '泰国', 'vietnam': '越南', 'indonesia': '印尼', 'canada': '加拿大',
    'uk': '英国', 'argentina': '阿根廷', 'netherlands': '荷兰', 'germany': '德国',
    'france': '法国', 'singapore': '新加坡', 'hong-kong': '香港', 'taiwan': '台湾',
    'india': '印度', 'malaysia': '马来西亚', 'philippines': '菲律宾', 'australia': '澳大利亚',
    'brazil': '巴西', 'mexico': '墨西哥', 'spain': '西班牙', 'italy': '意大利',
    'poland': '波兰', 'sweden': '瑞典', 'finland': '芬兰', 'norway': '挪威',
    'switzerland': '瑞士', 'ukraine': '乌克兰', 'turkey': '土耳其', 'iran': '伊朗',
    'czech-republic': '捷克', 'romania': '罗马尼亚', 'austria': '奥地利',
    'united-kingdom': '英国', 'united-states': '美国', 'south-africa': '南非',
    'new-zealand': '新西兰', 'ireland': '爱尔兰', 'belgium': '比利时',
    'denmark': '丹麦', 'hungary': '匈牙利', 'portugal': '葡萄牙', 'greece': '希腊',
    'israel': '以色列', 'estonia': '爱沙尼亚', 'latvia': '拉脱维亚',
    'lithuania': '立陶宛', 'bulgaria': '保加利亚', 'croatia': '克罗地亚',
    'serbia': '塞尔维亚', 'slovakia': '斯洛伐克', 'slovenia': '斯洛文尼亚',
    'kazakhstan': '哈萨克斯坦', 'belarus': '白俄罗斯', 'georgia': '格鲁吉亚',
    'azerbaijan': '阿塞拜疆', 'moldova': '摩尔多瓦', 'albania': '阿尔巴尼亚',
    'united-arab-emirates': '阿联酋', 'saudi-arabia': '沙特', 'egypt': '埃及',
    'nigeria': '尼日利亚', 'kenya': '肯尼亚', 'chile': '智利', 'colombia': '哥伦比亚',
    'peru': '秘鲁', 'uruguay': '乌拉圭', 'ecuador': '厄瓜多尔', 'costa-rica': '哥斯达黎加',
    'panama': '巴拿马', 'guatemala': '危地马拉', 'venezuela': '委内瑞拉',
    'bosnia-and-herzegowina': '波黑', 'macedonia': '北马其顿', 'montenegro': '黑山',
    'cyprus': '塞浦路斯', 'luxembourg': '卢森堡', 'iceland': '冰岛', 'malta': '马耳他',
    'bangladesh': '孟加拉', 'pakistan': '巴基斯坦', 'sri-lanka': '斯里兰卡',
    'nepal': '尼泊尔', 'myanmar': '缅甸', 'cambodia': '柬埔寨', 'laos': '老挝',
    'mongolia': '蒙古', 'uzbekistan': '乌兹别克斯坦', 'kyrgyzstan': '吉尔吉斯斯坦',
    'armenia': '亚美尼亚', 'qatar': '卡塔尔', 'kuwait': '科威特', 'bahrain': '巴林',
    'jordan': '约旦', 'lebanon': '黎巴嫩', 'iraq': '伊拉克', 'afghanistan': '阿富汗',
    'morocco': '摩洛哥', 'tunisia': '突尼斯', 'algeria': '阿尔及利亚', 'ghana': '加纳',
    'tanzania': '坦桑尼亚', 'uganda': '乌干达', 'zimbabwe': '津巴布韦',
    'zambia': '赞比亚', 'senegal': '塞内加尔', 'cameroon': '喀麦隆',
    'ivory-coast': '科特迪瓦', 'angola': '安哥拉', 'mozambique': '莫桑比克',
    'botswana': '博茨瓦纳', 'namibia': '纳米比亚', 'madagascar': '马达加斯加',
    'jamaica': '牙买加', 'trinidad-and-tobago': '特立尼达', 'dominican-republic': '多米尼加',
    'haiti': '海地', 'cuba': '古巴', 'bolivia': '玻利维亚', 'paraguay': '巴拉圭',
    'guyana': '圭亚那', 'suriname': '苏里南', 'nicaragua': '尼加拉瓜',
    'honduras': '洪都拉斯', 'el-salvador': '萨尔瓦多', 'belize': '伯利兹',
    'grenada': '格林纳达', 'barbados': '巴巴多斯', 'bahamas': '巴哈马',
    'northern-mariana-islands': '北马里亚纳', 'guam': '关岛', 'fiji': '斐济',
    'papua-new-guinea': '巴布亚新几内亚', 'brunei': '文莱', 'macao': '澳门',
    'north-korea': '朝鲜', 'palestine': '巴勒斯坦', 'sudan': '苏丹',
    'ethiopia': '埃塞俄比亚', 'rwanda': '卢旺达', 'malawi': '马拉维',
    'sierra-leone': '塞拉利昂', 'liberia': '利比里亚', 'mauritius': '毛里求斯',
    'seychelles': '塞舌尔', 'maldives': '马尔代夫', 'bhutan': '不丹',
    'timor-leste': '东帝汶', 'turkmenistan': '土库曼斯坦', 'tajikistan': '塔吉克斯坦',
    'yemen': '也门', 'oman': '阿曼', 'syria': '叙利亚', 'libya': '利比亚',
    'kosovo': '科索沃', 'andorra': '安道尔', 'monaco': '摩纳哥',
    'san-marino': '圣马力诺', 'liechtenstein': '列支敦士登', 'gibraltar': '直布罗陀',
}

# 国家码映射的单一真源在 docs/country-codes.json（cfnew Worker 与 sync_3xui 共用同一份），
# 这里加载它，避免同一份表在三处各写一遍后逐渐漂移。
def _load_country_codes():
    import json as _json
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'docs', 'country-codes.json')
    try:
        with open(path, encoding='utf-8') as f:
            return _json.load(f)
    except Exception:
        return {}

FLAG = _load_country_codes()


def log(msg):
    sys.stderr.write('[pvl] %s\n' % msg)
    sys.stderr.flush()


# urllib 不会自己存 cookie，而站点对未带会话的请求会限流（403）。
# 用 opener 挂上 CookieProcessor，先访问首页拿会话再拉大清单。
_COOKIE_JAR = None


def _opener():
    global _COOKIE_JAR
    if _COOKIE_JAR is None:
        import http.cookiejar
        _COOKIE_JAR = http.cookiejar.CookieJar()
    return urllib.request.build_opener(
        urllib.request.HTTPCookieProcessor(_COOKIE_JAR))


def warm_session():
    """先访问首页建立会话，后续大请求才不会被限流。"""
    try:
        req = urllib.request.Request(BASE + '/', headers={'User-Agent': UA})
        with _opener().open(req, timeout=60) as resp:
            resp.read(4096)
    except Exception:  # noqa: BLE001 - 预热失败不致命，后面还有重试
        pass


def get(url, referer=None, timeout=120, retries=3):
    """带重试的 GET。服务端偶尔抽风，退避重试比直接崩要好。"""
    headers = {
        'User-Agent': UA,
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity',  # 避开分块 gzip 截断导致的 JSON 解析失败
    }
    if referer:
        headers['Referer'] = referer
    last = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=headers)
            with _opener().open(req, timeout=timeout) as resp:
                return resp.read()
        except urllib.error.HTTPError as exc:
            last = exc
            # 403 是限流：新开会话 + 拉长退避再试
            if exc.code == 403:
                time.sleep(5 * (attempt + 1) + random.random() * 3)
                warm_session()
                continue
            time.sleep(1.5 * (attempt + 1) + random.random())
        except Exception as exc:  # noqa: BLE001 - 网络层错误一律重试
            last = exc
            time.sleep(1.5 * (attempt + 1) + random.random())
    raise last


def post_form(url, data, referer=None, timeout=30, retries=2):
    headers = {
        'User-Agent': UA,
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
    }
    if referer:
        headers['Referer'] = referer
    body = urllib.parse.urlencode(data).encode()
    last = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, data=body, headers=headers)
            with _opener().open(req, timeout=timeout) as resp:
                return json.loads(resp.read().decode('utf-8', 'replace'))
        except Exception as exc:  # noqa: BLE001
            last = exc
            time.sleep(1.0 * (attempt + 1))
    raise last


def country_label(code):
    code = (code or '').lower()
    return CN_NAME.get(code, code.upper() or 'XX')


def country_flag(code):
    code = (code or '').lower()
    return FLAG.get(code, (code[:2].upper() if code else 'XX'))


# ---------------------------------------------------------------- OpenVPN 路线

CATALOG_CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                             '.cache', 'vpn-data.json')


def fetch_openvpn_catalog(cache=True):
    """一次请求拿到全量 OpenVPN 清单（约 33MB，4.5 万行）。

    这个清单很大且站点限流明显，所以落盘缓存：缓存存在就直接用，
    需要刷新时加 --refresh 才会重新拉。
    """
    if cache and os.path.exists(CATALOG_CACHE):
        mtime = time.strftime('%Y-%m-%d %H:%M:%S',
                              time.localtime(os.path.getmtime(CATALOG_CACHE)))
        log('复用本地缓存清单（%s，%.1f MB），加 --refresh 强制重拉'
            % (mtime, os.path.getsize(CATALOG_CACHE) / 1048576))
        with open(CATALOG_CACHE, 'rb') as fh:
            rows = json.loads(fh.read().decode('utf-8', 'replace'))
        log('OpenVPN 清单 %d 行，其中 active=%d' % (
            len(rows), sum(1 for r in rows if r.get('active'))))
        return rows

    url = BASE + '/local/api/vpn-data.php?status=all'
    log('拉取 OpenVPN 全量清单（约 33MB，稍等）…')
    warm_session()
    raw = get(url, referer=BASE + '/', timeout=180, retries=5)
    rows = json.loads(raw.decode('utf-8', 'replace'))
    os.makedirs(os.path.dirname(CATALOG_CACHE), exist_ok=True)
    with open(CATALOG_CACHE, 'wb') as fh:
        fh.write(raw)
    log('OpenVPN 清单 %d 行，其中 active=%d' % (
        len(rows), sum(1 for r in rows if r.get('active'))))
    return rows


def fetch_ovpn_text(server_id, host, port, proto):
    """用 get_token.php 换 300 秒有效的下载链接，再取 .ovpn 原文。"""
    try:
        tok = post_form(BASE + '/get_token.php', {'id': str(server_id)},
                        referer='%s/download/%s/' % (BASE, server_id))
        url = tok.get('url') or ('/download.php?token=' + str(tok.get('token')))
        if not url.startswith('http'):
            url = BASE + url
        text = get(url, referer='%s/download/%s/' % (BASE, server_id),
                   timeout=30, retries=2).decode('utf-8', 'replace')
        if 'remote ' not in text:
            return None
        return text
    except urllib.error.HTTPError as exc:
        # 429/403 是限流，退避后重试一次，别把后面全拖垮
        if exc.code in (403, 429):
            time.sleep(3 + random.random() * 4)
            try:
                tok = post_form(BASE + '/get_token.php', {'id': str(server_id)},
                                referer='%s/download/%s/' % (BASE, server_id))
                url = tok.get('url') or ('/download.php?token=' + str(tok.get('token')))
                if not url.startswith('http'):
                    url = BASE + url
                text = get(url, referer='%s/download/%s/' % (BASE, server_id),
                           timeout=30, retries=2).decode('utf-8', 'replace')
                return text if 'remote ' in text else None
            except Exception:  # noqa: BLE001
                return None
        return None
    except Exception:  # noqa: BLE001 - 单条失败不影响整体
        return None


def parse_ovpn(text):
    """从 .ovpn 里抽出 cfnew 生成 openvpn 节点需要的字段。"""
    def directive(name):
        m = re.search(r'^[ \t]*' + name + r'[ \t]+(.+?)[ \t]*$', text, re.M)
        return m.group(1).strip() if m else ''

    def block(tag):
        m = re.search(r'<' + tag + r'>([\s\S]*?)</' + tag + r'>', text)
        return m.group(1).strip() if m else ''

    remote = directive('remote').split()
    if not remote:
        return None
    return {
        'server': remote[0],
        'port': int(remote[1]) if len(remote) > 1 and remote[1].isdigit() else 1194,
        'proto': (directive('proto') or 'tcp').lower(),
        'cipher': directive('cipher') or 'AES-128-CBC',
        'auth': directive('auth') or 'SHA1',
        'ca': block('ca'),
        'cert': block('cert'),
        'key': block('key'),
        'tls_auth': block('tls-auth'),
        'has_tls_auth': bool(block('tls-auth')),
    }


# ---------------------------------------------------------------- 多协议路线

def fetch_protocol_ids(proto, max_pages=40):
    """翻 /{proto}/ 列表页，收集稳定的 64 位十六进制配置 ID。"""
    ids = []
    seen = set()
    for page in range(1, max_pages + 1):
        url = '%s/%s/?per_page=100' % (BASE, proto)
        if page > 1:
            url += '&page=%d' % page
        try:
            html = get(url, referer='%s/%s/' % (BASE, proto), timeout=60).decode('utf-8', 'replace')
        except Exception as exc:  # noqa: BLE001
            log('%s 第 %d 页失败：%s' % (proto, page, exc))
            break
        found = re.findall(r'id=([a-f0-9]{64})', html)
        new = [i for i in found if i not in seen]
        if not new:
            break
        seen.update(new)
        ids.extend(new)
        m = re.search(r'Page\s+(\d+)\s+of\s+(\d+)', html)
        if m and int(m.group(1)) >= int(m.group(2)):
            break
        # 「Showing up to 100 matching endpoints per page」没有下一页链接就停
        if 'rel="next nofollow"' not in html:
            break
        time.sleep(0.4)
    log('%s 收集到 %d 个配置 ID' % (proto, len(ids)))
    return ids


def fetch_config_uri(proto, cid):
    """拿一条配置的 share URI。返回 (uri, 备注) 或 (None, 原因)。"""
    url = '%s/protocols/download.php?protocol=%s&id=%s&format=json' % (BASE, proto, cid)
    try:
        raw = get(url, referer='%s/%s/' % (BASE, proto), timeout=30, retries=2)
        data = json.loads(raw.decode('utf-8', 'replace'))
        uri = data.get('config_uri')
        if not uri:
            return None, 'empty'
        scheme = URI_SCHEME.get(proto, proto)
        if not re.match(r'^' + scheme + r'://', uri, re.I):
            return None, 'scheme-mismatch'
        return uri, None
    except urllib.error.HTTPError as exc:
        return None, 'http-%d' % exc.code
    except Exception:  # noqa: BLE001
        return None, 'error'


def endpoint_from_uri(uri, proto):
    """从 share URI 里抠出 address / port / 备注名，用来做展示和过滤。"""
    name = ''
    if '#' in uri:
        name = urllib.parse.unquote(uri.split('#', 1)[1])
    body = uri.split('#', 1)[0]
    if proto == 'vmess':
        try:
            payload = body.split('://', 1)[1]
            payload += '=' * (-len(payload) % 4)
            obj = json.loads(base64.b64decode(payload).decode('utf-8', 'replace'))
            return obj.get('add', ''), int(obj.get('port', 0) or 0), name or obj.get('ps', '')
        except Exception:  # noqa: BLE001
            return '', 0, name
    try:
        rest = body.split('://', 1)[1]
        at = rest.rfind('@')
        hostport = rest[at + 1:] if at != -1 else rest
        hostport = hostport.split('?', 1)[0]
        if hostport.startswith('['):  # IPv6
            host, _, port = hostport.partition(']')
            host = host[1:]
            port = port.lstrip(':')
        else:
            host, _, port = hostport.rpartition(':')
        return host, int(port) if port.isdigit() else 0, name
    except Exception:  # noqa: BLE001
        return '', 0, name


# ---------------------------------------------------------------- 输出构造

def ovpn_to_uri(node, name):
    """OpenVPN 没有通用 share URI，用 ovpn:// 把整份配置内联进去（v2rayNG/OpenVPN Connect 认识）。"""
    return 'ovpn://' + urllib.parse.quote(node['raw'], safe='') + '#' + urllib.parse.quote(name)


def build_clash(ovpn_nodes, proto_nodes, out_path):
    """生成 Clash/Mihomo 配置。OpenVPN 类型需要内核 1.19.25+。"""
    lines = [
        '# PublicVPNList 全量订阅 - 由 tools/fetch_publicvpnlist.py 生成',
        '# OpenVPN 节点需要 mihomo 1.19.25+ / Clash Meta 内核',
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
        '    - https://223.5.5.5/dns-query',
        '    - https://1.1.1.1/dns-query',
        '',
        'proxies:',
    ]

    def indent_block(text, pad):
        return '\n'.join(pad + l.strip() for l in text.split('\n') if l.strip())

    anchors_done = False
    for node in ovpn_nodes:
        o = node['parsed']
        lines.append('  - name: "%s"' % node['name'])
        lines.append('    type: openvpn')
        lines.append('    server: %s' % o['server'])
        lines.append('    port: %d' % o['port'])
        lines.append('    proto: %s' % o['proto'])
        lines.append('    username: vpn')
        lines.append('    password: vpn')
        lines.append('    cipher: %s' % o['cipher'])
        lines.append('    auth: %s' % o['auth'])
        lines.append('    udp: %s' % ('true' if o['proto'] == 'udp' else 'false'))
        lines.append('    handshake-timeout: 30')
        lines.append('    remote-dns-resolve: true')
        lines.append('    dns: [ 8.8.8.8, 1.1.1.1 ]')
        if not anchors_done:
            # 证书绝大多数是同一套 CA，第一个节点定锚点，后面引用，省几百 KB
            if o['ca']:
                lines.append('    ca: &pvlca |-')
                lines.append(indent_block(o['ca'], '      '))
            if o['cert']:
                lines.append('    cert: &pvlcert |-')
                lines.append(indent_block(o['cert'], '      '))
            if o['key']:
                lines.append('    key: &pvlkey |-')
                lines.append(indent_block(o['key'], '      '))
            anchors_done = True
        else:
            if o['ca']:
                lines.append('    ca: *pvlca')
            if o['cert']:
                lines.append('    cert: *pvlcert')
            if o['key']:
                lines.append('    key: *pvlkey')
        if o['has_tls_auth']:
            lines.append('    tls-auth: |-')
            lines.append(indent_block(o['tls_auth'], '      '))

    for node in proto_nodes:
        uri = node['uri']
        proto = node['proto']
        if proto == 'vmess':
            try:
                payload = uri.split('://', 1)[1].split('#', 1)[0]
                payload += '=' * (-len(payload) % 4)
                obj = json.loads(base64.b64decode(payload).decode('utf-8', 'replace'))
                lines.append('  - name: "%s"' % node['name'])
                lines.append('    type: vmess')
                lines.append('    server: %s' % obj.get('add', ''))
                lines.append('    port: %d' % int(obj.get('port', 0) or 0))
                lines.append('    uuid: %s' % obj.get('id', ''))
                lines.append('    alterId: %d' % int(obj.get('aid', 0) or 0))
                lines.append('    cipher: %s' % (obj.get('scy') or 'auto'))
                if obj.get('net') == 'ws':
                    lines.append('    network: ws')
                    lines.append('    ws-opts:')
                    lines.append('      path: %s' % (obj.get('path') or '/'))
                    if obj.get('host'):
                        lines.append('      headers:')
                        lines.append('        Host: %s' % obj['host'])
                if obj.get('tls'):
                    lines.append('    tls: true')
                    if obj.get('sni'):
                        lines.append('    servername: %s' % obj['sni'])
            except Exception:  # noqa: BLE001
                continue
        elif proto == 'shadowsocks':
            # ss:// 在 2022 之后有 userinfo-base64 / 明文两种写法，clash 侧兼容做法
            lines.append('  - name: "%s"' % node['name'])
            lines.append('    type: ss')
            parsed = urllib.parse.urlparse(uri)
            userinfo = parsed.netloc.split('@')[0]
            method, password = '', ''
            try:
                pad = userinfo + '=' * (-len(userinfo) % 4)
                decoded = base64.b64decode(pad).decode('utf-8', 'replace')
                if ':' in decoded:
                    method, password = decoded.split(':', 1)
            except Exception:  # noqa: BLE001
                if ':' in userinfo:
                    method, password = userinfo.split(':', 1)
            plugin = ''
            qs = urllib.parse.parse_qs(parsed.query or '')
            if 'plugin' in qs:
                plugin = qs['plugin'][0]
            lines.append('    server: %s' % node['host'])
            lines.append('    port: %d' % node['port'])
            lines.append('    cipher: %s' % (method or 'chacha20-ietf-poly1305'))
            lines.append('    password: "%s"' % password)
            if plugin:
                lines.append('    plugin: %s' % plugin.split(';')[0])
                opts = dict(p.split('=', 1) for p in plugin.split(';')[1:] if '=' in p)
                if opts:
                    lines.append('    plugin-opts:')
                    for k, v in opts.items():
                        lines.append('      %s: %s' % (k, v))
        elif proto == 'trojan':
            parsed = urllib.parse.urlparse(uri)
            lines.append('  - name: "%s"' % node['name'])
            lines.append('    type: trojan')
            lines.append('    server: %s' % node['host'])
            lines.append('    port: %d' % node['port'])
            lines.append('    password: "%s"' % urllib.parse.unquote(parsed.username or ''))
            qs = urllib.parse.parse_qs(parsed.query or '')
            if 'sni' in qs:
                lines.append('    sni: %s' % qs['sni'][0])
            if qs.get('type', [''])[0] == 'ws':
                lines.append('    network: ws')
                lines.append('    ws-opts:')
                lines.append('      path: %s' % qs.get('path', ['/'])[0])
            lines.append('    udp: true')
        elif proto == 'vless':
            parsed = urllib.parse.urlparse(uri)
            qs = urllib.parse.parse_qs(parsed.query or '')
            lines.append('  - name: "%s"' % node['name'])
            lines.append('    type: vless')
            lines.append('    server: %s' % node['host'])
            lines.append('    port: %d' % node['port'])
            lines.append('    uuid: %s' % urllib.parse.unquote(parsed.username or ''))
            security = qs.get('security', ['none'])[0]
            if security == 'reality':
                lines.append('    tls: true')
                lines.append('    reality-opts:')
                lines.append('      public-key: %s' % qs.get('pbk', [''])[0])
                if 'sid' in qs:
                    lines.append('      short-id: %s' % qs['sid'][0])
            elif security == 'tls':
                lines.append('    tls: true')
            if qs.get('sni'):
                lines.append('    servername: %s' % qs['sni'][0])
            if qs.get('fp'):
                lines.append('    client-fingerprint: %s' % qs['fp'][0])
            net = qs.get('type', ['tcp'])[0]
            if net == 'ws':
                lines.append('    network: ws')
                lines.append('    ws-opts:')
                lines.append('      path: %s' % qs.get('path', ['/'])[0])
                if qs.get('host'):
                    lines.append('      headers:')
                    lines.append('        Host: %s' % qs['host'][0])
            elif net == 'grpc':
                lines.append('    network: grpc')
                lines.append('    grpc-opts:')
                lines.append('      grpc-service-name: %s' % qs.get('serviceName', [''])[0])
            if qs.get('flow'):
                lines.append('    flow: %s' % qs['flow'][0])
            lines.append('    udp: true')
        elif proto == 'hysteria2':
            parsed = urllib.parse.urlparse(uri)
            qs = urllib.parse.parse_qs(parsed.query or '')
            lines.append('  - name: "%s"' % node['name'])
            lines.append('    type: hysteria2')
            lines.append('    server: %s' % node['host'])
            lines.append('    port: %d' % node['port'])
            lines.append('    password: "%s"' % urllib.parse.unquote(parsed.username or ''))
            if qs.get('sni'):
                lines.append('    sni: %s' % qs['sni'][0])
            if qs.get('insecure'):
                lines.append('    skip-cert-verify: %s' % qs['insecure'][0])
            lines.append('    udp: true')

    names = [n['name'] for n in ovpn_nodes] + [n['name'] for n in proto_nodes]
    if not names:
        return False
    lines.append('')
    lines.append('proxy-groups:')
    lines.append('  - name: "🚀 节点选择"')
    lines.append('    type: select')
    lines.append('    proxies:')
    lines.append('      - "♻️ 自动切换"')
    for grp in sorted(set(n['group'] for n in ovpn_nodes + proto_nodes)):
        lines.append('      - "%s"' % grp)
    lines.append('      - DIRECT')
    lines.append('  - name: "♻️ 自动切换"')
    lines.append('    type: url-test')
    lines.append('    url: https://www.gstatic.com/generate_204')
    lines.append('    interval: 300')
    lines.append('    tolerance: 50')
    lines.append('    proxies:')
    for n in names[:200]:  # 全量进 url-test 会打爆测速，取前 200
        lines.append('      - "%s"' % n)
    for grp in sorted(set(n['group'] for n in ovpn_nodes + proto_nodes)):
        lines.append('  - name: "%s"' % grp)
        lines.append('    type: select')
        lines.append('    proxies:')
        for n in ovpn_nodes + proto_nodes:
            if n['group'] == grp:
                lines.append('      - "%s"' % n['name'])
    lines.append('')
    lines.append('rules:')
    lines.append('  - GEOIP,LAN,DIRECT,no-resolve')
    lines.append('  - GEOIP,CN,DIRECT,no-resolve')
    lines.append('  - MATCH,🚀 节点选择')
    lines.append('')
    with open(out_path, 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(lines))
    return True


def build_singbox(proto_nodes, out_path):
    """生成 sing-box outbounds。OpenVPN 在 sing-box 里没有原生出站类型，跳过。"""
    outbounds = [{'type': 'selector', 'tag': 'select',
                  'outbounds': ['auto'] + sorted(set(n['group'] for n in proto_nodes)),
                  'default': 'auto'}]
    outbounds.append({'type': 'urltest', 'tag': 'auto',
                      'outbounds': [n['name'] for n in proto_nodes[:200]],
                      'url': 'https://www.gstatic.com/generate_204',
                      'interval': '3m'})
    for grp in sorted(set(n['group'] for n in proto_nodes)):
        outbounds.append({
            'type': 'selector', 'tag': grp,
            'outbounds': [n['name'] for n in proto_nodes if n['group'] == grp],
        })
    for n in proto_nodes:
        uri = n['uri']
        proto = n['proto']
        try:
            if proto == 'vless':
                parsed = urllib.parse.urlparse(uri)
                qs = urllib.parse.parse_qs(parsed.query or '')
                ob = {'type': 'vless', 'tag': n['name'], 'server': n['host'],
                      'server_port': n['port'],
                      'uuid': urllib.parse.unquote(parsed.username or '')}
                net = qs.get('type', ['tcp'])[0]
                if net == 'ws':
                    ob['transport'] = {'type': 'ws',
                                       'path': qs.get('path', ['/'])[0]}
                    if qs.get('host'):
                        ob['transport']['headers'] = {'Host': qs['host'][0]}
                elif net == 'grpc':
                    ob['transport'] = {'type': 'grpc',
                                       'service_name': qs.get('serviceName', [''])[0]}
                sec = qs.get('security', ['none'])[0]
                if sec in ('tls', 'reality'):
                    tls = {'enabled': True}
                    if qs.get('sni'):
                        tls['server_name'] = qs['sni'][0]
                    if qs.get('fp'):
                        tls['utls'] = {'enabled': True, 'fingerprint': qs['fp'][0]}
                    if sec == 'reality':
                        tls['reality'] = {'enabled': True,
                                          'public_key': qs.get('pbk', [''])[0],
                                          'short_id': qs.get('sid', [''])[0]}
                    ob['tls'] = tls
                if qs.get('flow'):
                    ob['flow'] = qs['flow'][0]
                outbounds.append(ob)
            elif proto == 'trojan':
                parsed = urllib.parse.urlparse(uri)
                qs = urllib.parse.parse_qs(parsed.query or '')
                ob = {'type': 'trojan', 'tag': n['name'], 'server': n['host'],
                      'server_port': n['port'],
                      'password': urllib.parse.unquote(parsed.username or '')}
                if qs.get('type', [''])[0] == 'ws':
                    ob['transport'] = {'type': 'ws', 'path': qs.get('path', ['/'])[0]}
                if qs.get('sni'):
                    ob['tls'] = {'enabled': True, 'server_name': qs['sni'][0]}
                outbounds.append(ob)
            elif proto == 'shadowsocks':
                parsed = urllib.parse.urlparse(uri)
                userinfo = parsed.netloc.split('@')[0]
                method, password = '', ''
                try:
                    pad = userinfo + '=' * (-len(userinfo) % 4)
                    decoded = base64.b64decode(pad).decode('utf-8', 'replace')
                    if ':' in decoded:
                        method, password = decoded.split(':', 1)
                except Exception:  # noqa: BLE001
                    if ':' in userinfo:
                        method, password = userinfo.split(':', 1)
                outbounds.append({'type': 'shadowsocks', 'tag': n['name'],
                                  'server': n['host'], 'server_port': n['port'],
                                  'method': method or 'chacha20-ietf-poly1305',
                                  'password': password})
            elif proto == 'vmess':
                payload = uri.split('://', 1)[1].split('#', 1)[0]
                payload += '=' * (-len(payload) % 4)
                obj = json.loads(base64.b64decode(payload).decode('utf-8', 'replace'))
                ob = {'type': 'vmess', 'tag': n['name'], 'server': obj.get('add', ''),
                      'server_port': int(obj.get('port', 0) or 0),
                      'uuid': obj.get('id', ''),
                      'alter_id': int(obj.get('aid', 0) or 0),
                      'security': obj.get('scy') or 'auto'}
                if obj.get('net') == 'ws':
                    ob['transport'] = {'type': 'ws', 'path': obj.get('path') or '/'}
                    if obj.get('host'):
                        ob['transport']['headers'] = {'Host': obj['host']}
                if obj.get('tls'):
                    ob['tls'] = {'enabled': True}
                    if obj.get('sni'):
                        ob['tls']['server_name'] = obj['sni']
                outbounds.append(ob)
            elif proto == 'hysteria2':
                parsed = urllib.parse.urlparse(uri)
                qs = urllib.parse.parse_qs(parsed.query or '')
                ob = {'type': 'hysteria2', 'tag': n['name'], 'server': n['host'],
                      'server_port': n['port'],
                      'password': urllib.parse.unquote(parsed.username or '')}
                tls = {'enabled': True}
                if qs.get('sni'):
                    tls['server_name'] = qs['sni'][0]
                if qs.get('insecure') in ('1', 'true'):
                    tls['insecure'] = True
                ob['tls'] = tls
                outbounds.append(ob)
        except Exception:  # noqa: BLE001
            continue
    conf = {
        'log': {'level': 'info'},
        'dns': {'servers': [{'tag': 'local', 'address': '223.5.5.5'}]},
        'outbounds': outbounds,
    }
    with open(out_path, 'w', encoding='utf-8') as fh:
        json.dump(conf, fh, ensure_ascii=False, indent=2)
    return True


# ---------------------------------------------------------------- 主流程

def main():
    ap = argparse.ArgumentParser(description='PublicVPNList 全量节点抓取器')
    ap.add_argument('--vpn-only', action='store_true', help='只抓 OpenVPN')
    ap.add_argument('--proto-only', action='store_true', help='只抓多协议')
    ap.add_argument('--no-ovpn', action='store_true', help='不逐条换 .ovpn 原文')
    ap.add_argument('--country', default='', help='只留这些国家，逗号分隔 slug 或 ISO 码')
    ap.add_argument('--limit', type=int, default=0, help='每种来源最多取 N 个')
    ap.add_argument('--min-speed', type=float, default=0, help='OpenVPN 最低实测 Mbps')
    ap.add_argument('--max-latency', type=float, default=0, help='OpenVPN 最高实测 RTT')
    ap.add_argument('--workers', type=int, default=8, help='并发数（太高会被限流，建议 8）')
    ap.add_argument('--sleep', type=float, default=0.15, help='每批之间的间隔秒数')
    ap.add_argument('--refresh', action='store_true', help='忽略本地清单缓存强制重拉')
    ap.add_argument('--out', default=OUT_DIR, help='输出目录')
    args = ap.parse_args()

    out_dir = os.path.abspath(args.out)
    nodes_dir = os.path.join(out_dir, 'nodes')
    sub_dir = os.path.join(out_dir, 'sub')
    os.makedirs(nodes_dir, exist_ok=True)
    os.makedirs(sub_dir, exist_ok=True)

    wanted = set()
    if args.country:
        for c in args.country.split(','):
            c = c.strip().lower()
            if c:
                wanted.add(c)
                wanted.add(c[:2])  # ISO 码也收

    ovpn_nodes = []
    proto_nodes = []
    stats = {}

    # ---------------- OpenVPN ----------------
    if not args.proto_only:
        rows = fetch_openvpn_catalog(cache=not args.refresh)
        active = [r for r in rows if r.get('active') and r.get('downloadable')]
        stats['openvpn_total'] = len(rows)
        stats['openvpn_active'] = len(active)

        def keep(r):
            code = (r.get('country') or '').lower()
            if wanted and not (code in wanted or code[:2] in wanted):
                return False
            if args.min_speed and (r.get('checkerMeasuredThroughputMbps') or 0) < args.min_speed:
                return False
            if args.max_latency and (r.get('checkerMeasuredTunnelRttMs') or 999999) > args.max_latency:
                return False
            return True

        active = [r for r in active if keep(r)]
        # 实测速度倒序，慢的靠后
        active.sort(key=lambda r: (r.get('checkerMeasuredThroughputMbps') or 0), reverse=True)
        if args.limit:
            active = active[:args.limit]
        stats['openvpn_selected'] = len(active)
        log('筛出 %d 个 OpenVPN 节点' % len(active))

        # 保存元数据
        with open(os.path.join(nodes_dir, 'openvpn.json'), 'w', encoding='utf-8') as fh:
            json.dump(active, fh, ensure_ascii=False, indent=1)

        if not args.no_ovpn:
            log('逐条换取 .ovpn 原文（并发 %d）…' % args.workers)
            counter = {'done': 0, 'ok': 0}
            total = len(active)

            def work(row):
                text = fetch_ovpn_text(row['id'], row.get('host'), row.get('port'), row.get('proto'))
                counter['done'] += 1
                if counter['done'] % 25 == 0:
                    log('  %d/%d' % (counter['done'], total))
                if not text:
                    return None
                parsed = parse_ovpn(text)
                if not parsed or not parsed['ca']:
                    return None
                counter['ok'] += 1
                return {'row': row, 'raw': text, 'parsed': parsed}

            with futures.ThreadPoolExecutor(max_workers=max(2, args.workers // 2)) as pool:
                results = list(pool.map(work, active))
            time.sleep(args.sleep)
            results = [r for r in results if r]
            stats['openvpn_fetched'] = len(results)
            log('成功换到 %d 份 .ovpn 原文' % len(results))

            seen_key = set()
            for idx, item in enumerate(results, 1):
                row = item['row']
                code = (row.get('country') or '').lower()
                label = country_label(code)
                flag = country_flag(code)
                name = '🏠 %s-%s-%02d' % (flag, label, idx)
                ovpn_nodes.append({
                    'name': name,
                    'group': '🏠 %s OpenVPN' % label,
                    'country': code,
                    'host': item['parsed']['server'],
                    'port': item['parsed']['port'],
                    'speed': row.get('checkerMeasuredThroughputMbps') or 0,
                    'latency': row.get('checkerMeasuredTunnelRttMs') or 0,
                    'raw': item['raw'],
                    'parsed': item['parsed'],
                })
            # 同一台机器的重复配置剔掉
            dedup = []
            for n in ovpn_nodes:
                k = (n['host'], n['port'])
                if k in seen_key:
                    continue
                seen_key.add(k)
                dedup.append(n)
            ovpn_nodes = dedup
            stats['openvpn_dedup'] = len(ovpn_nodes)

    # ---------------- 多协议 ----------------
    if not args.vpn_only:
        for proto in PROTO_PAGES:
            ids = fetch_protocol_ids(proto)
            if args.limit:
                ids = ids[:args.limit]
            uri_list = []
            counter = {'done': 0}
            total = len(ids)

            def work(cid):
                uri, reason = fetch_config_uri(proto, cid)
                counter['done'] += 1
                if counter['done'] % 50 == 0:
                    log('  %s %d/%d' % (proto, counter['done'], total))
                return cid, uri, reason

            with futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
                for cid, uri, reason in pool.map(work, ids):
                    if uri:
                        uri_list.append((cid, uri))

            stats[proto + '_ids'] = len(ids)
            stats[proto + '_ok'] = len(uri_list)
            log('%s 拿到 %d/%d 条可用配置' % (proto, len(uri_list), len(ids)))

            seen = set()
            for idx, (cid, uri) in enumerate(uri_list, 1):
                host, port, remark = endpoint_from_uri(uri, proto)
                if wanted:
                    # 多协议没有国家字段，用 URI 备注里的地名粗筛
                    blob = (remark + ' ' + uri).lower()
                    if not any(w in blob for w in wanted):
                        continue
                key = (proto, host, port)
                if key in seen:
                    continue
                seen.add(key)
                tag = URI_SCHEME[proto].upper()
                proto_nodes.append({
                    'name': '⚡ %s-%02d' % (tag, idx),
                    'group': '⚡ %s 节点' % tag,
                    'proto': proto,
                    'id': cid,
                    'uri': uri,
                    'host': host,
                    'port': port,
                    'remark': remark,
                })

    stats['proto_total'] = len(proto_nodes)
    stats['ovpn_total'] = len(ovpn_nodes)

    # ---------------- 输出 ----------------
    # 纯 URI 订阅
    all_uris = []
    for n in proto_nodes:
        all_uris.append(n['uri'])
    if not args.no_ovpn:
        for n in ovpn_nodes:
            all_uris.append(ovpn_to_uri(n, n['name']))

    with open(os.path.join(sub_dir, 'protocols.txt'), 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(n['uri'] for n in proto_nodes) + '\n')
    with open(os.path.join(sub_dir, 'all.txt'), 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(all_uris) + '\n')
    with open(os.path.join(sub_dir, 'all_base64.txt'), 'w', encoding='utf-8') as fh:
        fh.write(base64.b64encode('\n'.join(all_uris).encode()).decode() + '\n')

    with open(os.path.join(nodes_dir, 'protocols.json'), 'w', encoding='utf-8') as fh:
        json.dump(proto_nodes, fh, ensure_ascii=False, indent=1)
    with open(os.path.join(nodes_dir, 'ovpn_nodes.json'), 'w', encoding='utf-8') as fh:
        json.dump([{k: v for k, v in n.items() if k != 'raw'} for n in ovpn_nodes],
                  fh, ensure_ascii=False, indent=1)

    if ovpn_nodes or proto_nodes:
        build_clash(ovpn_nodes, proto_nodes, os.path.join(sub_dir, 'clash.yaml'))
    if proto_nodes:
        build_singbox(proto_nodes, os.path.join(sub_dir, 'singbox.json'))

    with open(os.path.join(nodes_dir, 'stats.json'), 'w', encoding='utf-8') as fh:
        json.dump(stats, fh, ensure_ascii=False, indent=1)

    lines = ['# PublicVPNList 抓取报告', '']
    lines.append('生成时间：%s' % time.strftime('%Y-%m-%d %H:%M:%S'))
    lines.append('')
    for k, v in stats.items():
        lines.append('- %s: %s' % (k, v))
    with open(os.path.join(nodes_dir, 'report.md'), 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(lines) + '\n')

    log('完成。输出目录：%s' % out_dir)
    for k, v in stats.items():
        log('  %-24s %s' % (k, v))


if __name__ == '__main__':
    main()
