#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""sync_3xui.py 的离线自测：不联网、不碰真实面板

覆盖三块：
  1. share URI -> 3x-ui inbound 载荷（这是最容易出脏数据的地方）
  2. 生成的 inbound 是否落在 3x-ui 的协议白名单里（源码 model.go 写死的那 13 个）
  3. XUI 客户端对面板各种响应的处理（3x-ui 失败也是 HTTP 200，只看 success）
"""

import json
import os
import sys
import types

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sync_3xui as S  # noqa: E402

PASS = FAIL = 0


def check(name, cond, detail=''):
    global PASS, FAIL
    if cond:
        PASS += 1
        print('  ✅ %s' % name)
    else:
        FAIL += 1
        print('  ❌ %s%s' % (name, (' — ' + str(detail)) if detail else ''))


def b64u(s):
    import base64
    return base64.b64encode(s.encode()).decode().rstrip('=')


# ---------------------------------------------------------------- 1. URI 解析
print('\n[1] share URI -> inbound 载荷')

cases = {
    'vless-reality': 'vless://814bd064-544d-4255-a070-5705c03f6da9@1.2.3.4:443'
                     '?flow=xtls-rprx-vision&fp=chrome'
                     '&pbk=k2hPp0tTW0Da-HK94wYpSCLbuK44LfGqC2MSJIM1Ti0&security=reality'
                     '&sid=48050fab&sni=www.apple.com&type=tcp#vless-01',
    'vless-ws-tls': 'vless://814bd064-544d-4255-a070-5705c03f6da9@5.6.7.8:80'
                    '?type=ws&path=%2Fws&host=ws.example.com&security=tls&sni=ws.example.com#vless-ws',
    'vless-grpc': 'vless://814bd064-544d-4255-a070-5705c03f6da9@9.9.9.9:443'
                  '?type=grpc&serviceName=grpcSvc&security=tls&sni=g.example.com#vless-grpc',
    'trojan-tls': 'trojan://mypassword@1.2.3.4:443?security=tls&sni=t.example.com#trojan-01',
    'trojan-ws': 'trojan://mypassword@1.2.3.4:443?type=ws&path=%2Ftp&security=tls&sni=t.example.com#trojan-ws',
    'ss-base64': 'ss://%s@5.6.7.8:8388#ss-01' % b64u('chacha20-ietf-poly1305:pass123'),
    'ss-plain': 'ss://aes-256-gcm:plainpass@5.6.7.8:8388#ss-02',
    'hysteria2': 'hysteria2://mypassword@9.9.9.9:443?sni=hy.example.com&insecure=1#hy2-01',
    'vmess-ws': 'vmess://' + b64u(json.dumps({
        'v': '2', 'ps': 'vmess-01', 'add': '7.7.7.7', 'port': '443',
        'id': 'b831381d-6324-4d53-ad4f-8cda48b30811', 'aid': '0', 'scy': 'auto',
        'net': 'ws', 'host': 'vm.example.com', 'path': '/vmess',
        'tls': 'tls', 'sni': 'vmess.example.com'})) + '#vmess-01',
    'vmess-tcp': 'vmess://' + b64u(json.dumps({
        'v': '2', 'add': '8.8.8.8', 'port': '443',
        'id': 'b831381d-6324-4d53-ad4f-8cda48b30811', 'aid': '0',
        'net': 'tcp', 'tls': ''})) + '#vmess-tcp',
}

bad_cases = {
    '空字符串': '',
    '没有 ://': 'not-a-uri',
    'vmess 坏 base64': 'vmess://!!!!notbase64',
    '未知协议': 'socks5://user:pass@1.2.3.4:1080',
    'snell': 'snell://pass@1.2.3.4:443?obfs=http#snell-01',
}

parsed = {}
for name, uri in cases.items():
    p = S.parse_uri(uri)
    parsed[name] = p
    check('%s 解析成功' % name, p is not None)
    if p:
        proto, settings, stream = p
        # 关键：协议必须在 3x-ui 的白名单里，否则面板直接拒
        check('  %s 协议在白名单内 (%s)' % (name, proto), proto in S.XUI_PROTOCOLS, proto)
        # settings/stream 必须能 JSON 序列化，否则 api 会 400
        try:
            json.dumps(settings, ensure_ascii=False)
            json.dumps(stream, ensure_ascii=False)
            check('  %s settings/stream 可序列化' % name, True)
        except Exception as exc:  # noqa: BLE001
            check('  %s settings/stream 可序列化' % name, False, exc)

print('\n[2] 坏输入必须返回 None（不能塞脏数据进面板）')
for name, uri in bad_cases.items():
    check('%s -> None' % name, S.parse_uri(uri) is None, S.parse_uri(uri))

print('\n[3] 关键字段正确性')
p = parsed['vless-reality']
check('REALITY 公钥落进 streamSettings',
      'k2hPp0tTW0Da-HK94wYpSCLbuK44LfGqC2MSJIM1Ti0' in json.dumps(p[2]),
      json.dumps(p[2]))
check('REALITY shortId', '48050fab' in json.dumps(p[2]))
check('REALITY serverName', 'www.apple.com' in json.dumps(p[2]))
check('REALITY 走 realitySettings 不是 tlsSettings',
      'realitySettings' in p[2] and 'tlsSettings' not in p[2], p[2])
check('REALITY 没污染成空 tlsSettings', 'tlsSettings' not in p[2], p[2])
check('vless flow 落到 client', p[1]['clients'][0].get('flow') == 'xtls-rprx-vision', p[1])
check('vless decryption=none', p[1].get('decryption') == 'none')

p = parsed['vless-ws-tls']
check('ws path 解析', p[2].get('wsSettings', {}).get('path') == '/ws', p[2])
check('ws host 解析', p[2].get('wsSettings', {}).get('headers', {}).get('Host') == 'ws.example.com', p[2])

p = parsed['vless-grpc']
check('grpc serviceName', p[2].get('grpcSettings', {}).get('serviceName') == 'grpcSvc', p[2])

p = parsed['trojan-tls']
check('trojan password', p[1]['clients'][0]['password'] == 'mypassword', p[1])
check('trojan sni', p[2].get('tlsSettings', {}).get('serverName') == 't.example.com', p[2])

p = parsed['ss-base64']
check('ss 解密出 method', p[1]['method'] == 'chacha20-ietf-poly1305', p[1])
check('ss 解密出 password', p[1]['password'] == 'pass123', p[1])

p = parsed['ss-plain']
check('ss 明文 method', p[1]['method'] == 'aes-256-gcm', p[1])
check('ss 明文 password', p[1]['password'] == 'plainpass', p[1])

p = parsed['hysteria2']
check('hy2 协议映射成 hysteria', p[0] == 'hysteria', p[0])
check('hy2 version=2', p[1].get('version') == 2, p[1])
check('hy2 sni', p[2].get('tlsSettings', {}).get('serverName') == 'hy.example.com', p[2])

p = parsed['vmess-ws']
check('vmess uuid', p[1]['clients'][0]['id'] == 'b831381d-6324-4d53-ad4f-8cda48b30811', p[1])
check('vmess network=ws', p[2].get('network') == 'ws', p[2])
check('vmess ws path', p[2].get('wsSettings', {}).get('path') == '/vmess', p[2])

p = parsed['vmess-tcp']
check('vmess 无 tls 时 security=none', p[2].get('security') == 'none', p[2])

# ---------------------------------------------------------------- 4. inbound 载荷
print('\n[4] inbound 载荷结构（对齐 model.Inbound json tag）')
payload = S.build_inbound('🏠 TEST-01', 'pvl-home-vless-0', 'vless', 20000,
                          parsed['vless-reality'][1], parsed['vless-reality'][2])
required = ['remark', 'tag', 'enable', 'protocol', 'port', 'listen',
            'settings', 'streamSettings', 'sniffing', 'trafficReset', 'expiryTime', 'total']
for key in required:
    check('含字段 %s' % key, key in payload)
check('settings 是字符串（面板要 JSON string）', isinstance(payload['settings'], str))
check('streamSettings 是字符串', isinstance(payload['streamSettings'], str))
check('sniffing 是字符串', isinstance(payload['sniffing'], str))
check('tag 带管理前缀', payload['tag'].startswith(S.MANAGED_PREFIX), payload['tag'])
check('protocol 在白名单', payload['protocol'] in S.XUI_PROTOCOLS)
check('端口合法', 0 < payload['port'] <= 65535)
check('整包可 JSON 序列化', bool(json.dumps(payload, ensure_ascii=False)))

# ---------------------------------------------------------------- 5. 白名单对齐源码
print('\n[5] 协议白名单与 3x-ui 源码一致')
expected = {'vmess', 'vless', 'trojan', 'shadowsocks', 'wireguard', 'hysteria',
            'http', 'mixed', 'tunnel', 'tun', 'mtproto', 'amneziawg', 'tuic'}
check('白名单完全匹配', set(S.XUI_PROTOCOLS) == expected,
      set(S.XUI_PROTOCOLS) ^ expected)
check('openvpn 确实不在白名单（这是设计事实，不是 bug）',
      'openvpn' not in S.XUI_PROTOCOLS)

# ---------------------------------------------------------------- 6. 面板响应处理
print('\n[6] 面板响应处理（3x-ui 失败也是 HTTP 200）')
ok, msg = S.check_api({'success': True, 'msg': 'ok', 'obj': {'id': 1}}, 'add')
check('success=true 判定成功', ok is True)
ok, msg = S.check_api({'success': False, 'msg': '端口冲突'}, 'add')
check('success=false 判定失败且带出 msg', ok is False and msg == '端口冲突', msg)
ok, msg = S.check_api({'success': False}, 'add')
check('无 msg 时兜底', ok is False and msg == '未知错误', msg)
ok, _ = S.check_api('not a dict', 'add')
check('非对象响应不崩', ok is False)

# ---------------------------------------------------------------- 7. 状态与清理边界
print('\n[7] 只清理自己建的 inbound')


class FakeXUI:
    """假面板：记录删除调用，验证绝不动手工建的 inbound"""

    def __init__(self, inbounds):
        self.inbounds = inbounds
        self.deleted = []

    def list_inbounds(self):
        return self.inbounds

    def del_inbound(self, iid):
        self.deleted.append(iid)
        return {'success': True, 'msg': 'ok'}

    def restart_xray(self):
        return {'success': True, 'msg': 'ok'}


mixed = [
    {'id': 1, 'tag': 'pvl-home-vless-0'},
    {'id': 2, 'tag': 'pvl-home-trojan-1'},
    {'id': 3, 'tag': 'my-own-vless'},        # 手工建的，绝不能删
    {'id': 4, 'tag': 'my-own-trojan'},
    {'id': 5, 'tag': ''},
]
fx = FakeXUI(mixed)
n = S.clear_managed(fx, {'managed': []})
check('删掉了 2 个自建的', n == 2, n)
check('删除 id 正确', fx.deleted == [1, 2], fx.deleted)
check('手工建的没被碰', 3 not in fx.deleted and 4 not in fx.deleted)

print('\n[8] .ovpn 解析')


def mk_ovpn(host='106.136.100.245', port='1946', proto='tcp',
            cipher='AES-128-CBC', auth='SHA1', with_certs=True):
    t = ['client', 'dev tun', 'proto %s' % proto, 'remote %s %s' % (host, port),
         'cipher %s' % cipher, 'auth %s' % auth, 'resolv-retry infinite',
         'nobind', 'persist-key', 'persist-tun', 'verb 3']
    if with_certs:
        t += ['<ca>', '-----BEGIN CERTIFICATE-----', 'MIIFazCCA1Og', '-----END CERTIFICATE-----', '</ca>',
              '<cert>', '-----BEGIN CERTIFICATE-----', 'MIIBZzCCAQ2g', '-----END CERTIFICATE-----', '</cert>',
              '<key>', '-----BEGIN PRIVATE KEY-----', 'MIGHAgEAMBMG', '-----END PRIVATE KEY-----', '</key>']
    return '\n'.join(t) + '\n'


p = S.parse_ovpn(mk_ovpn())
check('host 正确', p and p['host'] == '106.136.100.245', p and p['host'])
check('port 正确', p and p['port'] == 1946, p and p['port'])
check('proto 正确', p and p['proto'] == 'tcp')
check('cipher 正确', p and p['cipher'] == 'AES-128-CBC')
check('auth 正确', p and p['auth'] == 'SHA1')
check('ca 抽到', p and 'BEGIN CERTIFICATE' in p['ca'])
check('key 抽到', p and 'BEGIN PRIVATE KEY' in p['key'])
check('无 remote -> None', S.parse_ovpn('client\ndev tun\n') is None)
check('空 -> None', S.parse_ovpn('') is None)
check('None -> None', S.parse_ovpn(None) is None)

print('\n[9] 配置文件写入（要剔掉会冲突的指令）')
import tempfile
tmpd = tempfile.mkdtemp()
conf = os.path.join(tmpd, 't.ovpn')
raw = mk_ovpn() + 'up /etc/openvpn/up.sh\ndown /etc/openvpn/down.sh\n' \
                  'redirect-gateway def1\nscript-security 3\nroute 10.0.0.0 255.0.0.0\n'
S.ovpn_write_conf(S.parse_ovpn(raw), conf)
body = open(conf, encoding='utf-8').read()
check('剔掉 up 脚本', 'up /etc/openvpn/up.sh' not in body)
check('剔掉 redirect-gateway', 'redirect-gateway' not in body)
check('剔掉 route', '\nroute 10.0.0.0' not in body)
check('保留 remote', 'remote 106.136.100.245 1946' in body)
check('加了 route-nopull', 'route-nopull' in body)
check('保留 ca 块', 'BEGIN CERTIFICATE' in body)

print('\n──────────────────────────────')
print('通过 %d / 失败 %d' % (PASS, FAIL))
sys.exit(1 if FAIL else 0)
