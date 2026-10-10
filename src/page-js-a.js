const X = `
        <script>
var 订阅转换网址 = "${订阅转换接口}";
var 远程配置网址 = "${远程配置网址}";

const 本地值20215 = {
  zh: {
    subscriptionCopied: '${解码64('6K6i6ZiF6ZO+5o6l5bey5aSN5Yi2')}',
    autoSubscriptionCopied: '${解码64('6Ieq5Yqo6K+G5Yir6K6i6ZiF6ZO+5o6l5bey5aSN5Yi277yM5a6i5oi356uv6K6/6Zeu5pe25Lya5qC55o2uVXNlci1BZ2VudOiHquWKqOivhuWIq+W5tui/lOWbnuWvueW6lOagvOW8jw==')}'
  },
  fa: {
    subscriptionCopied: 'لینک اشتراک کپی شد',
    autoSubscriptionCopied: 'لینک اشتراک تشخیص خودکار کپی شد، کلاینت هنگام دسترسی بر اساس User-Agent به طور خودکار تشخیص داده و قالب مربوطه را برمی‌گرداند'
  }
};
function 获取凭据20214(名称20213) {
  const 值20212 = '; ' + document.cookie;
  const 部分列表20211 = 值20212.split('; ' + 名称20213 + '=');
  if (部分列表20211.length === 2) return 部分列表20211.pop().split(';').shift();
  return null;
}
const 浏览器语言20210 = navigator.language || navigator.userLanguage || '';
const 已保存语言20209 = localStorage.getItem('preferredLanguage') || 获取凭据20214('preferredLanguage');
let 是否值20208 = false;
if (已保存语言20209 === 'fa' || 已保存语言20209 === 'fa-IR') {
  是否值20208 = true;
} else if (已保存语言20209 === 'zh' || 已保存语言20209 === 'zh-CN') {
  是否值20208 = false;
} else {
  是否值20208 = 浏览器语言20210.includes('fa') || 浏览器语言20210.includes('fa-IR');
}
const 翻译值20207 = 本地值20215[是否值20208 ? 'fa' : 'zh'];
function 切换语言(语言) {
  localStorage.setItem('preferredLanguage', 语言);
  const 过期日期20206 = new Date();
  过期日期20206.setFullYear(过期日期20206.getFullYear() + 1);
  document.cookie = 'preferredLanguage=' + 语言 + '; path=/; expires=' + 过期日期20206.toUTCString() + '; SameSite=Lax';
  window.location.reload();
}

window.addEventListener('DOMContentLoaded', function () {
  const 已保存语言20205 = localStorage.getItem('preferredLanguage') || 获取凭据20214('preferredLanguage');
  const 网址参数 = new URLSearchParams(window.location.search);
  const 网址语言 = 网址参数.get('lang');

  if (网址语言) {
    const 当前网址20204 = new URL(window.location.href);
    当前网址20204.searchParams.delete('lang');
    const 新网址 = 当前网址20204.toString();

    const 过期日期20203 = new Date();
    过期日期20203.setFullYear(过期日期20203.getFullYear() + 1);
    document.cookie = 'preferredLanguage=' + 网址语言 + '; path=/; expires=' + 过期日期20203.toUTCString() + '; SameSite=Lax';
    localStorage.setItem('preferredLanguage', 网址语言);

    window.history.replaceState({}, '', 新网址);
  } else if (已保存语言20205) {
    const 过期日期 = new Date();
    过期日期.setFullYear(过期日期.getFullYear() + 1);
    document.cookie = 'preferredLanguage=' + 已保存语言20205 + '; path=/; expires=' + 过期日期.toUTCString() + '; SameSite=Lax';
  }
});

window.显示提示 = function (消息20202, 类型20201, 本地值20200) {
  本地值20200 = 本地值20200 || {};
  var 堆栈 = document.getElementById('cpToastStack');
  if (!堆栈) return;
  var 类型映射 = {
    success: '✓',
    info: '⌬',
    warn: '⚠',
    error: '✕'
  };
  var 标题映射 = {
    success: 'SUCCESS',
    info: 'INFO',
    warn: 'WARN',
    error: 'ERROR'
  };
  类型20201 = 类型映射[类型20201] ? 类型20201 : 'success';
  var 持续时间 = 本地值20200.duration || 3200;
  var 提示 = document.createElement('div');
  提示.className = 'cp-toast cp-toast-' + 类型20201;
  提示.style.setProperty('--cp-toast-dur', 持续时间 + 'ms');
  var 图标 = document.createElement('span');
  图标.className = 'cp-toast-icon';
  图标.textContent = 类型映射[类型20201];
  var 主体 = document.createElement('div');
  主体.className = 'cp-toast-body';
  var 标题 = document.createElement('div');
  标题.className = 'cp-toast-title';
  标题.textContent = 本地值20200.title || 标题映射[类型20201];
  var 消息20199 = document.createElement('div');
  消息20199.className = 'cp-toast-msg';
  消息20199.textContent = String(消息20202 == null ? '' : 消息20202);
  主体.appendChild(标题);
  主体.appendChild(消息20199);
  var 关闭 = document.createElement('button');
  关闭.type = 'button';
  关闭.className = 'cp-toast-close';
  关闭.setAttribute('aria-label', 'close');
  关闭.textContent = '✕';
  提示.appendChild(图标);
  提示.appendChild(主体);
  提示.appendChild(关闭);
  堆栈.appendChild(提示);
  requestAnimationFrame(function () {
    提示.classList.add('cp-show');
  });
  var 本地值20198 = false;
  function 关闭提示() {
    if (本地值20198) return;
    本地值20198 = true;
    提示.classList.remove('cp-show');
    提示.classList.add('cp-hide');
    setTimeout(function () {
      if (提示.parentNode) 提示.parentNode.removeChild(提示);
    }, 400);
  }
  关闭.addEventListener('click', 关闭提示);
  var 计时器 = setTimeout(关闭提示, 持续时间);
  提示.addEventListener('mouseenter', function () {
    clearTimeout(计时器);
  });
  提示.addEventListener('mouseleave', function () {
    计时器 = setTimeout(关闭提示, 1200);
  });
  return {
    dismiss: 关闭提示,
    element: 提示
  };
};
function 尝试打开应用(方案网址20197, 回退回调, 超时20196) {
  超时20196 = 超时20196 || 2500;
  var 应用已打开 = false;
  var 回调已执行 = false;
  var 开始值 = Date.now();
  var 值值20195 = function () {
    var 耗时20194 = Date.now() - 开始值;
    if (耗时20194 < 3000 && !回调已执行) {
      应用已打开 = true;
    }
  };
  window.addEventListener('blur', 值值20195);
  var 值值20193 = function () {
    var 耗时 = Date.now() - 开始值;
    if (耗时 < 3000 && !回调已执行) {
      应用已打开 = true;
    }
  };
  document.addEventListener('visibilitychange', 值值20193);
  var 内嵌框架 = document.createElement('iframe');
  内嵌框架.style.display = 'none';
  内嵌框架.style.width = '1px';
  内嵌框架.style.height = '1px';
  内嵌框架.src = 方案网址20197;
  document.body.appendChild(内嵌框架);
  setTimeout(function () {
    内嵌框架.parentNode && 内嵌框架.parentNode.removeChild(内嵌框架);
    window.removeEventListener('blur', 值值20195);
    document.removeEventListener('visibilitychange', 值值20193);
    if (!回调已执行) {
      回调已执行 = true;
      if (!应用已打开 && 回退回调) {
        回退回调();
      }
    }
  }, 超时20196);
}
function 生成客户端链接(客户端类型, 客户端名称) {
  var 当前网址20192 = window.location.href;
  var 订阅网址20191 = 当前网址20192 + "/sub";
  var 方案网址 = '';
  var 显示名称 = 客户端名称 || '';
  var 最终网址 = 订阅网址20191;
  if (客户端类型 === atob('djJyYXk=')) {
    最终网址 = 订阅网址20191;
    var 网址值20190 = document.getElementById("clientSubscriptionUrl");
    网址值20190.textContent = 最终网址;
    网址值20190.style.display = "block";
    网址值20190.style.overflowWrap = "break-word";
    网址值20190.style.wordBreak = "break-all";
    网址值20190.style.overflowX = "auto";
    网址值20190.style.maxWidth = "100%";
    网址值20190.style.boxSizing = "border-box";
    if (客户端名称 === 'V2RAY') {
      navigator.clipboard.writeText(最终网址).then(function () {
        显示提示(显示名称 + " " + 翻译值20207.subscriptionCopied, 'success');
      });
    } else if (客户端名称 === 'Shadowrocket') {
      方案网址 = '${解码64('c2hhZG93cm9ja2V0Oi8vYWRkLw==')}' + encodeURIComponent(最终网址);
      尝试打开应用(方案网址, function () {
        navigator.clipboard.writeText(最终网址).then(function () {
          显示提示(显示名称 + " " + 翻译值20207.subscriptionCopied, 'success');
        });
      });
    } else if (客户端名称 === 'V2RAYNG') {
      方案网址 = '${解码64('djJyYXluZzovL2luc3RhbGw/dXJsPQ==')}' + encodeURIComponent(最终网址);
      尝试打开应用(方案网址, function () {
        navigator.clipboard.writeText(最终网址).then(function () {
          显示提示(显示名称 + " " + 翻译值20207.subscriptionCopied, 'success');
        });
      });
    } else if (客户端名称 === 'NEKORAY') {
      方案网址 = '${解码64('bmVrb3JheTovL2luc3RhbGwtY29uZmlnP3VybD0=')}' + encodeURIComponent(最终网址);
      尝试打开应用(方案网址, function () {
        navigator.clipboard.writeText(最终网址).then(function () {
          显示提示(显示名称 + " " + 翻译值20207.subscriptionCopied, 'success');
        });
      });
    }
  } else {
    最终网址 = 订阅网址20191 + (订阅网址20191.includes('?') ? '&' : '?') + "target=" + 客户端类型;
    var 网址值20190 = document.getElementById("clientSubscriptionUrl");
    网址值20190.textContent = 最终网址;
    网址值20190.style.display = "block";
    网址值20190.style.overflowWrap = "break-word";
    网址值20190.style.wordBreak = "break-all";
    网址值20190.style.overflowX = "auto";
    网址值20190.style.maxWidth = "100%";
    网址值20190.style.boxSizing = "border-box";
    if (客户端类型 === 'vg' || 客户端类型 === 'pvl') {
      方案网址 = '${解码64('Y2xhc2g6Ly9pbnN0YWxsLWNvbmZpZz91cmw9')}' + encodeURIComponent(最终网址);
      if (客户端类型 === 'pvl') 显示名称 = 'CLASH';
    } else if (客户端类型 === 'pvlsb') {
      方案网址 = '${解码64('c2luZy1ib3g6Ly9pbXBvcnQtY29uZmlnP3VybD0=')}' + encodeURIComponent(最终网址);
      显示名称 = 'SING-BOX';
    } else if (客户端类型 === atob('Y2xhc2g=')) {
      if (客户端名称 === 'STASH') {
        方案网址 = '${解码64('c3Rhc2g6Ly9pbnN0YWxsP3VybD0=')}' + encodeURIComponent(最终网址);
        显示名称 = 'STASH';
      } else {
        方案网址 = '${解码64('Y2xhc2g6Ly9pbnN0YWxsLWNvbmZpZz91cmw9')}' + encodeURIComponent(最终网址);
        显示名称 = 'CLASH';
      }
    } else if (客户端类型 === atob('c3VyZ2U=')) {
      方案网址 = '${解码64('c3VyZ2U6Ly8vaW5zdGFsbC1jb25maWc/dXJsPQ==')}' + encodeURIComponent(最终网址);
      显示名称 = 'SURGE';
    } else if (客户端类型 === atob('c2luZ2JveA==')) {
      方案网址 = '${解码64('c2luZy1ib3g6Ly9pbnN0YWxsLWNvbmZpZz91cmw9')}' + encodeURIComponent(最终网址);
      显示名称 = 'SING-BOX';
    } else if (客户端类型 === atob('bG9vbg==')) {
      方案网址 = '${解码64('bG9vbjovL2luc3RhbGw/dXJsPQ==')}' + encodeURIComponent(最终网址);
      显示名称 = 'LOON';
    } else if (客户端类型 === atob('cXVhbng=')) {
      方案网址 = '${解码64('cXVhbnR1bXVsdC14Oi8vaW5zdGFsbC1jb25maWc/dXJsPQ==')}' + encodeURIComponent(最终网址);
      显示名称 = 'QUANTUMULT X';
    }
    if (方案网址) {
      尝试打开应用(方案网址, function () {
        navigator.clipboard.writeText(最终网址).then(function () {
          显示提示(显示名称 + " " + 翻译值20207.subscriptionCopied, 'success');
        });
      });
    } else {
      navigator.clipboard.writeText(最终网址).then(function () {
        显示提示(显示名称 + " " + 翻译值20207.subscriptionCopied, 'success');
      });
    }
  }
}

window.应用页面特效 = function () {
  var 本地值20189 = localStorage.getItem('cp-fx-off') === '1';
  document.body.classList.toggle('fx-off', 本地值20189);
  var 本地值20188 = document.getElementById('cpFxLabel');
  if (本地值20188) 本地值20188.textContent = 本地值20189 ? 'FX: OFF' : 'FX: ON';
  if (本地值20189) {
    var 本地值20187 = document.getElementById('matrixCodeRain');
    if (本地值20187) 本地值20187.innerHTML = '';
  } else if (typeof 创建矩阵雨 === 'function') {
    var 结果值 = document.getElementById('matrixCodeRain');
    if (结果值 && !结果值.firstChild) 创建矩阵雨();
  }
};
window.切换页面特效 = function () {
  var 本地值20186 = localStorage.getItem('cp-fx-off') === '1';
  localStorage.setItem('cp-fx-off', 本地值20186 ? '0' : '1');
  window.应用页面特效();
};
(function () {
  if (localStorage.getItem('cp-fx-off') === '1') {
    document.addEventListener('DOMContentLoaded', function () {
      document.body.classList.add('fx-off');
      var 本地值20185 = document.getElementById('cpFxLabel');
      if (本地值20185) 本地值20185.textContent = 'FX: OFF';
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
  for (let 索引值20184 = 0; 索引值20184 < 列数; 索引值20184++) {
    const 列20183 = document.createElement('div');
    列20183.className = 'matrix-column';
    列20183.style.left = 索引值20184 * 20 + 'px';
    列20183.style.animationDelay = -Math.random() * 15 + 's';
    列20183.style.animationDuration = Math.random() * 14 + 8 + 's';
    列20183.style.fontSize = Math.random() * 4 + 12 + 'px';
    列20183.style.opacity = (Math.random() * 0.7 + 0.3).toFixed(2);
    let 文本20182 = '';
    const 字符数量 = Math.floor(Math.random() * 30 + 18);
    for (let 次索引值 = 0; 次索引值 < 字符数量; 次索引值++) {
      const 字符 = 赛博字符列表[Math.floor(Math.random() * 赛博字符列表.length)];
      const 值强调 = Math.random() > 0.85;
      const 颜色 = 值强调 ? 调色板[Math.floor(Math.random() * 调色板.length)] : '';
      文本20182 += 颜色 ? '<span style="color:' + 颜色 + ';text-shadow:0 0 8px ' + 颜色 + ';">' + 字符 + '</span><br>' : '<span>' + 字符 + '</span><br>';
    }
    列20183.innerHTML = 文本20182;
    矩阵值.appendChild(列20183);
  }
  setInterval(function () {
    const 列列表 = 矩阵值.querySelectorAll('.matrix-column');
    列列表.forEach(function (列) {
      if (Math.random() > 0.94) {
        const 字符列表 = 列.querySelectorAll('span');
        if (字符列表.length > 0) {
          const 目标20181 = 字符列表[Math.floor(Math.random() * 字符列表.length)];
          const 本地值20180 = 目标20181.style.color;
          目标20181.style.color = '#ffffff';
          目标20181.style.textShadow = '0 0 10px #ffffff, 0 0 18px #00f0ff';
          setTimeout(function () {
            目标20181.style.color = 本地值20180;
            目标20181.style.textShadow = '';
          }, 200);
        }
      }
    });
  }, 110);
}
async function 检查系统状态() {
  try {
    const 云墙状态 = document.getElementById('cfStatus');
    const 地区状态 = document.getElementById('regionStatus');
    const 值值20179 = document.getElementById('geoInfo');
    const 备用状态 = document.getElementById('backupStatus');
    const 当前地址 = document.getElementById('currentIP');
    const 地区值 = document.getElementById('regionMatch');

    function 获取凭据20178(名称20177) {
      const 值20176 = '; ' + document.cookie;
      const 部分列表20175 = 值20176.split('; ' + 名称20177 + '=');
      if (部分列表20175.length === 2) return 部分列表20175.pop().split(';').shift();
      return null;
    }
    const 浏览器语言20174 = navigator.language || navigator.userLanguage || '';
    const 已保存语言20173 = localStorage.getItem('preferredLanguage') || 获取凭据20178('preferredLanguage');
    let 是否值20172 = false;
    if (已保存语言20173 === 'fa' || 已保存语言20173 === 'fa-IR') {
      是否值20172 = true;
    } else if (已保存语言20173 === 'zh' || 已保存语言20173 === 'zh-CN') {
      是否值20172 = false;
    } else {
      是否值20172 = 浏览器语言20174.includes('fa') || 浏览器语言20174.includes('fa-IR');
    }
    const 本地值20171 = {
      zh: {
        workerRegion: 'Worker地区: ',
        detectionMethod: '检测方式: ',
        proxyIPStatus: '${解码64('UHJveHlJUOeKtuaAgTog')}',
        currentIP: '当前使用IP: ',
        regionMatch: '地区匹配: ',
        regionNames: {
          'CF': '${解码64('8J+MkCDlrpjmlrnnm7Tov54=')}',
          'HK': '🇭🇰 香港',
          'US': '🇺🇸 美国',
          'SG': '🇸🇬 新加坡',
          'JP': '🇯🇵 日本',
          'KR': '🇰🇷 韩国',
          'DE': '🇩🇪 德国',
          'SE': '🇸🇪 瑞典',
          'NL': '🇳🇱 荷兰',
          'FI': '🇫🇮 芬兰',
          'GB': '🇬🇧 英国'
        },
        customIPMode: '${解码64('6Ieq5a6a5LmJUHJveHlJUOaooeW8jyAocOWPmOmHj+WQr+eUqCk=')}',
        customIPModeDesc: '自定义IP模式 (已禁用地区匹配)',
        usingCustomProxyIP: '${解码64('5L2/55So6Ieq5a6a5LmJUHJveHlJUDog')}',
        customIPConfig: ' (p变量配置)',
        customIPModeDisabled: '自定义IP模式，地区选择已禁用',
        manualRegion: '手动指定地区',
        manualRegionDesc: ' (手动指定)',
        proxyIPAvailable: '${解码64('MTAvMTAg5Y+v55SoIChQcm94eUlQ5Z+f5ZCN6aKE6K6+5Y+v55SoKQ==')}',
        smartSelection: '智能就近选择中',
        sameRegionIP: '同地区IP可用 (1个)',
        cloudflareDetection: '${解码64('5a6Y5pa555u06L+e')}',
        detectionFailed: '检测失败',
        unknown: '未知'
      },
      fa: {
        workerRegion: 'منطقه Worker: ',
        detectionMethod: 'روش تشخیص: ',
        proxyIPStatus: '${解码64('2YjYtti524zYqiBQcm94eUlQOiA=')}',
        currentIP: 'IP فعلی: ',
        regionMatch: 'تطبیق منطقه: ',
        regionNames: {
          'CF': '🌐 مستقیم رسمی',
          'HK': '🇭🇰 هنگ کنگ',
          'US': '🇺🇸 آمریکا',
          'SG': '🇸🇬 سنگاپور',
          'JP': '🇯🇵 ژاپن',
          'KR': '🇰🇷 کره جنوبی',
          'DE': '🇩🇪 آلمان',
          'SE': '🇸🇪 سوئد',
          'NL': '🇳🇱 هلند',
          'FI': '🇫🇮 فنلاند',
          'GB': '🇬🇧 بریتانیا'
        },
        customIPMode: '${解码64('2K3Yp9mE2KogUHJveHlJUCDYs9mB2KfYsdi024wgKNmF2KrYutuM2LEgcCDZgdi52KfZhCDYp9iz2Kop')}',
        customIPModeDesc: 'حالت IP سفارشی (تطبیق منطقه غیرفعال است)',
        usingCustomProxyIP: '${解码64('2KfYs9iq2YHYp9iv2Ycg2KfYsiBQcm94eUlQINiz2YHYp9ix2LTbjDog')}',
        customIPConfig: ' (پیکربندی متغیر p)',
        customIPModeDisabled: 'حالت IP سفارشی، انتخاب منطقه غیرفعال است',
        manualRegion: 'تعیین منطقه دستی',
        manualRegionDesc: ' (تعیین دستی)',
        proxyIPAvailable: '${解码64('MTAvMTAg2K/YsSDYr9iz2KrYsdizICjYr9in2YXZhtmHINm+24zYtOKAjNmB2LHYtiBQcm94eUlQINiv2LEg2K/Ys9iq2LHYsyDYp9iz2Kop')}',
        smartSelection: 'انتخاب هوشمند نزدیک در حال انجام است',
        sameRegionIP: 'IP هم‌منطقه در دسترس است (1)',
        cloudflareDetection: 'اتصال مستقیم رسمی',
        detectionFailed: 'تشخیص ناموفق',
        unknown: 'ناشناخته'
      }
    };
    const 翻译值20170 = 本地值20171[是否值20172 ? 'fa' : 'zh'];
    let 值地区20169 = 'US'; // 默认值
    let 是否自定义地址值 = false;
    let 是否手动地区值 = false;
    try {
      const 响应20168 = await fetch(window.location.pathname + '/region');
      const 数据20167 = await 响应20168.json();
      if (数据20167.region === 'CUSTOM') {
        是否自定义地址值 = true;
        值地区20169 = 'CUSTOM';

        const 自定义地址值 = 数据20167.ci || 翻译值20170.unknown;
        值值20179.innerHTML = 翻译值20170.detectionMethod + '<span style="color: #ffb400;">⚙️ ' + 翻译值20170.customIPMode + '</span>';
        地区状态.innerHTML = 翻译值20170.workerRegion + '<span style="color: #ffb400;">🔧 ' + 翻译值20170.customIPModeDesc + '</span>';

        if (备用状态) 备用状态.innerHTML = 翻译值20170.proxyIPStatus + '<span style="color: #ffb400;">🔧 ' + 翻译值20170.usingCustomProxyIP + 自定义地址值 + '</span>';
        if (当前地址) 当前地址.innerHTML = 翻译值20170.currentIP + '<span style="color: #ffb400;">✅ ' + 自定义地址值 + 翻译值20170.customIPConfig + '</span>';
        if (地区值) 地区值.innerHTML = 翻译值20170.regionMatch + '<span style="color: #ffb400;">⚠️ ' + 翻译值20170.customIPModeDisabled + '</span>';
        return; // 提前返回，不执行后续的地区匹配逻辑
      } else if (数据20167.detectionMethod === '手动指定地区' || 数据20167.detectionMethod === 'تعیین منطقه دستی') {
        是否手动地区值 = true;
        值地区20169 = 数据20167.region;
        值值20179.innerHTML = 翻译值20170.detectionMethod + '<span style="color: #00b380;">' + 翻译值20170.manualRegion + '</span>';
        地区状态.innerHTML = 翻译值20170.workerRegion + '<span style="color: #00ff9d;">🎯 ' + 翻译值20170.regionNames[值地区20169] + 翻译值20170.manualRegionDesc + '</span>';

        if (备用状态) 备用状态.innerHTML = 翻译值20170.proxyIPStatus + '<span style="color: #00ff9d;">✅ ' + 翻译值20170.proxyIPAvailable + '</span>';
        if (当前地址) 当前地址.innerHTML = 翻译值20170.currentIP + '<span style="color: #00ff9d;">✅ ' + 翻译值20170.smartSelection + '</span>';
        if (地区值) 地区值.innerHTML = 翻译值20170.regionMatch + '<span style="color: #00ff9d;">✅ ' + 翻译值20170.sameRegionIP + '</span>';
        return; // 提前返回，不执行后续的地区匹配逻辑
      } else if (数据20167.region && 翻译值20170.regionNames[数据20167.region]) {
        值地区20169 = 数据20167.region;
      }
      值值20179.innerHTML = 翻译值20170.detectionMethod + '<span style="color: #00ff9d;">' + 翻译值20170.cloudflareDetection + '</span>';
    } catch (事件值20166) {
      值值20179.innerHTML = 翻译值20170.detectionMethod + '<span style="color: #ff3860;">' + 翻译值20170.detectionFailed + '</span>';
    }
    地区状态.innerHTML = 翻译值20170.workerRegion + '<span style="color: #00ff9d;">✅ ' + 翻译值20170.regionNames[值地区20169] + '</span>';

    if (备用状态) {
      备用状态.innerHTML = 翻译值20170.proxyIPStatus + '<span style="color: #00ff9d;">✅ ' + 翻译值20170.proxyIPAvailable + '</span>';
    }
    if (当前地址) {
      当前地址.innerHTML = 翻译值20170.currentIP + '<span style="color: #00ff9d;">✅ ' + 翻译值20170.smartSelection + '</span>';
    }
    if (地区值) {
      地区值.innerHTML = 翻译值20170.regionMatch + '<span style="color: #00ff9d;">✅ ' + 翻译值20170.sameRegionIP + '</span>';
    }
  } catch (错误20165) {
    function 获取凭据20164(名称20163) {
      const 值20162 = '; ' + document.cookie;
      const 部分列表20161 = 值20162.split('; ' + 名称20163 + '=');
      if (部分列表20161.length === 2) return 部分列表20161.pop().split(';').shift();
      return null;
    }
    const 浏览器语言20160 = navigator.language || navigator.userLanguage || '';
    const 已保存语言20159 = localStorage.getItem('preferredLanguage') || 获取凭据20164('preferredLanguage');
    let 是否值20158 = false;
    if (已保存语言20159 === 'fa' || 已保存语言20159 === 'fa-IR') {
      是否值20158 = true;
    } else {
      是否值20158 = 浏览器语言20160.includes('fa') || 浏览器语言20160.includes('fa-IR');
    }
    const 本地值20157 = {
      zh: {
        workerRegion: 'Worker地区: ',
        detectionMethod: '检测方式: ',
        proxyIPStatus: '${解码64('UHJveHlJUOeKtuaAgTog')}',
        currentIP: '当前使用IP: ',
        regionMatch: '地区匹配: ',
        detectionFailed: '检测失败'
      },
      fa: {
        workerRegion: 'منطقه Worker: ',
        detectionMethod: 'روش تشخیص: ',
        proxyIPStatus: '${解码64('2YjYtti524zYqiBQcm94eUlQOiA=')}',
        currentIP: 'IP فعلی: ',
        regionMatch: 'تطبیق منطقه: ',
        detectionFailed: 'تشخیص ناموفق'
      }
    };
    const 翻译值20156 = 本地值20157[是否值20158 ? 'fa' : 'zh'];
    document.getElementById('regionStatus').innerHTML = 翻译值20156.workerRegion + '<span style="color: #ff3860;">❌ ' + 翻译值20156.detectionFailed + '</span>';
    document.getElementById('geoInfo').innerHTML = 翻译值20156.detectionMethod + '<span style="color: #ff3860;">❌ ' + 翻译值20156.detectionFailed + '</span>';
    document.getElementById('backupStatus').innerHTML = 翻译值20156.proxyIPStatus + '<span style="color: #ff3860;">❌ ' + 翻译值20156.detectionFailed + '</span>';
    document.getElementById('currentIP').innerHTML = 翻译值20156.currentIP + '<span style="color: #ff3860;">❌ ' + 翻译值20156.detectionFailed + '</span>';
    document.getElementById('regionMatch').innerHTML = 翻译值20156.regionMatch + '<span style="color: #ff3860;">❌ ' + 翻译值20156.detectionFailed + '</span>';
  }
}
`;
