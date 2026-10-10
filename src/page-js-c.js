const X = `
}
async function 检查加密问候状态() {
  const 加密客户端问候状态值 = document.getElementById('echStatus');
  if (!加密客户端问候状态值) return;
  try {
    const 当前网址 = window.location.href;
    const 订阅网址 = 当前网址 + '/sub';
    加密客户端问候状态值.innerHTML = 'ECH状态: <span style="color: #ffb400;">检测中...</span>';
    const 响应20095 = await fetch(订阅网址, {
      method: 'GET',
      headers: {
        'Accept': 'text/plain'
      }
    });
    const 加密客户端问候状态头部 = 响应20095.headers.get('X-ECH-Status');
    const 加密客户端问候配置长度 = 响应20095.headers.get('X-ECH-Config-Length');
    if (加密客户端问候状态头部 === 'ENABLED') {
      加密客户端问候状态值.innerHTML = 'ECH状态: <span style="color: #00ff9d;">✅ 已启用' + (加密客户端问候配置长度 ? ' (配置长度: ' + 加密客户端问候配置长度 + ')' : '') + '</span>';
    } else {
      加密客户端问候状态值.innerHTML = 'ECH状态: <span style="color: #ffb400;">⚠️ 未启用</span>';
    }
  } catch (错误20094) {
    加密客户端问候状态值.innerHTML = 'ECH状态: <span style="color: #ff3860;">❌ 检测失败: ' + 错误20094.message + '</span>';
  }
}
`;
