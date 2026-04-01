# AIConsole 完整验证流程

本文档提供完整的端到端验证流程，确保 AIConsole 所有功能正常工作。

> **⏱️ 预计时间**: 15-20 分钟
> **难度**: 中等
> **前提**: 已完成 `pnpm install` 和 `pnpm build`

---

## 📋 验证前检查清单

在开始验证前，请确认：

- [ ] Node.js 已安装（建议 v20+）
- [ ] pnpm 已安装
- [ ] 项目已克隆到本地
- [ ] 依赖已安装：`pnpm install`
- [ ] 项目已构建：`pnpm build`
- [ ] 端口 3000 未被占用

---

## 第一步：启动服务器

### 1.1 启动 AIConsole 服务器

```bash
pnpm start
```

**预期输出：**
```
AIConsole server running!

  Local:    http://localhost:3000
  Network:  http://192.168.x.x:3000

  Open http://localhost:3000 in browser to view devices

  按 Ctrl+C 停止服务器
```

**✅ 验证点：**
- 服务器成功启动
- 显示本地和网络访问地址
- 无错误信息

**❌ 如果失败：**
- 检查端口 3000 是否被占用：`lsof -i :3000`
- 尝试其他端口：`PORT=3001 pnpm start`
- 查看错误信息并排查

**保持服务器运行，继续下一步。**

---

## 第二步：验证 PC 查看页面

### 2.1 打开浏览器访问

在浏览器中打开：`http://localhost:3000`

**预期效果：**
- 显示 "AIConsole" 标题
- 左侧：设备列表区域（显示 "设备列表 (0)"）
- 右侧：日志面板区域（显示 "请选择一个设备查看日志"）
- 布局正常，无明显样式问题

**✅ 验证点：**
- [ ] 页面正常加载
- [ ] 布局正确（左右分栏）
- [ ] 无控制台错误（按 F12 查看控制台）
- [ ] 标题显示 "AIConsole"

---

## 第三步：创建测试页面

### 3.1 创建测试 HTML 文件

在项目根目录创建 `test-demo.html`：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AIConsole 功能测试</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
    }
    h1 { color: #333; }
    .button-group {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin: 20px 0;
    }
    button {
      padding: 12px 20px;
      font-size: 14px;
      cursor: pointer;
      border: none;
      border-radius: 6px;
      background: #007bff;
      color: white;
      transition: background 0.2s;
    }
    button:hover { background: #0056b3; }
    button:active { transform: scale(0.98); }
    .status {
      margin-top: 20px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 6px;
    }
    .status h3 { margin-top: 0; }
    .log-item {
      margin: 5px 0;
      padding: 8px;
      border-left: 3px solid #ddd;
      padding-left: 10px;
      font-family: monospace;
      font-size: 12px;
    }
    .log-log { border-color: #28a745; }
    .log-warn { border-color: #ffc107; }
    .log-error { border-color: #dc3545; }
    .log-info { border-color: #17a2b8; }
  </style>
</head>
<body>
  <h1>🧪 AIConsole 功能测试页面</h1>

  <div class="button-group">
    <button onclick="testLog()">📝 测试 Log</button>
    <button onclick="testWarn()">⚠️ 测试 Warn</button>
    <button onclick="testError()">🔴 测试 Error</button>
    <button onclick="testInfo()">ℹ️ 测试 Info</button>
    <button onclick="testObject()">📦 测试对象</button>
    <button onclick="testArray()">📋 测试数组</button>
    <button onclick="testMany()">🔄 批量测试</button>
  </div>

  <div class="status">
    <h3>📊 状态信息</h3>
    <div id="status">等待初始化...</div>
  </div>

  <div class="status">
    <h3>📝 最近日志</h3>
    <div id="logs"></div>
  </div>

  <script type="module">
    // 动态导入 SDK
    const script = document.createElement('script');
    script.type = 'module';
    script.src = './packages/sdk/dist/index.js';
    script.onload = () => {
      initAIConsole();
    };
    document.head.appendChild(script);

    function initAIConsole() {
      try {
        // 初始化 AIConsole
        const AIConsole = window.AIConsole;
        const aiconsole = new AIConsole({
          projectId: 'test-demo',
          server: 'ws://localhost:3000'
        });

        // 保存到全局以便调试
        window.aiconsole = aiconsole;

        updateStatus('✅ AIConsole 已初始化', 'success');

        // 拦截 console.log 以便显示在页面上
        const originalLog = console.log;
        console.log = function(...args) {
          originalLog.apply(console, args);
          addLog('log', args[0]);
        };
      } catch (error) {
        updateStatus('❌ 初始化失败: ' + error.message, 'error');
      }
    }

    function updateStatus(message, type = 'info') {
      const statusEl = document.getElementById('status');
      statusEl.innerHTML = `<span style="color: ${type === 'error' ? 'red' : type === 'success' ? 'green' : 'inherit'}">${message}</span>`;
    }

    function addLog(level, message) {
      const logsEl = document.getElementById('logs');
      const item = document.createElement('div');
      item.className = `log-item log-${level}`;
      item.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
      logsEl.insertBefore(item, logsEl.firstChild);

      // 保留最近 20 条
      while (logsEl.children.length > 20) {
        logsEl.removeChild(logsEl.lastChild);
      }
    }

    // 测试函数
    window.testLog = () => {
      console.log('这是一条普通日志');
      addLog('info', '发送: console.log("这是一条普通日志")');
    };

    window.testWarn = () => {
      console.warn('这是一条警告信息');
      addLog('info', '发送: console.warn("这是一条警告信息")');
    };

    window.testError = () => {
      console.error('这是一条错误信息');
      addLog('info', '发送: console.error("这是一条错误信息")');
    };

    window.testInfo = () => {
      console.info('这是一条信息');
      addLog('info', '发送: console.info("这是一条信息")');
    };

    window.testObject = () => {
      const obj = {
        user: 'test-user',
        data: { id: 1, name: '测试数据' },
        timestamp: Date.now()
      };
      console.log(obj);
      addLog('info', '发送: console.log(obj)');
    };

    window.testArray = () => {
      const arr = [1, 2, 3, { key: 'value' }];
      console.log('数组:', arr);
      addLog('info', '发送: console.log("数组:", ...)');
    };

    window.testMany = () => {
      updateStatus('🔄 发送 10 条日志...');
      for (let i = 0; i < 10; i++) {
        console.log(`批量测试日志 #${i + 1}`);
      }
      updateStatus('✅ 已发送 10 条日志', 'success');
    };

    // 远程控制测试
    window.testDisableRemote = () => {
      if (window.aiconsole) {
        window.aiconsole.disableRemote();
        updateStatus('🔴 远程监控已禁用', 'info');
      }
    };

    window.testEnableRemote = () => {
      if (window.aiconsole) {
        window.aiconsole.enableRemote();
        updateStatus('✅ 远程监控已启用', 'success');
      }
    };

    window.testIsRemoteEnabled = () => {
      if (window.aiconsole) {
        const enabled = window.aiconsole.isRemoteEnabled();
        updateStatus(`远程监控状态: ${enabled ? '✅ 启用' : '❌ 禁用'}`, 'info');
      }
    };
  </script>
</body>
</html>
```

### 3.2 访问测试页面

在浏览器中打开：`file:///path/to/aiconsole/test-demo.html`

**⚠️ 重要提示：** 由于浏览器安全限制，需要通过 HTTP 服务器访问，而不是直接打开文件。

**推荐方式：**

```bash
# 方式 1: 使用 Python（推荐）
python3 -m http.server 8080

# 方式 2: 使用 Node.js
npx serve

# 然后访问
# http://localhost:8080/test-demo.html
```

---

## 第四步：验证设备连接

### 4.1 确认设备注册

打开测试页面后，观察 PC 查看页面（`http://localhost:3000`）

**预期效果：**
- 设备列表中应该出现一个新设备
- 设备状态显示为在线（绿色指示器）
- 显示设备信息：
  - UA 信息（截断显示）
  - 屏幕分辨率
  - 最后活跃时间

**✅ 验证点：**
- [ ] 设备自动出现在列表中
- [ ] 显示设备数量变为 "设备列表 (1)"
- [ ] 在线状态指示器为绿色
- [ ] 显示设备 UA 信息

### 4.2 选择设备

点击设备列表中的设备

**预期效果：**
- 设备项背景变为蓝色（选中状态）
- 右侧日志面板标题显示设备信息

**✅ 验证点：**
- [ ] 设备项高亮显示
- [ ] 可以正确选择设备

---

## 第五步：验证日志上报

### 5.1 测试基本日志

在测试页面点击按钮：

| 按钮 | 预期日志面板显示 |
|------|------------------|
| **测试 Log** | 显示 "这是一条普通日志"，黑色文字 |
| **测试 Warn** | 显示 "这是一条警告信息"，橙色文字 |
| **测试 Error** | 显示 "这是一条错误信息"，红色文字 |
| **测试 Info** | 显示 "这是一条信息"，蓝色文字 |

**✅ 验证点：**
- [ ] 日志实时显示在右侧面板
- [ ] 时间戳格式正确
- [ ] 日志级别颜色正确
- [ ] 日志内容完整显示

### 5.2 测试对象日志

点击 "测试对象" 按钮

**预期效果：**
- 日志面板显示序列化后的 JSON 对象
- 类似：`{"user":"test-user","data":{"id":1,"name":"测试数据"},"timestamp":...}`

**✅ 验证点：**
- [ ] 对象正确序列化
- [ ] 不是 "[object Object]"
- [ ] JSON 格式正确

### 5.3 测试批量日志

点击 "批量测试" 按钮

**预期效果：**
- 快速发送 10 条日志
- 日志面板全部显示
- 可以滚动查看所有日志

**✅ 验证点：**
- [ ] 10 条日志全部显示
- [ ] 日志顺序正确
- [ ] 滚动流畅

---

## 第六步：验证远程监控开关

### 6.1 在测试页面控制台执行

```javascript
// 禁用远程监控
window.aiconsole.disableRemote()

// 发送日志
console.log('这条日志不应该被发送')

// 重新启用
window.aiconsole.enableRemote()

// 发送日志
console.log('这条日志应该被发送')
```

**预期效果：**
- 禁用后，日志不再出现在面板
- 启用后，日志重新出现

**✅ 验证点：**
- [ ] disableRemote() 工作正常
- [ ] enableRemote() 工作正常
- [ ] isRemoteEnabled() 返回正确状态

---

## 第七步：验证 API 端点

### 7.1 获取设备列表

```bash
curl http://localhost:3000/api/devices
```

**预期输出：** JSON 数组，包含设备信息

**✅ 验证点：**
- [ ] 返回正确的 JSON
- [ ] 包含刚才连接的设备
- [ ] 数据结构完整

### 7.2 获取设备日志

先获取设备 ID（从上一步的输出中复制），然后：

```bash
curl "http://localhost:3000/api/devices/{deviceId}/logs?limit=5"
```

**预期输出：** JSON 数组，包含日志

**✅ 验证点：**
- [ ] 返回正确的日志数组
- [ ] limit 参数生效（最多 5 条）
- [ ] 数据结构完整

### 7.3 测试错误处理

```bash
# 测试不存在的设备
curl http://localhost:3000/api/devices/non-existent

# 预期：404 错误
```

**✅ 验证点：**
- [ ] 返回 404 状态码
- [ ] 错误消息清晰

---

## 第八步：验证 MCP 工具

### 8.1 启动 MCP 服务器

在新终端中执行：

```bash
export AICONSOLE_API_BASE_URL=http://localhost:3000/api
node packages/mcp/dist/index.js
```

**预期效果：**
- 显示 "AIConsole MCP Server running on stdio"

### 8.2 测试工具调用

使用 MCP 客户端（如 Claude Desktop）调用工具：

```json
// 列出设备
{
  "name": "list_devices",
  "arguments": {}
}

// 获取日志
{
  "name": "get_console_logs",
  "arguments": {
    "deviceId": "从上一步获取的设备ID",
    "limit": 10
  }
}
```

**✅ 验证点：**
- [ ] list_devices 返回设备列表
- [ ] get_console_logs 返回日志
- [ ] 参数验证正常

---

## 第九步：运行自动化测试

### 9.1 运行所有测试

```bash
pnpm test
```

**预期输出：**
```
Test Files  3 passed (3)
     Tests  27 passed (27)
```

**✅ 验证点：**
- [ ] 27 个测试全部通过
- [ ] 无测试失败或跳过
- [ ] 无运行时错误

### 9.2 查看测试覆盖率

```bash
pnpm --filter vconsole test --coverage
```

**✅ 验证点：**
- [ ] 生成覆盖率报告
- [ ] 核心功能有测试覆盖

---

## 第十步：验证多设备支持

### 10.1 打开多个测试页面

1. 打开第二个浏览器窗口（或隐私模式）
2. 访问测试页面
3. 观察 PC 查看页面

**预期效果：**
- 设备列表显示 2 个设备（或 1 个设备 2 个标签）
- 每个设备独立显示

**✅ 验证点：**
- [ ] 多个设备同时显示
- [ ] 切换设备时日志正确切换
- [ ] 每个设备的日志独立

---

## 完成检查清单

### 基础功能
- [ ] 服务器成功启动
- [ ] PC 查看页面正常显示
- [ ] 测试页面成功连接
- [ ] 设备自动注册并显示

### 日志功能
- [ ] Log 日志正常上报和显示
- [ ] Warn 日志颜色正确
- [ ] Error 日志颜色正确
- [ ] Info 日志颜色正确
- [ ] 对象正确序列化
- [ ] 数组正确序列化
- [ ] 批量日志处理正常

### 远程控制
- [ ] 禁用远程监控生效
- [ ] 启用远程监控生效
- [ ] 状态查询正确

### API 功能
- [ ] 获取设备列表成功
- [ ] 获取日志成功
- [ ] 参数过滤（limit、level）正常
- [ ] 错误处理正确（404）

### MCP 功能
- [ ] list_devices 工具正常
- [ ] get_console_logs 工具正常
- [ ] 参数验证正常

### 测试
- [ ] 27 个单元测试通过
- [ ] 无明显性能问题

---

## ❌ 遇到问题？

### 问题 1：设备不显示

**排查步骤：**
1. 确认服务器正在运行
2. 检查浏览器控制台是否有 WebSocket 错误
3. 检查控制台是否有 JavaScript 错误
4. 确认 SDK 配置的 server 地址正确

### 问题 2：日志不显示

**排查步骤：**
1. 确认设备已在线
2. 确认已选择设备
3. 检查服务器日志是否有错误
4. 尝试刷新页面

### 问题 3：测试页面无法加载 SDK

**排查步骤：**
1. 确认已运行 `pnpm build`
2. 检查 SDK 构建产物是否存在：`ls packages/sdk/dist/`
3. 尝试清除浏览器缓存
4. 使用 HTTP 服务器访问（不是 file://）

### 问题 4：API 请求失败

**排查步骤：**
1. 确认服务器正在运行
2. 检查端口号是否正确
3. 查看服务器日志
4. 尝试用浏览器直接访问 API

---

## 验证通过标准

所有检查项通过后，说明 AIConsole MVP 功能完整且工作正常！

**下一步：** 可以开始：
- 添加新功能
- 优化性能
- 部署到生产环境
- 发布 npm 包

---

**验证完成后记得更新项目状态文档！**
