[English](./README.md) | **中文**

# openLog

> 首款面向 AI Agent 的前端 H5 数据监控工具 — 实时采集、PC 可视化、AI 可查询、开放接入

**开发 H5 页面，你有没有遇到这些问题：**
- 在手机上看到白屏，不知道哪里报错了
- 接口调没调、参数对不对，只能靠猜
- AI 帮你写了代码，但你不知道在真机上跑没跑通

**openLog 解决这些问题。** 在 H5 页面嵌入一行代码，手机上发生的一切——日志、请求、存储、性能——实时同步到你的电脑，也同步给 AI Agent，让 AI 能在真实设备上验证它写的每一行代码。

openLog 有三种用法，按需选择，互相独立：

| 模式 | 适合场景 | 如何使用 |
|------|---------|---------|
| **仅 SDK** | 本地调试，不需要远程 | 引入 SDK，本机直接打开 Eruda 面板 |
| **SDK + PC 面板** | 远程监控，团队协作 | `npx @openlog/cli` 启动服务 |
| **SDK + Claude Code** | AI 辅助开发，自动验证 | 再执行 `npx @openlog/cli init` 配置 MCP |

> 📖 **[完整调试流程指南（小白版）](./docs/debug-flow-guide.zh-CN.md)** — 从零开始，每种模式的详细安装和使用步骤。
> 🤖 **[AI 开发 Skill（SOP）](./docs/ai-dev-skill.zh-CN.md)** — 节点验证 SOP，粘贴到 CLAUDE.md / Cursor Rules 即可。

**同时，openLog 是一个开放数据平台**：任何系统（CI/CD、服务端、Native App、第三方工具）均可通过标准接口推送数据，供 PC 面板展示和 AI 工具查询。

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
list_devices          focus_device          get_console_logs
get_network_requests  watch_logs            get_storage
get_page_context      execute_js            take_screenshot
reload_page           set_storage           clear_storage
highlight_element     zen_mode              network_throttle
add_mock              remove_mock           clear_mocks
health_check          ai_analyze            start_perf_run
stop_perf_run         get_perf_report       verify_checkpoint
get_checkpoints       ensure_sdk            start_openlog
stop_openlog          start_monitor         poll_monitor
stop_monitor          list_monitors
```

---

## 🚀 快速开始

### 一、启动服务（零安装）

```bash
npx @openlog/cli
# 启动后终端会打印所有局域网 IP 和 SDK 接入代码，直接复制使用
# 指定端口：npx @openlog/cli -p 8080
# 公网/云端部署：npx @openlog/cli --host myapp.example.com
```

### 二、配置 AI 工具（自动检测）

```bash
npx @openlog/cli init
# 自动检测已安装的 AI 工具（Claude Code / Cursor / Windsurf）
# 一键写入 MCP 配置 + Claude Code slash commands，重启 AI 工具即可

# 指定工具：
npx @openlog/cli init --for=claude
npx @openlog/cli init --for=cursor
npx @openlog/cli init --for=windsurf
```

`init` 对 Claude Code 额外写入 `~/.claude/commands/openlog/`，安装后可直接使用：

| Slash Command | 功能 |
|---|---|
| `/openlog:setup` | **一键从零到就绪**（检测 SDK→注入→启动→确认连接） |
| `/openlog:start` | 启动监控服务 + 建立 WS 连接 |
| `/openlog:stop` | 停止监控服务 |
| `/openlog:status` | 查看设备连接状态 |
| `/openlog:logs` | 查看日志 + checkpoint 链路 |
| `/openlog:screenshot` | 截取当前页面截图 |
| `/openlog:clean` | 清除代码中所有 `@openlog` 调试日志 |

### 三、接入移动端 SDK

```html
<!-- CDN 方式（推荐）——服务启动后终端直接输出以下代码 -->
<script src="https://unpkg.com/@openlog/sdk@latest/dist/openlog.iife.js"></script>
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
npm install @openlog/sdk
```

```javascript
import OpenLog from '@openlog/sdk'
new OpenLog({ projectId: 'my-app', server: 'ws://192.168.x.x:38291', lang: 'zh' })
```

### 四、访问 PC 监控面板

浏览器打开 `http://localhost:38291`，从左侧设备列表选择设备即可。

---

## 🤖 AI 开发工作流

这是 openLog 的核心场景：AI 工具在开发 H5 功能时，通过真实设备数据验证每个关键节点。

### 完整流程

**第 1 步：启动监控**

```
/openlog:start
```

Claude 调用 `start_openlog` → 服务启动 → WS 长连接建立 → 自动打开 PC 面板。

如果有多个设备连接，Claude 会调用 `list_devices` 展示设备列表，然后调用 `focus_device(deviceId)` 锁定目标设备。后续所有操作自动指向该设备。

---

**第 2 步：开发 + 埋点（AI 自动完成）**

AI 在代码关键节点自动埋入 `@openlog[checkpoint]` 日志：

```javascript
async function handleLogin(username, password) {
  console.log('@openlog[checkpoint] login: 开始登录', { username })
  try {
    console.log('@openlog[checkpoint] login: 发起请求')
    const res = await api.login(username, password)
    console.log('@openlog[checkpoint] login: 请求成功', { status: res.status })
    localStorage.setItem('token', res.data.token)
    console.log('@openlog[checkpoint] login: token 已保存', { hasToken: true })
    router.push('/home')
    console.log('@openlog[checkpoint] login: 跳转首页')
  } catch (e) {
    console.log('@openlog[checkpoint] login: 请求失败', { error: e.message })
  }
}
```

**埋点格式约定：**
```
console.log('@openlog[checkpoint] 功能名: 步骤描述', { 可选附加数据 })
                ^^^^^^^^ openLog 统一标识符
```

`@openlog` 是 openLog 所有开发期日志的标识前缀，方便统一查询和清除。

---

**第 3 步：真机验证**

用户在手机上走一遍流程，然后：

```
/openlog:logs
```

或告诉 Claude："登录流程跑完了，帮我验证一下"

Claude 调用 `get_checkpoints(feature: "login")`，返回：

```
✅ 共发现 5 个检测点：
  开始登录 → 发起请求 → 请求成功 → token已保存 → 跳转首页

附加数据：
  请求成功: { status: 200 }
  token已保存: { hasToken: true }
```

---

**第 4 步：分析结果**

| 结果 | 含义 | 下一步 |
|------|------|--------|
| ✅ 所有节点出现且数据正确 | 功能验证通过 | 执行清除步骤 |
| ❌ 某节点缺失 | 该节点前的代码未执行（条件判断/异步/路由问题） | `get_console_logs(level: "error")` 定位 |
| ❌ 附加数据不符合预期 | 逻辑错误（如 `hasToken: false`） | 检查对应逻辑并修复 |

---

**第 5 步：清除 @openlog 日志（验证通过后必须执行）**

```
/openlog:clean
```

Claude 搜索代码中所有 `@openlog` 前缀的 console.log 行并删除。

**`@openlog` 日志是开发期工具，不应进入生产代码。**

---

**第 6 步：结束监控**

```
/openlog:stop
```

---

### 一图总结

```
你                       Claude Code (AI)              真实手机
│                              │                           │
│  /openlog:start              │                           │
│ ────────────────────────────►│ start_openlog()           │
│                              │──── WS 长连接 ────────────►│
│                              │                           │
│  "帮我写登录功能"             │                           │
│ ────────────────────────────►│ 写代码 + 埋 @openlog 日志 │
│ ◄────────────────────────────│                           │
│                              │                           │
│  （手机上走登录流程）          │                      SDK 上报日志
│                              │◄──────────────────────────│
│                              │                           │
│  "验证一下" / /openlog:logs  │                           │
│ ────────────────────────────►│ get_checkpoints()         │
│ ◄────────────────────────────│ ✅ 5个节点全部命中         │
│                              │                           │
│  /openlog:clean              │                           │
│ ────────────────────────────►│ 删除所有 @openlog 日志    │
```

---

## 📱 三种使用模式

### 模式一：仅 SDK（本地调试）

不需要启动任何服务，最轻量的使用方式。SDK 初始化后直接在手机上打开内置的 Eruda 调试面板。

```html
<script src="https://unpkg.com/@openlog/sdk@latest/dist/openlog.iife.js"></script>
<script>
  OpenLog.init({ projectId: 'my-app', lang: 'zh' })
  // 页面左下角会出现调试入口
</script>
```

适合：快速排查问题、不方便连网络、纯本地开发。

---

### 模式二：SDK + PC 面板（远程监控）

启动服务后，手机数据实时推送到 PC 端可视化面板，支持多设备同时接入。

```bash
npx @openlog/cli          # 启动，自动打印局域网 IP 和 SDK 接入代码
npx @openlog/cli -p 8080  # 指定端口（手机和电脑不在同一 WiFi 时按需调整）
```

PC 浏览器打开 `http://localhost:38291`，从左侧选择设备开始监控。

适合：远程调试、联调接口、性能分析、团队协作。

---

### 模式三：SDK + Claude Code（AI 辅助开发）

在模式一基础上，配置 MCP 让 Claude Code 接入实时数据流。AI 可自动检测并注入 SDK、验证开发节点、分析报错、执行远程操作。**不需要手动打开 PC 面板** —— Claude 就是你的调试面板。

```bash
npx @openlog/cli init     # 自动检测并配置 Claude Code / Cursor / Windsurf
```

重启 AI 工具后，Claude Code 里直接输入 `/openlog:start` 开始 AI 辅助开发。

适合：AI Agent 开发、功能节点自动验证、AI 驱动的调试闭环。

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
        └── WebSocket Reporter → Server（中控）
                                    ├── PC Web 面板（viewer）
                                    └── MCP AI 工具（viewer）

外部系统（CI/CD / 服务端 / Native / 第三方）
  └── POST /api/ingest ──────────→ Server（同上消费链路）
```

**双向通信：** PC 面板和 MCP 不仅接收数据，还可向 SDK 下发指令（reload、execute_js、mock 等），Server 作为中控负责转发。

---

## 📐 数据接入标准（OpenLog Envelope）

所有数据——无论来自移动端 SDK、外部系统还是未来的 Native 平台——均遵循统一的 **Envelope 格式**。

### 基础格式

```typescript
// 完整类型定义：packages/types/src/
{
  "v": "1",                    // Schema 版本
  "platform": "web",           // 平台标识
  "device": {
    "deviceId": "uuid",        // 设备唯一 ID
    "projectId": "my-app",     // 项目标识
    "ua": "Mozilla/5.0...",
    "screen": "390x844",
    "pixelRatio": 3,
    "language": "zh-CN",
    "url": "https://..."
  },
  "tabId": "tab-uuid",
  "ts": 1712345678901,         // Unix 毫秒时间戳
  "type": "console",           // 事件类型
  "data": { ... }              // 具体事件数据
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

```
POST http://localhost:38291/api/ingest
Content-Type: application/json
```

支持**单条**或**批量**（最多 500 条/次）：

```bash
curl -X POST http://localhost:38291/api/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "v": "1",
    "platform": "unknown",
    "device": { "deviceId": "ci-001", "projectId": "my-app", "ua": "CI", "screen": "n/a", "pixelRatio": 1, "language": "zh-CN" },
    "tabId": "build-456",
    "ts": 1712345678901,
    "type": "error",
    "data": { "source": "uncaught", "message": "单测失败", "stack": "..." }
  }'
```

| 场景 | 说明 |
|------|------|
| **CI/CD 流水线** | 单测失败、构建错误实时推送，AI 自动分析 |
| **服务端日志** | 接口异常推送到 openLog，与前端数据关联 |
| **Native App** | React Native / Flutter 接入，复用同一套监控体系 |
| **自定义采集** | 埋点数据、A/B 测试结果通过 `custom` 类型推送 |

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
// { total: 87, grade: 'B', issues: [...] }
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
- [x] `npx @openlog/cli init` 一键配置 AI 工具 + Claude Code slash commands
- [x] `@openlog[checkpoint]` 开发期埋点约定 + `get_checkpoints` 验证工具
- [x] `/openlog:clean` 验证完成后自动清除调试日志
- [x] `start_openlog` / `stop_openlog` 显式生命周期管理
- [x] MCP Prompt 自动加载开发 SOP（连接即生效，无需 CLAUDE.md）
- [x] API Key 鉴权（`--api-key` 参数）
- [x] SQLite 持久化（`--persist` 参数，可配置保留时长）
- [x] 国际化支持（中/英文，自动检测浏览器语言）
- [x] 多 Tab 过滤（按浏览器标签页筛选数据）
- [x] WebSocket 压缩 + 连接状态指示器

### 中期
- [ ] **React Native SDK**（`platform: "react-native"`）
- [ ] **小程序 SDK**（微信/支付宝，`platform: "miniprogram"`）
- [ ] **PC 面板 `custom` 类型展示**（通用 JSON 树 + 自定义渲染插件）

### 长期
- [ ] **Flutter SDK**（`platform: "flutter"`）
- [ ] **云端版本**（不依赖局域网，支持远程设备）
- [ ] **Envelope v2**（支持更多采集维度，向后兼容 v1）
- [ ] **开放插件系统**（第三方 type 扩展 + PC 面板自定义 Tab）

---

## 💻 开发

```bash
pnpm build      # 构建所有包
pnpm test       # 运行测试（需先 build）
pnpm dev        # 开发模式（watch）

# 单独运行某个包的测试：
pnpm --filter @openlog/server test
pnpm --filter @openlog/mcp test
pnpm --filter @openlog/cli test
pnpm --filter @openlog/sdk test
```

---

## 📄 许可证

MIT © [openLog](https://github.com/uaio/openLog)

