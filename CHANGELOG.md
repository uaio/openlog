# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-04-20

### Added

- **SQLite Persistence** — Optional data persistence with `--persist` flag, WAL mode, configurable retention (default: 1 day)
- **i18n Support** — Full English/Chinese UI with auto-detection and language switcher
- **Multi-tab Filtering** — TabFilter component to filter logs/network by browser tab
- **API Key Authentication** — `--api-key` flag for securing HTTP and WebSocket access
- **CORS Configuration** — `--cors-origin` flag for allowed origins
- **WebSocket Compression** — Per-message deflate for reduced bandwidth
- **Device Grouping** — Group connected devices by `projectId`
- **WebSocket Status Indicator** — Real-time connection status in the web panel header
- **Health Panel** — Automated page health scoring (error rate, long tasks, memory, vitals)
- **Performance Benchmarking** — Composite scoring with grades (A–F) and history
- **SDK Unit Tests** — 29 tests covering DataBus, RateLimiter, MessageQueue, perf-score
- **Persistence Tests** — 16 unit tests for SQLite storage layer
- **VitePress Documentation Site** — Full docs with guides and API reference
- **CI/CD Workflows** — GitHub Actions for lint/build/test, npm publish, docs deploy
- **Claude Code Slash Commands** — `/openlog:start`, `/openlog:stop`, `/openlog:logs`, etc.
- **`ensure_sdk` MCP Tool** — Auto-detect and inject SDK into user projects
- **Network Throttling** — Simulate 3G/4G/offline from PC panel or AI tools
- **XHR Mock Support** — API mocking now works for both Fetch and XMLHttpRequest

### Changed

- Default server port changed from 38291 to 9898
- NetworkPanel rewritten with full request waterfall UI
- MockPanel now shows rule list with toggle/delete
- Console interception now covers `debug` and `trace` levels
- Eruda initialized with `overrideConsole: false` to prevent double-capture

### Fixed

- ScreenshotStore/PerformanceStore cleanup timers now use correct `setInterval` reference
- Persistence layer handles JSON parse errors gracefully (skips corrupt entries)
- SettingsPanel state properly syncs with localStorage
- XHR requests now respect throttle and mock rules (previously only Fetch)
- Fixed unused variable TypeScript errors blocking web package build
- Fixed eruda webpack build (restored missing build configs from upstream v3.4.3)

## [0.1.0] - 2024-12-01

### Added

- Initial release of openLog monorepo
- `@openlog/sdk` — Mobile H5 SDK with console, network, storage, DOM, performance, error, and screenshot collectors
- `@openlog/server` — Node.js WebSocket + REST API server
- `@openlog/web` — PC debug panel with 9 tabs (Console, Network, Storage, Element, Performance, Benchmark, Mock, Health, AI Analysis)
- `@openlog/mcp` — MCP Server with 30+ AI-callable tools
- `@openlog/cli` — CLI entry point with `npx @openlog/cli` and `npx @openlog/cli init`
- `@openlog/types` — Shared TypeScript type definitions (Envelope v1 format)
- `POST /api/ingest` — External data ingestion API
- `@openlog[checkpoint]` instrumentation and verification system
- Claude Code slash commands (`/openlog:start`, `/openlog:stop`, `/openlog:logs`, etc.)
- Multi-AI tool support (Claude Code, Cursor, Windsurf)
- Built-in Eruda on-device debug panel
- Real-time WebSocket communication
- Network throttling and API mocking
- Performance benchmarking with composite scoring
- Health check system
