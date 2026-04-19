# Introduction

openLog is a real-time mobile H5 debugging tool that helps developers monitor console logs, network requests, performance metrics, and more — directly from a web dashboard.

## Architecture

```
┌─────────────┐     WebSocket      ┌──────────────┐     HTTP      ┌───────────┐
│  SDK (H5)   │ ──────────────────▶│   Server     │◀────────────▶ │  Web UI   │
│  @openlog/sdk│                    │  @openlog/server│             │           │
└─────────────┘                    └──────────────┘              └───────────┘
                                          │
                                    MCP Protocol
                                          │
                                   ┌──────▼──────┐
                                   │  MCP Server  │
                                   │  @openlog/mcp│
                                   └─────────────┘
```

## Packages

| Package | Description |
|---------|-------------|
| `@openlog/sdk` | Client SDK injected into H5 pages |
| `@openlog/server` | WebSocket + HTTP server for data collection |
| `@openlog/cli` | CLI tool to start the server (`npx @openlog/cli`) |
| `@openlog/mcp` | MCP server for AI-powered debugging |
| `@openlog/types` | Shared TypeScript type definitions |

## Features

- **Console Capture** — log, warn, error, info, debug, trace with stack traces
- **Network Monitoring** — Fetch and XHR interception with full request/response details
- **Performance** — Web Vitals, FPS, memory, long tasks, resource timing
- **Storage Inspection** — localStorage and sessionStorage snapshots
- **DOM Snapshots** — Live DOM tree inspection
- **Screenshots** — html2canvas-based page captures
- **API Mocking** — Client-side request mocking with throttling
- **Health Checks** — Automated scoring and diagnostics
- **Multi-device** — Support multiple connected devices simultaneously
- **Multi-tab** — Filter data by browser tab
- **Persistence** — Optional SQLite storage with configurable retention
- **i18n** — English and Chinese UI
