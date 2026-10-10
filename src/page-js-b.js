const X = `
async function 测试接口() {
  try {
    function 获取凭据20155(名称20154) {
      const 值20153 = '; ' + document.cookie;
      const 部分列表20152 = 值20153.split('; ' + 名称20154 + '=');
      if (部分列表20152.length === 2) return 部分列表20152.pop().split(';').shift();
      return null;
    }
    const 浏览器语言20151 = navigator.language || navigator.userLanguage || '';
    const 已保存语言20150 = localStorage.getItem('preferredLanguage') || 获取凭据20155('preferredLanguage');
    let 是否值20149 = false;
    if (已保存语言20150 === 'fa' || 已保存语言20150 === 'fa-IR') {
      是否值20149 = true;
    } else {
      是否值20149 = 浏览器语言20151.includes('fa') || 浏览器语言20151.includes('fa-IR');
    }
    const 本地值20148 = {
      zh: {
        apiTestResult: 'API检测结果: ',
        apiTestTime: '检测时间: ',
        apiTestFailed: 'API检测失败: ',
        unknownError: '未知错误',
        apiTestError: 'API测试失败: '
      },
      fa: {
        apiTestResult: 'نتیجه تشخیص API: ',
        apiTestTime: 'زمان تشخیص: ',
        apiTestFailed: 'تشخیص API ناموفق: ',
        unknownError: 'خطای ناشناخته',
        apiTestError: 'تست API ناموفق: '
      }
    };
    const 翻译值20147 = 本地值20148[是否值20149 ? 'fa' : 'zh'];
    const 响应20146 = await fetch(window.location.pathname + '/test-api');
    const 数据20145 = await 响应20146.json();
    if (数据20145.detectedRegion) {
      显示提示(翻译值20147.apiTestResult + 数据20145.detectedRegion + '\\n' + 翻译值20147.apiTestTime + 数据20145.timestamp, 'info', {
        duration: 5000
      });
    } else {
      显示提示(翻译值20147.apiTestFailed + (数据20145.error || 翻译值20147.unknownError), 'error', {
        duration: 4500
      });
    }
  } catch (错误20144) {
    function 获取凭据20143(名称20142) {
      const 值20141 = '; ' + document.cookie;
      const 部分列表20140 = 值20141.split('; ' + 名称20142 + '=');
      if (部分列表20140.length === 2) return 部分列表20140.pop().split(';').shift();
      return null;
    }
    const 浏览器语言20139 = navigator.language || navigator.userLanguage || '';
    const 已保存语言20138 = localStorage.getItem('preferredLanguage') || 获取凭据20143('preferredLanguage');
    let 是否值20137 = false;
    if (已保存语言20138 === 'fa' || 已保存语言20138 === 'fa-IR') {
      是否值20137 = true;
    } else {
      是否值20137 = 浏览器语言20139.includes('fa') || 浏览器语言20139.includes('fa-IR');
    }
    const 本地值20136 = {
      zh: {
        apiTestError: 'API测试失败: '
      },
      fa: {
        apiTestError: 'تست API ناموفق: '
      }
    };
    const 翻译值20135 = 本地值20136[是否值20137 ? 'fa' : 'zh'];
    显示提示(翻译值20135.apiTestError + 错误20144.message, 'error', {
      duration: 4500
    });
  }
}

async function 检查键值状态() {
  const 接口网址20134 = window.location.pathname + '/api/config';
  try {
    const 响应20133 = await fetch(接口网址20134);
    function 获取凭据20132(名称20131) {
      const 值20130 = '; ' + document.cookie;
      const 部分列表20129 = 值20130.split('; ' + 名称20131 + '=');
      if (部分列表20129.length === 2) return 部分列表20129.pop().split(';').shift();
      return null;
    }
    const 浏览器语言20128 = navigator.language || navigator.userLanguage || '';
    const 已保存语言20127 = localStorage.getItem('preferredLanguage') || 获取凭据20132('preferredLanguage');
    let 是否值20126 = false;
    if (已保存语言20127 === 'fa' || 已保存语言20127 === 'fa-IR') {
      是否值20126 = true;
    } else {
      是否值20126 = 浏览器语言20128.includes('fa') || 浏览器语言20128.includes('fa-IR');
    }
    const 本地值20125 = {
      zh: {
        kvDisabled: '⚠️ KV存储未启用或未配置',
        kvNotConfigured: 'KV存储未配置，无法使用配置管理功能。\\n\\n请在Cloudflare Workers中:\\n1. 创建KV命名空间\\n2. 绑定环境变量 C\\n3. 重新部署代码',
        kvNotEnabled: 'KV存储未配置',
        kvEnabled: '✅ KV存储已启用，可以使用配置管理功能',
        kvCheckFailed: '⚠️ KV存储检测失败',
        kvCheckFailedFormat: 'KV存储检测失败: 响应格式错误',
        kvCheckFailedStatus: 'KV存储检测失败 - 状态码: ',
        kvCheckFailedError: 'KV存储检测失败 - 错误: '
      },
      fa: {
        kvDisabled: '⚠️ ذخیره‌سازی KV فعال نیست یا پیکربندی نشده است',
        kvNotConfigured: 'ذخیره‌سازی KV پیکربندی نشده است، نمی‌توانید از عملکرد مدیریت تنظیمات استفاده کنید.\\n\\nلطفا در Cloudflare Workers:\\n1. فضای نام KV ایجاد کنید\\n2. متغیر محیطی C را پیوند دهید\\n3. کد را دوباره مستقر کنید',
        kvNotEnabled: 'ذخیره‌سازی KV پیکربندی نشده است',
        kvEnabled: '✅ ذخیره‌سازی KV فعال است، می‌توانید از مدیریت تنظیمات استفاده کنید',
        kvCheckFailed: '⚠️ بررسی ذخیره‌سازی KV ناموفق',
        kvCheckFailedFormat: 'بررسی ذخیره‌سازی KV ناموفق: خطای فرمت پاسخ',
        kvCheckFailedStatus: 'بررسی ذخیره‌سازی KV ناموفق - کد وضعیت: ',
        kvCheckFailedError: 'بررسی ذخیره‌سازی KV ناموفق - خطا: '
      }
    };
    const 翻译值20124 = 本地值20125[是否值20126 ? 'fa' : 'zh'];
    if (响应20133.status === 503) {
      document.getElementById('kvStatus').innerHTML = '<span style="color: #ffb400;">' + 翻译值20124.kvDisabled + '</span>';
      document.getElementById('configCard').style.display = 'block';
      document.getElementById('currentConfig').textContent = 翻译值20124.kvNotConfigured;
    } else if (响应20133.ok) {
      try {
        const 数据20123 = await 响应20133.json();

        if (数据20123 && 数据20123.kvEnabled === true) {
          document.getElementById('kvStatus').innerHTML = '<span style="color: #00ff9d;">' + 翻译值20124.kvEnabled + '</span>';
          document.getElementById('configContent').style.display = 'block';
          document.getElementById('configCard').style.display = 'block';
          await 加载当前配置();
        } else {
          document.getElementById('kvStatus').innerHTML = '<span style="color: #ffb400;">' + 翻译值20124.kvDisabled + '</span>';
          document.getElementById('configCard').style.display = 'block';
          document.getElementById('currentConfig').textContent = 翻译值20124.kvNotEnabled;
        }
      } catch (数据对象错误) {
        document.getElementById('kvStatus').innerHTML = '<span style="color: #ffb400;">' + 翻译值20124.kvCheckFailed + '</span>';
        document.getElementById('configCard').style.display = 'block';
        document.getElementById('currentConfig').textContent = 翻译值20124.kvCheckFailedFormat;
      }
    } else {
      document.getElementById('kvStatus').innerHTML = '<span style="color: #ffb400;">' + 翻译值20124.kvDisabled + '</span>';
      document.getElementById('configCard').style.display = 'block';
      document.getElementById('currentConfig').textContent = 翻译值20124.kvCheckFailedStatus + 响应20133.status;
    }
  } catch (错误20122) {
    function 获取凭据(名称) {
      const 值20121 = '; ' + document.cookie;
      const 部分列表20120 = 值20121.split('; ' + 名称 + '=');
      if (部分列表20120.length === 2) return 部分列表20120.pop().split(';').shift();
      return null;
    }
    const 浏览器语言 = navigator.language || navigator.userLanguage || '';
    const 已保存语言 = localStorage.getItem('preferredLanguage') || 获取凭据('preferredLanguage');
    let 是否值 = false;
    if (已保存语言 === 'fa' || 已保存语言 === 'fa-IR') {
      是否值 = true;
    } else {
      是否值 = 浏览器语言.includes('fa') || 浏览器语言.includes('fa-IR');
    }
    const 本地值20119 = {
      zh: {
        kvDisabled: '⚠️ KV存储未启用或未配置',
        kvCheckFailedError: 'KV存储检测失败 - 错误: '
      },
      fa: {
        kvDisabled: '⚠️ ذخیره‌سازی KV فعال نیست یا پیکربندی نشده است',
        kvCheckFailedError: 'بررسی ذخیره‌سازی KV ناموفق - خطا: '
      }
    };
    const 翻译值20118 = 本地值20119[是否值 ? 'fa' : 'zh'];
    document.getElementById('kvStatus').innerHTML = '<span style="color: #ffb400;">' + 翻译值20118.kvDisabled + '</span>';
    document.getElementById('configCard').style.display = 'block';
    document.getElementById('currentConfig').textContent = 翻译值20118.kvCheckFailedError + 错误20122.message;
  }
}
function 读取字段值(标识) {
  const 元素 = document.getElementById(标识);
  return 元素 ? 元素.value : '';
}

function 写入字段值(标识, 值 = '') {
  const 元素 = document.getElementById(标识);
  if (元素) 元素.value = 值 || '';
}

function 是否开关启用(值, 默认启用 = false) {
  if (值 === undefined || 值 === null || 值 === '') return 默认启用;
  if (值 === true || 值 === false) return 值;
  const 文本 = String(值).trim().toLowerCase();
  if (文本 === 'yes' || 文本 === 'true' || 文本 === '1' || 文本 === 'on') return true;
  if (文本 === 'no' || 文本 === 'false' || 文本 === '0' || 文本 === 'off') return false;
  return 默认启用;
}

function 写入开关值(标识, 值, 默认启用 = false) {
  const 元素 = document.getElementById(标识);
  if (元素) 元素.checked = 是否开关启用(值, 默认启用);
}

function 读取开关值(标识, 默认启用 = false) {
  const 元素 = document.getElementById(标识);
  if (!元素) return 默认启用 ? 'yes' : 'no';
  return 元素.checked ? 'yes' : 'no';
}

function 同步协议界面状态() {
  const 明文开关 = document.getElementById('ev');
  const 木马开关 = document.getElementById('et');
  const 扩展开关 = document.getElementById('ex');
  if (明文开关 && 木马开关 && 扩展开关 && !明文开关.checked && !木马开关.checked && !扩展开关.checked) {
    明文开关.checked = true;
  }
}

function 同步联动界面状态() {
  同步协议界面状态();
  const 加密客户端问候复选框 = document.getElementById('ech');
  const 端口控制 = document.getElementById('portControl');
  if (加密客户端问候复选框 && 端口控制 && 加密客户端问候复选框.checked) {
    端口控制.value = 'yes';
  }
  更新路径类型状态(读取字段值('customPath'));
  更新工作器地区状态();
}

function 应用配置到界面(配置) {
  写入字段值('wkRegion', 配置.wk);
  写入开关值('ev', 配置.ev, true);
  写入开关值('et', 配置.et, false);
  写入开关值('ex', 配置.ex, false);
  写入开关值('ech', 配置.ech, false);
  写入字段值('tp', 配置.tp);
  写入字段值('customDNS', 配置.customDNS);
  写入字段值('customECHDomain', 配置.customECHDomain);
  写入字段值('alpn', 配置.alpn);
  写入字段值('scu', 配置.scu);
  写入开关值('ena', 配置.ena, false);
  写入开关值('jk', 配置.jk, false);
  const 家宽按钮 = document.getElementById('jkClientBtn');
  if (家宽按钮) 家宽按钮.style.display = 是否开关启用(配置.jk, false) ? '' : 'none';
  写入开关值('pvl', 配置.pvl, false);
  写入字段值('pvlURL', 配置.pvlURL);
  写入字段值('pvlmin', 配置.pvlmin);
  写入字段值('pvlmax', 配置.pvlmax);
  写入字段值('pvllimit', 配置.pvllimit);
  写入字段值('pvlcountry', 配置.pvlcountry);
  写入字段值('pvlproto', 配置.pvlproto);
  写入开关值('pvlraw', 配置.pvlraw, true);
  const 公共开关 = 是否开关启用(配置.pvl, false);
  for (const 标识 of ['pvlClientBtn', 'pvlUriClientBtn', 'pvlBoxClientBtn']) {
    const 按钮 = document.getElementById(标识);
    if (按钮) 按钮.style.display = 公共开关 ? '' : 'none';
  }
  写入开关值('epd', 配置.epd, true);
  写入开关值('epi', 配置.epi, true);
  写入开关值('egi', 配置.egi, true);
  写入开关值('ipv4Enabled', 配置.ipv4, true);
  写入开关值('ipv6Enabled', 配置.ipv6, true);
  写入开关值('ispMobile', 配置.ispMobile, true);
  写入开关值('ispUnicom', 配置.ispUnicom, true);
  写入开关值('ispTelecom', 配置.ispTelecom, true);
  写入字段值('customPath', 配置.d);
  写入字段值('customIP', 配置.p);
  写入字段值('yx', 配置.yx);
  写入字段值('yxURL', 配置.yxURL);
  写入字段值('socksConfig', 配置.s);
  写入字段值('customHomepage', 配置.homepage);
  写入字段值('apiEnabled', 配置.ae);
  写入字段值('regionMatching', 配置.rm);
  写入字段值('downgradeControl', 配置.qj);
  写入字段值('portControl', 配置.dkby);
  写入字段值('preferredControl', 配置.yxby);
  同步联动界面状态();
}

function 收集界面配置() {
  const 配置 = {
    wk: 读取字段值('wkRegion'),
    ev: 读取开关值('ev', true),
    et: 读取开关值('et', false),
    ex: 读取开关值('ex', false),
    ech: 读取开关值('ech', false),
    tp: 读取字段值('tp'),
    customDNS: 读取字段值('customDNS'),
    customECHDomain: 读取字段值('customECHDomain'),
    alpn: 读取字段值('alpn'),
    d: 读取字段值('customPath'),
    p: 读取字段值('customIP'),
    yx: 读取字段值('yx'),
    yxURL: 读取字段值('yxURL'),
    s: 读取字段值('socksConfig'),
    homepage: 读取字段值('customHomepage'),
    scu: 读取字段值('scu'),
    ena: 读取开关值('ena', false),
    jk: 读取开关值('jk', false),
    pvl: 读取开关值('pvl', false),
    pvlURL: 读取字段值('pvlURL'),
    pvlmin: 读取字段值('pvlmin'),
    pvlmax: 读取字段值('pvlmax'),
    pvllimit: 读取字段值('pvllimit'),
    pvlcountry: 读取字段值('pvlcountry'),
    pvlproto: 读取字段值('pvlproto'),
    pvlraw: 读取开关值('pvlraw', true),
    epd: 读取开关值('epd', true),
    epi: 读取开关值('epi', true),
    egi: 读取开关值('egi', true),
    ae: 读取字段值('apiEnabled'),
    rm: 读取字段值('regionMatching'),
    qj: 读取字段值('downgradeControl'),
    dkby: 读取字段值('portControl'),
    yxby: 读取字段值('preferredControl'),
    ipv4: 读取开关值('ipv4Enabled', true),
    ipv6: 读取开关值('ipv6Enabled', true),
    ispMobile: 读取开关值('ispMobile', true),
    ispUnicom: 读取开关值('ispUnicom', true),
    ispTelecom: 读取开关值('ispTelecom', true)
  };
  if (配置.ev === 'no' && 配置.et === 'no' && 配置.ex === 'no') {
    配置.ev = 'yes';
    写入开关值('ev', 'yes', true);
  }
  if (配置.ech === 'yes') {
    配置.dkby = 'yes';
    写入字段值('portControl', 'yes');
  }
  return 配置;
}

async function 加载当前配置() {
  const 接口网址20117 = window.location.pathname + '/api/config';
  try {
    const 响应20116 = await fetch(接口网址20117);
    if (响应20116.status === 503) {
      document.getElementById('currentConfig').textContent = 'KV存储未配置，无法加载配置';
      return;
    }
    if (!响应20116.ok) {
      const 错误文本20115 = await 响应20116.text();
      document.getElementById('currentConfig').textContent = '加载配置失败: ' + 错误文本20115;
      return;
    }
    const 配置 = await 响应20116.json();

    const 显示配置 = {};
    for (const [键20114, 值20113] of Object.entries(配置)) {
      if (键20114 !== 'kvEnabled') {
        显示配置[键20114] = 值20113;
      }
    }
    let 配置文本 = '当前配置:\\n';
    if (Object.keys(显示配置).length === 0) {
      配置文本 += '(暂无配置)';
    } else {
      for (const [键, 值20112] of Object.entries(显示配置)) {
        配置文本 += 键 + ': ' + (值20112 || '(未设置)') + '\\n';
      }
    }
    document.getElementById('currentConfig').textContent = 配置文本;

    应用配置到界面(配置);
  } catch (错误20111) {
    document.getElementById('currentConfig').textContent = '加载配置失败: ' + 错误20111.message;
  }
}

function 更新路径类型状态(自定义路径) {
  const 路径类型状态 = document.getElementById('pathTypeStatus');
  const 当前网址20110 = window.location.href;
  const 路径部分列表 = window.location.pathname.split('/').filter(参数值20109 => 参数值20109);
  const 当前路径 = 路径部分列表.length > 0 ? 路径部分列表[0] : '';
  if (自定义路径 && 自定义路径.trim()) {
    路径类型状态.innerHTML = '<div style="color: #00ff9d;">使用类型: <strong>自定义路径 (d)</strong></div>' + '<div style="margin-top: 5px; color: #00f0ff;">当前路径: <span style="color: #ffb400;">' + 自定义路径 + '</span></div>' + '<div style="margin-top: 5px; font-size: 0.9rem; color: #7aa9c4;">访问地址: ' + (当前网址20110.split('/')[0] + '//' + 当前网址20110.split('/')[2]) + 自定义路径 + '/sub</div>';
  } else {
    路径类型状态.innerHTML = '<div style="color: #00ff9d;">使用类型: <strong>UUID 路径 (u)</strong></div>' + '<div style="margin-top: 5px; color: #00f0ff;">当前路径: <span style="color: #ffb400;">' + (当前路径 || '(UUID)') + '</span></div>' + '<div style="margin-top: 5px; font-size: 0.9rem; color: #7aa9c4;">访问地址: ' + 当前网址20110.split('/sub')[0] + '/sub</div>';
  }
}

function 更新工作器地区状态() {
  const 自定义地址输入20108 = document.getElementById('customIP');
  const 值地区 = document.getElementById('wkRegion');
  const 值地区值 = document.getElementById('wkRegionHint');
  if (自定义地址输入20108 && 值地区) {
    const 是否有自定义地址 = 自定义地址输入20108.value.trim() !== '';
    值地区.disabled = 是否有自定义地址;

    if (是否有自定义地址) {
      值地区.style.opacity = '0.5';
      值地区.style.cursor = 'not-allowed';
      值地区.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      if (值地区值) {
        值地区值.style.display = 'block';
        值地区值.style.color = '#ffb400';
      }
    } else {
      值地区.style.opacity = '1';
      值地区.style.cursor = 'pointer';
      值地区.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      if (值地区值) {
        值地区值.style.display = 'none';
      }
    }
  }
}
async function 保存配置(配置数据20107) {
  const 接口网址 = window.location.pathname + '/api/config';
  try {
    const 响应20106 = await fetch(接口网址, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(配置数据20107)
    });
    if (响应20106.status === 503) {
      显示状态('KV存储未配置，无法保存配置。请先在Cloudflare Workers中配置KV存储。', 'error');
      return;
    }
    if (!响应20106.ok) {
      const 错误文本20105 = await 响应20106.text();

      try {
        const 错误数据20104 = JSON.parse(错误文本20105);
        显示状态(错误数据20104.message || '保存失败', 'error');
      } catch (解析错误20103) {
        显示状态('保存失败: ' + 错误文本20105, 'error');
      }
      return;
    }
    const 结果20102 = await 响应20106.json();
    显示状态(结果20102.message, 结果20102.success ? 'success' : 'error');
    if (结果20102.success) {
      await 加载当前配置();
      更新工作器地区状态();
      setTimeout(function () {
        window.location.reload();
      }, 1500);
    } else {}
  } catch (错误20101) {
    显示状态('保存失败: ' + 错误20101.message, 'error');
  }
}
function 显示状态(消息20100, 类型20099) {
  const 状态值 = document.getElementById('statusMessage');
  if (状态值) {
    状态值.textContent = 消息20100;
    状态值.style.display = 'block';
    状态值.style.color = 类型20099 === 'success' ? '#00f0ff' : '#ff3860';
    状态值.style.borderColor = 类型20099 === 'success' ? '#00f0ff' : '#ff3860';
    setTimeout(function () {
      状态值.style.display = 'none';
    }, 3000);
  }
  if (typeof window.显示操作状态 === 'function') {
    window.显示操作状态(消息20100, 类型20099 === 'success' ? 'ok' : 'err');
  }
}
async function 重置全部配置() {
  if (confirm('确定要重置所有配置吗？这将清空所有KV配置，恢复为环境变量设置。')) {
    try {
      const 响应20098 = await fetch(window.location.pathname + '/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          wk: '',
          d: '',
          p: '',
          yx: '',
          yxURL: '',
          s: '',
          ae: '',
          rm: '',
          qj: '',
          dkby: '',
          yxby: '',
          ev: '',
          et: '',
          ex: '',
          ech: '',
          tp: '',
          customDNS: '',
          customECHDomain: '',
          scu: '',
          epd: '',
          epi: '',
          egi: '',
          ipv4: '',
          ipv6: '',
          ispMobile: '',
          ispUnicom: '',
          ispTelecom: '',
          homepage: '',
          alpn: ''
        })
      });
      if (响应20098.status === 503) {
        显示状态('KV存储未配置，无法重置配置。', 'error');
        return;
      }
      if (!响应20098.ok) {
        const 错误文本 = await 响应20098.text();

        try {
          const 错误数据 = JSON.parse(错误文本);
          显示状态(错误数据.message || '重置失败', 'error');
        } catch (解析错误) {
          显示状态('重置失败: ' + 错误文本, 'error');
        }
        return;
      }
      const 结果20097 = await 响应20098.json();
      显示状态(结果20097.message || '配置已重置', 结果20097.success ? 'success' : 'error');
      if (结果20097.success) {
        await 加载当前配置();
        更新工作器地区状态();
        setTimeout(function () {
          window.location.reload();
        }, 1500);
      }
    } catch (错误20096) {
      显示状态('重置失败: ' + 错误20096.message, 'error');
    }
  }
`;
