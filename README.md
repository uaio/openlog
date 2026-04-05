# openLog

> 移动端 H5 远程调试工具 — 实时采集、PC 可视化、AI 可查询

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
