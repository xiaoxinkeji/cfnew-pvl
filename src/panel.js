const X = `
    <html lang="${语言值661}" dir="${是否值664 ? 'rtl' : 'ltr'}">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${翻译值659.title}</title>
        <style>
            :root {
                --cp-bg: #05030e;
                --cp-bg-2: #0a0820;
                --cp-cyan: #00f0ff;
                --cp-cyan-d: #00b8c4;
                --cp-pink: #ff2bd6;
                --cp-pink-d: #d1239f;
                --cp-purple: #a347ff;
                --cp-yellow: #fff200;
                --cp-mint: #00ff9d;
                --cp-red: #ff3860;
                --cp-text: #e6f5ff;
                --cp-text-dim: #7aa9c4;
                --cp-border: rgba(0, 240, 255, 0.55);
                --cp-grid: rgba(255, 43, 214, 0.16);
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { height: 100%; }
            body {
                font-family: "JetBrains Mono", "Fira Code", "Courier New", monospace;
                background: radial-gradient(ellipse at 20% 10%, #2a0040 0%, var(--cp-bg) 55%, #000 100%);
                color: var(--cp-text);
                min-height: 100vh;
                overflow-x: hidden;
                position: relative;
                display: flex; justify-content: center; align-items: center;
            }
            body::before {
                content: ""; position: fixed; inset: 0;
                background-image:
                    linear-gradient(var(--cp-grid) 1px, transparent 1px),
                    linear-gradient(90deg, var(--cp-grid) 1px, transparent 1px);
                background-size: 48px 48px;
                mask-image: radial-gradient(ellipse at center, #000 30%, transparent 80%);
                z-index: -3;
                animation: cp-grid-slide 18s linear infinite;
            }
            body::after {
                content: ""; position: fixed; inset: 0;
                background: repeating-linear-gradient(
                    180deg,
                    rgba(255,255,255,0.04) 0,
                    rgba(255,255,255,0.04) 1px,
                    transparent 1px,
                    transparent 3px
                );
                pointer-events: none;
                z-index: 5;
                mix-blend-mode: overlay;
                animation: cp-scan-flicker 6s infinite;
            }
            @keyframes cp-grid-slide {
                0% { background-position: 0 0, 0 0; }
                100% { background-position: 48px 48px, 48px 48px; }
            }
            @keyframes cp-scan-flicker {
                0%, 100% { opacity: 0.6; }
                50% { opacity: 0.9; }
            }
            .matrix-bg {
                position: fixed; inset: 0;
                background:
                    radial-gradient(circle at 80% 90%, rgba(255,43,214,0.18) 0%, transparent 45%),
                    radial-gradient(circle at 10% 80%, rgba(0,240,255,0.18) 0%, transparent 45%);
                z-index: -2;
                pointer-events: none;
            }
            .matrix-rain { display: none; }
            .matrix-code-rain {
                position: fixed; inset: 0;
                pointer-events: none; z-index: -1;
                overflow: hidden;
            }
            .matrix-column {
                position: absolute; top: -120%; left: 0;
                color: var(--cp-cyan);
                font-family: "JetBrains Mono", "Courier New", monospace;
                font-size: 14px; line-height: 1.25;
                text-shadow: 0 0 6px var(--cp-cyan), 0 0 12px rgba(0,240,255,0.5);
                animation: cp-drop linear infinite;
            }
            @keyframes cp-drop {
                0%   { top: -120%; opacity: 0; }
                10%  { opacity: 0.85; }
                90%  { opacity: 0.4; }
                100% { top: 110vh; opacity: 0; }
            }
            .matrix-column:nth-child(odd)  { animation-duration: 12s; }
            .matrix-column:nth-child(even) { animation-duration: 18s; color: var(--cp-pink); text-shadow: 0 0 6px var(--cp-pink), 0 0 14px rgba(255,43,214,0.5); }
            .matrix-column:nth-child(3n)   { animation-duration: 20s; color: var(--cp-purple); text-shadow: 0 0 6px var(--cp-purple); }
            .matrix-column:nth-child(5n)   { animation-duration: 9s; opacity: 0.6; }

            .terminal {
                width: 92%; max-width: 860px; height: 540px;
                background:
                    linear-gradient(180deg, rgba(8,4,28,0.92) 0%, rgba(15,3,40,0.92) 100%);
                border: 1px solid var(--cp-border);
                border-radius: 0;
                box-shadow:
                    0 0 0 1px rgba(255,43,214,0.25),
                    0 0 28px rgba(0,240,255,0.35),
                    0 0 80px rgba(255,43,214,0.18),
                    inset 0 0 30px rgba(0,240,255,0.06);
                clip-path: polygon(
                    0 18px, 18px 0,
                    calc(100% - 60px) 0, calc(100% - 42px) 18px,
                    100% 18px, 100% calc(100% - 14px),
                    calc(100% - 14px) 100%, 42px 100%,
                    24px calc(100% - 14px), 0 calc(100% - 14px)
                );
                position: relative; z-index: 1;
                overflow: hidden;
            }
            .terminal::before {
                content: ""; position: absolute; inset: 0;
                background: repeating-linear-gradient(180deg, rgba(0,240,255,0.06) 0 1px, transparent 1px 4px);
                pointer-events: none;
                animation: cp-scan-flicker 5s infinite;
            }
            .terminal-header {
                background: linear-gradient(90deg, rgba(255,43,214,0.18), rgba(0,240,255,0.18));
                padding: 12px 18px;
                border-bottom: 1px solid rgba(0,240,255,0.5);
                display: flex; align-items: center; gap: 16px;
                position: relative;
            }
            .terminal-header::after {
                content: ""; position: absolute; left: 18px; right: 18px; bottom: -1px;
                height: 1px;
                background: linear-gradient(90deg, transparent, var(--cp-pink), var(--cp-cyan), transparent);
                animation: cp-scan-line 4s linear infinite;
            }
            @keyframes cp-scan-line {
                0% { transform: translateX(-30%); opacity: 0.4; }
                50% { opacity: 1; }
                100% { transform: translateX(30%); opacity: 0.4; }
            }
            .terminal-buttons {
                display: flex; gap: 8px;
            }
            .terminal-button {
                width: 12px; height: 12px;
                background: var(--cp-pink);
                box-shadow: 0 0 8px var(--cp-pink);
                border: none; transform: rotate(45deg);
            }
            .terminal-button:nth-child(2) { background: var(--cp-yellow); box-shadow: 0 0 8px var(--cp-yellow); }
            .terminal-button:nth-child(3) { background: var(--cp-mint); box-shadow: 0 0 8px var(--cp-mint); }
            .terminal-title {
                color: var(--cp-cyan);
                font-size: 13px; font-weight: 700;
                letter-spacing: 0.25em;
                text-transform: uppercase;
                text-shadow: 0 0 6px var(--cp-cyan);
            }
            .terminal-title::before { content: "// "; color: var(--cp-pink); }
            .terminal-body {
                padding: 24px; height: calc(100% - 52px);
                overflow-y: auto; font-size: 14px;
                line-height: 1.6;
                position: relative;
            }
            .terminal-body::-webkit-scrollbar { width: 6px; }
            .terminal-body::-webkit-scrollbar-thumb {
                background: linear-gradient(180deg, var(--cp-pink), var(--cp-cyan));
            }
            .terminal-line {
                margin-bottom: 8px; display: flex; align-items: center; gap: 8px;
                flex-wrap: wrap;
            }
            .terminal-prompt {
                color: var(--cp-pink);
                font-weight: 700;
                text-shadow: 0 0 6px var(--cp-pink);
                letter-spacing: 0.05em;
            }
            .terminal-prompt::before { content: "▍"; color: var(--cp-cyan); margin-right: 4px; }
            .terminal-input {
                background: transparent; border: none; outline: none;
                color: var(--cp-cyan);
                font-family: inherit;
                font-size: 14px; flex: 1; min-width: 0;
                caret-color: var(--cp-pink);
                text-shadow: 0 0 4px var(--cp-cyan);
            }
            .terminal-input::placeholder { color: var(--cp-text-dim); opacity: 0.75; }
            .terminal-cursor {
                display: inline-block; width: 9px; height: 16px;
                background: var(--cp-pink);
                margin-left: 2px;
                box-shadow: 0 0 8px var(--cp-pink);
                animation: cp-blink 1s steps(2, end) infinite;
            }
            @keyframes cp-blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0; }
            }
            .terminal-output { color: var(--cp-cyan); margin: 4px 0; }
            .terminal-error  { color: var(--cp-red); margin: 4px 0; text-shadow: 0 0 6px var(--cp-red); }
            .terminal-success{ color: var(--cp-mint); margin: 4px 0; text-shadow: 0 0 6px var(--cp-mint); }

            .cp-hud {
                position: fixed; top: 18px; right: 22px;
                color: var(--cp-cyan);
                font-family: "JetBrains Mono", monospace;
                font-size: 11px; letter-spacing: 0.2em;
                text-transform: uppercase;
                text-align: right;
                opacity: 0.85;
                z-index: 1000;
            }
            .cp-hud .cp-hud-label { color: var(--cp-pink); }
            .cp-hud .cp-hud-line { display: block; }
            .cp-lang-wrapper {
                position: fixed; top: 18px; left: 22px; z-index: 1000;
                display: flex; align-items: center; gap: 10px;
            }
            .cp-lang-tag {
                color: var(--cp-pink); font-size: 11px;
                letter-spacing: 0.25em; text-transform: uppercase;
                text-shadow: 0 0 6px var(--cp-pink);
            }
            #languageSelector {
                background: rgba(8,4,28,0.85);
                border: 1px solid var(--cp-cyan);
                color: var(--cp-cyan);
                padding: 6px 12px;
                font-family: inherit;
                font-size: 12px;
                cursor: pointer;
                letter-spacing: 0.12em;
                text-shadow: 0 0 6px var(--cp-cyan);
                box-shadow: 0 0 12px rgba(0,240,255,0.35);
                clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
            }
            #languageSelector option { background: var(--cp-bg-2); color: var(--cp-cyan); }

            /* FX toggle - 页面特效图形化开关 */
            .cp-fx-toggle {
                position: fixed; top: 68px; left: 22px; z-index: 1001;
                background: rgba(8,4,28,0.85);
                border: 1px solid var(--cp-mint);
                color: var(--cp-mint);
                padding: 6px 12px;
                font-family: inherit;
                font-size: 11px;
                letter-spacing: 0.18em;
                text-transform: uppercase;
                cursor: pointer;
                text-shadow: 0 0 6px var(--cp-mint);
                box-shadow: 0 0 10px rgba(0,255,157,0.35);
                clip-path: polygon(7px 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%, 0 7px);
                transition: all 0.2s ease;
                display: inline-flex; align-items: center; gap: 6px;
            }
            .cp-fx-toggle:hover { color: var(--cp-pink); border-color: var(--cp-pink); text-shadow: 0 0 8px var(--cp-pink); box-shadow: 0 0 16px rgba(255,43,214,0.55); }
            .cp-fx-toggle .cp-fx-dot { width: 6px; height: 6px; background: var(--cp-mint); border-radius: 50%; box-shadow: 0 0 8px var(--cp-mint); transition: all 0.2s; }
            body.fx-off .cp-fx-toggle { color: var(--cp-text-dim); border-color: var(--cp-text-dim); text-shadow: none; box-shadow: none; }
            body.fx-off .cp-fx-toggle .cp-fx-dot { background: transparent; border: 1px solid var(--cp-text-dim); box-shadow: none; }
            body.fx-off .matrix-bg,
            body.fx-off .matrix-code-rain,
            body.fx-off .matrix-column { display: none !important; }
            body.fx-off::before,
            body.fx-off::after { display: none !important; content: none !important; }
            body.fx-off { background: var(--cp-bg) !important; }
            body.fx-off * {
                animation: none !important;
                transition: color 0.15s, background-color 0.15s, border-color 0.15s, box-shadow 0.15s !important;
            }
            body.fx-off .cp-glitch::before,
            body.fx-off .cp-glitch::after { display: none !important; }
            body.fx-off .terminal-cursor::after { animation: none !important; }

            .cp-glitch {
                font-family: "JetBrains Mono", monospace;
                font-weight: 700;
                letter-spacing: 0.18em;
                text-transform: uppercase;
                color: var(--cp-cyan);
                text-shadow:
                    0 0 8px var(--cp-cyan),
                    -2px 0 var(--cp-pink),
                    2px 0 var(--cp-mint);
            }
        </style>
    </head>
    <body>
        <div class="matrix-bg"></div>
        <div class="matrix-code-rain" id="matrixCodeRain"></div>
            <div class="cp-hud">
                <span class="cp-hud-line"><span class="cp-hud-label">SYS::</span> ${翻译值659.terminal}</span>
                <span class="cp-hud-line"><span class="cp-hud-label">NODE::</span> NIGHT_CITY</span>
                <span class="cp-hud-line"><span class="cp-hud-label">LINK::</span> SECURE / ENC</span>
            </div>
            <div class="cp-lang-wrapper">
                <span class="cp-lang-tag">LANG_</span>
                <select id="languageSelector" onchange="切换语言(this.value)">
                    <option value="zh" ${!是否值664 ? 'selected' : ''}>🇨🇳 中文</option>
                    <option value="fa" ${是否值664 ? 'selected' : ''}>🇮🇷 فارسی</option>
                </select>
            </div>
            <button type="button" id="cpFxToggle" class="cp-fx-toggle" onclick="window.切换页面特效()" title="${是否值664 ? 'تغییر افکت‌های صفحه' : '切换页面特效'}" aria-label="FX toggle">
                <span class="cp-fx-dot" aria-hidden="true"></span>
                <span id="cpFxLabel">FX: ON</span>
            </button>
        <div class="terminal">
            <div class="terminal-header">
                <div class="terminal-buttons">
                    <div class="terminal-button"></div>
                    <div class="terminal-button"></div>
                    <div class="terminal-button"></div>
                </div>
                    <div class="terminal-title cp-glitch">${翻译值659.terminal}</div>
            </div>
            <div class="terminal-body" id="terminalBody">
                <div class="terminal-line">
                    <span class="terminal-prompt">root:~$</span>
                        <span class="terminal-output">${翻译值659.congratulations}</span>
                </div>
                <div class="terminal-line">
                    <span class="terminal-prompt">root:~$</span>
                        <span class="terminal-output">${自定义路径 && 自定义路径.trim() ? 翻译值659.enterD : 翻译值659.enterU}</span>
                </div>
                <div class="terminal-line">
                    <span class="terminal-prompt">root:~$</span>
                        <span class="terminal-output">${翻译值659.command}${自定义路径 && 自定义路径.trim() ? 翻译值659.path : 翻译值659.uuid}]</span>
                </div>
                <div class="terminal-line">
                    <span class="terminal-prompt">root:~$</span>
                        <input type="text" class="terminal-input" id="uuidInput" placeholder="${自定义路径 && 自定义路径.trim() ? 翻译值659.inputD : 翻译值659.inputU}" autofocus>
                    <span class="terminal-cursor"></span>
                </div>
            </div>
        </div>
        <script>
// 页面特效图形化开关 (localStorage 持久化)
window.应用页面特效 = function () {
  var 本地值10009 = localStorage.getItem('cp-fx-off') === '1';
  document.body.classList.toggle('fx-off', 本地值10009);
  var 本地值10008 = document.getElementById('cpFxLabel');
  if (本地值10008) 本地值10008.textContent = 本地值10009 ? 'FX: OFF' : 'FX: ON';
  if (本地值10009) {
    var 本地值10007 = document.getElementById('matrixCodeRain');
    if (本地值10007) 本地值10007.innerHTML = '';
  } else if (typeof 创建矩阵雨 === 'function') {
    var 结果值 = document.getElementById('matrixCodeRain');
    if (结果值 && !结果值.firstChild) 创建矩阵雨();
  }
};
window.切换页面特效 = function () {
  var 本地值10006 = localStorage.getItem('cp-fx-off') === '1';
  localStorage.setItem('cp-fx-off', 本地值10006 ? '0' : '1');
  window.应用页面特效();
};
(function () {
  if (localStorage.getItem('cp-fx-off') === '1') {
    document.documentElement.classList.add('fx-off-preload');
    document.addEventListener('DOMContentLoaded', function () {
      document.body.classList.add('fx-off');
    });
  }
})();
function 创建矩阵雨() {
  if (document.body && document.body.classList.contains('fx-off')) return;
  const 矩阵值 = document.getElementById('matrixCodeRain');
  if (!矩阵值) return;
  const 赛博字符列表 = '01アイウエオカキクケコサシスセソタチツテトナニヌネノ$%#@!?<>+=ABCDEF';
  const 调色板 = ['#00f0ff', '#ff2bd6', '#a347ff', '#00ff9d'];
  const 列数 = Math.floor(window.innerWidth / 20);
  for (let 索引值 = 0; 索引值 < 列数; 索引值++) {
    const 列10005 = document.createElement('div');
    列10005.className = 'matrix-column';
    列10005.style.left = 索引值 * 20 + 'px';
    列10005.style.animationDelay = -Math.random() * 15 + 's';
    列10005.style.animationDuration = Math.random() * 14 + 8 + 's';
    列10005.style.fontSize = Math.random() * 4 + 12 + 'px';
    列10005.style.opacity = (Math.random() * 0.7 + 0.3).toFixed(2);
    let 文本 = '';
    const 字符数量 = Math.floor(Math.random() * 30 + 18);
    for (let 次索引值 = 0; 次索引值 < 字符数量; 次索引值++) {
      const 字符 = 赛博字符列表[Math.floor(Math.random() * 赛博字符列表.length)];
      const 值强调 = Math.random() > 0.85;
      const 颜色 = 值强调 ? 调色板[Math.floor(Math.random() * 调色板.length)] : '';
      文本 += 颜色 ? '<span style="color:' + 颜色 + ';text-shadow:0 0 8px ' + 颜色 + ';">' + 字符 + '</span><br>' : '<span>' + 字符 + '</span><br>';
    }
    列10005.innerHTML = 文本;
    矩阵值.appendChild(列10005);
  }
  setInterval(function () {
    const 列列表 = 矩阵值.querySelectorAll('.matrix-column');
    列列表.forEach(function (列) {
      if (Math.random() > 0.94) {
        const 字符列表 = 列.querySelectorAll('span');
        if (字符列表.length > 0) {
          const 目标 = 字符列表[Math.floor(Math.random() * 字符列表.length)];
          const 本地值10004 = 目标.style.color;
          目标.style.color = '#ffffff';
          目标.style.textShadow = '0 0 10px #ffffff, 0 0 18px #00f0ff';
          setTimeout(function () {
            目标.style.color = 本地值10004;
            目标.style.textShadow = '';
          }, 200);
        }
      }
    });
  }, 110);
}
function 是否有效唯一标识(唯一标识) {
  const 唯一标识正则 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return 唯一标识正则.test(唯一标识);
}
function 添加终端行(内容, 类型 = 'output') {
  const 终端主体 = document.getElementById('terminalBody');
  const 行 = document.createElement('div');
  行.className = 'terminal-line';
  const 提示符 = document.createElement('span');
  提示符.className = 'terminal-prompt';
  提示符.textContent = 'root:~$';
  const 输出 = document.createElement('span');
  输出.className = 'terminal-' + 类型;
  输出.textContent = 内容;
  行.appendChild(提示符);
  行.appendChild(输出);
  终端主体.appendChild(行);
  终端主体.scrollTop = 终端主体.scrollHeight;
}
function 处理唯一标识输入() {
  const 输入10003 = document.getElementById('uuidInput');
  const 输入值 = 输入10003.value.trim();
  const 自定义路径 = '${自定义路径}';
  if (输入值) {
    添加终端行(atob('Y29ubmVjdCA=') + 输入值, 'output');
    const 本地值 = {
      zh: {
        connecting: '正在连接...',
        invading: '正在入侵...',
        success: '连接成功！返回结果...',
        error: '错误: 无效的UUID格式',
        reenter: '请重新输入有效的UUID'
      },
      fa: {
        connecting: 'در حال اتصال...',
        invading: 'در حال نفوذ...',
        success: 'اتصال موفق! در حال بازگشت نتیجه...',
        error: 'خطا: فرمت UUID نامعتبر',
        reenter: 'لطفا UUID معتبر را دوباره وارد کنید'
      }
    };
    const 浏览器语言 = navigator.language || navigator.userLanguage || '';
    const 是否值 = 浏览器语言.includes('fa') || 浏览器语言.includes('fa-IR');
    const 翻译值 = 本地值[是否值 ? 'fa' : 'zh'];
    if (自定义路径) {
      const 清理输入 = 输入值.startsWith('/') ? 输入值 : '/' + 输入值;
      添加终端行(翻译值.connecting, 'output');
      setTimeout(() => {
        添加终端行(翻译值.success, 'success');
        setTimeout(() => {
          window.location.href = 清理输入;
        }, 1000);
      }, 500);
    } else {
      if (是否有效唯一标识(输入值)) {
        添加终端行(翻译值.invading, 'output');
        setTimeout(() => {
          添加终端行(翻译值.success, 'success');
          setTimeout(() => {
            window.location.href = '/' + 输入值;
          }, 1000);
        }, 500);
      } else {
        添加终端行(翻译值.error, 'error');
        添加终端行(翻译值.reenter, 'output');
      }
    }
    输入10003.value = '';
  }
}
function 切换语言(语言) {
  localStorage.setItem('preferredLanguage', 语言);
  // 设置Cookie（有效期1年）
  const 过期日期10002 = new Date();
  过期日期10002.setFullYear(过期日期10002.getFullYear() + 1);
  document.cookie = 'preferredLanguage=' + 语言 + '; path=/; expires=' + 过期日期10002.toUTCString() + '; SameSite=Lax';
  // 刷新页面，不使用URL参数
  window.location.reload();
}

// 页面加载时检查 localStorage 和 Cookie，并清理URL参数
window.addEventListener('DOMContentLoaded', function () {
  function 获取凭据(名称) {
    const 值 = '; ' + document.cookie;
    const 部分列表 = 值.split('; ' + 名称 + '=');
    if (部分列表.length === 2) return 部分列表.pop().split(';').shift();
    return null;
  }
  const 已保存语言 = localStorage.getItem('preferredLanguage') || 获取凭据('preferredLanguage');
  const 网址参数 = new URLSearchParams(window.location.search);
  const 网址语言 = 网址参数.get('lang');

  // 如果URL中有语言参数，移除它并设置Cookie
  if (网址语言) {
    const 当前网址 = new URL(window.location.href);
    当前网址.searchParams.delete('lang');
    const 新网址 = 当前网址.toString();

    // 设置Cookie
    const 过期日期10001 = new Date();
    过期日期10001.setFullYear(过期日期10001.getFullYear() + 1);
    document.cookie = 'preferredLanguage=' + 网址语言 + '; path=/; expires=' + 过期日期10001.toUTCString() + '; SameSite=Lax';
    localStorage.setItem('preferredLanguage', 网址语言);

    // 使用history API移除URL参数，不刷新页面
    window.history.replaceState({}, '', 新网址);
  } else if (已保存语言) {
    // 如果localStorage中有但Cookie中没有，同步到Cookie
    const 过期日期 = new Date();
    过期日期.setFullYear(过期日期.getFullYear() + 1);
    document.cookie = 'preferredLanguage=' + 已保存语言 + '; path=/; expires=' + 过期日期.toUTCString() + '; SameSite=Lax';
  }
});
document.addEventListener('DOMContentLoaded', function () {
  try {
    创建矩阵雨();
  } catch (事件值10000) {}
  const 输入 = document.getElementById('uuidInput');
  if (输入) {
    输入.focus();
    输入.addEventListener('keypress', function (事件值) {
      if (事件值.key === 'Enter') {
        处理唯一标识输入();
      }
    });
  }
});
</script>
    </body>
`;
