#!/usr/bin/env bash
# homesync 管理菜单
# 不带参数进交互菜单，带参数当普通命令用（便于脚本调用）。
set -uo pipefail

WORK_DIR=/var/lib/homesync
SERVICE=homesync
BIN=/usr/local/bin/homesync
REPO="${REPO:-xiaoxinkeji/cfnew-pvl}"

G='\033[0;32m'; R='\033[0;31m'; Y='\033[0;33m'; B='\033[0;36m'; D='\033[2m'; N='\033[0m'

need_root() {
  [[ $EUID -eq 0 ]] || { echo -e "${R}需要 root${N}"; exit 1; }
}

# ── init 系统抽象 ────────────────────────────────────
if command -v systemctl >/dev/null 2>&1 && [[ -d /run/systemd/system ]]; then
  INIT_SYS=systemd
  UNIT=/etc/systemd/system/${SERVICE}.service
else
  INIT_SYS=openrc
  UNIT=/etc/init.d/${SERVICE}
fi

svc_start()   { [[ $INIT_SYS == systemd ]] && systemctl start "$SERVICE"   || rc-service "$SERVICE" start; }
svc_stop()    { [[ $INIT_SYS == systemd ]] && systemctl stop "$SERVICE"    || rc-service "$SERVICE" stop; }
svc_restart() { [[ $INIT_SYS == systemd ]] && systemctl restart "$SERVICE" || rc-service "$SERVICE" restart; }
svc_reload()  { [[ $INIT_SYS == systemd ]] && systemctl daemon-reload || true; }
svc_enable()  { [[ $INIT_SYS == systemd ]] && systemctl enable "$SERVICE" >/dev/null 2>&1 || rc-update add "$SERVICE" default >/dev/null 2>&1; }
svc_disable() { [[ $INIT_SYS == systemd ]] && systemctl disable "$SERVICE" >/dev/null 2>&1 || rc-update del "$SERVICE" default >/dev/null 2>&1; }

svc_is_enabled() {
  if [[ $INIT_SYS == systemd ]]; then
    systemctl is-enabled --quiet "$SERVICE"
  else
    rc-update show default 2>/dev/null | grep -q "^ *${SERVICE} "
  fi
}

svc_state() {
  if [[ $INIT_SYS == systemd ]]; then
    systemctl is-active --quiet "$SERVICE" && echo running || echo stopped
  else
    rc-service "$SERVICE" status >/dev/null 2>&1 && echo running || echo stopped
  fi
}

svc_logs() {
  if [[ $INIT_SYS == systemd ]]; then
    journalctl -u "$SERVICE" -n "${1:-50}" --no-pager
  else
    tail -n "${1:-50}" /var/log/${SERVICE}.log 2>/dev/null || echo "  暂无日志"
  fi
}

svc_logs_follow() {
  if [[ $INIT_SYS == systemd ]]; then
    journalctl -u "$SERVICE" -f
  else
    tail -f /var/log/${SERVICE}.log
  fi
}

# 配置以 settings.json 为唯一权威来源，服务文件里不写死参数
cfg_get() {
  local key="$1" v
  v=$(sed -n "s/.*\"${key}\"[[:space:]]*:[[:space:]]*\"\{0,1\}\([^\",}]*\)\"\{0,1\}.*/\1/p" \
        "$WORK_DIR/settings.json" 2>/dev/null | head -1)
  echo "${v:--}"
}

cfg_set() {
  local key="$1" val="$2" f="$WORK_DIR/settings.json"
  [[ -f $f ]] || return 1

  # 消毒：country 这类是用户自由输入的。带引号/反斜杠/斜杠会破坏 JSON，
  # 更糟的是塞进 sed 表达式里会让整条替换命令报错（实测踩到）。
  # 只留 slug 该有的字符，其它一律丢掉。
  if [[ $val =~ ^[0-9]+$ ]]; then
    val=$(printf '%s' "$val" | tr -cd '0-9')
  else
    val=$(printf '%s' "$val" | tr -cd 'A-Za-z0-9,_-')
  fi

  # 不用 sed 原地替换：值里只要带分隔符就会把表达式搞崩。
  # 直接整份重写——字段就四个，用当前值兜底，丢了格式也比写坏强。
  local cur_mode cur_limit cur_country cur_interval
  cur_mode=$(cfg_get mode); cur_limit=$(cfg_get limit)
  cur_country=$(cfg_get country); cur_interval=$(cfg_get interval)
  [[ $cur_limit    == - ]] && cur_limit=20
  [[ $cur_interval == - ]] && cur_interval=1800
  [[ $cur_country  == - ]] && cur_country=""
  [[ $cur_mode     == - ]] && cur_mode=xray

  case "$key" in
    mode)     cur_mode="$val" ;;
    limit)    cur_limit="$val" ;;
    country)  cur_country="$val" ;;
    interval) cur_interval="$val" ;;
    *) return 1 ;;
  esac

  cat > "$f" <<EOF
{
  "mode": "${cur_mode}",
  "limit": ${cur_limit},
  "country": "${cur_country}",
  "interval": ${cur_interval}
}
EOF
  chmod 600 "$f"
}

pause() { echo; read -rp "回车返回菜单..." _; }

show_info() {
  local state
  state=$(svc_state)
  echo
  if [[ $state == running ]]; then
    echo -e "  状态      ${G}运行中${N}"
  else
    echo -e "  状态      ${R}已停止${N}"
  fi
  echo -e "  开机自启  $(svc_is_enabled && echo enabled || echo disabled)"
  echo
  echo -e "  同步模式  ${B}$(cfg_get mode)${N}"
  echo -e "  每种取几个 $(cfg_get limit)"
  echo -e "  国家筛选  $(cfg_get country)"
  echo -e "  同步间隔  $(cfg_get interval) 秒"
  echo
  # 面板地址从 .xui-token 旁边读不出来（只存 token），提示去哪看
  if [[ -f "$WORK_DIR/.xui-token" ]]; then
    echo -e "  ${D}面板 token 已缓存（${WORK_DIR}/.xui-token）${N}"
  else
    echo -e "  ${D}还没缓存面板 token${N}"
  fi
  if [[ $(cfg_get mode) == ovpn ]]; then
    local tun
    tun=$(ip -4 -o addr show tun0 2>/dev/null | awk '{print $4}' | head -1)
    echo -e "  ${D}tun0: ${tun:-未起来}${N}"
  fi
}

# 手动跑一次同步（前台，能看到输出）
run_once() {
  echo
  echo "  正在同步（前台运行，看 -dry-run 先试跑）…"
  "$BIN" -dir "$WORK_DIR" -mode "$(cfg_get mode)" -limit "$(cfg_get limit)" 2>&1 | tail -30
}

run_dry() {
  echo
  echo "  试跑（不碰面板）…"
  "$BIN" -dir "$WORK_DIR" -mode "$(cfg_get mode)" -limit 3 -dry-run 2>&1 | tail -20
}

# 面板上的 inbound 列表：数一数我们建了几个
list_inbounds() {
  echo
  local tok url
  tok=$(cat "$WORK_DIR/.xui-token" 2>/dev/null || true)
  url=$(cat "$WORK_DIR/.xui-url" 2>/dev/null || true)
  if [[ -z $tok || -z $url ]]; then
    echo "  面板地址或 token 还没缓存，先跑一次同步"
    return
  fi
  curl -s --max-time 10 -H "Authorization: Bearer ${tok}" \
    "${url}/panel/api/inbounds/list" \
    | sed 's/{"id"/\n{"id"/g' \
    | while IFS= read -r line; do
        case "$line" in *'"id"'*) ;; *) continue ;; esac
        p=$(echo "$line"  | sed -n 's/.*"port":\([0-9]*\).*/\1/p')
        t=$(echo "$line"  | sed -n 's/.*"tag":"\([^"]*\)".*/\1/p')
        pr=$(echo "$line" | sed -n 's/.*"protocol":"\([^"]*\)".*/\1/p')
        [[ -z $p ]] && continue
        # 自建的打标记，手工建的一眼能分开
        case "$t" in pvl-home-*) mark="*" ;; *) mark=" " ;; esac
        printf "  %s%-6s%-10s%s\n" "$mark" "$pr" "$p" "$t"
      done
  echo
  echo -e "  ${D}带 * 的是 homesync 建的，清理时只删这些${N}"
}

clean_inbounds() {
  local yes
  echo
  read -rp "  确认清理 homesync 建的 inbound？手工建的不动 [y/N]: " yes
  [[ ${yes,,} == y ]] || { echo "  已取消"; return; }
  "$BIN" -dir "$WORK_DIR" -clean 2>&1 | tail -5
}

change_mode() {
  local cur new
  cur=$(cfg_get mode)
  echo
  echo "  xray = 多协议直建 inbound（开箱即用，推荐）"
  echo "  ovpn = OpenVPN 家宽落地（需 root + openvpn，走 tun 网卡）"
  read -rp "  模式 (当前 ${cur}) [xray/ovpn]: " new
  [[ -z $new ]] && { echo "  未修改"; return; }
  if [[ $new != xray && $new != ovpn ]]; then
    echo -e "  ${R}只支持 xray 或 ovpn${N}"; return
  fi
  cfg_set mode "$new"
  if [[ $new == ovpn ]]; then
    command -v openvpn >/dev/null || echo -e "  ${Y}警告：没装 openvpn，路线 A 跑不起来${N}"
  fi
  svc_restart
  echo -e "  ${G}已改为 ${new} 并重启${N}"
}

change_interval() {
  local cur new
  cur=$(cfg_get interval)
  echo
  read -rp "  同步间隔秒数（当前 ${cur}，0=跑一次就退出）: " new
  [[ -z $new ]] && { echo "  未修改"; return; }
  if ! [[ $new =~ ^[0-9]+$ ]]; then
    echo -e "  ${R}必须是数字${N}"; return
  fi
  cfg_set interval "$new"
  svc_restart
  echo -e "  ${G}已改为 ${new} 秒${N}"
}

change_limit() {
  local cur new
  cur=$(cfg_get limit)
  echo
  read -rp "  每种来源最多取几个（当前 ${cur}）: " new
  [[ -z $new ]] && { echo "  未修改"; return; }
  if ! [[ $new =~ ^[0-9]+$ ]] || (( new < 1 || new > 500 )); then
    echo -e "  ${R}要 1-500 之间的数字${N}"; return
  fi
  cfg_set limit "$new"
  svc_restart
  echo -e "  ${G}已改为 ${new}${N}"
}

change_country() {
  local cur new
  cur=$(cfg_get country)
  echo
  echo "  常用: japan, south-korea, usa, singapore, hong-kong, taiwan, russia"
  echo "  留空 = 不筛选"
  read -rp "  国家 slug 逗号分隔（当前 ${cur}）: " new
  cfg_set country "$new"
  svc_restart
  echo -e "  ${G}已改为 '${new:-不筛选}'${N}"
}

do_update() {
  local arch goarch tmp
  arch=$(uname -m)
  case "$arch" in
    x86_64) goarch=amd64 ;;
    aarch64|arm64) goarch=arm64 ;;
    i386|i686) goarch=386 ;;
    *) echo -e "  ${R}不支持的架构 ${arch}${N}"; return ;;
  esac

  echo -e "\n  正在下载最新版..."
  tmp=$(mktemp -d)
  if ! curl -fsSL "https://github.com/${REPO}/releases/latest/download/homesync-linux-${goarch}.tar.gz" \
       -o "$tmp/h.tar.gz"; then
    echo -e "  ${R}下载失败${N}"; rm -rf "$tmp"; return
  fi
  tar xzf "$tmp/h.tar.gz" -C "$tmp"
  svc_stop
  install -m 755 "$tmp/homesync" "$BIN"
  [[ -f "$tmp/hs.sh" ]] && install -m 755 "$tmp/hs.sh" /usr/local/bin/hs
  svc_start
  rm -rf "$tmp"
  echo -e "  ${G}已更新${N}"
}

do_uninstall() {
  local yes
  echo
  read -rp "  确认卸载？会先清理面板上 homesync 建的 inbound [y/N]: " yes
  [[ ${yes,,} == y ]] || { echo "  已取消"; return; }

  # 先把面板上的 inbound 清干净，免得留一堆孤儿
  if [[ -f "$BIN" ]]; then
    "$BIN" -dir "$WORK_DIR" -clean >/dev/null 2>&1 || true
  fi
  # 路线 A 的 openvpn 残留
  for f in "$WORK_DIR"/.cache/ovpn-*.pid; do
    [[ -f $f ]] || continue
    kill "$(cat "$f")" 2>/dev/null || true
  done
  svc_stop >/dev/null 2>&1
  svc_disable
  rm -f "$UNIT" "$BIN" /usr/local/bin/hs
  rm -rf "$WORK_DIR"
  svc_reload
  echo -e "  ${G}已卸载${N}"
  exit 0
}

menu() {
  while true; do
    clear
    echo -e "${B}  homesync${N}  ${D}PublicVPNList 家宽节点 -> 3x-ui${N}"
    show_info
    echo -e "${D}  ─────────────────────────────${N}"
    echo "   1) 启动          2) 停止"
    echo "   3) 重启          4) 查看日志"
    echo
    echo "   5) 立即同步      6) 试跑（不碰面板）"
    echo "   7) 面板 inbound 列表"
    echo
    echo "   8) 改模式        9) 改间隔"
    echo "  10) 改数量       11) 改国家"
    echo
    echo "  12) 清理自建 inbound"
    echo "  13) 开机自启开关  14) 更新"
    echo "  15) 卸载"
    echo "   0) 退出"
    echo -e "${D}  ─────────────────────────────${N}"
    read -rp "  选择: " choice

    case "$choice" in
      1)  svc_start   && echo -e "\n  ${G}已启动${N}"; pause ;;
      2)  svc_stop    && echo -e "\n  ${Y}已停止${N}"; pause ;;
      3)  svc_restart && echo -e "\n  ${G}已重启${N}"; pause ;;
      4)  echo; svc_logs 40; pause ;;
      5)  run_once; pause ;;
      6)  run_dry; pause ;;
      7)  list_inbounds; pause ;;
      8)  change_mode; pause ;;
      9)  change_interval; pause ;;
      10) change_limit; pause ;;
      11) change_country; pause ;;
      12) clean_inbounds; pause ;;
      13)
        if svc_is_enabled; then
          svc_disable
          echo -e "\n  ${Y}已关闭开机自启${N}"
        else
          svc_enable
          echo -e "\n  ${G}已开启开机自启${N}"
        fi
        pause ;;
      14) do_update; pause ;;
      15) do_uninstall; pause ;;
      0)  exit 0 ;;
      *) ;;
    esac
  done
}

need_root

case "${1:-}" in
  start)     svc_start ;;
  stop)      svc_stop ;;
  restart)   svc_restart ;;
  status)    svc_state ;;
  log)       svc_logs_follow ;;
  info)      show_info ;;
  sync)      run_once ;;
  dry)       run_dry ;;
  list)      list_inbounds ;;
  clean)     clean_inbounds ;;
  update)    do_update ;;
  uninstall) do_uninstall ;;
  "")        menu ;;
  *)
    echo "用法: hs [start|stop|restart|status|log|info|sync|dry|list|clean|update|uninstall]"
    echo "不带参数进入交互菜单"
    ;;
esac
