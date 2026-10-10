const X = `
document.addEventListener('DOMContentLoaded', function () {
  创建矩阵雨();
  检查系统状态();
  检查键值状态();
  检查加密问候状态();

  const 加密客户端问候复选框 = document.getElementById('ech');
  const 端口控制 = document.getElementById('portControl');
  if (加密客户端问候复选框 && 端口控制) {
    加密客户端问候复选框.addEventListener('change', function () {
      if (this.checked) {
        端口控制.value = 'yes';
      }
      同步联动界面状态();
    });

    if (加密客户端问候复选框.checked) {
      端口控制.value = 'yes';
    }
  }

  const 自定义地址输入 = document.getElementById('customIP');
  if (自定义地址输入) {
    自定义地址输入.addEventListener('input', function () {
      同步联动界面状态();
    });
  }


  const 自定义路径输入 = document.getElementById('customPath');
  if (自定义路径输入) {
    自定义路径输入.addEventListener('input', function () {
      同步联动界面状态();
    });
  }

  ['ev', 'et', 'ex'].forEach(function (协议标识) {
    const 协议开关 = document.getElementById(协议标识);
    if (协议开关) {
      协议开关.addEventListener('change', function () {
        同步联动界面状态();
      });
    }
  });

  ['regionForm', 'otherConfigForm', 'advancedConfigForm'].forEach(function (本地值20093) {
    const 表单值 = document.getElementById(本地值20093);
    if (表单值) 表单值.addEventListener('submit', function (事件值20092) {
      事件值20092.preventDefault();
    });
  });

  document.querySelectorAll('#configContent input[type="text"], #configContent input[type="number"]').forEach(function (本地值20091) {
    本地值20091.addEventListener('keydown', function (事件值20090) {
      if (事件值20090.key === 'Enter') {
        事件值20090.preventDefault();
        保存全部配置();
      }
    });
  });

  function 收集全部配置() {
    return 收集界面配置();
  }
  async function 保存全部配置() {
    const 值值20085 = document.getElementById('ev'),
      值值20084 = document.getElementById('et'),
      值值20083 = document.getElementById('ex');
    if (值值20085 && 值值20084 && 值值20083 && !值值20085.checked && !值值20084.checked && !值值20083.checked) {
      显示操作状态('${是否值236 ? 解码64('2K3Yr9in2YLZhCDbjNqpINm+2LHZiNiq2qnZhCDYsdinINmB2LnYp9mEINqp2YbbjNivIQ==') : 解码64('6Iez5bCR6ZyA6KaB5ZCv55So5LiA5Liq5Y2P6K6u77yB')}', 'err');
      显示提示('${是否值236 ? 解码64('2K3Yr9in2YLZhCDbjNqpINm+2LHZiNiq2qnZhCDYsdinINmB2LnYp9mEINqp2YbbjNivIQ==') : 解码64('6Iez5bCR6ZyA6KaB5ZCv55So5LiA5Liq5Y2P6K6u77yB')}', 'warn');
      return;
    }
    const 本地值20082 = document.getElementById('cpBtnSaveAll');
    if (本地值20082) {
      本地值20082.classList.add('cp-action-btn-saving');
      本地值20082.disabled = true;
    }
    try {
      await 保存配置(收集全部配置());
    } finally {
      if (本地值20082) {
        本地值20082.classList.remove('cp-action-btn-saving');
        本地值20082.disabled = false;
      }
    }
  }
  window.保存全部配置 = 保存全部配置;
  function 显示操作状态(消息, 类型) {
    const 本地值20081 = document.getElementById('cpActionStatus');
    if (!本地值20081) return;
    本地值20081.textContent = 消息;
    本地值20081.classList.toggle('cp-err', 类型 === 'err');
    本地值20081.classList.add('cp-show');
    clearTimeout(显示操作状态._t);
    显示操作状态._t = setTimeout(function () {
      本地值20081.classList.remove('cp-show');
    }, 2400);
  }
  window.显示操作状态 = 显示操作状态;

  const 值操作值 = document.getElementById('cpActionBar');
  const 值值保存值 = document.getElementById('cpBtnSaveAll');
  if (值值保存值) 值值保存值.addEventListener('click', async function () {
    值值保存值.classList.add('cp-action-btn-saving');
    try {
      await 保存全部配置();
      if (值操作值) 值操作值.classList.remove('cp-dirty');
    } finally {
      值值保存值.classList.remove('cp-action-btn-saving');
    }
  });
  const 值值值20080 = document.getElementById('cpBtnRefresh');
  if (值值值20080) 值值值20080.addEventListener('click', async function () {
    值值值20080.classList.add('cp-action-btn-saving');
    try {
      await 加载当前配置();
      if (值操作值) 值操作值.classList.remove('cp-dirty');
      显示操作状态('${是否值236 ? 'تنظیمات تازه‌سازی شد' : '配置已刷新'}');
    } finally {
      值值值20080.classList.remove('cp-action-btn-saving');
    }
  });
  const 值值重置 = document.getElementById('cpBtnReset');
  if (值值重置) 值值重置.addEventListener('click', 重置全部配置);

  function 标记已修改() {
    if (值操作值) 值操作值.classList.add('cp-dirty');
  }
  const 已修改范围 = document.getElementById('configContent') || document;
  ['input', 'change'].forEach(function (本地值20079) {
    已修改范围.addEventListener(本地值20079, function (事件值20078) {
      const 本地值20077 = 事件值20078.target;
      if (!本地值20077 || !本地值20077.tagName) return;
      const 本地值20076 = 本地值20077.tagName.toLowerCase();
      if (本地值20076 === 'input' || 本地值20076 === 'select' || 本地值20076 === 'textarea') {
        if (本地值20077.id && /^(latencyTestInput|fetchURLInput|latencyTestPort|randomIPCount|testThreads|ipSourceSelect)$/.test(本地值20077.id)) return;
        标记已修改();
      }
    });
  });

  window.addEventListener('keydown', function (事件值20075) {
    if ((事件值20075.ctrlKey || 事件值20075.metaKey) && (事件值20075.key === 's' || 事件值20075.key === 'S')) {
      事件值20075.preventDefault();
      if (值值保存值 && !值值保存值.classList.contains('cp-action-btn-saving')) {
        值值保存值.click();
      }
    }
  });
  let 测试值控制器 = null;
  let 测试结果列表 = [];
  const 开始测试值 = document.getElementById('startLatencyTest');
  const 值测试值 = document.getElementById('stopLatencyTest');
  const 测试状态 = document.getElementById('latencyTestStatus');
  const 测试结果列表值 = document.getElementById('latencyTestResults');
  const 结果列表列表 = document.getElementById('latencyResultsList');
  const 覆盖已选值 = document.getElementById('overwriteSelectedToYx');
  const 追加已选值 = document.getElementById('appendSelectedToYx');
  const 选择值值 = document.getElementById('selectAllResults');
  const 值值值 = document.getElementById('deselectAllResults');
  const 地址源选择 = document.getElementById('ipSourceSelect');
  const 手动输入值 = document.getElementById('manualInputDiv');
  const 网址获取值 = document.getElementById('urlFetchDiv');
  const 延迟测试输入 = document.getElementById('latencyTestInput');
  const 获取网址输入 = document.getElementById('fetchURLInput');
  const 延迟测试端口 = document.getElementById('latencyTestPort');
  const 随机地址数量 = document.getElementById('randomIPCount');
  const 云墙随机值 = document.getElementById('cfRandomDiv');
  const 随机数量值 = document.getElementById('randomCountDiv');
  const 生成云墙地址值 = document.getElementById('generateCFIPBtn');
  const 获取地址值 = document.getElementById('fetchIPBtn');
  if (延迟测试输入) {
    const 已保存测试输入 = localStorage.getItem('latencyTestInput');
    if (已保存测试输入) 延迟测试输入.value = 已保存测试输入;
    延迟测试输入.addEventListener('input', function () {
      localStorage.setItem('latencyTestInput', this.value);
    });
  }
  if (获取网址输入) {
    const 已保存获取网址 = localStorage.getItem('fetchURLInput');
    if (已保存获取网址) 获取网址输入.value = 已保存获取网址;
    获取网址输入.addEventListener('input', function () {
      localStorage.setItem('fetchURLInput', this.value);
    });
  }
  if (延迟测试端口) {
    const 已保存端口 = localStorage.getItem('latencyTestPort');
    if (已保存端口) 延迟测试端口.value = 已保存端口;
    延迟测试端口.addEventListener('input', function () {
      localStorage.setItem('latencyTestPort', this.value);
    });
  }
  if (随机地址数量) {
    const 已保存数量 = localStorage.getItem('randomIPCount');
    if (已保存数量) 随机地址数量.value = 已保存数量;
    随机地址数量.addEventListener('input', function () {
      localStorage.setItem('randomIPCount', this.value);
    });
    if (随机数量值 && 随机数量值.style.display === 'none') {
      随机地址数量.disabled = true;
    }
  }
  const 测试线程数输入 = document.getElementById('testThreads');
  if (测试线程数输入) {
    const 已保存线程数 = localStorage.getItem('testThreads');
    if (已保存线程数) 测试线程数输入.value = 已保存线程数;
    测试线程数输入.addEventListener('input', function () {
      localStorage.setItem('testThreads', this.value);
    });
  }
  if (地址源选择) {
    const 已保存源 = localStorage.getItem('ipSourceSelect');
    const 当前源 = 已保存源 || 地址源选择.value || 'manual';
    if (已保存源) {
      地址源选择.value = 已保存源;
    }
    手动输入值.style.display = 当前源 === 'manual' ? 'block' : 'none';
    网址获取值.style.display = 当前源 === 'urlFetch' ? 'block' : 'none';
    云墙随机值.style.display = 当前源 === 'cfRandom' ? 'block' : 'none';
    随机数量值.style.display = 当前源 === 'cfRandom' ? 'block' : 'none';
    if (随机地址数量) {
      随机地址数量.disabled = 当前源 !== 'cfRandom';
    }
  }
  const 云墙网段列表 = ['173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22', '141.101.64.0/18', '108.162.192.0/18', '190.93.240.0/20', '188.114.96.0/20', '197.234.240.0/22', '198.41.128.0/17', '162.158.0.0/15', '104.16.0.0/13', '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22'];
  function 从网段生成随机地址(网段20074) {
    const [基础地址, 前缀长度] = 网段20074.split('/');
    const 前缀 = parseInt(前缀长度);
    const 主机值 = 32 - 前缀;
    const 地址部分列表 = 基础地址.split('.').map(参数值20073 => parseInt(参数值20073));
    const 地址值 = 地址部分列表[0] << 24 | 地址部分列表[1] << 16 | 地址部分列表[2] << 8 | 地址部分列表[3];
    const 随机偏移 = Math.floor(Math.random() * Math.pow(2, 主机值));
    const 掩码 = 0xFFFFFFFF << 主机值 >>> 0;
    const 随机地址 = ((地址值 & 掩码) >>> 0) + 随机偏移 >>> 0;
    return [随机地址 >>> 24 & 0xFF, 随机地址 >>> 16 & 0xFF, 随机地址 >>> 8 & 0xFF, 随机地址 & 0xFF].join('.');
  }
  function 生成云墙随机地址(数量20072, 端口20071) {
    const 地址列表20070 = [];
    for (let 索引值20069 = 0; 索引值20069 < 数量20072; 索引值20069++) {
      const 网段 = 云墙网段列表[Math.floor(Math.random() * 云墙网段列表.length)];
      const 地址20068 = 从网段生成随机地址(网段);
      地址列表20070.push(地址20068 + ':' + 端口20071);
    }
    return 地址列表20070;
  }
  if (地址源选择) {
    地址源选择.addEventListener('change', function () {
      const 值 = this.value;
      localStorage.setItem('ipSourceSelect', 值);
      手动输入值.style.display = 值 === 'manual' ? 'block' : 'none';
      网址获取值.style.display = 值 === 'urlFetch' ? 'block' : 'none';
      云墙随机值.style.display = 值 === 'cfRandom' ? 'block' : 'none';
      随机数量值.style.display = 值 === 'cfRandom' ? 'block' : 'none';
      if (随机地址数量) {
        随机地址数量.disabled = 值 !== 'cfRandom';
      }
    });
  }
  if (生成云墙地址值) {
    生成云墙地址值.addEventListener('click', function () {
      const 数量 = parseInt(document.getElementById('randomIPCount').value) || 20;
      const 端口20067 = document.getElementById('latencyTestPort').value || '443';
      const 地址列表 = 生成云墙随机地址(数量, 端口20067);
      document.getElementById('latencyTestInput').value = 地址列表.join(',');
      手动输入值.style.display = 'block';
      显示状态('${是否值236 ? 'تولید شد' : '已生成'} ' + 数量 + ' ${是否值236 ? 'IP تصادفی CF' : '个CF随机IP'}', 'success');
    });
  }
  if (获取地址值) {
    获取地址值.addEventListener('click', async function () {
      const 网址输入 = document.getElementById('fetchURLInput');
      const 获取网址 = 网址输入.value.trim();
      if (!获取网址) {
        显示提示('${是否值236 ? 'لطفا URL را وارد کنید' : '请输入URL'}', 'warn');
        return;
      }
      获取地址值.disabled = true;
      获取地址值.textContent = '${是否值236 ? 'در حال دریافت...' : '获取中...'}';
      try {
        const 网址列表 = Array.from(new Set(获取网址.split(',').map(网址值20066 => 网址值20066.trim()).filter(网址值20065 => 网址值20065)));
        const 值项目列表 = [];
        for (const 网址值 of 网址列表) {
          const 响应 = await fetch(网址值);
          if (!响应.ok) {
            throw new Error('HTTP ' + 响应.status + ' @ ' + 网址值);
          }
          const 文本20064 = await 响应.text();

          const 值网址项目列表 = 文本20064.split(/\\r?\\n/).map(行值20063 => 行值20063.trim()).filter(行值20062 => 行值20062 && !行值20062.startsWith('#')).flatMap(行值 => 行值.split(',').map(参数值20061 => 参数值20061.trim()).filter(参数值 => 参数值));
          值项目列表.push(...值网址项目列表);
        }
        if (值项目列表.length > 0) {
          document.getElementById('latencyTestInput').value = 值项目列表.join(',');
          手动输入值.style.display = 'block';
          显示状态('${是否值236 ? 'دریافت شد' : '已获取'} ' + 值项目列表.length + ' ${是否值236 ? 'IP' : '个IP'}', 'success');
        } else {
          显示状态('${是否值236 ? 'داده‌ای یافت نشد' : '未获取到数据'}', 'error');
        }
      } catch (错误20060) {
        显示状态('${是否值236 ? 'خطا در دریافت' : '获取失败'}: ' + 错误20060.message, 'error');
      } finally {
        获取地址值.disabled = false;
        获取地址值.textContent = '⬇ ${是否值236 ? 'دریافت IP' : '获取IP'}';
      }
    });
  }
  if (开始测试值) {
    开始测试值.addEventListener('click', async function () {
      const 输入值20059 = document.getElementById('latencyTestInput');
      const 端口值 = document.getElementById('latencyTestPort');
      const 线程数值 = document.getElementById('testThreads');
      const 输入值 = 输入值20059.value.trim();
      const 默认端口 = 端口值.value || '443';
      const 线程数 = parseInt(线程数值.value) || 5;
      if (!输入值) {
        显示状态('${是否值236 ? 'لطفا IP یا دامنه وارد کنید' : '请输入IP或域名'}', 'error');
        return;
      }
      const 本地值20058 = 输入值.split(',').map(翻译值20057 => 翻译值20057.trim()).filter(翻译值20056 => 翻译值20056);
      if (本地值20058.length === 0) return;
      开始测试值.style.display = 'none';
      值测试值.style.display = 'inline-block';
      测试状态.style.display = 'block';
      测试结果列表值.style.display = 'block';
      结果列表列表.innerHTML = '';
      测试结果列表 = [];
      if (城市筛选值) {
        城市筛选值.style.display = 'none';
      }
      测试值控制器 = new AbortController();
      let 本地值20055 = 0;
      const 本地值20054 = 本地值20058.length;
      function 解析目标(目标20053) {
        let 主机20052 = 目标20053;
        let 端口20051 = 默认端口;
        let 节点名称20050 = '';
        if (目标20053.includes('#')) {
          const 部分列表20049 = 目标20053.split('#');
          节点名称20050 = 部分列表20049[1] || '';
          主机20052 = 部分列表20049[0];
        }
        if (主机20052.includes(':') && !主机20052.startsWith('[')) {
          const 值值20048 = 主机20052.lastIndexOf(':');
          const 值端口 = 主机20052.substring(值值20048 + 1);
          if (/^[0-9]+$/.test(值端口)) {
            端口20051 = 值端口;
            主机20052 = 主机20052.substring(0, 值值20048);
          }
        } else if (主机20052.includes(']:')) {
          const 部分列表20047 = 主机20052.split(']:');
          主机20052 = 部分列表20047[0] + ']';
          端口20051 = 部分列表20047[1];
        }
        return {
          host: 主机20052,
          port: 端口20051,
          nodeName: 节点名称20050
        };
      }
      function 渲染结果(结果20046, 索引20045, 值值20044 = true) {
        if (!结果20046.success) {
          return null;
        }
        const 结果项目 = document.createElement('div');
        结果项目.style.cssText = 'display: flex; align-items: center; padding: 8px; border-bottom: 1px solid #003300; gap: 10px;';
        结果项目.dataset.index = 索引20045;
        结果项目.dataset.colo = 结果20046.colo || '';
        if (!值值20044) {
          结果项目.style.display = 'none';
        }
        const 复选框20043 = document.createElement('input');
        复选框20043.type = 'checkbox';
        复选框20043.checked = true;
        复选框20043.disabled = false;
        复选框20043.dataset.index = 索引20045;
        复选框20043.style.cssText = 'width: 18px; height: 18px; cursor: pointer;';
        const 本地值20042 = document.createElement('div');
        本地值20042.style.cssText = 'flex: 1; font-family: monospace; font-size: 13px;';
        const 机房名称20041 = 结果20046.colo ? 获取机房名称(结果20046.colo) : '';
        const 机房显示 = 机房名称20041 ? ' <span style="color: #00aaff;">[' + 机房名称20041 + ']</span>' : '';
        本地值20042.innerHTML = '<span style="color: #00f0ff;">' + 结果20046.host + ':' + 结果20046.port + '</span>' + 机房显示 + ' <span style="color: #ffff00;">' + 结果20046.latency + 'ms</span>';
        结果项目.appendChild(复选框20043);
        结果项目.appendChild(本地值20042);
        结果列表列表.appendChild(结果项目);
        return 结果项目;
      }
      async function 测试单项(目标) {
        if (测试值控制器.signal.aborted) return null;
        const {
          host: 主机20040,
          port: 端口20039,
          nodeName: 节点名称
        } = 解析目标(目标);
        const 结果20038 = await 测试延迟(主机20040, 端口20039, 测试值控制器.signal);
        结果20038.host = 主机20040;
        结果20038.port = 端口20039;
        结果20038.nodeName = 结果20038.success && 结果20038.colo ? 节点名称 || 'CF-' + 结果20038.colo : 节点名称 || 主机20040;
        return 结果20038;
      }
      for (let 索引值20037 = 0; 索引值20037 < 本地值20054; 索引值20037 += 线程数) {
        if (测试值控制器.signal.aborted) break;
        const 本地值20036 = 本地值20058.slice(索引值20037, Math.min(索引值20037 + 线程数, 本地值20054));
        测试状态.textContent = '${是否值236 ? 'در حال تست' : '测试中'}: ' + (索引值20037 + 1) + '-' + Math.min(索引值20037 + 线程数, 本地值20054) + '/' + 本地值20054 + ' (${是否值236 ? 'رشته‌ها' : '线程'}: ' + 线程数 + ')';
        const 结果列表 = await Promise.all(本地值20036.map(翻译值 => 测试单项(翻译值)));
        for (const 结果20035 of 结果列表) {
          if (结果20035) {
            const 索引20034 = 测试结果列表.length;
            测试结果列表.push(结果20035);
            渲染结果(结果20035, 索引20034);
            本地值20055++;
          }
        }
      }
      测试状态.textContent = '${是否值236 ? 'تست کامل شد' : '测试完成'}: ' + 本地值20055 + '/' + 本地值20054;
      开始测试值.style.display = 'inline-block';
      值测试值.style.display = 'none';

      更新城市筛选();
    });
  }
  if (值测试值) {
    值测试值.addEventListener('click', function () {
      if (测试值控制器) {
        测试值控制器.abort();
      }
      开始测试值.style.display = 'inline-block';
      值测试值.style.display = 'none';
      测试状态.textContent = '${是否值236 ? 'تست متوقف شد' : '测试已停止'}';
    });
  }
  if (选择值值) {
    选择值值.addEventListener('click', function () {
      const 本地值20033 = 结果列表列表.querySelectorAll('input[type="checkbox"]:not(:disabled)');
      本地值20033.forEach(本地值20032 => 本地值20032.checked = true);
    });
  }
  if (值值值) {
    值值值.addEventListener('click', function () {
      const 本地值20031 = 结果列表列表.querySelectorAll('input[type="checkbox"]');
      本地值20031.forEach(本地值20030 => 本地值20030.checked = false);
    });
  }

  function 获取已选项目() {
    const 本地值20029 = 结果列表列表.querySelectorAll('input[type="checkbox"]:checked');
    if (本地值20029.length === 0) {
      显示状态('${是否值236 ? 'لطفا حداقل یک مورد انتخاب کنید' : '请至少选择一项'}', 'error');
      return null;
    }
    const 已选项目列表20028 = [];
    本地值20029.forEach(本地值20027 => {
      const 索引20026 = parseInt(本地值20027.dataset.index);
      const 结果20025 = 测试结果列表[索引20026];
      if (结果20025 && 结果20025.success) {
        const 机房名称 = 结果20025.colo ? 获取机房名称(结果20025.colo) : 结果20025.nodeName;
        const 项目字符串 = 结果20025.host + ':' + 结果20025.port + '#' + 机房名称;
        已选项目列表20028.push(项目字符串);
      }
    });
    return 已选项目列表20028;
  }

  if (覆盖已选值) {
    覆盖已选值.addEventListener('click', async function () {
      const 已选项目列表20024 = 获取已选项目();
      if (!已选项目列表20024 || 已选项目列表20024.length === 0) return;
      const 值输入20023 = document.getElementById('yx');
      const 新值20022 = 已选项目列表20024.join(',');
      值输入20023.value = 新值20022;
      覆盖已选值.disabled = true;
      追加已选值.disabled = true;
      覆盖已选值.textContent = '${是否值236 ? 'در حال ذخیره...' : '保存中...'}';
      try {
        const 配置数据20021 = {
          customIP: document.getElementById('customIP').value,
          yx: 新值20022,
          yxURL: document.getElementById('yxURL').value,
          s: document.getElementById('socksConfig').value
        };
        await 保存配置(配置数据20021);
        显示状态('${是否值236 ? 'موفقیت‌آمیز بود' : '已覆盖'} ' + 已选项目列表20024.length + ' ${是否值236 ? 'مورد و ذخیره شد' : '项并已保存'}', 'success');
      } catch (错误20020) {
        显示状态('${是否值236 ? 'خطا در ذخیره' : '保存失败'}: ' + 错误20020.message, 'error');
      } finally {
        覆盖已选值.disabled = false;
        追加已选值.disabled = false;
        覆盖已选值.textContent = '${是否值236 ? '覆盖添加' : '覆盖添加'}';
      }
    });
  }

  if (追加已选值) {
    追加已选值.addEventListener('click', async function () {
      const 已选项目列表 = 获取已选项目();
      if (!已选项目列表 || 已选项目列表.length === 0) return;
      const 值输入 = document.getElementById('yx');
      const 当前值 = 值输入.value.trim();
      const 新项目列表 = 已选项目列表.join(',');
      const 新值 = 当前值 ? 当前值 + ',' + 新项目列表 : 新项目列表;
      值输入.value = 新值;
      覆盖已选值.disabled = true;
      追加已选值.disabled = true;
      追加已选值.textContent = '${是否值236 ? 'در حال ذخیره...' : '保存中...'}';
      try {
        const 配置数据 = {
          customIP: document.getElementById('customIP').value,
          yx: 新值,
          yxURL: document.getElementById('yxURL').value,
          s: document.getElementById('socksConfig').value
        };
        await 保存配置(配置数据);
        显示状态('${是否值236 ? 'موفقیت‌آمیز بود' : '已追加'} ' + 已选项目列表.length + ' ${是否值236 ? 'مورد و ذخیره شد' : '项并已保存'}', 'success');
      } catch (错误20019) {
        显示状态('${是否值236 ? 'خطا در ذخیره' : '保存失败'}: ' + 错误20019.message, 'error');
      } finally {
        覆盖已选值.disabled = false;
        追加已选值.disabled = false;
        追加已选值.textContent = '${是否值236 ? '追加添加' : '追加添加'}';
      }
    });
  }
  function 地址转十六进制(地址) {
    const 部分列表 = 地址.split('.');
    if (部分列表.length !== 4) return null;
    let 十六进制 = '';
    for (let 索引值 = 0; 索引值 < 4; 索引值++) {
      const 数字 = parseInt(部分列表[索引值]);
      if (isNaN(数字) || 数字 < 0 || 数字 > 255) return null;
      十六进制 += 数字.toString(16).padStart(2, '0');
    }
    return 十六进制;
  }
  const 机房映射 = {
    'SJC': '🇺🇸 圣何塞',
    'LAX': '🇺🇸 洛杉矶',
    'SEA': '🇺🇸 西雅图',
    'SFO': '🇺🇸 旧金山',
    'DFW': '🇺🇸 达拉斯',
    'ORD': '🇺🇸 芝加哥',
    'IAD': '🇺🇸 华盛顿',
    'ATL': '🇺🇸 亚特兰大',
    'MIA': '🇺🇸 迈阿密',
    'DEN': '🇺🇸 丹佛',
    'PHX': '🇺🇸 凤凰城',
    'BOS': '🇺🇸 波士顿',
    'EWR': '🇺🇸 纽瓦克',
    'JFK': '🇺🇸 纽约',
    'LAS': '🇺🇸 拉斯维加斯',
    'MSP': '🇺🇸 明尼阿波利斯',
    'DTW': '🇺🇸 底特律',
    'PHL': '🇺🇸 费城',
    'CLT': '🇺🇸 夏洛特',
    'SLC': '🇺🇸 盐湖城',
    'PDX': '🇺🇸 波特兰',
    'SAN': '🇺🇸 圣地亚哥',
    'TPA': '🇺🇸 坦帕',
    'IAH': '🇺🇸 休斯顿',
    'MCO': '🇺🇸 奥兰多',
    'AUS': '🇺🇸 奥斯汀',
    'BNA': '🇺🇸 纳什维尔',
    'RDU': '🇺🇸 罗利',
    'IND': '🇺🇸 印第安纳波利斯',
    'CMH': '🇺🇸 哥伦布',
    'MCI': '🇺🇸 堪萨斯城',
    'OMA': '🇺🇸 奥马哈',
    'ABQ': '🇺🇸 阿尔伯克基',
    'OKC': '🇺🇸 俄克拉荷马城',
    'MEM': '🇺🇸 孟菲斯',
    'JAX': '🇺🇸 杰克逊维尔',
    'RIC': '🇺🇸 里士满',
    'BUF': '🇺🇸 布法罗',
    'PIT': '🇺🇸 匹兹堡',
    'CLE': '🇺🇸 克利夫兰',
    'CVG': '🇺🇸 辛辛那提',
    'MKE': '🇺🇸 密尔沃基',
    'STL': '🇺🇸 圣路易斯',
    'SAT': '🇺🇸 圣安东尼奥',
    'HNL': '🇺🇸 檀香山',
    'ANC': '🇺🇸 安克雷奇',
    'SMF': '🇺🇸 萨克拉门托',
    'ONT': '🇺🇸 安大略',
    'OAK': '🇺🇸 奥克兰',
    'HKG': '🇭🇰 香港',
    'TPE': '🇹🇼 台北',
    'TSA': '🇹🇼 台北松山',
    'KHH': '🇹🇼 高雄',
    'NRT': '🇯🇵 东京成田',
    'HND': '🇯🇵 东京羽田',
    'KIX': '🇯🇵 大阪关西',
    'ITM': '🇯🇵 大阪伊丹',
    'NGO': '🇯🇵 名古屋',
    'FUK': '🇯🇵 福冈',
    'CTS': '🇯🇵 札幌',
    'OKA': '🇯🇵 冲绳',
    'ICN': '🇰🇷 首尔仁川',
    'GMP': '🇰🇷 首尔金浦',
    'PUS': '🇰🇷 釜山',
    'SIN': '🇸🇬 新加坡',
    'BKK': '🇹🇭 曼谷',
    'DMK': '🇹🇭 曼谷廊曼',
    'KUL': '🇲🇾 吉隆坡',
    'CGK': '🇮🇩 雅加达',
    'MNL': '🇵🇭 马尼拉',
    'CEB': '🇵🇭 宿务',
    'HAN': '🇻🇳 河内',
    'SGN': '🇻🇳 胡志明',
    'DAD': '🇻🇳 岘港',
    'RGN': '🇲🇲 仰光',
    'PNH': '🇰🇭 金边',
    'REP': '🇰🇭 暹粒',
    'VTE': '🇱🇦 万象',
    'BOM': '🇮🇳 孟买',
    'DEL': '🇮🇳 新德里',
    'MAA': '🇮🇳 金奈',
    'BLR': '🇮🇳 班加罗尔',
    'CCU': '🇮🇳 加尔各答',
    'HYD': '🇮🇳 海得拉巴',
    'AMD': '🇮🇳 艾哈迈达巴德',
    'COK': '🇮🇳 科钦',
    'PNQ': '🇮🇳 浦那',
    'GOI': '🇮🇳 果阿',
    'CMB': '🇱🇰 科伦坡',
    'DAC': '🇧🇩 达卡',
    'KTM': '🇳🇵 加德满都',
    'ISB': '🇵🇰 伊斯兰堡',
    'KHI': '🇵🇰 卡拉奇',
    'LHE': '🇵🇰 拉合尔',
    'LHR': '🇬🇧 伦敦希思罗',
    'LGW': '🇬🇧 伦敦盖特威克',
    'STN': '🇬🇧 伦敦斯坦斯特德',
    'LTN': '🇬🇧 伦敦卢顿',
    'MAN': '🇬🇧 曼彻斯特',
    'EDI': '🇬🇧 爱丁堡',
    'BHX': '🇬🇧 伯明翰',
    'CDG': '🇫🇷 巴黎戴高乐',
    'ORY': '🇫🇷 巴黎奥利',
    'MRS': '🇫🇷 马赛',
    'LYS': '🇫🇷 里昂',
    'NCE': '🇫🇷 尼斯',
    'FRA': '🇩🇪 法兰克福',
    'MUC': '🇩🇪 慕尼黑',
    'TXL': '🇩🇪 柏林',
    'BER': '🇩🇪 柏林勃兰登堡',
    'HAM': '🇩🇪 汉堡',
    'DUS': '🇩🇪 杜塞尔多夫',
    'CGN': '🇩🇪 科隆',
    'STR': '🇩🇪 斯图加特',
    'AMS': '🇳🇱 阿姆斯特丹',
    'BRU': '🇧🇪 布鲁塞尔',
    'LUX': '🇱🇺 卢森堡',
    'ZRH': '🇨🇭 苏黎世',
    'GVA': '🇨🇭 日内瓦',
    'BSL': '🇨🇭 巴塞尔',
    'VIE': '🇦🇹 维也纳',
    'PRG': '🇨🇿 布拉格',
    'BUD': '🇭🇺 布达佩斯',
    'WAW': '🇵🇱 华沙',
    'KRK': '🇵🇱 克拉科夫',
    'MXP': '🇮🇹 米兰马尔彭萨',
    'LIN': '🇮🇹 米兰利纳特',
    'FCO': '🇮🇹 罗马',
    'VCE': '🇮🇹 威尼斯',
    'NAP': '🇮🇹 那不勒斯',
    'FLR': '🇮🇹 佛罗伦萨',
    'BGY': '🇮🇹 贝加莫',
    'MAD': '🇪🇸 马德里',
    'BCN': '🇪🇸 巴塞罗那',
    'PMI': '🇪🇸 帕尔马',
    'AGP': '🇪🇸 马拉加',
    'VLC': '🇪🇸 瓦伦西亚',
    'SVQ': '🇪🇸 塞维利亚',
    'BIO': '🇪🇸 毕尔巴鄂',
    'LIS': '🇵🇹 里斯本',
    'OPO': '🇵🇹 波尔图',
    'FAO': '🇵🇹 法鲁',
    'DUB': '🇮🇪 都柏林',
    'CPH': '🇩🇰 哥本哈根',
    'ARN': '🇸🇪 斯德哥尔摩',
    'GOT': '🇸🇪 哥德堡',
    'OSL': '🇳🇴 奥斯陆',
    'BGO': '🇳🇴 卑尔根',
    'HEL': '🇫🇮 赫尔辛基',
    'RIX': '🇱🇻 里加',
    'TLL': '🇪🇪 塔林',
    'VNO': '🇱🇹 维尔纽斯',
    'ATH': '🇬🇷 雅典',
    'SKG': '🇬🇷 塞萨洛尼基',
    'SOF': '🇧🇬 索非亚',
    'OTP': '🇷🇴 布加勒斯特',
    'BEG': '🇷🇸 贝尔格莱德',
    'ZAG': '🇭🇷 萨格勒布',
    'LJU': '🇸🇮 卢布尔雅那',
    'KBP': '🇺🇦 基辅',
    'IEV': '🇺🇦 基辅茹良尼',
    'ODS': '🇺🇦 敖德萨',
    'SVO': '🇷🇺 莫斯科谢列梅捷沃',
    'DME': '🇷🇺 莫斯科多莫杰多沃',
    'VKO': '🇷🇺 莫斯科伏努科沃',
    'LED': '🇷🇺 圣彼得堡',
    'IST': '🇹🇷 伊斯坦布尔',
    'SAW': '🇹🇷 伊斯坦布尔萨比哈',
    'ESB': '🇹🇷 安卡拉',
    'AYT': '🇹🇷 安塔利亚',
    'ADB': '🇹🇷 伊兹密尔',
    'TLV': '🇮🇱 特拉维夫',
    'AMM': '🇯🇴 安曼',
    'BEY': '🇱🇧 贝鲁特',
    'BAH': '🇧🇭 巴林',
    'KWI': '🇰🇼 科威特',
    'DXB': '🇦🇪 迪拜',
    'AUH': '🇦🇪 阿布扎比',
    'SHJ': '🇦🇪 沙迦',
    'DOH': '🇶🇦 多哈',
    'MCT': '🇴🇲 马斯喀特',
    'RUH': '🇸🇦 利雅得',
    'JED': '🇸🇦 吉达',
    'DMM': '🇸🇦 达曼',
    'CAI': '🇪🇬 开罗',
    'HBE': '🇪🇬 亚历山大',
    'SSH': '🇪🇬 沙姆沙伊赫',
    'CMN': '🇲🇦 卡萨布兰卡',
    'RAK': '🇲🇦 马拉喀什',
    'TUN': '🇹🇳 突尼斯',
    'ALG': '🇩🇿 阿尔及尔',
    'LOS': '🇳🇬 拉各斯',
    'ABV': '🇳🇬 阿布贾',
    'ACC': '🇬🇭 阿克拉',
    'NBO': '🇰🇪 内罗毕',
    'MBA': '🇰🇪 蒙巴萨',
    'ADD': '🇪🇹 亚的斯亚贝巴',
    'DAR': '🇹🇿 达累斯萨拉姆',
    'JNB': '🇿🇦 约翰内斯堡',
    'CPT': '🇿🇦 开普敦',
    'DUR': '🇿🇦 德班',
    'HRE': '🇿🇼 哈拉雷',
    'LUN': '🇿🇲 卢萨卡',
    'MRU': '🇲🇺 毛里求斯',
    'SEZ': '🇸🇨 塞舌尔',
    'SYD': '🇦🇺 悉尼',
    'MEL': '🇦🇺 墨尔本',
    'BNE': '🇦🇺 布里斯班',
    'PER': '🇦🇺 珀斯',
    'ADL': '🇦🇺 阿德莱德',
    'CBR': '🇦🇺 堪培拉',
    'OOL': '🇦🇺 黄金海岸',
    'CNS': '🇦🇺 凯恩斯',
    'AKL': '🇳🇿 奥克兰',
    'WLG': '🇳🇿 惠灵顿',
    'CHC': '🇳🇿 基督城',
    'ZQN': '🇳🇿 皇后镇',
    'NAN': '🇫🇯 楠迪',
    'PPT': '🇵🇫 帕皮提',
    'GUM': '🇬🇺 关岛',
    'GRU': '🇧🇷 圣保罗瓜鲁柳斯',
    'CGH': '🇧🇷 圣保罗孔戈尼亚斯',
    'GIG': '🇧🇷 里约热内卢',
    'BSB': '🇧🇷 巴西利亚',
    'CNF': '🇧🇷 贝洛奥里藏特',
    'POA': '🇧🇷 阿雷格里港',
    'CWB': '🇧🇷 库里蒂巴',
    'FOR': '🇧🇷 福塔莱萨',
    'REC': '🇧🇷 累西腓',
    'SSA': '🇧🇷 萨尔瓦多',
    'EZE': '🇦🇷 布宜诺斯艾利斯',
    'AEP': '🇦🇷 布宜诺斯艾利斯城',
    'COR': '🇦🇷 科尔多瓦',
    'MDZ': '🇦🇷 门多萨',
    'SCL': '🇨🇱 圣地亚哥',
    'LIM': '🇵🇪 利马',
    'BOG': '🇨🇴 波哥大',
    'MDE': '🇨🇴 麦德林',
    'CLO': '🇨🇴 卡利',
    'UIO': '🇪🇨 基多',
    'GYE': '🇪🇨 瓜亚基尔',
    'CCS': '🇻🇪 加拉加斯',
    'MVD': '🇺🇾 蒙得维的亚',
    'ASU': '🇵🇾 亚松森',
    'PTY': '🇵🇦 巴拿马城',
    'SJO': '🇨🇷 圣何塞',
    'GUA': '🇬🇹 危地马拉城',
    'SAL': '🇸🇻 圣萨尔瓦多',
    'TGU': '🇭🇳 特古西加尔巴',
    'MGA': '🇳🇮 马那瓜',
    'BZE': '🇧🇿 伯利兹城',
    'MEX': '🇲🇽 墨西哥城',
    'GDL': '🇲🇽 瓜达拉哈拉',
    'MTY': '🇲🇽 蒙特雷',
    'CUN': '🇲🇽 坎昆',
    'TIJ': '🇲🇽 蒂华纳',
    'SJD': '🇲🇽 圣何塞德尔卡沃',
    'YYZ': '🇨🇦 多伦多',
    'YVR': '🇨🇦 温哥华',
    'YUL': '🇨🇦 蒙特利尔',
    'YYC': '🇨🇦 卡尔加里',
    'YEG': '🇨🇦 埃德蒙顿',
    'YOW': '🇨🇦 渥太华',
    'YWG': '🇨🇦 温尼伯',
    'YHZ': '🇨🇦 哈利法克斯',
    'HAV': '🇨🇺 哈瓦那',
    'SJU': '🇵🇷 圣胡安',
    'SDQ': '🇩🇴 圣多明各',
    'PAP': '🇭🇹 太子港',
    'KIN': '🇯🇲 金斯顿',
    'NAS': '🇧🇸 拿骚',
    'MBJ': '🇯🇲 蒙特哥贝'
  };
  function 获取机房名称(机房20018) {
    return 机房映射[机房20018] || 机房20018;
  }

  const 城市筛选值 = document.getElementById('cityFilterContainer');
  const 城市值值 = document.getElementById('cityCheckboxesContainer');
  function 更新城市筛选() {
    if (!城市筛选值 || !城市值值) return;

    const 城市映射 = new Map();
    测试结果列表.forEach((结果20017, 索引20016) => {
      if (结果20017.success && 结果20017.colo) {
        const 机房20015 = 结果20017.colo;
        if (!城市映射.has(机房20015)) {
          城市映射.set(机房20015, {
            colo: 机房20015,
            name: 获取机房名称(机房20015),
            count: 0
          });
        }
        城市映射.get(机房20015).count++;
      }
    });
    if (城市映射.size === 0) {
      城市筛选值.style.display = 'none';
      return;
    }
    城市筛选值.style.display = 'block';
    城市值值.innerHTML = '';

    const 城市列表 = Array.from(城市映射.values()).sort((甲值20014, 乙值20013) => 甲值20014.name.localeCompare(乙值20013.name));
    城市列表.forEach(城市 => {
      const 标签 = document.createElement('label');
      标签.style.cssText = 'display: inline-flex; align-items: center; cursor: pointer; color: #00f0ff; font-size: 0.85rem; padding: 4px 8px; background: rgba(20, 5, 50, 0.4); border: 1px solid #7aa9c4; border-radius: 4px;';
      const 复选框20012 = document.createElement('input');
      复选框20012.type = 'checkbox';
      复选框20012.value = 城市.colo;
      复选框20012.checked = true;
      复选框20012.dataset.colo = 城市.colo;
      复选框20012.style.cssText = 'margin-right: 6px; width: 16px; height: 16px; cursor: pointer;';
      const 本地值20011 = document.createElement('span');
      本地值20011.textContent = 城市.name + ' (' + 城市.count + ')';
      标签.appendChild(复选框20012);
      标签.appendChild(本地值20011);
      城市值值.appendChild(标签);
      复选框20012.addEventListener('change', 按城市筛选结果);
    });

    const 筛选值值 = document.querySelectorAll('input[name="cityFilterMode"]');
    筛选值值.forEach(单选框 => {
      单选框.addEventListener('change', function () {
        if (this.value === 'all') {
          const 城市值20010 = 城市值值.querySelectorAll('input[type="checkbox"]');
          城市值20010.forEach(本地值20009 => {
            本地值20009.checked = true;
            本地值20009.disabled = false;
          });
        }
        按城市筛选结果();
      });
    });
  }
  function 按城市筛选结果() {
    if (!结果列表列表 || !城市值值) return;
    const 筛选值 = document.querySelector('input[name="cityFilterMode"]:checked')?.value || 'all';
    const 结果项目列表 = 结果列表列表.querySelectorAll('[data-index]');
    const 城市值 = 城市值值.querySelectorAll('input[type="checkbox"]');
    if (筛选值 === 'fastest10') {
      const 值结果列表 = 测试结果列表.map((结果, 索引20008) => ({
        result: 结果,
        index: 索引20008
      })).filter(项目20007 => 项目20007.result.success).sort((甲值, 乙值) => 甲值.result.latency - 乙值.result.latency).slice(0, 10);
      const 最快索引集合 = new Set(值结果列表.map(项目20006 => 项目20006.index));
      结果项目列表.forEach(项目20005 => {
        const 索引 = parseInt(项目20005.dataset.index);
        const 复选框20004 = 项目20005.querySelector('input[type="checkbox"]');
        if (最快索引集合.has(索引)) {
          项目20005.style.display = 'flex';
          if (复选框20004) 复选框20004.checked = true;
        } else {
          项目20005.style.display = 'none';
          if (复选框20004) 复选框20004.checked = false;
        }
      });

      城市值.forEach(本地值20003 => 本地值20003.disabled = true);
    } else {
      const 已选城市列表 = new Set();
      城市值.forEach(本地值20002 => {
        if (本地值20002.checked) {
          已选城市列表.add(本地值20002.value);
        }
      });

      const 值值20001 = 城市值.length > 0 && 已选城市列表.size === 城市值.length;
      const 值值 = 已选城市列表.size === 0;
      结果项目列表.forEach(项目 => {
        const 机房20000 = 项目.dataset.colo || '';
        const 复选框 = 项目.querySelector('input[type="checkbox"]');
        if (值值20001 || 值值 || 已选城市列表.has(机房20000)) {
          项目.style.display = 'flex';
          if (复选框) {
            if (值值20001) {
              复选框.checked = true;
            } else if (值值) {
              复选框.checked = false;
            } else {
              复选框.checked = 已选城市列表.has(机房20000);
            }
          }
        } else {
          项目.style.display = 'none';
          if (复选框) {
            复选框.checked = false;
          }
        }
      });

      城市值.forEach(本地值 => 本地值.disabled = false);
    }
  }
  async function 测试延迟(主机, 端口, 信号) {
    const 超时 = 8000;
    let 机房 = '';
    let 测试网址 = '';
    try {
      const 控制器 = new AbortController();
      const 超时标识 = setTimeout(() => 控制器.abort(), 超时);
      if (信号) {
        信号.addEventListener('abort', () => 控制器.abort());
      }
      const 清理主机 = 主机.replace(/^\\[|\\]$/g, '');
      const 十六进制地址 = 地址转十六进制(清理主机);
      const 测试域名 = 十六进制地址 ? 十六进制地址 + '.nip.lfree.org' : 清理主机 + '.nip.lfree.org';
      测试网址 = 'https://' + 测试域名 + ':' + 端口 + '/';
      console.log('[LatencyTest] Testing:', 测试网址, 'Original:', 主机 + ':' + 端口, 'HexIP:', 十六进制地址);
      const 首次开始 = Date.now();
      const 响应1 = await fetch(测试网址, {
        signal: 控制器.signal
      });
      const 首次值 = Date.now() - 首次开始;
      if (!响应1.ok) {
        clearTimeout(超时标识);
        return {
          success: false,
          latency: 首次值,
          error: 'HTTP ' + 响应1.status + ' ' + 响应1.statusText,
          colo: '',
          testUrl: 测试网址
        };
      }
      try {
        const 文本 = await 响应1.text();
        console.log('[LatencyTest] Response body:', 文本.substring(0, 200));
        const 数据 = JSON.parse(文本);
        if (数据.colo) {
          机房 = 数据.colo;
        }
      } catch (事件值) {
        console.log('[LatencyTest] Parse error:', 事件值.message);
      }
      const 值开始 = Date.now();
      const 响应2 = await fetch(测试网址, {
        signal: 控制器.signal
      });
      await 响应2.text();
      const 延迟 = Date.now() - 值开始;
      clearTimeout(超时标识);
      console.log('[LatencyTest] First:', 首次值 + 'ms (DNS+TLS+RTT)', 'Second:', 延迟 + 'ms (RTT only)');
      return {
        success: true,
        latency: 延迟,
        colo: 机房,
        testUrl: 测试网址
      };
    } catch (错误) {
      const 错误消息 = 错误.name === 'AbortError' ? '${是否值236 ? 'زمان تمام شد' : '超时'}' : 错误.message;
      console.log('[LatencyTest] Error:', 错误消息, 'URL:', 测试网址);
      return {
        success: false,
        latency: -1,
        error: 错误消息,
        colo: '',
        testUrl: 测试网址
      };
    }
  }
});
</script>
    </body>
`;
