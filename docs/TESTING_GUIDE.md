# AIConsole 测试流程与验证指南

本文档描述如何测试和验证 AIConsole 的各项功能。

## 前置准备

```bash
# 1. 确保项目已构建
pnpm build

# 2. 检查所有包构建成功
ls packages/*/dist
```

---

## 测试流程

### 第一步：启动服务器

```bash
# 方式 1: 使用 npx（推荐）
npx aiconsole

# 方式 2: 指定端口
pnpm start

# 方式 3: 直接运行
node packages/server/dist/index.js
```

**预期输出：**
```
AIConsole server running!

  Local:    http://localhost:3000
  Network:  http://192.168.x.x:3000

  Open http://localhost:3000 in browser to view devices
```

**验证点：**
- ✅ 服务器成功启动
- ✅ 显示本地和网络访问地址
- ✅ 无错误信息

---

### 第二步：访问 PC 查看页面

在浏览器中打开：`http://localhost:3000`

**预期效果：**
- 显示 "AIConsole" 标题
- 左侧显示设备列表（初始为空）
- 右侧显示 "请选择一个设备查看日志" 提示

**验证点：**
- ✅ 页面正常加载
- ✅ 布局正确（左侧设备列表，右侧日志面板）
- ✅ 无控制台错误

---

### 第三步：创建测试页面

创建一个简单的 HTML 测试页面：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AIConsole 测试</title>
</head>
<body>
  <h1>AIConsole 测试页面</h1>
  <button onclick="testLog()">测试 Log</button>
  <button onclick="testWarn()">测试 Warn</button>
  <button onclick="testError()">测试 Error</button>
  <button onclick="testInfo()">测试 Info</button>
  <button onclick="testObject()">测试对象</button>

  <script type="module">
    import AIConsole from '../packages/sdk/dist/index.js';

    // 初始化 AIConsole
    const aiconsole = new AIConsole({
      projectId: 'test-app',
      server: 'ws://localhost:3000'
    });

    window.aiconsole = aiconsole;

    window.testLog = () => console.log('这是一条普通日志');
    window.testWarn = () => console.warn('这是一条警告信息');
    window.testError = () => console.error('这是一条错误信息');
    window.testInfo = () => console.info('这是一条信息');
    window.testObject = () => console.log({ user: 'test', data: [1, 2, 3] });
  </script>
</body>
</html>
```

将文件保存到 `packages/web/public/test.html`，然后访问：`http://localhost:3000/test.html`

---

### 第四步：验证设备连接

1. **打开测试页面**
2. **观察 PC 查看页面**

**预期效果：**
- 设备列表中应该出现一个新设备
- 设备状态显示为在线（绿色指示器）
- 显示设备 UA 信息和活跃时间

**验证点：**
- ✅ 设备自动出现在列表中
- ✅ 在线状态显示正确
- ✅ UA 信息显示正常（截断到 50 字符）

---

### 第五步：验证日志上报

点击测试页面的各个按钮，观察日志面板。

**测试 log 日志：**
```
点击"测试Log"按钮
→ 日志面板显示 "这是一条普通日志"
→ 时间戳正确
→ 级别显示 "LOG"
```

**测试 warn 日志：**
```
点击"测试Warn"按钮
→ 日志面板显示 "这是一条警告信息"
→ 日志级别文字颜色为橙色
→ 级别显示 "WARN"
```

**测试 error 日志：**
```
点击"测试Error"按钮
→ 日志面板显示 "这是一条错误信息"
→ 日志级别文字颜色为红色
→ 级别显示 "ERROR"
```

**测试对象日志：**
```
点击"测试对象"按钮
→ 日志面板显示序列化后的对象
→ 应显示: {"user":"test","data":[1,2,3]}
```

**验证点：**
- ✅ 日志实时显示
- ✅ 日志级别颜色正确
- ✅ 时间戳格式正确
- ✅ 对象正确序列化（不是 "[object Object]"）

---

### 第六步：验证多设备支持

1. **打开第二个浏览器窗口**，访问测试页面
2. **观察设备列表**

**预期效果：**
- 设备列表显示两个设备
- 每个 Tab 有独立的标识

**验证点：**
- ✅ 多个设备同时显示
- ✅ 选择不同设备时，日志面板切换正确

---

### 第七步：验证远程监控开关

在浏览器控制台中执行：

```javascript
// 关闭远程监控
window.aiconsole.disableRemote();

// 尝试记录日志
console.log('这条日志不应该被发送');

// 重新开启
window.aiconsole.enableRemote();

// 记录日志
console.log('这条日志应该被发送');
```

**验证点：**
- ✅ disableRemote 后，新日志不再出现在面板
- ✅ enableRemote 后，新日志重新出现
- ✅ 刷新页面后设置保持（localStorage 持久化）

---

### 第八步：验证 MCP 工具

**启动 MCP 服务器测试：**

```bash
# 设置环境变量
export AICONSOLE_API_BASE_URL=http://localhost:3000/api

# 运行 MCP 服务器
node packages/mcp/dist/index.js
```

**在 MCP 客户端中测试：**

```json
// 调用 list_devices 工具
{
  "name": "list_devices",
  "arguments": {}
}

// 调用 get_console_logs 工具
{
  "name": "get_console_logs",
  "arguments": {
    "deviceId": "从 list_devices 获取的设备ID",
    "limit": 10
  }
}
```

**验证点：**
- ✅ list_devices 返回设备列表
- ✅ get_console_logs 返回日志数组
- ✅ 参数验证正确（缺少 deviceId 时报错）

---

### 第九步：验证 API 端点

使用 curl 或 Postman 测试 HTTP API：

```bash
# 1. 获取设备列表
curl http://localhost:3000/api/devices

# 预期：返回设备数组 JSON

# 2. 获取设备详情
curl http://localhost:3000/api/devices/{deviceId}

# 预期：返回单个设备信息

# 3. 获取设备日志
curl http://localhost:3000/api/devices/{deviceId}/logs

# 预期：返回日志数组

# 4. 带参数获取日志
curl "http://localhost:3000/api/devices/{deviceId}/logs?limit=5&level=error"

# 预期：返回最多 5 条 error 级别的日志
```

**验证点：**
- ✅ 所有端点返回正确的 JSON
- ✅ 参数过滤正确工作
- ✅ 错误处理正确（404、400 等）

---

### 第十步：验证错误处理

**测试 1：服务器关闭后重连**
```bash
# 1. 停止服务器（Ctrl+C）
# 2. 刷新测试页面
# 3. 观察控制台应该显示重连尝试
# 4. 重新启动服务器
# 5. 观察设备重新连接
```

**测试 2：无效参数**
```bash
# 测试无效的 limit 参数
curl "http://localhost:3000/api/devices/{deviceId}/logs?limit=abc"
# 预期：返回 400 或忽略无效参数

# 测试无效的 level 参数
curl "http://localhost:3000/api/devices/{deviceId}/logs?level=invalid"
# 预期：返回空数组（无匹配日志）
```

**测试 3：不存在的设备**
```bash
curl http://localhost:3000/api/devices/non-existent-device
# 预期：返回 404 和错误消息
```

**验证点：**
- ✅ 客户端自动重连
- ✅ 参数验证正确
- ✅ 错误响应格式统一

---

## 自动化测试

运行完整的单元测试和 E2E 测试：

```bash
# 运行所有测试
pnpm test

# 仅运行 vconsole 测试
pnpm --filter vconsole test

# 运行测试并生成覆盖率报告
pnpm --filter vconsole test --coverage
```

**预期输出：**
```
Test Files  3 passed (3)
     Tests  27 passed (27)
```

---

## 性能验证

### 1. 日志吞吐量测试

在测试页面中执行：

```javascript
// 发送 100 条日志
for (let i = 0; i < 100; i++) {
  console.log(`性能测试日志 #${i}`);
}
```

**验证点：**
- ✅ 所有日志都正确显示
- ✅ 无明显延迟
- ✅ UI 保持响应

### 2. 内存泄漏测试

```javascript
// 重复创建和销毁实例
for (let i = 0; i < 10; i++) {
  const instance = new AIConsole({ projectId: 'test' });
  instance.destroy();
}
```

**验证点：**
- ✅ 无内存泄漏警告
- ✅ 控制台显示预期的多实例警告

---

## 完成检查清单

### 功能测试

- [ ] 服务器成功启动
- [ ] PC 查看页面正常显示
- [ ] 设备自动注册并显示
- [ ] 日志实时上报并显示
- [ ] 多设备同时支持
- [ ] 日志级别正确显示
- [ ] 对象正确序列化
- [ ] 远程监控开关工作正常

### API 测试

- [ ] GET /api/devices 返回设备列表
- [ ] GET /api/devices/:id 返回设备详情
- [ ] GET /api/devices/:id/logs 返回日志
- [ ] 参数过滤（limit, level）正常工作
- [ ] 错误处理（404, 400）正确

### MCP 测试

- [ ] list_devices 工具正常
- [ ] get_console_logs 工具正常
- [ ] 参数验证正确
- [ ] 错误处理正确

### 集成测试

- [ ] 移动端连接正常
- [ ] WebSocket 消息正确传递
- [ ] 断线重连正常工作
- [ ] 跨设备日志隔离正确

---

## 常见问题排查

### 问题：设备不显示

**排查步骤：**
1. 检查服务器是否运行：`ps aux | grep aiconsole`
2. 检查浏览器控制台是否有 WebSocket 错误
3. 确认 SDK 配置的 server 地址正确
4. 检查网络连接

### 问题：日志不显示

**排查步骤：**
1. 确认设备已在线
2. 检查是否选择了正确的设备
3. 查看 MCP 服务器日志是否有错误
4. 验证 localStorage 中没有禁用远程监控

### 问题：MCP 工具无响应

**排查步骤：**
1. 确认环境变量 `AICONSOLE_API_BASE_URL` 正确设置
2. 检查 HTTP 服务器是否运行
3. 验证工具名称和参数格式正确

---

## 测试报告模板

```markdown
# AIConsole 测试报告

**测试日期：** YYYY-MM-DD
**测试人员：** 姓名
**版本：** 0.1.0

## 测试环境
- Node.js: vxx.x.x
- 操作系统: xxx
- 浏览器: xxx

## 测试结果

### 功能测试
- 服务器启动: ✅ 通过
- 设备连接: ✅ 通过
- 日志上报: ✅ 通过
- ...

### API 测试
- 设备列表: ✅ 通过
- 日志查询: ✅ 通过
- ...

### 发现的问题

1. 问题描述
   - 复现步骤：...
   - 预期行为：...
   - 实际行为：...

### 总体评价
- 通过率: xx/xx
- 风险等级: 低/中/高
- 建议: ...
```
