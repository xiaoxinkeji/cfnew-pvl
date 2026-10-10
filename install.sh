#!/usr/bin/env bash
# homesync 一键安装：装二进制、装服务（systemd / OpenRC）、开机自启、配管理菜单。
#
#   bash <(curl -fsSL https://raw.githubusercontent.com/xiaoxinkeji/cfnew-pvl/main/install.sh)
#
# Alpine 默认不带 bash：
#   apk add bash && bash <(curl -fsSL .../install.sh)
#
# 参考了 byJoey/fanout 的 install.sh 结构：init 系统抽象、包管理器分派、
# 重装时不覆盖用户已改的配置。

set -euo pipefail

WORK_DIR="${WORK_DIR:-/var/lib/homesync}"
BIN=/usr/local/bin/homesync
SERVICE=homesync
REPO="${REPO:-xiaoxinkeji/cfnew-pvl}"

# 用户显式给的参数才覆盖已保存的值，重装时沿用原来的选择
MODE_EXPLICIT="${MODE:+1}"
MODE="${MODE:-xray}"
LIMIT_EXPLICIT="${LIMIT:+1}"
LIMIT="${LIMIT:-20}"
COUNTRY_EXPLICIT="${COUNTRY:+1}"
COUNTRY="${COUNTRY:-}"
INTERVAL_EXPLICIT="${INTERVAL:+1}"
INTERVAL="${INTERVAL:-1800}"

if [[ $EUID -ne 0 ]]; then
  echo "需要 root（路线 A 要建 tun 网卡；路线 B 只是写面板，但也统一要求）" >&2
  exit 1
fi

# ── init 系统抽象：systemd 与 OpenRC 两套 ────────────────
INIT_SYS=""
if command -v systemctl >/dev/null 2>&1 && [[ -d /run/systemd/system ]]; then
  INIT_SYS=systemd
elif command -v rc-service >/dev/null 2>&1; then
  INIT_SYS=openrc
else
  echo "不认识的 init 系统（需要 systemd 或 OpenRC）" >&2
  exit 1
fi

# seed_settings 落配置文件。重装时不覆盖用户改过的值：
# 只有这次显式指定的参数才写，其余沿用盘上原值，免得重装一次把配置打回默认。
seed_settings() {
  local f="${WORK_DIR}/settings.json"
  if [[ -f "$f" ]]; then
    local cur_mode cur_limit cur_country cur_interval
    cur_mode=$(sed -n 's/.*"mode"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$f" | head -1)
    cur_limit=$(sed -n 's/.*"limit"[[:space:]]*:[[:space:]]*\([0-9]*\).*/\1/p' "$f" | head -1)
    cur_country=$(sed -n 's/.*"country"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$f" | head -1)
    cur_interval=$(sed -n 's/.*"interval"[[:space:]]*:[[:space:]]*\([0-9]*\).*/\1/p' "$f" | head -1)
    [[ -n $cur_mode    && -z ${MODE_EXPLICIT:-}       ]] && MODE="$cur_mode"
    [[ -n $cur_limit   && -z ${LIMIT_EXPLICIT:-}      ]] && LIMIT="$cur_limit"
    [[ -n $cur_country && -z ${COUNTRY_EXPLICIT:-}    ]] && COUNTRY="$cur_country"
    [[ -n $cur_interval && -z ${INTERVAL_EXPLICIT:-}  ]] && INTERVAL="$cur_interval"
  fi
  mkdir -p "$WORK_DIR"
  cat > "$f" <<EOF
{
  "mode": "${MODE}",
  "limit": ${LIMIT},
  "country": "${COUNTRY}",
  "interval": ${INTERVAL}
}
EOF
  chmod 600 "$f"
}

svc_install() {
  if [[ "$INIT_SYS" == systemd ]]; then
    cat > /etc/systemd/system/${SERVICE}.service <<EOF
[Unit]
Description=homesync - PublicVPNList 家宽节点同步到 3x-ui
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
# 参数由 ${WORK_DIR}/settings.json 决定，服务文件里不写死，
# 免得改完配置一重启又被拽回旧值。
ExecStart=${BIN} -dir ${WORK_DIR}
Restart=on-failure
RestartSec=30
# 退出码 1 表示配置缺失（没装 3x-ui / 没给 token），这种要人去配，
# 无限重试只会刷日志。其余失败（网络抖动、面板临时不通）照常重试。
RestartPreventExitStatus=1
# 路线 A 要给足时间清理 tun 与 openvpn 子进程
TimeoutStopSec=60
KillMode=mixed

[Install]
WantedBy=multi-user.target
EOF
    systemctl daemon-reload
  else
    cat > /etc/init.d/${SERVICE} <<INITEOF
#!/sbin/openrc-run
name="${SERVICE}"
description="homesync - PublicVPNList 家宽节点同步到 3x-ui"
command="${BIN}"
command_args="-dir ${WORK_DIR}"
command_background=true
pidfile="/run/${SERVICE}.pid"
output_log="/var/log/${SERVICE}.log"
error_log="/var/log/${SERVICE}.log"
respawn_delay=30
respawn_max=0
supervisor=supervise-daemon
depend() { need net; after firewall; }
INITEOF
    chmod +x /etc/init.d/${SERVICE}
  fi
}

svc_enable_start() {
  if [[ "$INIT_SYS" == systemd ]]; then
    systemctl enable --now ${SERVICE}
  else
    rc-update add ${SERVICE} default >/dev/null 2>&1 || true
    rc-service ${SERVICE} restart
  fi
}

svc_is_active() {
  if [[ "$INIT_SYS" == systemd ]]; then
    systemctl is-active --quiet ${SERVICE}
  else
    rc-service ${SERVICE} status >/dev/null 2>&1
  fi
}

svc_logs_hint() {
  [[ "$INIT_SYS" == systemd ]] && echo "journalctl -u ${SERVICE} -n 30" || echo "cat /var/log/${SERVICE}.log"
}

echo "[1/5] 检查依赖"

detect_mgr() {
  for m in apt-get dnf yum pacman apk zypper; do
    command -v "$m" >/dev/null && { echo "$m"; return; }
  done
  echo ""
}

install_pkgs() {
  local mgr="$1"; shift
  case "$mgr" in
    apt-get)
      apt-get update -qq
      DEBIAN_FRONTEND=noninteractive apt-get install -y -qq "$@"
      ;;
    dnf)     dnf install -y -q "$@" ;;
    yum)     yum install -y -q "$@" ;;
    pacman)  pacman -Sy --noconfirm --needed "$@" ;;
    apk)     apk add --no-cache "$@" ;;
    zypper)  zypper --non-interactive install -y "$@" ;;
  esac
}

MGR=$(detect_mgr)

need_cmd=()
for c in curl tar; do
  command -v "$c" >/dev/null || need_cmd+=("$c")
done
# 路线 A 才需要 openvpn 和 ip；路线 B 纯 HTTP 调面板，不装也行
if [[ "${MODE}" == "ovpn" ]]; then
  command -v openvpn >/dev/null || need_cmd+=(openvpn)
  command -v ip >/dev/null || need_cmd+=(ip)
fi

if [[ ${#need_cmd[@]} -gt 0 ]]; then
  echo "      缺少: ${need_cmd[*]}"
  if [[ -z "$MGR" ]]; then
    echo "      不认识的包管理器，请手动安装后重试" >&2
    exit 1
  fi
  pkgs=()
  for c in "${need_cmd[@]}"; do
    case "$c" in
      ip)
        # Debian/Ubuntu 叫 iproute2，RHEL 系叫 iproute，同一个东西
        [[ "$MGR" == "apt-get" || "$MGR" == "apk" || "$MGR" == "pacman" ]] \
          && pkgs+=(iproute2) || pkgs+=(iproute)
        ;;
      *) pkgs+=("$c") ;;
    esac
  done
  echo "      安装: ${pkgs[*]}"
  install_pkgs "$MGR" "${pkgs[@]}" || {
    echo "      自动安装失败，请手动安装: ${pkgs[*]}" >&2
    exit 1
  }
fi

echo "[2/5] 获取程序"
ARCH=$(uname -m)
case "$ARCH" in
  x86_64)        GOARCH=amd64 ;;
  aarch64|arm64) GOARCH=arm64 ;;
  i386|i686)     GOARCH=386 ;;
  *) echo "      不支持的架构: $ARCH" >&2; exit 1 ;;
esac

if [[ -f go.mod ]] && command -v go >/dev/null; then
  echo "      从源码编译"
  go build -trimpath -ldflags "-s -w" -o "$BIN" ./cmd/homesync
else
  echo "      下载预编译版本 (${GOARCH})"
  TMP=$(mktemp -d)
  URL="https://github.com/${REPO}/releases/latest/download/homesync-linux-${GOARCH}.tar.gz"
  if ! curl -fsSL "$URL" -o "$TMP/h.tar.gz"; then
    echo "      下载失败: $URL" >&2
    echo "      也可以 clone 仓库后在源码目录运行本脚本（有 go 环境就本地编译）" >&2
    exit 1
  fi
  tar xzf "$TMP/h.tar.gz" -C "$TMP"
  # 包里的二进制带平台后缀（release workflow 按 GOOS-GOARCH 命名），
  # 安装后统一叫 homesync。老包可能是无后缀的，两种都认。
  if [[ -f "$TMP/homesync-linux-${GOARCH}" ]]; then
    install -m 755 "$TMP/homesync-linux-${GOARCH}" "$BIN"
  elif [[ -f "$TMP/homesync" ]]; then
    install -m 755 "$TMP/homesync" "$BIN"
  else
    echo "      包里没有二进制：$(ls "$TMP")" >&2
    rm -rf "$TMP"
    exit 1
  fi
  [[ -f "$TMP/hs.sh" ]] && install -m 755 "$TMP/hs.sh" /usr/local/bin/hs
  rm -rf "$TMP"
fi

echo "[3/5] 探测 3x-ui"
# 装了面板就自动读端口/basePath/token，不用手工填
if [[ -x /usr/local/x-ui/x-ui ]]; then
  echo "      检测到 3x-ui，同步时自动读取面板设置"
else
  echo "      没检测到 3x-ui。同步前需要面板地址和 token："
  echo "        export XUI_URL=http://127.0.0.1:54321"
  echo "        export XUI_TOKEN=<token>"
  echo "      或写进 ${WORK_DIR}/config.json"
fi

echo "[4/5] 安装服务"
# 管理菜单
if [[ -f hs.sh ]]; then
  install -m 755 hs.sh /usr/local/bin/hs
else
  curl -fsSL "https://raw.githubusercontent.com/${REPO}/main/hs.sh" -o /usr/local/bin/hs \
    && chmod 755 /usr/local/bin/hs || echo "      菜单下载失败，不影响服务本身"
fi
mkdir -p "$WORK_DIR"
chmod 700 "$WORK_DIR"
seed_settings
svc_install
svc_enable_start

echo "[5/5] 就绪"
sleep 3
if svc_is_active; then
  echo "      服务运行中（${INIT_SYS}）"
elif [[ -x /usr/local/x-ui/x-ui ]]; then
  # 装了面板却起不来，是真故障
  echo "      服务启动失败，看 $(svc_logs_hint)" >&2
  exit 1
else
  # 没装面板时必然起不来（缺地址/token），这不是安装失败
  echo -e "      服务已装好但暂时没跑：本机没装 3x-ui，缺面板地址。\n" \
       "      装好面板、或配好 XUI_URL / XUI_TOKEN 后执行：\n" \
       "        hs restart\n" \
       "      现在也能先试跑（不需要面板）：hs dry"
fi

IP=$(curl -s --max-time 8 http://api.ipify.org || echo "<本机IP>")
echo
echo "  homesync 已安装"
echo "  工作目录  ${WORK_DIR}"
echo "  同步模式  ${MODE}（$( [[ $MODE == ovpn ]] && echo 'OpenVPN 家宽落地，需 openvpn' || echo '多协议直建 inbound' )）"
echo "  同步间隔  ${INTERVAL} 秒"
echo
echo "  输入 hs 打开管理菜单"
echo
echo "  注意：面板 API token 存在 ${WORK_DIR}/.xui-token（0600），别泄露。"
echo "  3x-ui 的 inbound 协议白名单里没有 openvpn，所以："
echo "    - xray  直接建多协议 inbound，开箱即用"
echo "    - ovpn  走 openvpn -> tun0 -> tunnel inbound，需 root（改模式：hs -> 8）"
echo
