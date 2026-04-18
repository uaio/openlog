**English** | [中文](./README.zh-CN.md)

# openLog

> The first frontend H5 monitoring tool built for AI Agents — real-time collection, PC visualization, AI-queryable, open integration.

**Developing H5 mobile pages? Ever run into these problems?**
- White screen on the phone, no idea where it crashed
- Can't tell if API calls fired or if params are correct
- AI wrote your code, but you can't verify it actually works on a real device

**openLog solves this.** Embed one line of code in your H5 page — everything happening on the phone (logs, requests, storage, performance) syncs to your PC in real-time, and also syncs to AI Agents, letting AI verify every line of code it writes on real devices.

openLog has three usage modes — pick what fits, they're independent:

| Mode | Best For | How to Use |
|------|----------|------------|
| **SDK Only** | Local debugging, no network needed | Add SDK, Eruda panel opens on device |
| **SDK + PC Panel** | Remote monitoring, team collaboration | `npx @openlog/cli` to start server |
| **SDK + Claude Code** | AI-assisted development, auto-verification | Then run `npx @openlog/cli init` for MCP config |

> 📖 **[Complete Debug Flow Guide](./docs/debug-flow-guide.md)** — Step-by-step setup and usage for each mode.

**openLog is also an open data platform**: any system (CI/CD, backend, Native apps, third-party tools) can push data via standard APIs for PC panel display and AI tool querying.

---

## ✨ Core Capabilities

### 📡 Real-time Data Collection (Mobile SDK)
| Collector | Description |
|-----------|-------------|
| **Console** | log / warn / error / info, preserves original rich-text arguments |
| **Network** | XHR + Fetch interception, includes request/response bodies + timing |
| **Storage** | localStorage / sessionStorage / Cookie real-time monitoring |
| **DOM Snapshot** | Page structure serialization, responds to PC refresh commands |
| **Performance** | FPS + Web Vitals (LCP/CLS/FCP/TTFB/INP) + Long Tasks + Resource Loading + Interaction Delay |
| **Screenshot** | html2canvas captures current page |
| **Error Capture** | Global JS errors + unhandled Promise rejections |

### 🖥️ PC Visualization Panel (9 Tabs)
| Tab | Function |
|-----|----------|
| 📝 Console | Real-time log stream + Remote JS execution + Log export + Network throttling |
| 🌐 Network | Request waterfall with filtering |
| 💾 Storage | localStorage / sessionStorage / Cookie viewing & editing |
| 🌲 Element | DOM tree structure viewer |
| 📊 Performance | FPS chart + Web Vitals + Long Tasks + Resource timeline |
| 🏁 Benchmark | Performance scoring report (score + grade + recommendations + history) |
| 🎭 Mock | API Mock rule management (URL regex matching) |
| 🩺 Health | Page health check (errors/memory/long tasks/Vitals composite score) |
| 🤖 AI Analysis | Aggregate all data, generate issue list & optimization suggestions |

### 🤖 MCP Toolset (AI-callable)
```
list_devices          get_console_logs      get_network_requests
watch_logs            get_storage           get_page_context
execute_js            take_screenshot       reload_page
set_storage           clear_storage         highlight_element
zen_mode              network_throttle      add_mock
remove_mock           clear_mocks           health_check
ai_analyze            start_perf_run        stop_perf_run
get_perf_report       verify_checkpoint     get_checkpoints
ensure_sdk            start_openlog         stop_openlog
start_monitor         poll_monitor          stop_monitor
```

---

## 🚀 Quick Start

### 1. Start the Server (Zero Install)

```bash
npx @openlog/cli
# Terminal prints all LAN IPs and SDK snippet — just copy and use
# Custom port: npx @openlog/cli -p 8080
```

### 2. Configure AI Tools (Auto-detection)

```bash
npx @openlog/cli init
# Auto-detects installed AI tools (Claude Code / Cursor / Windsurf)
# Writes MCP config + Claude Code slash commands in one step

# Specify tool:
npx @openlog/cli init --for=claude
npx @openlog/cli init --for=cursor
npx @openlog/cli init --for=windsurf
```

For Claude Code, `init` also writes `~/.claude/commands/openlog/` — available immediately:

| Slash Command | Function |
|---|---|
| `/openlog:setup` | **One-click zero-to-ready** (detect SDK → inject → start → confirm) |
| `/openlog:start` | Start monitoring + establish WS connection |
| `/openlog:stop` | Stop monitoring |
| `/openlog:status` | Check device connection status |
| `/openlog:logs` | View logs + checkpoint trace |
| `/openlog:screenshot` | Capture current page screenshot |
| `/openlog:clean` | Remove all `@openlog` debug logs from code |

### 3. Integrate the Mobile SDK

```html
<!-- CDN (recommended) — server prints this snippet on startup -->
<script src="https://unpkg.com/@openlog/sdk@latest/dist/openlog.iife.js"></script>
<script>
  OpenLog.init({
    projectId: 'my-app',
    server: 'ws://192.168.x.x:38291',  // Correct IP is printed on server start
    lang: 'en'
  })
</script>

<!-- Local-only mode (no server needed, Eruda panel only) -->
<script>
  OpenLog.init({ projectId: 'my-app', lang: 'en' })
</script>
```

```bash
# npm install
npm install @openlog/sdk
```

```javascript
import OpenLog from '@openlog/sdk'
new OpenLog({ projectId: 'my-app', server: 'ws://192.168.x.x:38291', lang: 'en' })
```

### 4. Open the PC Panel

Open `http://localhost:38291` in your browser, select a device from the sidebar.

---

## 🤖 AI Development Workflow

This is openLog's core scenario: AI tools verify each development milestone using real device data while building H5 features.

### Complete Flow

**Step 1: Start Monitoring**

```
/openlog:start
```

Claude calls `start_openlog` → server starts → WS connection established → PC panel auto-opens.

---

**Step 2: Develop + Instrument (AI does this automatically)**

AI automatically inserts `@openlog[checkpoint]` logs at key code nodes:

```javascript
async function handleLogin(username, password) {
  console.log('@openlog[checkpoint] login: start', { username })
  try {
    console.log('@openlog[checkpoint] login: sending request')
    const res = await api.login(username, password)
    console.log('@openlog[checkpoint] login: success', { status: res.status })
    localStorage.setItem('token', res.data.token)
    console.log('@openlog[checkpoint] login: token saved', { hasToken: true })
    router.push('/home')
    console.log('@openlog[checkpoint] login: navigated to home')
  } catch (e) {
    console.log('@openlog[checkpoint] login: failed', { error: e.message })
  }
}
```

**Checkpoint format convention:**
```
console.log('@openlog[checkpoint] featureName: stepDescription', { optionalData })
                ^^^^^^^^ openLog unified identifier
```

`@openlog` is the unified prefix for all openLog development-time logs, enabling easy querying and cleanup.

---

**Step 3: Real Device Verification**

User walks through the flow on their phone, then:

```
/openlog:logs
```

Or tell Claude: "I finished the login flow, verify it for me"

Claude calls `get_checkpoints(feature: "login")`, returns:

```
✅ Found 5 checkpoints:
  start → sending request → success → token saved → navigated to home

Attached data:
  success: { status: 200 }
  token saved: { hasToken: true }
```

---

**Step 4: Analyze Results**

| Result | Meaning | Next Step |
|--------|---------|-----------|
| ✅ All nodes present with correct data | Feature verified | Run cleanup |
| ❌ A node is missing | Code before that node didn't execute (condition/async/routing issue) | `get_console_logs(level: "error")` to locate |
| ❌ Attached data doesn't match | Logic error (e.g., `hasToken: false`) | Check and fix the logic |

---

**Step 5: Clean up @openlog logs (required after verification)**

```
/openlog:clean
```

Claude searches and removes all `@openlog`-prefixed console.log lines from your code.

**`@openlog` logs are development tools — they must not ship to production.**

---

**Step 6: Stop Monitoring**

```
/openlog:stop
```

---

### Flow Diagram

```
You                      Claude Code (AI)              Real Phone
│                              │                           │
│  /openlog:start              │                           │
│ ────────────────────────────►│ start_openlog()           │
│                              │──── WS connection ────────►│
│                              │                           │
│  "Build me a login feature"  │                           │
│ ────────────────────────────►│ writes code + @openlog    │
│ ◄────────────────────────────│                           │
│                              │                           │
│  (walk through login on phone)│                     SDK reports
│                              │◄──────────────────────────│
│                              │                           │
│  "verify it" / /openlog:logs │                           │
│ ────────────────────────────►│ get_checkpoints()         │
│ ◄────────────────────────────│ ✅ all 5 nodes hit        │
│                              │                           │
│  /openlog:clean              │                           │
│ ────────────────────────────►│ removes @openlog logs     │
```

---

## 📱 Three Usage Modes

### Mode A: SDK Only (Local Debugging)

No server needed — the lightest option. SDK initializes and opens the built-in Eruda debug panel directly on the phone.

```html
<script src="https://unpkg.com/@openlog/sdk@latest/dist/openlog.iife.js"></script>
<script>
  OpenLog.init({ projectId: 'my-app', lang: 'en' })
  // Debug entry appears at bottom-left of the page
</script>
```

Best for: quick debugging, no network available, purely local development.

---

### Mode B: SDK + PC Panel (Remote Monitoring)

Start the server, phone data streams to the PC visualization panel in real-time. Supports multiple devices simultaneously.

```bash
npx @openlog/cli          # Start, auto-prints LAN IPs and SDK code
npx @openlog/cli -p 8080  # Custom port
```

Open `http://localhost:38291` in your PC browser, select a device to start monitoring.

Best for: remote debugging, API integration testing, performance analysis, team collaboration.

---

### Mode C: SDK + Claude Code (AI-Assisted Development)

On top of Mode A, configure MCP so Claude Code connects to the real-time data stream. AI can auto-detect and inject SDK, verify development milestones, analyze errors, and execute remote operations. **No need to open the PC panel** — Claude IS your debug panel.

```bash
npx @openlog/cli init     # Auto-detect and configure Claude Code / Cursor / Windsurf
```

After restarting your AI tool, type `/openlog:start` in Claude Code to begin AI-assisted development.

Best for: AI Agent development, automatic milestone verification, AI-driven debugging loops.

---

## 🏗️ Architecture

```
openLog/
├── packages/
│   ├── types/      # Unified data standard (@openlog/types) ← single source of truth
│   ├── sdk/        # Mobile SDK (data collection + Eruda integration)
│   ├── server/     # Node.js server (WebSocket + REST API)
│   ├── web/        # PC debug panel (React)
│   └── mcp/        # MCP Server (AI toolset)
```

### Data Flow

```
Mobile H5 SDK
  └── DataBus (unified data bus)
        ├── Eruda local panel (independently usable)
        └── WebSocket Reporter → Server (hub)
                                    ├── PC Web Panel (viewer)
                                    └── MCP AI Tools (viewer)

External Systems (CI/CD / Backend / Native / Third-party)
  └── POST /api/ingest ──────────→ Server (same consumption chain)
```

**Bidirectional communication:** PC panel and MCP don't just receive data — they can send commands to the SDK (reload, execute_js, mock, etc.), with Server acting as the relay hub.

---

## 📐 Data Integration Standard (OpenLog Envelope)

All data — whether from the mobile SDK, external systems, or future Native platforms — follows the unified **Envelope format**.

### Base Format

```typescript
// Full type definitions: packages/types/src/
{
  "v": "1",                    // Schema version
  "platform": "web",           // Platform identifier
  "device": {
    "deviceId": "uuid",        // Unique device ID
    "projectId": "my-app",     // Project identifier
    "ua": "Mozilla/5.0...",
    "screen": "390x844",
    "pixelRatio": 3,
    "language": "en-US",
    "url": "https://..."
  },
  "tabId": "tab-uuid",
  "ts": 1712345678901,         // Unix timestamp (ms)
  "type": "console",           // Event type
  "data": { ... }              // Event-specific data
}
```

### Supported platform Values

| Value | Description | Status |
|-------|-------------|--------|
| `web` | Browser H5 | ✅ Supported |
| `react-native` | React Native | 🔜 Planned |
| `flutter` | Flutter / Dart | 🔜 Planned |
| `miniprogram` | WeChat / Alipay Mini Programs | 🔜 Planned |
| `unknown` | Other / Custom | ✅ Compatible |

### Event Types and Data Structures

<details>
<summary><strong>console</strong> — Console logs</summary>

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
<summary><strong>network</strong> — Network requests</summary>

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
<summary><strong>error</strong> — JS errors / unhandled Promises</summary>

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
<summary><strong>performance</strong> — Performance data</summary>

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

Full type definitions at [`packages/types/src/events/index.ts`](./packages/types/src/events/index.ts)

</details>

---

## 🔌 External Data Integration (POST /api/ingest)

Any system can push data to openLog via REST API — data appears in the PC panel and MCP tools in real-time.

```
POST http://localhost:38291/api/ingest
Content-Type: application/json
```

Supports **single** or **batch** (up to 500 items/request):

```bash
curl -X POST http://localhost:38291/api/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "v": "1",
    "platform": "unknown",
    "device": { "deviceId": "ci-001", "projectId": "my-app", "ua": "CI", "screen": "n/a", "pixelRatio": 1, "language": "en-US" },
    "tabId": "build-456",
    "ts": 1712345678901,
    "type": "error",
    "data": { "source": "uncaught", "message": "Test failed", "stack": "..." }
  }'
```

| Scenario | Description |
|----------|-------------|
| **CI/CD Pipeline** | Push test failures, build errors in real-time for AI analysis |
| **Backend Logs** | Push API exceptions to openLog, correlate with frontend data |
| **Native Apps** | React Native / Flutter integration, reuse the same monitoring stack |
| **Custom Collection** | Analytics, A/B test results via `custom` event type |

---

## 🏁 Performance Benchmarking

```
Composite Score = FPS(20%) + LCP(15%) + CLS(10%) + FCP(10%) +
                  TTFB(10%) + INP(10%) + Long Tasks(15%) + Resources(10%)
```

```javascript
await logger.startPerfRun();
// ... perform user interactions ...
const report = await logger.stopPerfRun();
// { total: 87, grade: 'B', issues: [...] }
```

---

## 🔌 REST API

| Method | Path | Description |
|--------|------|-------------|
| **POST** | **`/api/ingest`** | **External data ingestion (unified Envelope format)** |
| GET | `/api/devices` | Device list |
| GET | `/api/devices/:id/logs` | Console logs |
| GET | `/api/devices/:id/network` | Network requests |
| GET | `/api/devices/:id/storage` | Storage snapshot |
| GET | `/api/devices/:id/performance` | Performance data |
| GET | `/api/devices/:id/health` | Health check |
| POST | `/api/devices/:id/perf-run/start` | Start benchmark |
| POST | `/api/devices/:id/perf-run/stop` | Stop benchmark |
| GET | `/api/devices/:id/perf-run` | Benchmark history |
| POST | `/api/devices/:id/execute` | Remote JS execution |
| POST | `/api/devices/:id/screenshot` | Trigger screenshot |
| POST | `/api/devices/:id/network-throttle` | Network throttling |
| POST | `/api/devices/:id/mocks` | Add Mock rule |
| DELETE | `/api/devices/:id/mocks/:mockId` | Delete Mock rule |

---

## 🗺️ Roadmap

### Near-term (Implemented)
- [x] Web H5 SDK + PC monitoring panel + MCP toolset
- [x] `@openlog/types` unified data standard (Envelope v1)
- [x] `POST /api/ingest` external data ingestion API
- [x] `npx @openlog/cli init` one-click AI tool configuration + Claude Code slash commands
- [x] `@openlog[checkpoint]` development-time instrumentation + `get_checkpoints` verification
- [x] `/openlog:clean` auto-cleanup of debug logs after verification
- [x] `start_openlog` / `stop_openlog` explicit lifecycle management
- [x] MCP Prompt auto-loads development SOP (works on connect, no CLAUDE.md needed)

### Mid-term
- [ ] **React Native SDK** (`platform: "react-native"`)
- [ ] **Mini Program SDK** (WeChat/Alipay, `platform: "miniprogram"`)
- [ ] **PC panel `custom` type display** (generic JSON tree + custom render plugins)
- [ ] **Ingest authentication** (API Key + project-level permissions)
- [ ] **Data persistence** (SQLite, data survives restarts)

### Long-term
- [ ] **Flutter SDK** (`platform: "flutter"`)
- [ ] **Cloud version** (no LAN dependency, remote device support)
- [ ] **Envelope v2** (more collection dimensions, backward-compatible with v1)
- [ ] **Open plugin system** (third-party type extensions + custom PC panel tabs)

---

## 💻 Development

```bash
pnpm build      # Build all packages
pnpm dev        # Dev mode (watch)
pnpm test       # Run tests
pnpm start      # Start server
```

---

## 📄 License

MIT © [openLog](https://github.com/uaio/openLog)

