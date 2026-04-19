# openLog AI Development Skill — Node Verification SOP

Add the content below to your project's `CLAUDE.md` (or Cursor Rules / Copilot Instructions)
to enable AI tools to automatically verify every feature node during development using openLog.

---

## How to Use

Copy the **"Content for CLAUDE.md"** section below into your project's root `CLAUDE.md`.

---

## Content for CLAUDE.md

```markdown
## 🔬 Development Verification SOP (Powered by openLog)

When developing H5 page features, you **must** verify each key node
on a real device using openLog MCP tools after completing it.
**Do not skip verification and proceed to the next node.**

### Verification Tools

Prefer `verify_checkpoint` to run multiple checks in one call.
For real-time observation, call `watch_logs` before triggering the action.

### Verification Methods by Node Type

#### Event Binding Nodes
```
verify_checkpoint(
  checkpoint: "describe the feature",
  triggerJs: "JS to trigger the action",
  expects: {
    noErrors: true,
    js: [{ code: "!!document.querySelector('#your-element')", description: "element exists" }]
  }
)
```

#### API Call Nodes
```
verify_checkpoint(
  checkpoint: "describe the feature",
  triggerJs: "JS to trigger the API call",
  waitMs: 1500,
  expects: {
    noErrors: true,
    network: [{ urlPattern: "/api/your-endpoint", method: "POST", status: 200 }]
  }
)
```

#### State Storage Nodes (Login / Auth)
```
verify_checkpoint(
  checkpoint: "describe the feature",
  expects: {
    noErrors: true,
    storage: [{ key: "token", storageType: "localStorage" }]
  }
)
```

#### Page Navigation Nodes
```
verify_checkpoint(
  checkpoint: "describe the feature",
  expects: {
    noErrors: true,
    js: [{ code: "location.pathname === '/target-path'", description: "navigated to target page" }]
  }
)
```

#### Before Full Feature Delivery
```
health_check()       → health score no lower than 80
ai_analyze()         → no high-priority issues
take_screenshot()    → archive screenshot
```

### Failure Handling Rules

1. `failed_checks` is not empty → locate the issue, fix the code, re-verify — **do not skip**
2. Same check fails twice in a row → use `get_console_logs(level="error")` + `get_network_requests` for deep investigation
3. All passed → annotate `✅ Node verified` in your reply, then proceed to next node
```

---

## Complete Development Loop

```
[AI writes code] → [Hot-reload to device] → [verify_checkpoint]
     ↑                                    |
     |         ✅ passed                  |
     └──────────────────────────────────┘
                     ↓ ❌ failed
              [get_console_logs / get_network_requests]
                     ↓
              [AI fixes code] → re-run verify_checkpoint
```

---

## 🤖 Sub-Agent Background Monitoring Mode

**Core principle: log and error monitoring run in sub-agents, never blocking the main agent from writing code.**

### At Development Session Start (Main Agent Runs Once)

```
start_monitor(type="error") → errorMonitorId   # hand to "error sub-agent"
start_monitor(type="log")   → logMonitorId     # hand to "log sub-agent"
```

### Error Sub-Agent (Runs Independently, Loops)

```
loop:
  result = poll_monitor(errorMonitorId)
  if result.hasAlert:
    → immediately notify main agent: result.alertSummary
    → main agent pauses current task, handles error first
  sleep(3000ms)   # poll every 3 seconds
```

### Log Sub-Agent (Runs Independently, Loops)

```
loop:
  result = poll_monitor(logMonitorId)
  if result.hasAlert:
    → summarize result.newEvents warn/error, notify main agent
  elif result.newEvents.length > 0:
    → accumulate silently, available for main agent to query
  sleep(5000ms)   # poll every 5 seconds
```

### Main Agent Alert Handling

```
1. Pause current node development
2. get_console_logs(level="error") to get full error context
3. Locate + fix
4. verify_checkpoint to re-verify current node
5. Resume development
```

### At Session End

```
stop_monitor(errorMonitorId)
stop_monitor(logMonitorId)
```

### Architecture Diagram

```
┌─────────────────────────────────────┐
│        Main Agent (writes code)      │
│  verify_checkpoint  →  continue dev  │
│         ↑ receives alert, pauses     │
└────────────┬────────────────────────┘
             │ alert notification
    ┌────────┴──────────┐
    │                   │
┌───▼──────┐      ┌─────▼─────┐
│ Error     │      │ Log        │
│ Sub-Agent │      │ Sub-Agent  │
│poll_monitor│     │poll_monitor│
│(error)    │      │(log)      │
│every 3s   │      │every 5s   │
└───────────┘      └───────────┘
         ↑               ↑
    In-process MCP watcher registry (cursor-based)
         ↓               ↓
    openLog Server API (/logs?since=cursor)
```

---

## Node Check Quick Reference

| Node Type | Recommended expects Config |
|-----------|---------------------------|
| DOM rendered | `js: [{ code: "!!document.querySelector('#el')" }]` |
| Form validation | `logs: [{ contains: "validate", level: "log" }]` |
| API call | `network: [{ urlPattern: "/api/xxx", status: 200 }]` |
| Login success | `storage: [{ key: "token" }]` + `js: location.pathname` |
| Error handling | `logs: [{ contains: "error message text" }]` + `noErrors: false` |
| Page navigation | `js: [{ code: "location.pathname === '/xxx'" }]` |
| Data rendering | `js: [{ code: "document.querySelectorAll('.item').length > 0" }]` |
