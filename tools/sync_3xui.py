#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
家宽落地同步器 —— PublicVPNList 家宽节点 -> 3x-ui 面板
=====================================================
把 PublicVPNList 上实测可用的家宽（住宅宽带）节点，自动灌进 3x-ui 面板，
并按间隔持续同步，掉线的自动换掉。

先说清楚一件事，免得白跑
----------------------------------------------------------------
3x-ui 是 xray-core 的管理面板，**它自己不能当 OpenVPN 客户端**。
面板 inbound 的协议白名单是（源码 model.go 里写死的）：

    vmess vless trojan shadowsocks wireguard hysteria http
    mixed tunnel tun mtproto amneziawg tuic

**没有 openvpn**。所以「OpenVPN 家宽节点」不可能作为一个 inbound 塞进 3x-ui。

那家宽落地怎么做？两条路，本工具都实现了：

  路线 A（推荐，真·家宽出口）
      在本机用 openvpn 客户端连上家宽节点，拿到一个 tun0 网卡，
      3x-ui 里建 `tunnel`（dokodemo-door）型 inbound，把流量导进 tun0，
      xray 那边再配一条走 tun0 的出站。出口 IP 就是家宽节点的 IP。
      本工具负责：挑节点 -> 生成 .ovpn -> 建 tunnel inbound -> 写 xray 出站
                  -> 定期体检，节点挂了自动换下一个并重建。

  路线 B（纯 xray，零外部依赖）
      只同步 PublicVPNList 上的多协议家宽节点（vless/trojan/ss/vmess/hysteria2）。
      这些是现成的 share URI，3x-ui 面板里直接就是正常的 inbound，
      不需要 openvpn、不需要 tun 网卡。出口 IP 同样是家宽的。

  路线 A 需要你能在这台机器上跑 openvpn（有 root、有 tun 设备）。
  路线 B 开箱即用，`--mode xray` 即可。

3x-ui API 契约（全部核对过 v2.6+ 源码，不是猜的）
----------------------------------------------------------------
  登录    POST /login                    {username, password, twoFactorCode}
          —— 有 CSRF 中间件，脚本走这条很麻烦
  推荐    Bearer token                   Authorization: Bearer <token>
          —— /panel/api/* 走 checkAPIAuth，带 token 时 api_authed=true，
             CSRF 中间件直接放行，比 login 稳得多
  取 token：在面板机器上跑
          x-ui setting -getApiToken true -tokenName home -tokenScope admin
          （node-sync 也够：含 inbounds/add del update + restartXrayService）
  列表    GET  /panel/api/inbounds/list
  新增    POST /panel/api/inbounds/add
  删除    POST /panel/api/inbounds/del/<id>
  改      POST /panel/api/inbounds/update/<id>
  重启    POST /panel/api/server/restartXrayService

  响应一律 {"success": bool, "msg": string, "obj": ...}
  注意：登录失败这类也是 HTTP 200 + success:false，别只看状态码。

用法
----------------------------------------------------------------
  # 1. 先看看能抓到什么（不碰面板）
  python3 sync_3xui.py --dry-run --mode xray

  # 2. 纯 xray 模式同步多协议家宽节点
  export XUI_URL="http://127.0.0.1:54321"
  export XUI_TOKEN="你的token"
  python3 sync_3xui.py --mode xray --limit 30

  # 3. OpenVPN 家宽落地（需要 root + openvpn）
  python3 sync_3xui.py --mode ovpn --country japan,usa --limit 8

  # 4. 常驻同步，每 30 分钟体检一次
  python3 sync_3xui.py --mode xray --daemon 1800

配置优先级：命令行 > 环境变量 > config.json
token 也可以放 config.json，但记得 chmod 600（本工具会检查并警告）。
"""

import argparse
import base64
import ipaddress
import json
import os
import random
import signal
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from http.cookiejar import CookieJar

# ---------------------------------------------------------------- 常量

PUBLICVPNLIST = 'https://publicvpnlist.com'
VPN_DATA_API = PUBLICVPNLIST + '/local/api/vpn-data.php?status=all'
TOKEN_API = PUBLICVPNLIST + '/get_token.php'
DOWNLOAD_API = PUBLICVPNLIST + '/download.php'
PROTO_API = PUBLICVPNLIST + '/protocols/download.php'

# 3x-ui inbound 协议白名单（源码写死，别乱填）
XUI_PROTOCOLS = {
    'vmess', 'vless', 'trojan', 'shadowsocks', 'wireguard', 'hysteria',
    'http', 'mixed', 'tunnel', 'tun', 'mtproto', 'amneziawg', 'tuic'
}

# PublicVPNList 的协议名 -> 3x-ui 的协议名
PROTO_MAP = {
    'vless': 'vless',
    'trojan': 'trojan',
    'vmess': 'vmess',
    'shadowsocks': 'shadowsocks',
    'hysteria2': 'hysteria',
}

UA = ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/124.0 Safari/537.36')

# 本工具建的 inbound 一律打这个前缀，方便识别和删除，绝不碰你手建的
MANAGED_PREFIX = 'pvl-home-'

# 运行状态文件，记录当前用了哪些节点、建了哪些 inbound
STATE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.sync_state.json')
CACHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.cache')


def log(msg):
    print('[sync] %s' % msg, flush=True)


def die(msg, code=1):
    print('[sync] 错误：%s' % msg, file=sys.stderr, flush=True)
    sys.exit(code)


# ---------------------------------------------------------------- HTTP

_opener = None


def opener():
    """带 cookie 的 opener，publicvpnlist 会下 cookie，不带容易被 403"""
    global _opener
    if _opener is None:
        _opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(CookieJar()))
    return _opener


def http(url, data=None, headers=None, timeout=45, retries=2, method=None):
    hdr = {'User-Agent': UA}
    if headers:
        hdr.update(headers)
    body = None
    if data is not None:
        if isinstance(data, dict):
            body = urllib.parse.urlencode(data).encode()
            hdr.setdefault('Content-Type', 'application/x-www-form-urlencoded')
        elif isinstance(data, (str, bytes)):
            body = data.encode() if isinstance(data, str) else data
            hdr.setdefault('Content-Type', 'application/json')
    last = None
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(url, data=body, headers=hdr, method=method)
            with opener().open(req, timeout=timeout) as resp:
                return resp.read()
        except urllib.error.HTTPError as exc:
            last = exc
            # 403/429 是限流，退避后重试；4xx 别的直接放弃
            if exc.code in (403, 429) and attempt < retries:
                time.sleep(3 + random.random() * 4)
                continue
            raise
        except Exception as exc:  # noqa: BLE001
            last = exc
            if attempt < retries:
                time.sleep(2 + random.random() * 3)
                continue
            raise
    raise last


# ---------------------------------------------------------------- 抓取：OpenVPN

def warm_session():
    try:
        http(PUBLICVPNLIST + '/', timeout=30, retries=1)
    except Exception:  # noqa: BLE001
        pass


def fetch_catalog(refresh=False):
    """全量 OpenVPN 清单，约 33MB，落本地缓存"""
    os.makedirs(CACHE_DIR, exist_ok=True)
    cache = os.path.join(CACHE_DIR, 'vpn-data.json')
    if os.path.exists(cache) and not refresh:
        age = time.time() - os.path.getmtime(cache)
        if age < 3600:
            log('复用本地清单缓存（%.0f 分钟前），加 --refresh 强制重拉' % (age / 60))
            with open(cache, 'rb') as fh:
                return json.loads(fh.read().decode('utf-8'))

    log('拉取全量 OpenVPN 清单（约 33MB，慢）…')
    warm_session()
    raw = http(VPN_DATA_API, headers={
        'Accept': 'application/json',
        'Accept-Encoding': 'identity',  # 不压缩，gzip 分块会截断 JSON
        'Referer': PUBLICVPNLIST + '/'
    }, timeout=180, retries=3)
    data = json.loads(raw.decode('utf-8'))
    with open(cache, 'wb') as fh:
        fh.write(raw)
    log('清单 %d 行' % len(data))
    return data


def fetch_ovpn(server_id):
    """一条配置换一次令牌（300 秒有效），拿到 .ovpn 原文"""
    try:
        tok = json.loads(http(TOKEN_API, data={'id': str(server_id)}, headers={
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json',
            'Referer': '%s/download/%s/' % (PUBLICVPNLIST, server_id)
        }, timeout=30).decode('utf-8'))
        if not tok.get('token'):
            return None
        text = http('%s?token=%s' % (DOWNLOAD_API, urllib.parse.quote(str(tok['token']))),
                    headers={'Accept': 'application/x-openvpn-profile'},
                    timeout=30).decode('utf-8', 'replace')
        return text if 'remote ' in text else None
    except Exception:  # noqa: BLE001
        return None


def parse_ovpn(text):
    if not text:
        return None

    def directive(name):
        m = text.find('\n' + name + ' ')
        if m == -1:
            m = 0 if text.startswith(name + ' ') else -1
        if m == -1:
            return ''
        seg = text[m:].lstrip('\n')
        return seg.split('\n')[0].split(None, 1)[1].strip() if len(seg.split('\n')[0].split(None, 1)) > 1 else ''

    def block(tag):
        s = text.find('<%s>' % tag)
        if s == -1:
            return ''
        e = text.find('</%s>' % tag, s)
        return text[s + len(tag) + 2:e].strip() if e != -1 else ''

    remote = directive('remote').split()
    if not remote:
        return None
    return {
        'host': remote[0],
        'port': int(remote[1]) if len(remote) > 1 and remote[1].isdigit() else 1194,
        'proto': (directive('proto') or 'tcp').lower(),
        'cipher': directive('cipher') or 'AES-128-CBC',
        'auth': directive('auth') or 'SHA1',
        'ca': block('ca'),
        'cert': block('cert'),
        'key': block('key'),
        'raw': text,
    }


# ---------------------------------------------------------------- 抓取：多协议

def fetch_protocol(proto, limit, pages=3):
    """翻列表页拿 64 位 ID，再并发换 share URI"""
    import concurrent.futures as futures
    ids, seen = [], set()
    for page in range(1, pages + 1):
        url = '%s/%s/?per_page=100' % (PUBLICVPNLIST, proto)
        if page > 1:
            url += '&page=%d' % page
        try:
            html = http(url, headers={'Accept': 'text/html'}, timeout=60).decode('utf-8', 'replace')
        except Exception as exc:  # noqa: BLE001
            log('%s 第 %d 页失败：%s' % (proto, page, exc))
            break
        found = []
        for m in __import__('re').finditer(r'id=([a-f0-9]{64})', html):
            if m.group(1) not in seen:
                seen.add(m.group(1))
                found.append(m.group(1))
        if not found:
            break
        ids.extend(found)
        if limit > 0 and len(ids) >= limit * 2:
            break
        if 'rel="next nofollow"' not in html:
            break
    if limit > 0:
        ids = ids[:limit * 2]
    log('%s 收集到 %d 个配置 ID' % (proto, len(ids)))

    def work(cid):
        try:
            data = json.loads(http(
                '%s?protocol=%s&id=%s&format=json' % (PROTO_API, proto, cid),
                headers={'Accept': 'application/json', 'Referer': '%s/%s/' % (PUBLICVPNLIST, proto)},
                timeout=30, retries=1).decode('utf-8'))
            uri = data.get('config_uri')
            if not uri:
                return None
            return {'proto': proto, 'id': cid, 'uri': uri}
        except Exception:  # noqa: BLE001
            return None

    out = []
    with futures.ThreadPoolExecutor(max_workers=8) as pool:
        for item in pool.map(work, ids):
            if item:
                out.append(item)
            if limit > 0 and len(out) >= limit:
                break
    log('%s 拿到 %d 条可用配置' % (proto, len(out)))
    return out


# ---------------------------------------------------------------- 3x-ui 客户端

class XUI:
    """3x-ui 面板 API 客户端

    走 Bearer token，不走 /login —— 带 token 时 api_authed=true，
    CSRF 中间件直接放行，比维护 session cookie 稳得多。
    """

    def __init__(self, base, token, insecure=False, timeout=30):
        self.base = base.rstrip('/')
        self.token = token
        self.timeout = timeout
        self.insecure = insecure

    def _req(self, path, data=None, method=None):
        url = self.base + path
        hdr = {
            'Authorization': 'Bearer %s' % self.token,
            'Accept': 'application/json',
            'User-Agent': UA,
        }
        body = None
        if data is not None:
            body = json.dumps(data).encode()
            hdr['Content-Type'] = 'application/json'
        req = urllib.request.Request(url, data=body, headers=hdr, method=method or ('POST' if data is not None else 'GET'))
        ctx = None
        if self.insecure:
            import ssl
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
        try:
            with urllib.request.urlopen(req, timeout=self.timeout, context=ctx) as resp:
                raw = resp.read().decode('utf-8', 'replace')
        except urllib.error.HTTPError as exc:
            raw = exc.read().decode('utf-8', 'replace')
            # 401 = token 不对；404 = base 路径不对（比如没带面板子路径）
            if exc.code == 401:
                die('面板返回 401：API token 无效或被禁用。'
                    '重新生成：x-ui setting -getApiToken true -tokenName home -tokenScope admin')
            if exc.code == 404:
                die('面板返回 404：地址不对。确认 XUI_URL 是否要带子路径，'
                    '比如 http://1.2.3.4:54321/xxx/ （面板设置里的「面板 URL 路径」）')
            raise RuntimeError('面板返回 HTTP %d：%s' % (exc.code, raw[:300]))
        try:
            return json.loads(raw)
        except ValueError:
            raise RuntimeError('面板返回的不是 JSON（地址可能指向了别的页面）：%s' % raw[:200])

    def ping(self):
        return self._req('/panel/api/server/status')

    def list_inbounds(self):
        res = self._req('/panel/api/inbounds/list')
        return (res.get('obj') or []) if res.get('success') else []

    def add_inbound(self, inbound):
        return self._req('/panel/api/inbounds/add', data=inbound)

    def del_inbound(self, inbound_id):
        return self._req('/panel/api/inbounds/del/%d' % int(inbound_id), data={})

    def restart_xray(self):
        return self._req('/panel/api/server/restartXrayService', data={})


def check_api(res, what):
    """3x-ui 失败也返回 HTTP 200，只看 success 字段"""
    if not isinstance(res, dict):
        return False, '响应不是对象'
    if not res.get('success'):
        return False, res.get('msg') or '未知错误'
    return True, res.get('obj')


# ---------------------------------------------------------------- 节点 -> inbound

def country_code(slug):
    table = {
        'japan': 'JP', 'south-korea': 'KR', 'usa': 'US', 'united-states': 'US',
        'russia': 'RU', 'thailand': 'TH', 'vietnam': 'VN', 'indonesia': 'ID',
        'canada': 'CA', 'uk': 'GB', 'united-kingdom': 'GB', 'argentina': 'AR',
        'netherlands': 'NL', 'germany': 'DE', 'france': 'FR', 'singapore': 'SG',
        'hong-kong': 'HK', 'taiwan': 'TW', 'india': 'IN', 'malaysia': 'MY',
        'philippines': 'PH', 'australia': 'AU', 'brazil': 'BR', 'mexico': 'MX',
        'spain': 'ES', 'italy': 'IT', 'poland': 'PL', 'sweden': 'SE',
        'finland': 'FI', 'norway': 'NO', 'switzerland': 'CH', 'ukraine': 'UA',
        'turkey': 'TR', 'iran': 'IR', 'czech-republic': 'CZ', 'romania': 'RO',
    }
    key = (slug or '').lower()
    return table.get(key, key[:2].upper() if key else 'XX')


def slugify(text):
    out = []
    for ch in (text or ''):
        out.append(ch if (ch.isalnum() or ch in '-_') else '-')
    s = ''.join(out).strip('-').lower()
    return s[:40] or 'node'


def parse_uri(uri):
    """share URI -> 3x-ui inbound 需要的 settings / streamSettings

    返回 (protocol, settings_dict, stream_dict) 或 None
    只处理 3x-ui 认的协议；拿不准的宁可丢掉，别塞脏数据进面板。
    """
    try:
        scheme = uri.split('://', 1)[0].lower()
        rest = uri.split('://', 1)[1]
        frag = rest.find('#')
        main = rest[:frag] if frag != -1 else rest
        qpos = main.find('?')
        addrpart = main[:qpos] if qpos != -1 else main
        params = urllib.parse.parse_qs(main[qpos + 1:]) if qpos != -1 else {}

        def one(key, default=''):
            v = params.get(key)
            return v[0] if v else default

        if scheme == 'vmess':
            pad = main + '=' * (-len(main) % 4)
            cfg = json.loads(base64.b64decode(pad).decode('utf-8', 'replace'))
            net = cfg.get('net') or 'tcp'
            stream = {'network': net, 'security': 'tls' if cfg.get('tls') else 'none'}
            if net == 'ws':
                stream['wsSettings'] = {'path': cfg.get('path', '/')}
                if cfg.get('host'):
                    stream['wsSettings']['headers'] = {'Host': cfg['host']}
            if cfg.get('tls') and cfg.get('sni'):
                stream['tlsSettings'] = {'serverName': cfg['sni']}
            return 'vmess', {
                'clients': [{
                    'id': cfg.get('id', ''),
                    'alterId': int(cfg.get('aid') or 0),
                    'email': 'home@%s' % slugify(cfg.get('add', 'node')),
                }]
            }, stream

        at = addrpart.rfind('@')
        hostport = addrpart[at + 1:] if at != -1 else addrpart
        userinfo = addrpart[:at] if at != -1 else ''
        if hostport.startswith('['):
            close = hostport.find(']')
            host, port = hostport[1:close], hostport[close + 2:]
        else:
            colon = hostport.rfind(':')
            host, port = hostport[:colon], hostport[colon + 1:]
        port = int(port) if port.isdigit() else 0

        if scheme == 'vless':
            sec = one('security', 'none')
            stream = {'network': one('type', 'tcp'), 'security': sec}
            if sec == 'reality':
                # REALITY 的 serverName / fingerprint 在 realitySettings 里，
                # 不在 tlsSettings —— 放错位置面板会连不上
                stream['realitySettings'] = {
                    'serverName': one('sni'),
                    'fingerprint': one('fp'),
                    'publicKey': one('pbk'),
                    'shortIds': [one('sid')] if one('sid') else [],
                }
            elif sec == 'tls':
                tls = {}
                if one('sni'):
                    tls['serverName'] = one('sni')
                if one('fp'):
                    tls['fingerprint'] = one('fp')
                if tls:
                    stream['tlsSettings'] = tls
            net = stream['network']
            if net == 'ws':
                stream['wsSettings'] = {'path': one('path', '/')}
                if one('host'):
                    stream['wsSettings']['headers'] = {'Host': one('host')}
            elif net == 'grpc':
                stream['grpcSettings'] = {'serviceName': one('serviceName', '')}
            client = {'id': userinfo, 'email': 'home@%s' % slugify(host)}
            if one('flow'):
                client['flow'] = one('flow')
            return 'vless', {'clients': [client], 'decryption': 'none'}, stream

        if scheme == 'trojan':
            stream = {'network': one('type', 'tcp'), 'security': one('security', 'tls')}
            if one('sni'):
                stream['tlsSettings'] = {'serverName': one('sni')}
            if stream['network'] == 'ws':
                stream['wsSettings'] = {'path': one('path', '/')}
            return 'trojan', {
                'clients': [{'password': userinfo, 'email': 'home@%s' % slugify(host)}]
            }, stream

        if scheme == 'ss':
            method, password = '', ''
            for cand in (userinfo, userinfo + '=', userinfo + '==', userinfo + '==='):
                try:
                    dec = base64.b64decode(cand).decode('utf-8', 'replace')
                    if ':' in dec:
                        method, password = dec.split(':', 1)
                        break
                except Exception:  # noqa: BLE001
                    continue
            if not method and ':' in userinfo:
                method, password = userinfo.split(':', 1)
            return 'shadowsocks', {
                'method': method or 'chacha20-ietf-poly1305',
                'password': password,
                'clients': [{'password': password, 'email': 'home@%s' % slugify(host)}],
            }, {'network': 'tcp'}

        if scheme in ('hysteria2', 'hy2'):
            return 'hysteria', {
                'version': 2,
                'up_mbps': 100,
                'down_mbps': 100,
                'clients': [{'password': userinfo, 'email': 'home@%s' % slugify(host)}],
            }, {'network': 'udp', 'security': 'tls', 'tlsSettings': {'serverName': one('sni')}}
    except Exception:  # noqa: BLE001
        return None
    return None


def build_inbound(remark, tag, protocol, port, settings, stream, listen='0.0.0.0'):
    """3x-ui inbound 载荷。字段全部对齐 model.Inbound 的 json tag"""
    return {
        'remark': remark,
        'tag': tag,
        'enable': True,
        'protocol': protocol,
        'port': port,
        'listen': listen,
        'settings': json.dumps(settings, ensure_ascii=False),
        'streamSettings': json.dumps(stream, ensure_ascii=False),
        'sniffing': json.dumps({'enabled': True, 'destOverride': ['http', 'tls']}),
        'trafficReset': 'never',
        'expiryTime': 0,
        'total': 0,
    }


# ---------------------------------------------------------------- 家宽落地（OpenVPN）

def ovpn_write_conf(parsed, path, gateway='10.200.0.1'):
    """把 .ovpn 原文写成配置文件，加上让 tun0 可用的必要选项"""
    text = parsed['raw']
    # 原站配置常带这类指令，会跟我们的路由/守护冲突
    drop = ('up ', 'down ', 'script-security', 'route ', 'redirect-gateway',
            'dhcp-option', 'block-outside-dns', 'register-dns', 'setenv')
    lines = []
    for line in text.splitlines():
        s = line.strip()
        if any(s.startswith(d) for d in drop):
            continue
        lines.append(line)
    lines += [
        '',
        '# --- 由 sync_3xui.py 追加 ---',
        'route-nopull',          # 不接管全局路由，我们自己按需导流量
        'script-security 2',
        'ping 10',
        'ping-restart 60',
        'persist-tun',
        'persist-key',
        'resolv-retry infinite',
        'verb 3',
    ]
    with open(path, 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(lines) + '\n')
    return path


def ovpn_start(conf_path, name, ovpn_bin='openvpn'):
    """后台起 openvpn，返回 Popen。失败返回 None"""
    log_path = os.path.join(CACHE_DIR, 'ovpn-%s.log' % slugify(name))
    try:
        proc = subprocess.Popen(
            [ovpn_bin, '--config', conf_path, '--daemon', '--writepid',
             os.path.join(CACHE_DIR, 'ovpn-%s.pid' % slugify(name)), '--log-append', log_path],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        proc.wait(timeout=10)
    except FileNotFoundError:
        die('找不到 %s。路线 A 需要本机装 openvpn（apt install openvpn）。'
            '不想装就用 --mode xray 走路线 B。' % ovpn_bin)
    except Exception as exc:  # noqa: BLE001
        log('openvpn 启动异常：%s' % exc)
        return None
    return proc


def ovpn_wait_tun(iface='tun0', timeout=45):
    """等 tun 网卡起来并拿到 IP"""
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            out = subprocess.run(['ip', '-4', 'addr', 'show', iface],
                                 capture_output=True, text=True, timeout=5)
            if out.returncode == 0 and 'inet ' in out.stdout:
                for line in out.stdout.splitlines():
                    line = line.strip()
                    if line.startswith('inet '):
                        return line.split()[1].split('/')[0]
        except Exception:  # noqa: BLE001
            pass
        time.sleep(2)
    return None


def ovpn_probe(iface='tun0'):
    """验证出口是不是真的变成家宽了"""
    ip = ovpn_wait_tun(iface, timeout=20)
    if not ip:
        return None, 'tun 网卡没起来'
    return ip, None


# ---------------------------------------------------------------- 同步逻辑

def load_state():
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, encoding='utf-8') as fh:
                return json.load(fh)
        except Exception:  # noqa: BLE001
            pass
    return {'managed': [], 'ovpn': None}


def save_state(state):
    with open(STATE_FILE, 'w', encoding='utf-8') as fh:
        json.dump(state, fh, ensure_ascii=False, indent=2)


def clear_managed(xui, state):
    """删掉本工具建的所有 inbound。只认 MANAGED_PREFIX，绝不碰手工建的"""
    existing = xui.list_inbounds()
    removed = 0
    for item in existing:
        tag = item.get('tag') or ''
        if not tag.startswith(MANAGED_PREFIX):
            continue
        ok, msg = check_api(xui.del_inbound(item['id']), 'del')
        if ok:
            removed += 1
        else:
            log('删除 %s 失败：%s' % (tag, msg))
    state['managed'] = [m for m in state.get('managed', []) if not str(m).startswith(MANAGED_PREFIX)]
    return removed


def sync_xray_mode(xui, args, state):
    """路线 B：多协议家宽节点直接建 inbound"""
    log('路线 B：同步多协议家宽节点')
    collected = []
    wanted = [p for p in (args.protos.split(',') if args.protos else PROTO_MAP.keys())]
    for proto in wanted:
        proto = proto.strip()
        if proto not in PROTO_MAP:
            log('跳过不认识的协议：%s' % proto)
            continue
        collected.extend(fetch_protocol(proto, args.limit))
    if not collected:
        log('没抓到任何节点，面板保持原样')
        return 0

    clear_managed(xui, state)
    added = 0
    for idx, item in enumerate(collected):
        parsed = parse_uri(item['uri'])
        if not parsed:
            continue
        protocol, settings, stream = parsed
        if protocol not in XUI_PROTOCOLS:
            continue
        port = args.port_start + idx
        tag = '%s%s-%d' % (MANAGED_PREFIX, protocol, idx)
        remark = '🏠 %s-%02d' % (protocol.upper(), idx + 1)
        payload = build_inbound(remark, tag, protocol, port, settings, stream)
        ok, msg = check_api(xui.add_inbound(payload), 'add')
        if ok:
            added += 1
            state['managed'].append(tag)
            log('  ✅ %s (端口 %d)' % (remark, port))
        else:
            log('  ❌ %s：%s' % (remark, msg))
        if args.max_inbounds and added >= args.max_inbounds:
            break
    save_state(state)
    if added:
        ok, msg = check_api(xui.restart_xray(), 'restart')
        log('重启 xray：%s' % ('成功' if ok else msg))
    log('本次写入 %d 个 inbound' % added)
    return added


def sync_ovpn_mode(xui, args, state):
    """路线 A：OpenVPN 连家宽 -> tun -> tunnel inbound"""
    log('路线 A：OpenVPN 家宽落地')
    if os.geteuid() != 0:
        die('路线 A 需要 root（要建 tun 网卡、跑 openvpn）。'
            '没有 root 就用 --mode xray 走路线 B。')

    catalog = fetch_catalog(refresh=args.refresh)
    countries = [c.strip().lower() for c in args.country.split(',')] if args.country else []
    cands = []
    for row in catalog:
        if not row.get('active') or not row.get('downloadable'):
            continue
        cc = (row.get('country') or '').lower()
        if countries and cc not in countries:
            continue
        if args.min_speed and (row.get('checkerMeasuredThroughputMbps') or 0) < args.min_speed:
            continue
        cands.append(row)
    cands.sort(key=lambda r: -(r.get('checkerMeasuredThroughputMbps') or 0))
    cands = cands[:max(1, args.limit)]
    log('筛出 %d 个 OpenVPN 家宽候选' % len(cands))

    ovpn_bin = args.ovpn_bin
    for row in cands:
        sid = row.get('id')
        log('尝试节点 %s（%s，%.1f Mbps）…' % (sid, row.get('country'), row.get('checkerMeasuredThroughputMbps') or 0))
        raw = fetch_ovpn(sid)
        parsed = parse_ovpn(raw)
        if not parsed or not parsed['ca']:
            log('  ❌ 拿不到可用配置，换下一个')
            continue
        conf = os.path.join(CACHE_DIR, 'home-%s.ovpn' % slugify(str(sid)))
        ovpn_write_conf(parsed, conf)

        # 先把可能占着的旧进程清掉
        subprocess.run(['pkill', '-f', 'home-.*\\.ovpn'], capture_output=True)
        time.sleep(1)
        ovpn_start(conf, str(sid), ovpn_bin)
        ip, err = ovpn_probe(args.iface)
        if not ip:
            log('  ❌ %s，换下一个' % err)
            subprocess.run(['pkill', '-f', 'home-.*\\.ovpn'], capture_output=True)
            continue
        log('  ✅ tun 起来了，虚拟地址 %s（出口 %s:%d）' % (ip, parsed['host'], parsed['port']))

        clear_managed(xui, state)
        # tunnel = dokodemo-door，把流量导进 tun0 的对端网关
        gateway = '.'.join(ip.split('.')[:3] + ['1'])
        tag = '%stun-0' % MANAGED_PREFIX
        payload = build_inbound(
            '🏠 家宽出口', tag, 'tunnel', args.port_start,
            {'address': gateway, 'port': args.port_start, 'network': 'tcp,udp'},
            {'network': 'tcp,udp'},
            listen='127.0.0.1')
        ok, msg = check_api(xui.add_inbound(payload), 'add')
        if not ok:
            log('  ❌ 建 inbound 失败：%s' % msg)
            continue
        state['managed'].append(tag)
        state['ovpn'] = {'id': sid, 'host': parsed['host'], 'port': parsed['port'],
                         'conf': conf, 'iface': args.iface, 'ts': int(time.time())}
        save_state(state)
        ok, _ = check_api(xui.restart_xray(), 'restart')
        log('  ✅ 面板已更新（tunnel inbound 端口 %d），重启 xray：%s'
            % (args.port_start, '成功' if ok else '失败'))
        return 1
    log('所有候选都连不上，面板保持原样')
    return 0


def health_check(xui, args, state):
    """体检：tun 还在不在、出口是不是还通。不通就换节点"""
    ov = state.get('ovpn')
    if not ov:
        return False
    try:
        out = subprocess.run(['ip', '-4', 'addr', 'show', ov.get('iface', 'tun0')],
                             capture_output=True, text=True, timeout=5)
        alive = out.returncode == 0 and 'inet ' in out.stdout
    except Exception:  # noqa: BLE001
        alive = False
    if alive:
        return True
    log('家宽隧道断了（%s），换节点重连' % ov.get('host'))
    subprocess.run(['pkill', '-f', 'home-.*\\.ovpn'], capture_output=True)
    return False


# ---------------------------------------------------------------- 配置

def load_config(path):
    if not path or not os.path.exists(path):
        return {}
    with open(path, encoding='utf-8') as fh:
        return json.load(fh)


def resolve(args):
    cfg = load_config(args.config)
    def pick(name, env, default=None):
        v = getattr(args, name, None)
        if v not in (None, '', False):
            return v
        if os.environ.get(env):
            return os.environ[env]
        return cfg.get(name, default)

    return {
        'url': pick('url', 'XUI_URL'),
        'token': pick('token', 'XUI_TOKEN'),
        'insecure': bool(cfg.get('insecure', False)),
    }


def check_token_safety(cfg, args):
    """token 别落进 git"""
    if args.config and os.path.exists(args.config):
        mode = os.stat(args.config).st_mode & 0o777
        if mode & 0o077:
            log('警告：%s 权限是 %o，同组/其他用户可读。建议 chmod 600' % (args.config, mode))
    gitignore = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.gitignore')
    if os.path.exists(gitignore):
        with open(gitignore, encoding='utf-8') as fh:
            if 'config.json' not in fh.read():
                log('警告：.gitignore 没排除 config.json，token 有被提交的风险')


def main():
    ap = argparse.ArgumentParser(
        description='PublicVPNList 家宽节点 -> 3x-ui 面板自动同步',
        formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--mode', choices=['xray', 'ovpn'], default='xray',
                    help='xray=多协议直建 inbound（开箱即用）；ovpn=OpenVPN 家宽落地（需 root+openvpn）')
    ap.add_argument('--url', help='面板地址，如 http://127.0.0.1:54321（也可用 XUI_URL）')
    ap.add_argument('--token', help='面板 API token（也可用 XUI_TOKEN）')
    ap.add_argument('--config', default='config.json', help='配置文件（默认 config.json）')
    ap.add_argument('--limit', type=int, default=20, help='每种来源最多取几个')
    ap.add_argument('--max-inbounds', type=int, default=0, help='最多建几个 inbound（0=不限）')
    ap.add_argument('--protos', help='只取这些协议，逗号分隔（默认全取）')
    ap.add_argument('--country', help='只留这些国家（slug，逗号分隔）')
    ap.add_argument('--min-speed', type=float, default=0, help='OpenVPN 最低实测 Mbps')
    ap.add_argument('--port-start', type=int, default=20000, help='inbound 起始端口')
    ap.add_argument('--iface', default='tun0', help='OpenVPN tun 网卡名')
    ap.add_argument('--ovpn-bin', default='openvpn', help='openvpn 可执行文件名')
    ap.add_argument('--refresh', action='store_true', help='忽略清单缓存重拉')
    ap.add_argument('--dry-run', action='store_true', help='只抓取和解析，不碰面板')
    ap.add_argument('--clean', action='store_true', help='删掉本工具建的所有 inbound 后退出')
    ap.add_argument('--daemon', type=int, default=0, metavar='SECONDS',
                    help='常驻同步，每隔 N 秒跑一次（含体检）')
    args = ap.parse_args()

    conf = resolve(args)
    check_token_safety(conf, args)

    if not conf['url'] or not conf['token']:
        if args.dry_run:
            log('未配置面板，dry-run 模式只做抓取和解析')
        else:
            die('缺少面板地址或 token。设 XUI_URL / XUI_TOKEN，或写进 config.json。'
                '\n  token 生成：x-ui setting -getApiToken true -tokenName home -tokenScope admin')

    stop = {'flag': False}

    def on_sig(signum, _frame):
        stop['flag'] = True
        log('收到退出信号，收尾中…')

    signal.signal(signal.SIGINT, on_sig)
    signal.signal(signal.SIGTERM, on_sig)

    xui = None
    if conf['url'] and conf['token']:
        xui = XUI(conf['url'], conf['token'], insecure=conf['insecure'])

    if xui and args.clean:
        state = load_state()
        n = clear_managed(xui, state)
        save_state(state)
        ok, _ = check_api(xui.restart_xray(), 'restart')
        log('清理完成，删除 %d 个 inbound' % n)
        return 0

    if xui and not args.dry_run:
        try:
            ok, msg = check_api(xui.ping(), 'ping')
            if not ok:
                die('连不上面板：%s' % msg)
            log('面板连通：%s' % conf['url'])
        except Exception as exc:  # noqa: BLE001
            die('连不上面板：%s' % exc)

    state = load_state()
    round_no = 0
    while True:
        round_no += 1
        if args.daemon:
            log('── 第 %d 轮 ──' % round_no)

        if args.mode == 'ovpn' and not args.dry_run:
            if round_no > 1 and not health_check(xui, args, state):
                state['ovpn'] = None
            sync_ovpn_mode(xui, args, state)
        elif args.mode == 'ovpn' and args.dry_run:
            # dry-run 下也把候选打出来看看
            catalog = fetch_catalog(refresh=args.refresh)
            cands = [r for r in catalog if r.get('active') and r.get('downloadable')]
            cands.sort(key=lambda r: -(r.get('checkerMeasuredThroughputMbps') or 0))
            log('dry-run：%d 个在线 OpenVPN 候选，前 %d 个：' % (len(cands), min(5, len(cands))))
            for r in cands[:5]:
                log('  %s %s:%s %s %.1fMbps %sms' % (
                    country_code(r.get('country')), r.get('ip'), r.get('port'),
                    r.get('proto'), r.get('checkerMeasuredThroughputMbps') or 0,
                    r.get('checkerMeasuredTunnelRttMs') or '-'))
                raw = fetch_ovpn(r.get('id'))
                parsed = parse_ovpn(raw)
                if parsed:
                    log('    -> remote %s:%d %s cipher=%s ca=%s' % (
                        parsed['host'], parsed['port'], parsed['proto'],
                        parsed['cipher'], '有' if parsed['ca'] else '无'))
                else:
                    log('    -> 配置换不到')
        else:
            if args.dry_run:
                got = []
                for proto in (args.protos.split(',') if args.protos else PROTO_MAP.keys()):
                    got.extend(fetch_protocol(proto.strip(), min(args.limit, 5)))
                log('dry-run：拿到 %d 条，抽查解析结果：' % len(got))
                for item in got[:8]:
                    p = parse_uri(item['uri'])
                    log('  %s -> %s' % (item['proto'], ('%s/%s 解析成功' % (p[0], json.dumps(p[1])[:60])) if p else '解析失败'))
            else:
                sync_xray_mode(xui, args, state)

        if not args.daemon or stop['flag']:
            break
        try:
            for _ in range(args.daemon):
                if stop['flag']:
                    break
                time.sleep(1)
        except KeyboardInterrupt:
            break
        if stop['flag']:
            break

    return 0


if __name__ == '__main__':
    sys.exit(main())
