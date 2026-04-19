# openLog Complete Debug Flow Guide (Beginner-Friendly)

> openLog offers three usage modes, from simplest to most advanced. You can use just one, or combine them.

---

## Overview: Three Modes Compared

```
┌───────────────┬──────────────────────┬────────────────────┬───────────────────────────────┐
│               │  Mode A: SDK Only    │  Mode B: SDK + PC  │  Mode C: SDK + Claude Code    │
├───────────────┼──────────────────────┼────────────────────┼───────────────────────────────┤
│  Setup needed │  One <script> tag    │  npx @openlog/cli  │  npx @openlog/cli init        │
│  Debug panel  │  Eruda on phone      │  PC browser panel  │  Claude Code reads data       │
│  Network req  │  None                │  Same LAN          │  Same LAN                     │
│  Best for     │  Quick log checking  │  Remote monitoring  │  AI auto-verification         │
│  Data goes to │  Local Eruda         │  → PC real-time     │  → Claude Code via MCP        │
└───────────────┴──────────────────────┴────────────────────┴───────────────────────────────┘
```

---

## Mode A: SDK Only (Simplest — 10 Seconds to Start)

### What You Get

A debug floating button appears at the bottom-left of the phone page. Tap it to see a full console, network requests, storage, DOM tree — similar to Chrome DevTools.

### Setup Steps

Add this to your H5 page's `<head>` or at the end of `<body>`:

```html
<script src="https://unpkg.com/@openlog/sdk@latest/dist/openlog.iife.js"></script>
<script>
  OpenLog.init({ projectId: 'my-app', lang: 'en' })
</script>
```

**No `server` parameter → SDK won't connect remotely, only starts the local Eruda panel.**

### Usage Flow

```
1. Add the code above to your H5 page
2. Open the page on your phone
3. See the green floating button at bottom-left → tap to expand
4. Check Console / Network / Elements / Storage tabs
5. Done debugging → remove those two <script> tags
```

### Best For

- Phone shows white screen, want to see error messages
- Want to confirm if an API call went through
- No WiFi available, quick local debugging

---

## Mode B: SDK + PC Monitoring Panel (Remote Debugging)

### What You Get

All logs, network requests, storage, and performance data from the phone **sync to your PC browser in real-time**. Supports multiple devices simultaneously.

### Setup Steps

#### Step 1: Start the Server on Your PC (Zero Install)

```bash
npx @openlog/cli
```

After startup, the terminal prints:

```
┌─────────────────────────────────────────┐
│         openLog  Started 🚀              │
├─────────────────────────────────────────┤
│  PC Monitoring Panel                     │
│    Local:   http://localhost:38291       │
│  LAN:                                    │
│    en0          http://192.168.1.5:38291 │
│                 SDK server: 'ws://192.168.1.5:38291' │
├─────────────────────────────────────────┤
│  SDK Integration:                        │
│  <script src="https://unpkg.com/@openlog/sdk@latest/dist/openlog.iife.js"></script>
│  <script>                                │
│    OpenLog.init({                        │
│      projectId: 'my-app',               │
│      server: 'ws://192.168.1.5:38291',  │
│      lang: 'en'                          │
│    })                                    │
│  </script>                               │
└─────────────────────────────────────────┘
```

**Just copy the code printed in the terminal.** The IP address is already filled in for you.

#### Step 2: Integrate the SDK in Your H5 Page

Paste the code from the terminal into your H5 page:

```html
<script src="https://unpkg.com/@openlog/sdk@latest/dist/openlog.iife.js"></script>
<script>
  OpenLog.init({
    projectId: 'my-app',
    server: 'ws://192.168.1.5:38291',   // ← Replace with the address shown in your terminal
    lang: 'en'
  })
</script>
```

**With the `server` parameter → SDK sends data to your PC via WebSocket.**

> You can also use npm:
> ```bash
> npm install @openlog/sdk
> ```
> ```javascript
> import OpenLog from '@openlog/sdk'
> new OpenLog({ projectId: 'my-app', server: 'ws://192.168.1.5:38291', lang: 'en' })
> ```

#### Step 3: Open the PC Panel

Visit `http://localhost:38291` (or the address shown in terminal) in your browser.

### Usage Flow

```
1. PC: npx @openlog/cli                → Server starts
2. H5 page: paste SDK code             → SDK connects to server
3. Phone: open H5 page                 → Device appears in PC panel sidebar
4. PC: select device                   → See real-time logs/network/storage/performance
5. Interact on phone                   → PC panel refreshes in real-time
6. PC can: remote execute JS / screenshot / mock APIs / simulate slow network
7. Done debugging: Ctrl+C to stop server + remove SDK code
```

### What's in the PC Panel

| Tab | Function |
|-----|----------|
| 📝 Console | Real-time logs + Remote JS execution + Log export |
| 🌐 Network | Request waterfall with request/response bodies and timing |
| 💾 Storage | View and edit localStorage / sessionStorage / Cookies |
| 🌲 Element | DOM tree structure |
| 📊 Performance | FPS chart + Web Vitals + Long Tasks + Resource loading |
| 🏁 Benchmark | Performance scoring (A/B/C grade + recommendations + history) |
| 🎭 Mock | API Mock rule management |
| 🩺 Health | Page health check (errors/memory/Vitals composite score) |
| 🤖 AI Analysis | Aggregate data, generate issue list and optimization suggestions |

### FAQ

**Q: Phone and PC not on the same WiFi?**
A: Make sure they're on the same LAN. The terminal prints all network interface addresses — pick the one your phone can reach.

**Q: Change port?**
A: `npx @openlog/cli -p 8080`

---

## Mode C: SDK + Claude Code (AI-Assisted Debugging)

### What You Get

Claude Code reads your phone's logs, network requests, and screenshots directly via MCP, helping you debug automatically. **No need to open the PC panel** — Claude IS your debug panel. While you write code, AI verifies every feature on the real device.

### Setup Steps

#### Step 1: Configure MCP (One-time setup)

```bash
npx @openlog/cli init
```

This command will:
- **Auto-detect** which AI tools you have installed (Claude Code / Cursor / Windsurf)
- **Auto-write** the MCP configuration file
- For Claude Code, also installs 7 **slash commands**

> You can also specify: `npx @openlog/cli init --for=claude`

**Then restart Claude Code.**

#### Step 2: Start in Claude Code

Simply type:

```
/openlog:setup
```

This command automatically handles everything:
1. Starts the openLog monitoring server
2. Detects if your project has the SDK integrated
3. If not → auto-injects (HTML projects get CDN injection; npm projects get install + code insertion)
4. Waits for device connection
5. Reports ready status

**You just need to open the H5 page on your phone — Claude handles the rest.**

### All Slash Commands

| Command | What It Does |
|---------|-------------|
| `/openlog:setup` | **One-click zero-to-ready** (detect → inject → start → confirm connection) |
| `/openlog:start` | Start monitoring server |
| `/openlog:stop` | Stop monitoring server |
| `/openlog:status` | Check device connection status |
| `/openlog:logs` | View logs + checkpoint verification chain |
| `/openlog:screenshot` | Capture current phone screen |
| `/openlog:clean` | Remove all @openlog debug logs from code |

### AI Development & Debug Flow

```
You                       Claude Code                   Phone
│                              │                          │
│  /openlog:setup              │                          │
│ ───────────────────────────► │ ensure_sdk → inject SDK  │
│                              │ start_openlog → start    │
│                              │────── WS connection ────►│
│                              │                          │
│  "Build me a login feature"  │                          │
│ ───────────────────────────► │ writes code              │
│                              │ + inserts @openlog logs  │
│ ◄─────────────────────────── │                          │
│                              │                          │
│  (walk through login on phone)│                    SDK reports
│                              │ ◄────────────────────────│
│                              │                          │
│  "verify it"                 │                          │
│ ───────────────────────────► │ get_checkpoints("login") │
│ ◄─────────────────────────── │ ✅ all 5 nodes hit       │
│                              │                          │
│  "there's an error, check it"│                          │
│ ───────────────────────────► │ get_console_logs("error") │
│                              │ + get_network_requests()  │
│ ◄─────────────────────────── │ found API returning 401   │
│                              │                          │
│  /openlog:clean              │                          │
│ ───────────────────────────► │ removes all @openlog logs │
```

### Core Tools Claude Can Call

**Query data:**
- `get_console_logs` — View logs (filter by level: error/warn/log)
- `get_network_requests` — View network requests (URL/status/timing/body)
- `get_storage` — View localStorage / sessionStorage / Cookies
- `get_checkpoints` — View @openlog[checkpoint] verification nodes
- `take_screenshot` — Capture screenshot
- `health_check` — Page health score

**Control device:**
- `execute_js` — Remote execute JS (run code on the phone)
- `reload_page` — Refresh page
- `set_storage` / `clear_storage` — Modify storage
- `network_throttle` — Simulate slow network
- `add_mock` / `remove_mock` — Mock API responses

**Auto-detect:**
- `ensure_sdk` — Detect if project has SDK integrated, auto-inject if not

### Typical Debugging Scenarios

**Scenario 1: White Screen**
```
You: "Phone shows white screen"
Claude: calls get_console_logs(level: "error")
       → finds "Cannot read property 'map' of undefined"
       → calls get_network_requests()
       → finds /api/list returned 500
       → identifies server-side issue, suggests fix
```

**Scenario 2: Logic Verification**
```
You: "Build me a login feature"
Claude: writes code + inserts @openlog[checkpoint] logs at key nodes
You: walk through login flow on phone
Claude: calls get_checkpoints(feature: "login")
       → finds "token saved" node exists but hasToken: false
       → identifies localStorage.setItem wrote empty value
       → fixes code → re-verifies → passes → cleans up @openlog logs
```

**Scenario 3: Performance Issues**
```
You: "Page loads too slowly"
Claude: calls health_check() → health score 45/100
       → calls get_perf_report() → LCP 4.2s, 3 long tasks > 200ms
       → calls take_screenshot() to confirm first-screen content
       → suggests: lazy-load images + split large components + preload APIs
```

---

## Full Comparison: When to Use Which Mode

| Scenario | Recommended Mode | Reason |
|----------|-----------------|--------|
| Quick error check on phone | A (SDK Only) | No PC needed, just add one line of code |
| API integration, inspect request details | B (SDK + PC) | Easier to view request/response bodies on PC |
| Team collaboration, QA feedback | B (SDK + PC) | Multiple phones connect simultaneously |
| AI writes and verifies code | C (SDK + Claude Code) | Claude auto-verifies every node on real device |
| Track complex logic bugs | C (SDK + Claude Code) | AI correlates logs/network/storage for analysis |
| Performance optimization | B or C | Benchmarking + Vitals + Long Task analysis |

---

## Important Notes

1. **openLog is a development tool — don't ship to production**
   - CDN `<script>` tag: remove after debugging
   - npm install: exclude from production builds, or guard with env variables
   - `@openlog[checkpoint]` logs: use `/openlog:clean` to auto-remove

2. **Phone and PC must be on the same LAN** (Modes B/C)
   - Connecting to the same WiFi is simplest
   - Not on the same WiFi? Check the multiple network interface addresses printed in terminal

3. **Modes B and C can be used simultaneously**
   - Using Claude Code (Mode C) but also want the PC panel? Open `http://localhost:38291`
   - Same server, same data on both sides

4. **Default port is 38291**
   - Port taken? `npx @openlog/cli -p 8080` to use a different one
