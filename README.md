# openLog

> 首款面向 AI Agent 的前端 H5 数据监控工具 — 实时采集、PC 可视化、AI 可查询、开放接入

openLog 是专为 **AI 辅助开发场景**设计的前端监控工具。通过在 H5 页面嵌入轻量 SDK，将设备的 console、网络请求、存储、DOM、性能等数据实时同步到 PC 端和 AI Agent，实现「移动端采集 → PC 分析 → AI 诊断」的完整闭环。

**同时，openLog 是一个开放数据平台**：任何系统（CI/CD、服务端日志、Native App、第三方工具）均可通过标准接口向 openLog 推送数据，供 PC 面板展示和 AI 工具查询。

---

## ✨ 核心能力

### 📡 实时数据采集（移动端 SDK）
| 采集项 | 说明 |
|--------|------|
| **Console** | log / warn / error / info，保留原始参数富文本 |
| **网络请求** | XHR + Fetch 拦截，含请求体/响应体/耗时 |
| **Storage** | localStorage / sessionStorage / Cookie 实时监听 |
| **DOM 快照** | 页面结构序列化，响应 PC 刷新指令 |
| **性能数据** | FPS + Web Vitals (LCP/CLS/FCP/TTFB/INP) + 长任务 + 资源加载 + 交互延迟 |
| **截图** | html2canvas 截取当前页面 |
| **错误捕获** | 全局 JS 错误 + 未处理 Promise rejection |

### 🖥️ PC 可视化面板（9 个 Tab）
| Tab | 功能 |
|-----|------|
| 📝 控制台 | 实时日志流 + JS 远程执行 + 日志导出 + 网速模拟 |
| 🌐 网络 | 请求瀑布流，支持过滤 |
| 💾 存储 | localStorage / sessionStorage / Cookie 查看与写入 |
| 🌲 Element | DOM 树结构查看 |
| 📊 Performance | FPS 折线图 + Web Vitals + 长任务 + 资源时序 |
| 🏁 跑分 | 性能跑分报告（评分 + 等级 + 问题建议 + 历史对比） |
| 🎭 Mock | API Mock 规则管理（URL 正则匹配） |
| 🩺 健康 | 页面健康检查（错误数/内存/长任务/Vitals 综合评分） |
| 🤖 AI 分析 | 汇总全量数据，生成问题清单与优化建议 |

### 🤖 MCP 工具集（AI 直接调用）
```
list_devices          get_console_logs      get_network_requests
watch_logs            get_storage           get_page_context
execute_js            take_screenshot       reload_page
set_storage           clear_storage         highlight_element
zen_mode              network_throttle      add_mock
remove_mock           clear_mocks           health_check
ai_analyze            start_perf_run        stop_perf_run
get_perf_report       verify_checkpoint     init_dev_session
start_monitor         poll_monitor          stop_monitor
```

---

## 🚀 快速开始

### 一、启动服务（零安装）

```bash
npx openlog
# 启动后终端会打印所有局域网 IP 和 SDK 接入代码，直接复制使用
# 指定端口：npx openlog -p 8080
```

### 二、配置 AI 工具（自动检测）

```bash
npx openlog init
# 自动检测已安装的 AI 工具（Claude Code / Cursor / Windsurf）
# 一键写入 MCP 配置，重启 AI 工具即可

# 指定工具：
npx openlog init --for=claude
npx openlog init --for=cursor
npx openlog init --for=windsurf
```

### 三、接入移动端 SDK

```html
<!-- CDN 方式（推荐）——服务启动后终端直接输出以下代码 -->
<script src="https://unpkg.com/openlog@latest/dist/openlog.iife.js"></script>
<script>
  OpenLog.init({
    projectId: 'my-app',
    server: 'ws://192.168.x.x:38291',  // 服务启动时会打印正确 IP
    lang: 'zh'
  })
</script>

<!-- 纯本地模式（无需服务器，仅 Eruda 调试面板）-->
<script>
  OpenLog.init({ projectId: 'my-app', lang: 'zh' })
</script>
```

```bash
# npm 方式
npm install openlog
```

```javascript
import OpenLog from 'openlog'
new OpenLog({ projectId: 'my-app', server: 'ws://192.168.x.x:38291', lang: 'zh' })
```

### 四、访问 PC 监控面板

浏览器打开 `http://localhost:38291`，从左侧设备列表选择设备即可。

> **三种使用模式**（按需选择，互相独立）
> - **仅 SDK**：不启动服务，OpenLog.init 后直接打开本地 Eruda 面板
> - **SDK + PC 面板**：`npx openlog` 启动服务，实时远程监控
> - **SDK + PC 面板 + AI**：再执行 `npx openlog init`，AI 自动编排开发闭环

---

## 🏗️ 架构

```
openLog/
├── packages/
│   ├── types/      # 统一数据标准（@openlog/types）← 唯一类型来源
│   ├── sdk/        # 移动端 SDK（数据采集 + Eruda 集成）
│   ├── server/     # Node.js 服务（WebSocket + REST API）
│   ├── web/        # PC 调试面板（React）
│   └── mcp/        # MCP Server（AI 工具集）
```

### 数据流

```
移动端 H5 SDK
  └── DataBus（统一数据总线）
        ├── Eruda 本地面板（独立可用）
        └── WebSocket Reporter → Server
                                    ├── PC Web 面板（实时推送）
                                    └── REST API → MCP 工具查询

外部系统（CI/CD / 服务端 / Native / 第三方）
  └── POST /api/ingest ──────────→ Server（同上消费链路）
```

---

## 📐 数据接入标准（OpenLog Envelope）

所有数据——无论来自移动端 SDK、外部系统还是未来的 Native 平台——均遵循统一的 **Envelope 格式**。

### 基础格式

```typescript
// 完整类型定义：packages/types/src/
{
  "v": "1",                    // Schema 版本，当前固定为 "1"
  "platform": "web",           // 平台标识，见下方支持列表
  "device": {
    "deviceId": "uuid",        // 设备唯一 ID
    "projectId": "my-app",     // 项目标识（与 SDK init 保持一致）
    "ua": "Mozilla/5.0...",    // User-Agent 或设备型号
    "screen": "390x844",       // 屏幕分辨率
    "pixelRatio": 3,
    "language": "zh-CN",
    "url": "https://..."       // 当前页面 URL（可选）
  },
  "tabId": "tab-uuid",         // Tab/会话 ID
  "ts": 1712345678901,         // Unix 毫秒时间戳
  "type": "console",           // 事件类型，见下方类型列表
  "data": { ... }              // 具体事件数据，由 type 决定结构
}
```

### platform 支持值

| 值 | 说明 | 状态 |
|----|------|------|
| `web` | 浏览器 H5 | ✅ 已支持 |
| `react-native` | React Native | 🔜 规划中 |
| `flutter` | Flutter / Dart | 🔜 规划中 |
| `miniprogram` | 微信/支付宝小程序 | 🔜 规划中 |
| `unknown` | 其他 / 自定义 | ✅ 兼容 |

### type 事件类型及 data 结构

<details>
<summary><strong>console</strong> — 控制台日志</summary>

```json
{
  "level": "error",
  "args": ["something went wrong", { "code": 500 }],
  "message": "something went wrong [object Object]",
  "stack": "Error: ...\n  at ..."
}
```
</details>

<details>
<summary><strong>network</strong> — 网络请求</summary>

```json
{
  "id": "req-uuid",
  "method": "POST",
  "url": "https://api.example.com/login",
  "type": "fetch",
  "status": 200,
  "requestBody": "{\"username\":\"test\"}",
  "responseBody": "{\"token\":\"...\"}",
  "duration": 342
}
```
</details>

<details>
<summary><strong>error</strong> — JS 错误/未处理 Promise</summary>

```json
{
  "source": "uncaught",
  "message": "Cannot read properties of undefined",
  "stack": "TypeError: ...",
  "filename": "https://example.com/app.js",
  "lineno": 42,
  "colno": 15
}
```
</details>

<details>
<summary><strong>performance</strong> — 性能数据</summary>

```json
{
  "vitals": [{ "name": "LCP", "value": 1200, "rating": "good" }],
  "samples": [{ "ts": 1712345678000, "fps": 60 }],
  "longTasks": [{ "startTime": 1200, "duration": 80, "name": "unknown" }],
  "resources": [],
  "interactions": []
}
```
</details>

<details>
<summary><strong>storage / dom / screenshot / perf_run / lifecycle / custom</strong></summary>

完整类型定义见 [`packages/types/src/events/index.ts`](./packages/types/src/events/index.ts)

</details>

---

## 🔌 外部数据接入（POST /api/ingest）

任何系统均可通过 REST 接口向 openLog 推送数据，数据将实时出现在 PC 面板和 MCP 工具中。

### 接口说明

```
POST http://localhost:38291/api/ingest
Content-Type: application/json
```

支持**单条**或**批量**（最多 500 条/次）：

### 示例：推送一条错误日志

```bash
curl -X POST http://localhost:38291/api/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "v": "1",
    "platform": "unknown",
    "device": {
      "deviceId": "ci-pipeline-001",
      "projectId": "my-app",
      "ua": "CI/CD Pipeline",
      "screen": "n/a",
      "pixelRatio": 1,
      "language": "zh-CN"
    },
    "tabId": "build-456",
    "ts": 1712345678901,
    "type": "error",
    "data": {
      "source": "uncaught",
      "message": "单元测试失败：LoginForm 渲染异常",
      "stack": "AssertionError: expected true to equal false\n  at test.js:15"
    }
  }'
```

### 批量推送

```javascript
// 一次推送多条
await fetch('http://localhost:38291/api/ingest', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify([envelope1, envelope2, envelope3])
})
```

### 响应格式

```json
// 全部成功（200）
{ "ok": true, "accepted": 3, "rejected": 0, "ts": 1712345678901 }

// 部分失败（207）
{ "ok": true, "accepted": 2, "rejected": 1, "errors": ["[2] missing field: device.deviceId"], "ts": ... }

// 全部失败（400）
{ "ok": false, "accepted": 0, "rejected": 1, "errors": ["[0] unsupported schema version: \"2\""], "ts": ... }
```

### 典型使用场景

| 场景 | 说明 |
|------|------|
| **CI/CD 流水线** | 单测失败、构建错误实时推送，AI 自动分析 |
| **服务端日志** | 接口异常、业务错误推送到 openLog，与前端数据关联 |
| **Native App** | React Native / Flutter 接入，复用同一套监控体系 |
| **自定义采集** | 埋点数据、A/B 测试结果等通过 `custom` 类型推送 |

---

## 🤖 MCP 接入（AI 调试）

### 配置

```bash
# 自动配置（推荐）
npx openlog init

# 手动配置
```

```json
{
  "mcpServers": {
    "openlog": {
      "command": "node",
      "args": ["/path/to/openLog/packages/mcp/dist/index.js"],
      "env": { "OPENLOG_API_BASE_URL": "http://localhost:38291" }
    }
  }
}
```

### AI 开发工作流（自动编排，无需手动配置）

连接 MCP 后，Claude Code 等 AI 工具会自动加载 openLog 的开发 SOP：

```
开始开发 H5 功能
  → init_dev_session()          # 一键启动，返回监控 protocol
  → 启动「报错子代理」           # 每 3s poll，报错立即打断主代理
  → 启动「日志子代理」           # 每 5s poll，异常时通知主代理
  → 主代理写代码
  → verify_checkpoint(...)      # 每个功能节点写完后真机验证
  → health_check()              # 功能完成后健康检查
```

---

## 🏁 性能跑分

```
综合评分 = FPS(20%) + LCP(15%) + CLS(10%) + FCP(10%) +
           TTFB(10%) + INP(10%) + 长任务(15%) + 资源(10%)
```

```javascript
await logger.startPerfRun();
// ... 执行用户操作 ...
const report = await logger.stopPerfRun();
console.log(report.score); // { total: 87, grade: 'B', issues: [...] }
```

---

## 🔌 REST API

| 方法 | 路径 | 说明 |
|------|------|------|
| **POST** | **`/api/ingest`** | **外部数据接入（统一 Envelope 格式）** |
| GET | `/api/devices` | 设备列表 |
| GET | `/api/devices/:id/logs` | 控制台日志 |
| GET | `/api/devices/:id/network` | 网络请求 |
| GET | `/api/devices/:id/storage` | 存储快照 |
| GET | `/api/devices/:id/performance` | 性能数据 |
| GET | `/api/devices/:id/health` | 健康检查 |
| POST | `/api/devices/:id/perf-run/start` | 开始跑分 |
| POST | `/api/devices/:id/perf-run/stop` | 停止跑分 |
| GET | `/api/devices/:id/perf-run` | 跑分历史 |
| POST | `/api/devices/:id/execute` | 远程执行 JS |
| POST | `/api/devices/:id/screenshot` | 触发截图 |
| POST | `/api/devices/:id/network-throttle` | 网络节流 |
| POST | `/api/devices/:id/mocks` | 添加 Mock |
| DELETE | `/api/devices/:id/mocks/:mockId` | 删除 Mock |

---

## 🗺️ Roadmap

### 近期（已实现）
- [x] Web H5 SDK + PC 监控面板 + MCP 工具集
- [x] `@openlog/types` 统一数据标准（Envelope v1）
- [x] `POST /api/ingest` 外部数据接入接口
- [x] `npx openlog init` 一键配置 AI 工具
- [x] AI 开发自动编排（`init_dev_session` + 子代理 monitor）
- [x] `verify_checkpoint` 功能节点自动验证 Harness

### 中期
- [ ] **React Native SDK**（`platform: "react-native"`，复用同一套 Envelope 标准）
- [ ] **小程序 SDK**（微信/支付宝，`platform: "miniprogram"`）
- [ ] **PC 面板 `custom` 类型展示**（通用 JSON 树 + 自定义渲染插件）
- [ ] **ingest 鉴权**（API Key + 项目级权限）
- [ ] **数据持久化**（SQLite，重启后数据不丢失）

### 长期
- [ ] **Flutter SDK**（`platform: "flutter"`）
- [ ] **云端版本**（不依赖局域网，支持远程设备）
- [ ] **Envelope v2**（支持更多采集维度，向后兼容 v1）
- [ ] **开放插件系统**（第三方 type 扩展 + PC 面板自定义 Tab）

---

## 💻 开发

```bash
pnpm build      # 构建所有包
pnpm dev        # 开发模式（watch）
pnpm test       # 运行测试
pnpm start      # 启动服务器
```

---

## 📄 许可证

MIT © [openLog](https://github.com/uaio/openLog)


openLog 是一套完整的移动端远程调试解决方案。通过在 H5 页面中嵌入轻量 SDK，将设备的 console、网络请求、存储、DOM、性能等数据实时同步到 PC 端，同时支持 AI（MCP）直接查询和操控，实现「移动端采集 → PC 分析 → AI 诊断」的完整调试闭环。

---

## ✨ 核心能力

### 📡 实时数据采集（移动端 SDK）
| 采集项 | 说明 |
|--------|------|
| **Console** | log / warn / error / info，保留原始参数富文本 |
| **网络请求** | XHR + Fetch 拦截，含请求体/响应体/耗时 |
| **Storage** | localStorage / sessionStorage / Cookie 实时监听 |
| **DOM 快照** | 页面结构序列化，响应 PC 刷新指令 |
| **性能数据** | FPS + Web Vitals (LCP/CLS/FCP/TTFB/INP) + 长任务 + 资源加载 + 交互延迟 |
| **截图** | html2canvas 截取当前页面 |
| **错误捕获** | 全局 JS 错误 + 未处理 Promise rejection |

### 🖥️ PC 可视化面板（9 个 Tab）
| Tab | 功能 |
|-----|------|
| 📝 控制台 | 实时日志流 + JS 远程执行 + 日志导出 + 网速模拟 |
| 🌐 网络 | 请求瀑布流，支持过滤 |
| 💾 存储 | localStorage / sessionStorage / Cookie 查看与写入 |
| 🌲 Element | DOM 树结构查看 |
| 📊 Performance | FPS 折线图 + Web Vitals + 长任务 + 资源时序 |
| 🏁 跑分 | 性能跑分报告（评分 + 等级 + 问题建议 + 历史对比） |
| 🎭 Mock | API Mock 规则管理（URL 正则匹配） |
| 🩺 健康 | 页面健康检查（错误数/内存/长任务/Vitals 综合评分） |
| 🤖 AI 分析 | 汇总全量数据，生成问题清单与优化建议 |

### 🤖 MCP 工具集（AI 可直接调用）
```
list_devices          get_console_logs      get_network_requests
watch_logs            get_storage           get_page_context
execute_js            take_screenshot       reload_page
set_storage           clear_storage         highlight_element
zen_mode              network_throttle      add_mock
remove_mock           clear_mocks           health_check
ai_analyze            start_perf_run        stop_perf_run
get_perf_report
```

---

## 🚀 快速开始

### 安装

```bash
git clone https://github.com/uaio/openLog.git
cd openLog
pnpm install
pnpm build
```

### 启动服务器

```bash
pnpm start
# 默认监听 http://localhost:38291
# 指定端口: PORT=3001 pnpm start
```

### 在 H5 页面中接入 SDK

```html
<script type="module">
  import OpenLog from './packages/sdk/dist/index.js';

  const logger = new OpenLog({
    projectId: 'my-app',           // 必填，项目标识
    server: 'ws://192.168.x.x:38291', // 服务器地址（局域网 IP）
    eruda: { enabled: true },      // 开启 Eruda 本地调试面板
  });
</script>
```

### 访问 PC 控制台

浏览器打开 `http://localhost:38291`，从左侧设备列表选择设备即可开始调试。

---

## 🏗️ 架构

```
openLog/
├── packages/
│   ├── sdk/        # 移动端 SDK（数据采集 + Eruda 集成）
│   ├── server/     # Node.js 服务（WebSocket + REST API）
│   ├── web/        # PC 调试面板（React）
│   └── mcp/        # MCP Server（AI 工具集）
```

### 数据流

```
移动端 H5
  └── DataBus（统一数据总线）
        ├── Eruda 本地面板（展示层）
        └── Reporter → WebSocket → Server
                                      ├── PC Web 面板（消费）
                                      └── MCP 工具（消费）
```

**DataBus 是核心**：所有采集器（Console/Network/Storage/DOM/Performance）在第一时间向 DataBus emit 数据，Eruda 和远程传输各自按需消费，互不干扰。

---

## 🏁 性能跑分

openLog 内置基于 Lighthouse 权重的评分系统：

```
综合评分 = FPS(20%) + LCP(15%) + CLS(10%) + FCP(10%) +
           TTFB(10%) + INP(10%) + 长任务(15%) + 资源(10%)
```

**触发方式：**

```javascript
// SDK 直接调用
await logger.startPerfRun();
// ... 执行用户操作 ...
const report = await logger.stopPerfRun();
console.log(report.score); // { total: 87, grade: 'B', issues: [...] }
```

```bash
# MCP（AI 触发）
start_perf_run → stop_perf_run → get_perf_report
```

PC 端「🏁 跑分」Tab 提供图形化报告，支持历史对比和 JSON 导出。

> **禅模式**：跑分期间 SDK 自动进入禅模式，暂停 Network/Storage/DOM 采集，确保测量结果不被 SDK 自身干扰。

---

## 🐢 网络节流

模拟弱网环境测试：

```javascript
logger.setNetworkThrottle('3g');   // 300ms 延迟，750Kbps
logger.setNetworkThrottle('2g');   // 600ms 延迟，250Kbps
logger.setNetworkThrottle('offline'); // 离线
logger.setNetworkThrottle('none'); // 恢复正常
```

PC 控制台和 MCP（`network_throttle`）均可远程切换。

---

## 🎭 Mock API

在设备上拦截指定请求并返回自定义响应：

```javascript
// SDK 直接调用
const id = logger.addMock('/api/user', {
  status: 200,
  headers: { 'Content-Type': 'application/json' },
  body: '{"name":"test","role":"admin"}',
});
logger.removeMock(id);
```

PC「🎭 Mock」Tab 和 MCP（`add_mock`）均可远程配置。

---

## 🤖 MCP 接入（AI 调试）

### 配置（以 Claude Code 为例）

```json
{
  "mcpServers": {
    "openlog": {
      "command": "node",
      "args": ["/path/to/openLog/packages/mcp/dist/index.js"],
      "env": {
        "OPENLOG_API_BASE_URL": "http://localhost:38291"
      }
    }
  }
}
```

### 典型 AI 工作流

```
# 查看设备状态
list_devices → get_page_context

# 诊断问题
ai_analyze → 输出问题清单和优化建议

# 跑分
start_perf_run → (等待操作) → stop_perf_run → get_perf_report

# 调试
execute_js "document.title"
highlight_element "#submit-btn"
set_storage "token" "test-value"
```

---

## 🔌 REST API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/devices` | 设备列表 |
| GET | `/api/devices/:id/logs` | 控制台日志 |
| GET | `/api/devices/:id/network` | 网络请求 |
| GET | `/api/devices/:id/storage` | 存储快照 |
| GET | `/api/devices/:id/performance` | 性能数据 |
| GET | `/api/devices/:id/health` | 健康检查 |
| POST | `/api/devices/:id/perf-run/start` | 开始跑分 |
| POST | `/api/devices/:id/perf-run/stop` | 停止跑分 |
| GET | `/api/devices/:id/perf-run` | 跑分历史 |
| POST | `/api/devices/:id/execute` | 远程执行 JS |
| POST | `/api/devices/:id/screenshot` | 触发截图 |
| POST | `/api/devices/:id/network-throttle` | 网络节流 |
| POST | `/api/devices/:id/mocks` | 添加 Mock |
| DELETE | `/api/devices/:id/mocks/:mockId` | 删除 Mock |

---

## 💻 开发

```bash
pnpm build      # 构建所有包
pnpm dev        # 开发模式（watch）
pnpm test       # 运行测试
pnpm start      # 启动服务器
```

---

## 📄 许可证

MIT © [openLog](https://github.com/uaio/openLog)
