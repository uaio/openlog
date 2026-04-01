# AIConsole MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 AIConsole 的最小可用版本，支持移动端日志实时推送到本地服务器，AI 可通过 MCP 查询设备日志，PC 页面可实时查看。

**Architecture:**
- 基于 vConsole fork 添加 WebSocket transport 模块
- 本地 Node.js 服务器提供 WebSocket + HTTP API
- MCP Server 通过 stdio 与 AI 工具通信
- React + Vite 构建 PC 查看页面

**Tech Stack:**
- SDK: TypeScript + vConsole fork
- Server: Node.js + ws + express
- MCP: @modelcontextprotocol/sdk
- Web: React + Vite + TypeScript
- Build: pnpm + Turborepo

---

## 文件结构

### Monorepo 根目录
```
aiconsole/
├── package.json                    # 根配置，scripts + 依赖管理
├── pnpm-workspace.yaml             # workspace 配置
├── tsconfig.json                   # 共享 TS 配置
└── packages/
```

### packages/sdk (SDK)
```
packages/sdk/
├── package.json
├── tsconfig.json
├── src/
│   ├── core/
│   │   └── device.ts              # 设备 ID 生成、设备信息收集
│   ├── transport/
│   │   ├── websocket.ts           # WebSocket 连接管理
│   │   ├── reporter.ts            # 数据上报
│   │   └── index.ts               # 导出
│   ├── plugins/
│   │   └── console.ts             # 扩展 console 插件（上报日志）
│   ├── types/
│   │   └── index.ts               # 类型定义
│   └── index.ts                   # SDK 入口
└── build/
    └── vite.config.ts             # 构建配置（UMD + ESM）
```

### packages/server
```
packages/server/
├── package.json
├── tsconfig.json
├── src/
│   ├── ws/
│   │   ├── server.ts              # WebSocket 服务器
│   │   └── handlers.ts            # 消息处理
│   ├── api/
│   │   ├── routes.ts              # HTTP API 路由
│   │   └── devices.ts             # 设备查询 API
│   ├── store/
│   │   ├── devices.ts             # 设备存储
│   │   └── logs.ts                # 日志存储
│   ├── cli/
│   │   └── index.ts               # CLI 入口（npx aiconsole）
│   └── index.ts                   # 服务器入口
└── bin/
    └── aiconsole                  # CLI 可执行文件
```

### packages/mcp
```
packages/mcp/
├── package.json
├── tsconfig.json
├── src/
│   ├── tools/
│   │   ├── list_devices.ts        # 列出设备
│   │   ├── get_console_logs.ts    # 获取日志
│   │   └── index.ts               # 工具注册
│   ├── server.ts                  # MCP 服务器
│   └── index.ts                   # 入口
└── bin/
    └── aiconsole-mcp              # MCP 可执行文件
```

### packages/web
```
packages/web/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── src/
│   ├── main.tsx                   # 入口
│   ├── App.tsx                    # 根组件
│   ├── components/
│   │   ├── DeviceList.tsx         # 设备列表
│   │   ├── LogPanel.tsx           # 日志面板
│   │   └── LogEntry.tsx           # 日志条目
│   ├── hooks/
│   │   ├── useDevices.ts          # 设备数据 hook
│   │   └── useLogs.ts             # 日志数据 hook
│   ├── types/
│   │   └── index.ts               # 类型定义
│   └── api/
│       └── client.ts              # API 客户端
└── styles/
    └── global.css                 # 全局样式
```

---

## 任务分解

### 阶段 0: 项目初始化

#### Task 0.1: 初始化 Monorepo

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.json`

- [ ] **Step 1: 创建根 package.json**

```json
{
  "name": "aiconsole",
  "version": "0.1.0",
  "private": true,
  "description": "AI console for mobile debugging",
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "prepare": "husky install"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "turbo": "^1.11.0",
    "pnpm": "^8.12.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

- [ ] **Step 2: 创建 pnpm-workspace.yaml**

```yaml
packages:
  - 'packages/*'
```

- [ ] **Step 3: 创建共享 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true
  }
}
```

- [ ] **Step 4: 安装依赖**

```bash
pnpm install
```

Expected: 依赖安装成功，node_modules 生成

- [ ] **Step 5: 提交**

```bash
git add package.json pnpm-workspace.yaml tsconfig.json
git commit -m "chore: initialize monorepo with pnpm workspace"
```

---

#### Task 0.2: 创建 Server 包骨架

**Files:**
- Create: `packages/server/package.json`
- Create: `packages/server/tsconfig.json`
- Create: `packages/server/src/index.ts`

- [ ] **Step 1: 创建 server/package.json**

```json
{
  "name": "@aiconsole/server",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "bin": {
    "aiconsole": "./bin/aiconsole"
  },
  "scripts": {
    "dev": "tsc --watch",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "ws": "^8.16.0",
    "express": "^4.18.0"
  },
  "devDependencies": {
    "@types/ws": "^8.5.0",
    "@types/express": "^4.17.0"
  }
}
```

- [ ] **Step 2: 创建 server/tsconfig.json**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: 创建 server/src/index.ts（占位）**

```typescript
console.log('AIConsole Server');
```

- [ ] **Step 4: 提交**

```bash
git add packages/server/
git commit -m "chore: create server package skeleton"
```

---

#### Task 0.3: 创建 MCP 包骨架

**Files:**
- Create: `packages/mcp/package.json`
- Create: `packages/mcp/tsconfig.json`
- Create: `packages/mcp/src/index.ts`

- [ ] **Step 1: 创建 mcp/package.json**

```json
{
  "name": "@aiconsole/mcp",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "bin": {
    "aiconsole-mcp": "./bin/aiconsole-mcp"
  },
  "scripts": {
    "dev": "tsc --watch",
    "build": "tsc"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0"
  }
}
```

- [ ] **Step 2: 创建 mcp/tsconfig.json**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: 创建 mcp/src/index.ts（占位）**

```typescript
console.log('AIConsole MCP Server');
```

- [ ] **Step 4: 提交**

```bash
git add packages/mcp/
git commit -m "chore: create mcp package skeleton"
```

---

#### Task 0.4: 创建 VConsole 包骨架

**Files:**
- Create: `packages/sdk/package.json`
- Create: `packages/sdk/tsconfig.json`
- Create: `packages/sdk/build/vite.config.ts`

- [ ] **Step 1: 创建 vconsole/package.json**

```json
{
  "name": "aiconsole",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "dev": "vite build --watch",
    "build": "vite build"
  },
  "dependencies": {},
  "devDependencies": {
    "vite": "^5.0.0",
    "vite-plugin-dts": "^3.7.0"
  }
}
```

- [ ] **Step 2: 创建 vconsole/build/vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'AIConsole',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`
    }
  },
  plugins: [dts()]
});
```

- [ ] **Step 3: 提交**

```bash
git add packages/sdk/
git commit -m "chore: create vconsole package skeleton"
```

---

#### Task 0.5: 创建 Web 包骨架

**Files:**
- Create: `packages/web/package.json`
- Create: `packages/web/vite.config.ts`
- Create: `packages/web/index.html`
- Create: `packages/web/src/main.tsx`
- Create: `packages/web/src/App.tsx`

- [ ] **Step 1: 创建 web/package.json**

```json
{
  "name": "@aiconsole/web",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0"
  }
}
```

- [ ] **Step 2: 创建 web/vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001
  }
});
```

- [ ] **Step 3: 创建 web/index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AIConsole</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

- [ ] **Step 4: 创建 web/src/main.tsx**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 5: 创建 web/src/App.tsx**

```typescript
export default function App() {
  return <div>AIConsole Web Viewer</div>;
}
```

- [ ] **Step 6: 提交**

```bash
git add packages/web/
git commit -m "chore: create web package skeleton"
```

---

### 阶段 1: SDK 实现

#### Task 1.1: 设备 ID 生成逻辑

**Files:**
- Create: `packages/sdk/src/types/index.ts`
- Create: `packages/sdk/src/core/device.ts`
- Test: `packages/sdk/src/core/device.test.ts`

- [ ] **Step 1: 创建类型定义**

```typescript
// packages/sdk/src/types/index.ts
export interface DeviceInfo {
  deviceId: string;
  projectId: string;
  ua: string;
  screen: string;
  pixelRatio: number;
  language: string;
  url: string;
  connectTime: number;
  lastActiveTime: number;
}

export interface ConsoleLogEntry {
  deviceId: string;
  tabId: string;
  timestamp: number;
  level: 'log' | 'warn' | 'error' | 'info';
  message: string;
  stack?: string;
}

export interface RemoteConfig {
  projectId: string;
  server?: string;
}
```

- [ ] **Step 2: 创建设备 ID 生成函数**

```typescript
// packages/sdk/src/core/device.ts
import type { DeviceInfo } from '../types/index.js';

// 简单的字符串 hash 函数
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

// 生成设备 ID
export function generateDeviceId(projectId: string): string {
  const urlPart = window.location.origin + window.location.pathname;
  const ua = navigator.userAgent;
  return hashString(urlPart + ua + projectId);
}

// 生成标签页 ID
export function generateTabId(): string {
  return 'tab-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
}

// 获取设备信息
export function getDeviceInfo(projectId: string): DeviceInfo {
  const deviceId = generateDeviceId(projectId);

  // 尝试从 localStorage 读取
  const cachedId = localStorage.getItem(`aiconsole_device_id_${projectId}`);
  const isNew = !cachedId || cachedId !== deviceId;

  if (isNew) {
    localStorage.setItem(`aiconsole_device_id_${projectId}`, deviceId);
  }

  return {
    deviceId,
    projectId,
    ua: navigator.userAgent,
    screen: `${window.screen.width}x${window.screen.height}`,
    pixelRatio: window.devicePixelRatio,
    language: navigator.language,
    url: window.location.origin + window.location.pathname,
    connectTime: isNew ? Date.now() : parseInt(localStorage.getItem(`aiconsole_connect_time_${projectId}`) || '0'),
    lastActiveTime: Date.now()
  };
}

// 更新设备活跃时间
export function updateDeviceActiveTime(projectId: string): void {
  localStorage.setItem(`aiconsole_last_active_${projectId}`, Date.now().toString());
}
```

- [ ] **Step 3: 创建测试文件**

```typescript
// packages/sdk/src/core/device.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateDeviceId, generateTabId, getDeviceInfo } from './device.js';

describe('device', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should generate consistent device ID for same inputs', () => {
    const projectId = 'test-app';
    const id1 = generateDeviceId(projectId);
    const id2 = generateDeviceId(projectId);
    expect(id1).toBe(id2);
  });

  it('should generate different device IDs for different projects', () => {
    const id1 = generateDeviceId('app1');
    const id2 = generateDeviceId('app2');
    expect(id1).not.toBe(id2);
  });

  it('should generate unique tab IDs', () => {
    const id1 = generateTabId();
    const id2 = generateTabId();
    expect(id1).not.toBe(id2);
  });
});
```

- [ ] **Step 4: 添加 vitest 依赖**

```bash
cd packages/sdk
pnpm add -D vitest
```

- [ ] **Step 5: 运行测试（预期失败，因为还没配置）**

```bash
pnpm vitest run src/core/device.test.ts
```

Expected: 失败（配置问题）

- [ ] **Step 6: 更新 vconsole tsconfig.json 支持测试**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 7: 运行测试**

```bash
pnpm vitest run src/core/device.test.ts
```

Expected: PASS

- [ ] **Step 8: 提交**

```bash
git add packages/sdk/
git commit -m "feat(vconsole): add device ID generation logic"
```

---

#### Task 1.2: WebSocket Transport 模块

**Files:**
- Create: `packages/sdk/src/transport/websocket.ts`
- Create: `packages/sdk/src/transport/reporter.ts`

- [ ] **Step 1: 创建 WebSocket 连接管理**

```typescript
// packages/sdk/src/transport/websocket.ts
import type { RemoteConfig } from '../types/index.js';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface TransportEvents {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export class WebSocketTransport {
  private ws: WebSocket | null = null;
  private serverUrl: string;
  private state: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private readonly reconnectDelay = 3000;
  private events: TransportEvents;
  private messageQueue: string[] = [];
  private readonly maxQueueSize = 100;

  constructor(config: RemoteConfig, events: TransportEvents = {}) {
    this.serverUrl = config.server || this.getDefaultServerUrl();
    this.events = events;
  }

  private getDefaultServerUrl(): string {
    const host = window.location.hostname;
    return `ws://${host}:3000`;
  }

  connect(): void {
    if (this.state === 'connecting' || this.state === 'connected') {
      return;
    }

    this.state = 'connecting';
    this.reconnectAttempts++;

    try {
      this.ws = new WebSocket(this.serverUrl);

      this.ws.onopen = () => {
        this.state = 'connected';
        this.reconnectAttempts = 0;
        this.events.onConnect?.();

        // 发送队列中的消息
        while (this.messageQueue.length > 0) {
          const msg = this.messageQueue.shift();
          if (msg) this.send(msg);
        }
      };

      this.ws.onclose = () => {
        this.state = 'disconnected';
        this.events.onDisconnect?.();

        // 自动重连
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => this.connect(), this.reconnectDelay);
        }
      };

      this.ws.onerror = (event) => {
        this.state = 'error';
        this.events.onError?.(new Error('WebSocket connection failed'));
      };
    } catch (error) {
      this.state = 'error';
      this.events.onError?.(error as Error);
    }
  }

  send(data: string): void {
    if (this.state === 'connected' && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    } else {
      // 缓存消息到队列
      if (this.messageQueue.length < this.maxQueueSize) {
        this.messageQueue.push(data);
      }
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.state = 'disconnected';
  }

  getState(): ConnectionState {
    return this.state;
  }

  getServerUrl(): string {
    return this.serverUrl;
  }
}
```

- [ ] **Step 2: 创建数据上报器**

```typescript
// packages/sdk/src/transport/reporter.ts
import type { DeviceInfo, ConsoleLogEntry } from '../types/index.js';
import { WebSocketTransport } from './websocket.js';
import type { ConnectionState } from './websocket.js';

export class Reporter {
  private transport: WebSocketTransport | null = null;
  private deviceInfo: DeviceInfo;
  private tabId: string;
  private remoteEnabled = true;
  private rateLimiter: {
    count: number;
    resetTime: number;
  } = {
    count: 0,
    resetTime: 0
  };
  private readonly maxRatePerSecond = 100;

  constructor(deviceInfo: DeviceInfo, tabId: string) {
    this.deviceInfo = deviceInfo;
    this.tabId = tabId;
  }

  connect(serverUrl?: string): void {
    if (!this.remoteEnabled) return;

    this.transport = new WebSocketTransport(
      {
        projectId: this.deviceInfo.projectId,
        server: serverUrl
      },
      {
        onConnect: () => {
          this.sendRegisterMessage();
        }
      }
    );

    this.transport.connect();
  }

  disconnect(): void {
    this.transport?.disconnect();
  }

  enableRemote(): void {
    this.remoteEnabled = true;
    localStorage.setItem(`aiconsole_remote_${this.deviceInfo.projectId}`, 'true');
    if (!this.transport || this.transport.getState() === 'disconnected') {
      this.connect();
    }
  }

  disableRemote(): void {
    this.remoteEnabled = false;
    localStorage.setItem(`aiconsole_remote_${this.deviceInfo.projectId}`, 'false');
    this.transport?.disconnect();
  }

  isRemoteEnabled(): boolean {
    return this.remoteEnabled;
  }

  reportConsole(entry: Omit<ConsoleLogEntry, 'deviceId' | 'tabId'>): void {
    if (!this.remoteEnabled || !this.transport) return;

    if (!this.checkRateLimit()) {
      // 超出限流，批量合并
      return;
    }

    const logEntry: ConsoleLogEntry = {
      ...entry,
      deviceId: this.deviceInfo.deviceId,
      tabId: this.tabId
    };

    this.send({
      type: 'console',
      ...logEntry
    });
  }

  updateDeviceInfo(): void {
    this.deviceInfo.lastActiveTime = Date.now();
    this.send({
      type: 'heartbeat',
      deviceId: this.deviceInfo.deviceId,
      timestamp: Date.now()
    });
  }

  private sendRegisterMessage(): void {
    this.send({
      type: 'register',
      projectId: this.deviceInfo.projectId,
      deviceId: this.deviceInfo.deviceId,  // 重要：发送 deviceId 给服务器
      deviceInfo: {
        ua: this.deviceInfo.ua,
        screen: this.deviceInfo.screen,
        pixelRatio: this.deviceInfo.pixelRatio,
        language: this.deviceInfo.language
      }
    });
  }

  private send(data: any): void {
    this.transport?.send(JSON.stringify(data));
  }

  private checkRateLimit(): boolean {
    const now = Date.now();
    if (now > this.rateLimiter.resetTime + 1000) {
      this.rateLimiter.count = 0;
      this.rateLimiter.resetTime = now;
    }

    if (this.rateLimiter.count >= this.maxRatePerSecond) {
      return false;
    }

    this.rateLimiter.count++;
    return true;
  }
}
```

- [ ] **Step 3: 创建导出**

```typescript
// packages/sdk/src/transport/index.ts
export { WebSocketTransport } from './websocket.js';
export type { ConnectionState, TransportEvents } from './websocket.js';
export { Reporter } from './reporter.js';
```

- [ ] **Step 4: 提交**

```bash
git add packages/sdk/src/transport/
git commit -m "feat(vconsole): add WebSocket transport and reporter"
```

---

#### Task 1.3: SDK 入口与初始化

**Files:**
- Create: `packages/sdk/src/index.ts`

- [ ] **Step 1: 创建 SDK 入口文件**

```typescript
// packages/sdk/src/index.ts
import { getDeviceInfo, generateTabId, updateDeviceActiveTime } from './core/device.js';
import { Reporter } from './transport/reporter.js';
import type { RemoteConfig } from './types/index.js';

export interface AIConsoleOptions extends RemoteConfig {
  defaultPlugins?: string[];
}

export class AIConsole {
  private reporter: Reporter;
  private deviceInfo: ReturnType<typeof getDeviceInfo>;
  private tabId: string;
  private projectId: string;

  constructor(options: AIConsoleOptions) {
    if (!options.projectId) {
      throw new Error('projectId is required');
    }

    this.projectId = options.projectId;
    this.deviceInfo = getDeviceInfo(options.projectId);
    this.tabId = generateTabId();

    this.reporter = new Reporter(this.deviceInfo, this.tabId);

    // 检查用户是否之前关闭了远程监控
    const remoteDisabled = localStorage.getItem(`aiconsole_remote_${this.projectId}`) === 'false';
    if (!remoteDisabled) {
      this.reporter.connect(options.server);
    }

    // 拦截 console
    this.interceptConsole();

    // 定期更新活跃时间
    setInterval(() => {
      updateDeviceActiveTime(this.projectId);
      this.reporter.updateDeviceInfo();
    }, 30000);
  }

  private interceptConsole(): void {
    const original = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info
    };

    const self = this;

    console.log = function (...args: any[]) {
      original.log.apply(console, args);
      self.reporter.reportConsole({
        timestamp: Date.now(),
        level: 'log',
        message: args.map(a => String(a)).join(' ')
      });
    };

    console.warn = function (...args: any[]) {
      original.warn.apply(console, args);
      self.reporter.reportConsole({
        timestamp: Date.now(),
        level: 'warn',
        message: args.map(a => String(a)).join(' ')
      });
    };

    console.error = function (...args: any[]) {
      original.error.apply(console, args);
      const message = args.map(a => String(a)).join(' ');
      self.reporter.reportConsole({
        timestamp: Date.now(),
        level: 'error',
        message,
        stack: new Error().stack
      });
    };

    console.info = function (...args: any[]) {
      original.info.apply(console, args);
      self.reporter.reportConsole({
        timestamp: Date.now(),
        level: 'info',
        message: args.map(a => String(a)).join(' ')
      });
    };
  }

  enableRemote(): void {
    this.reporter.enableRemote();
  }

  disableRemote(): void {
    this.reporter.disableRemote();
  }

  isRemoteEnabled(): boolean {
    return this.reporter.isRemoteEnabled();
  }

  destroy(): void {
    this.reporter.disconnect();
  }
}

// 默认导出
export default AIConsole;
```

- [ ] **Step 2: 更新 package.json 添加类型导出**

```json
{
  "name": "aiconsole",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "dev": "vite build --watch",
    "build": "vite build",
    "test": "vitest"
  },
  "dependencies": {},
  "devDependencies": {
    "vite": "^5.0.0",
    "vite-plugin-dts": "^3.7.0",
    "vitest": "^1.0.0"
  }
}
```

- [ ] **Step 3: 构建测试**

```bash
cd packages/sdk
pnpm build
```

Expected: 生成 dist 目录

- [ ] **Step 4: 提交**

```bash
git add packages/sdk/
git commit -m "feat(vconsole): add SDK entry point and initialization"
```

---

### 阶段 2: 服务器实现

#### Task 2.1: 存储层

**Files:**
- Create: `packages/server/src/store/devices.ts`
- Create: `packages/server/src/store/logs.ts`
- Create: `packages/server/src/store/index.ts`

- [ ] **Step 1: 创建设备存储**

```typescript
// packages/server/src/store/devices.ts
export interface Device {
  deviceId: string;
  projectId: string;
  ua: string;
  screen: string;
  pixelRatio: number;
  language: string;
  connectTime: number;
  lastActiveTime: number;
  activeTabs: number;
  online: boolean;
}

export class DeviceStore {
  private devices: Map<string, Device> = new Map();

  register(deviceId: string, info: Omit<Device, 'deviceId' | 'online' | 'activeTabs'>): void {
    const existing = this.devices.get(deviceId);
    this.devices.set(deviceId, {
      ...info,
      deviceId,
      online: true,
      activeTabs: existing ? existing.activeTabs + 1 : 1
    });
  }

  unregister(deviceId: string): void {
    const device = this.devices.get(deviceId);
    if (device) {
      device.activeTabs--;
      if (device.activeTabs <= 0) {
        device.online = false;
        device.lastActiveTime = Date.now();
      }
    }
  }

  get(deviceId: string): Device | undefined {
    return this.devices.get(deviceId);
  }

  list(projectId?: string): Device[] {
    const all = Array.from(this.devices.values());
    if (projectId) {
      return all.filter(d => d.projectId === projectId);
    }
    return all;
  }

  updateActiveTime(deviceId: string): void {
    const device = this.devices.get(deviceId);
    if (device) {
      device.lastActiveTime = Date.now();
      device.online = true;
    }
  }

  // 清理 30 分钟未活跃的设备
  cleanup(): void {
    const threshold = Date.now() - 30 * 60 * 1000;
    for (const [id, device] of this.devices) {
      if (!device.online && device.lastActiveTime < threshold) {
        this.devices.delete(id);
      }
    }
  }
}
```

- [ ] **Step 2: 创建日志存储**

```typescript
// packages/server/src/store/logs.ts
export interface ConsoleLog {
  deviceId: string;
  tabId: string;
  timestamp: number;
  level: 'log' | 'warn' | 'error' | 'info';
  message: string;
  stack?: string;
}

export class LogStore {
  private logs: Map<string, ConsoleLog[]> = new Map();
  private readonly maxLogsPerDevice = 1000;

  push(deviceId: string, log: ConsoleLog): void {
    let logs = this.logs.get(deviceId);
    if (!logs) {
      logs = [];
      this.logs.set(deviceId, logs);
    }

    logs.push(log);

    // 超出限制，删除最旧的
    if (logs.length > this.maxLogsPerDevice) {
      logs.shift();
    }
  }

  get(deviceId: string, limit?: number, level?: string): ConsoleLog[] {
    let logs = this.logs.get(deviceId) || [];

    if (level) {
      logs = logs.filter(l => l.level === level);
    }

    if (limit) {
      logs = logs.slice(-limit);
    }

    return logs;
  }

  clear(deviceId: string): void {
    this.logs.delete(deviceId);
  }

  cleanup(deviceId: string): void {
    // 当设备断开 30 分钟后清理
    setTimeout(() => {
      this.logs.delete(deviceId);
    }, 30 * 60 * 1000);
  }
}
```

- [ ] **Step 3: 创建导出**

```typescript
// packages/server/src/store/index.ts
export { DeviceStore, type Device } from './devices.js';
export { LogStore, type ConsoleLog } from './logs.js';
```

- [ ] **Step 4: 提交**

```bash
git add packages/server/src/store/
git commit -m "feat(server): add device and log storage"
```

---

#### Task 2.2: WebSocket 服务器

**Files:**
- Create: `packages/server/src/ws/handlers.ts`
- Create: `packages/server/src/ws/server.ts`

- [ ] **Step 1: 创建消息处理器**

```typescript
// packages/server/src/ws/handlers.ts
import { WebSocket } from 'ws';
import { DeviceStore, LogStore } from '../store/index.js';

export interface MessageContext {
  ws: WebSocket;
  deviceStore: DeviceStore;
  logStore: LogStore;
  deviceIds: Map<WebSocket, string>;
}

export type MessageHandler = (data: any, context: MessageContext) => void | Promise<void>;

export const handlers: Record<string, MessageHandler> = {
  register: (data, context) => {
    const { ws, deviceStore, deviceIds } = context;
    const { projectId, deviceId, deviceInfo } = data;

    // 重要：从消息中获取 deviceId，而不是自己生成
    // SDK 端已经基于 URL + UA + projectId 生成了固定的 deviceId
    if (!deviceId) {
      console.error('Missing deviceId in register message');
      return;
    }

    deviceStore.register(deviceId, {
      projectId,
      ua: deviceInfo.ua,
      screen: deviceInfo.screen,
      pixelRatio: deviceInfo.pixelRatio,
      language: deviceInfo.language,
      connectTime: Date.now(),
      lastActiveTime: Date.now()
    });

    deviceIds.set(ws, deviceId);

    // 广播设备列表更新
    broadcastDeviceList(context);
  },

  console: (data, context) => {
    const { logStore } = context;
    logStore.push(data.deviceId, data);
    broadcastLog(data, context);
  },

  heartbeat: (data, context) => {
    const { deviceStore, deviceIds } = context;
    const deviceId = deviceIds.get(context.ws);
    if (deviceId) {
      deviceStore.updateActiveTime(deviceId);
    }
  }
};

// PC 客户端 WebSocket 连接管理
const pcClients = new Set<WebSocket>();

function broadcastDeviceList(context: MessageContext): void {
  const devices = context.deviceStore.list();
  const message = JSON.stringify({ type: 'devices', data: devices });

  for (const client of pcClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

function broadcastLog(log: any, context: MessageContext): void {
  const message = JSON.stringify({ type: 'log', data: log });

  for (const client of pcClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

// 导出 PC 客户端管理函数
export function registerPCClient(ws: WebSocket): void {
  pcClients.add(ws);
  ws.on('close', () => pcClients.delete(ws));
}
```

- [ ] **Step 2: 创建 WebSocket 服务器**

```typescript
// packages/server/src/ws/server.ts
import { WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer } from 'http';
import { DeviceStore, LogStore } from '../store/index.js';
import { handlers, type MessageContext, registerPCClient } from './handlers.js';

export function createWebSocketServer(httpServer: HTTPServer) {
  const deviceStore = new DeviceStore();
  const logStore = new LogStore();
  const deviceIds = new Map<WebSocket, string>();

  // 将 WebSocket 服务器挂载到 HTTP 服务器上
  const wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws: WebSocket) => {
    // 判断是设备连接还是 PC 查看器连接
    // PC 查看器连接后会发送 { type: 'viewer' } 消息
    let isViewer = false;

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());

        // PC 查看器注册
        if (message.type === 'viewer') {
          isViewer = true;
          registerPCClient(ws);
          return;
        }

        // 设备消息处理
        if (!isViewer) {
          const handler = handlers[message.type];

          if (handler) {
            const context: MessageContext = {
              ws,
              deviceStore,
              logStore,
              deviceIds
            };
            handler(message, context);
          }
        }
      } catch (error) {
        console.error('Failed to handle message:', error);
      }
    });

    ws.on('close', () => {
      if (!isViewer) {
        const deviceId = deviceIds.get(ws);
        if (deviceId) {
          deviceStore.unregister(deviceId);
          deviceIds.delete(ws);
        }
      }
    });
  });
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        const handler = handlers[message.type];

        if (handler) {
          const context: MessageContext = {
            ws,
            deviceStore,
            logStore,
            deviceIds
          };
          handler(message, context);
        }
      } catch (error) {
        console.error('Failed to handle message:', error);
      }
    });

    ws.on('close', () => {
      const deviceId = deviceIds.get(ws);
      if (deviceId) {
        deviceStore.unregister(deviceId);
        deviceIds.delete(ws);
      }
    });
  });

  // 定期清理
  setInterval(() => {
    deviceStore.cleanup();
  }, 5 * 60 * 1000);

  return { wss, deviceStore, logStore };
}
```

- [ ] **Step 3: 提交**

```bash
git add packages/server/src/ws/
git commit -m "feat(server): add WebSocket server"
```

---

#### Task 2.3: HTTP API

**Files:**
- Create: `packages/server/src/api/devices.ts`
- Create: `packages/server/src/api/routes.ts`

- [ ] **Step 1: 创建设备 API**

```typescript
// packages/server/src/api/devices.ts
import { Request, Response } from 'express';
import { DeviceStore, LogStore } from '../store/index.js';

export function createDeviceRoutes(deviceStore: DeviceStore, logStore: LogStore) {
  return {
    // 获取设备列表
    listDevices: (req: Request, res: Response) => {
      const projectId = req.query.projectId as string;
      const devices = deviceStore.list(projectId);
      res.json(devices);
    },

    // 获取设备日志
    getLogs: (req: Request, res: Response) => {
      const { deviceId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const level = req.query.level as string;

      const logs = logStore.get(deviceId, limit, level);
      res.json(logs);
    },

    // 获取设备详情
    getDevice: (req: Request, res: Response) => {
      const { deviceId } = req.params;
      const device = deviceStore.get(deviceId);

      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }

      res.json(device);
    }
  };
}
```

- [ ] **Step 2: 创建路由注册**

```typescript
// packages/server/src/api/routes.ts
import { Router } from 'express';
import { createDeviceRoutes } from './devices.js';

export function createRoutes(deviceStore: DeviceStore, logStore: LogStore): Router {
  const router = Router();
  const deviceRoutes = createDeviceRoutes(deviceStore, logStore);

  router.get('/api/devices', deviceRoutes.listDevices);
  router.get('/api/devices/:deviceId', deviceRoutes.getDevice);
  router.get('/api/devices/:deviceId/logs', deviceRoutes.getLogs);

  return router;
}
```

- [ ] **Step 3: 提交**

```bash
git add packages/server/src/api/
git commit -m "feat(server): add HTTP API routes"
```

---

#### Task 2.4: CLI 入口

**Files:**
- Create: `packages/server/src/cli/index.ts`
- Create: `packages/server/src/index.ts`
- Create: `packages/server/bin/aiconsole`

- [ ] **Step 1: 创建 CLI**

```typescript
// packages/server/src/cli/index.ts
import { createWebSocketServer } from '../ws/server.js';
import { createRoutes } from '../api/routes.js';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { networkInterfaces } from 'os';

export interface CLIOptions {
  port?: number;
}

export async function start(options: CLIOptions = {}) {
  const port = options.port || 3000;

  // 创建 HTTP 服务器
  const app = express();
  const server = http.createServer(app);

  // 添加 CORS 支持
  app.use(cors());

  // 创建 WebSocket 服务器（挂载到 HTTP 服务器）
  const { deviceStore, logStore } = createWebSocketServer(server);

  // 注册路由
  app.use(createRoutes(deviceStore, logStore));

  // 静态文件服务（PC 页面）
  app.use(express.static('public'));

  server.listen(port, '0.0.0.0', () => {
    const networkInterface = Object.values(networkInterfaces())
      .flat()
      .find(iface => iface?.family === 'IPv4' && !iface.internal);

    const localUrl = `http://localhost:${port}`;
    const networkUrl = networkInterface
      ? `http://${networkInterface.address}:${port}`
      : localUrl;

    console.log(`
AIConsole server running!

  Local:    ${localUrl}
  Network:  ${networkUrl}

  Open ${localUrl} in browser to view devices
    `);
  });

  return server;
}
```

- [ ] **Step 2: 创建服务器入口**

```typescript
// packages/server/src/index.ts
export { start } from './cli/index.js';
export * from './store/index.js';
export * from './ws/server.js';
```

- [ ] **Step 3: 创建可执行文件**

```bash
#!/usr/bin/env node
import { start } from '../dist/cli/index.js';
import { parseArgs } from 'util';

const args = parseArgs({
  options: {
    port: {
      type: 'string',
      short: 'p'
    }
  }
});

await start({
  port: args.values.port ? parseInt(args.values.port) : undefined
});
```

- [ ] **Step 4: 添加可执行权限**

```bash
chmod +x packages/server/bin/aiconsole
```

- [ ] **Step 5: 更新 package.json**

```json
{
  "name": "@aiconsole/server",
  "bin": {
    "aiconsole": "./bin/aiconsole"
  },
  "dependencies": {
    "ws": "^8.16.0",
    "express": "^4.18.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/ws": "^8.5.0",
    "@types/express": "^4.17.0",
    "@types/cors": "^2.8.17",
    "tsx": "^4.7.0"
  }
}
```

- [ ] **Step 6: 提交**

```bash
git add packages/server/
git commit -m "feat(server): add CLI entry point"
```

---

### 阶段 3: MCP Server

#### Task 3.1: MCP 工具实现

**Files:**
- Create: `packages/mcp/src/tools/list_devices.ts`
- Create: `packages/mcp/src/tools/get_console_logs.ts`
- Create: `packages/mcp/src/tools/index.ts`

- [ ] **Step 1: 创建 list_devices 工具**

```typescript
// packages/mcp/src/tools/list_devices.ts
import type { Device } from '@aiconsole/server';

export const listDevices = {
  name: 'list_devices',
  description: '列出所有当前连接的设备',
  inputSchema: {
    type: 'object' as const,
    properties: {
      projectId: {
        type: 'string' as const,
        description: '项目 ID，用于过滤设备'
      }
    }
  },

  async execute(args: { projectId?: string }): Promise<Device[]> {
    try {
      // 调用 HTTP API
      const url = args.projectId
        ? `http://localhost:3000/api/devices?projectId=${args.projectId}`
        : `http://localhost:3000/api/devices`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch devices:', error);
      return [];  // 返回空数组而不是抛出异常
    }
  }
};
```

- [ ] **Step 2: 创建 get_console_logs 工具**

```typescript
// packages/mcp/src/tools/get_console_logs.ts
import type { ConsoleLog } from '@aiconsole/server';

export const getConsoleLogs = {
  name: 'get_console_logs',
  description: '获取指定设备的控制台日志',
  inputSchema: {
    type: 'object' as const,
    properties: {
      deviceId: {
        type: 'string' as const,
        description: '设备 ID'
      },
      limit: {
        type: 'number' as const,
        description: '返回的日志条数限制'
      },
      level: {
        type: 'string' as const,
        enum: ['log', 'warn', 'error', 'info'],
        description: '日志级别过滤'
      }
    },
    required: ['deviceId'] as const
  },

  async execute(args: { deviceId: string; limit?: number; level?: string }): Promise<ConsoleLog[]> {
    try {
      const params = new URLSearchParams();
      if (args.limit) params.append('limit', args.limit.toString());
      if (args.level) params.append('level', args.level);

      const url = `http://localhost:3000/api/devices/${args.deviceId}/logs?${params}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      return [];  // 返回空数组而不是抛出异常
    }
  }
};
```

- [ ] **Step 3: 创建工具注册**

```typescript
// packages/mcp/src/tools/index.ts
export { listDevices } from './list_devices.js';
export { getConsoleLogs } from './get_console_logs.js';
```

- [ ] **Step 4: 提交**

```bash
git add packages/mcp/src/tools/
git commit -m "feat(mcp): add list_devices and get_console_logs tools"
```

---

#### Task 3.2: MCP Server 入口

**Files:**
- Create: `packages/mcp/src/server.ts`
- Create: `packages/mcp/src/index.ts`
- Create: `packages/mcp/bin/aiconsole-mcp`

- [ ] **Step 1: 创建 MCP 服务器**

```typescript
// packages/mcp/src/server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { listDevices, getConsoleLogs } from './tools/index.js';

export async function startMCPServer() {
  const server = new Server(
    {
      name: 'aiconsole-mcp',
      version: '0.1.0'
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  // 注册工具列表处理器
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: listDevices.name,
          description: listDevices.description,
          inputSchema: listDevices.inputSchema
        },
        {
          name: getConsoleLogs.name,
          description: getConsoleLogs.description,
          inputSchema: getConsoleLogs.inputSchema
        }
      ]
    };
  });

  // 注册工具调用处理器
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'list_devices':
        return { content: [{ type: 'text', text: JSON.stringify(await listDevices.execute(args), null, 2) }] };

      case 'get_console_logs':
        return { content: [{ type: 'text', text: JSON.stringify(await getConsoleLogs.execute(args), null, 2) }] };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('AIConsole MCP Server running on stdio');
}
```

- [ ] **Step 2: 创建入口文件**

```typescript
// packages/mcp/src/index.ts
export { startMCPServer } from './server.js';
```

- [ ] **Step 3: 创建可执行文件**

```bash
#!/usr/bin/env node
import { startMCPServer } from '../dist/server.js';
await startMCPServer();
```

- [ ] **Step 4: 添加可执行权限**

```bash
chmod +x packages/mcp/bin/aiconsole-mcp
```

- [ ] **Step 5: 更新 package.json**

```json
{
  "name": "@aiconsole/mcp",
  "bin": {
    "aiconsole-mcp": "./bin/aiconsole-mcp"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0"
  }
}
```

- [ ] **Step 6: 提交**

```bash
git add packages/mcp/
git commit -m "feat(mcp): add MCP server implementation"
```

---

### 阶段 4: PC Web 页面

#### Task 4.0: WebSocket 客户端

**Files:**
- Create: `packages/web/src/hooks/useWebSocket.ts`

- [ ] **Step 1: 创建 WebSocket hook**

```typescript
// packages/web/src/hooks/useWebSocket.ts
import { useEffect, useRef, useCallback } from 'react';

export interface WebSocketMessage {
  type: 'devices' | 'log' | 'heartbeat';
  data: any;
}

export function useWebSocket(onMessage: (message: WebSocketMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const ws = new WebSocket('ws://localhost:3000');
    wsRef.current = ws;

    ws.onopen = () => {
      // 注册为 PC 查看器
      ws.send(JSON.stringify({ type: 'viewer' }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        onMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      // 3 秒后重连
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }, [onMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return { connect, disconnect };
}
```

- [ ] **Step 2: 提交**

```bash
git add packages/web/src/hooks/
git commit -m "feat(web): add WebSocket client hook"
```

---

#### Task 4.1: API 客户端

**Files:**
- Create: `packages/web/src/api/client.ts`
- Create: `packages/web/src/types/index.ts`

- [ ] **Step 1: 创建类型定义**

```typescript
// packages/web/src/types/index.ts
export interface Device {
  deviceId: string;
  projectId: string;
  ua: string;
  screen: string;
  pixelRatio: number;
  language: string;
  connectTime: number;
  lastActiveTime: number;
  activeTabs: number;
  online: boolean;
}

export interface ConsoleLog {
  deviceId: string;
  tabId: string;
  timestamp: number;
  level: 'log' | 'warn' | 'error' | 'info';
  message: string;
  stack?: string;
}
```

- [ ] **Step 2: 创建 API 客户端**

```typescript
// packages/web/src/api/client.ts
import type { Device, ConsoleLog } from '../types/index.js';

const API_BASE = 'http://localhost:3000/api';

export const api = {
  // 获取设备列表
  async listDevices(projectId?: string): Promise<Device[]> {
    const url = projectId ? `${API_BASE}/devices?projectId=${projectId}` : `${API_BASE}/devices`;
    const res = await fetch(url);
    return res.json();
  },

  // 获取设备日志
  async getLogs(deviceId: string, limit?: number, level?: string): Promise<ConsoleLog[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (level) params.append('level', level);

    const res = await fetch(`${API_BASE}/devices/${deviceId}/logs?${params}`);
    return res.json();
  },

  // 获取设备详情
  async getDevice(deviceId: string): Promise<Device> {
    const res = await fetch(`${API_BASE}/devices/${deviceId}`);
    return res.json();
  }
};
```

- [ ] **Step 3: 提交**

```bash
git add packages/web/src/
git commit -m "feat(web): add API client and types"
```

---

#### Task 4.2: 设备列表组件

**Files:**
- Create: `packages/web/src/components/DeviceList.tsx`
- Create: `packages/web/src/hooks/useDevices.ts`

- [ ] **Step 1: 创建 useDevices hook**

```typescript
// packages/web/src/hooks/useDevices.ts
import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client.js';
import { useWebSocket } from './useWebSocket.js';
import type { Device } from '../types/index.js';

export function useDevices(projectId?: string) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // WebSocket 实时更新处理
  const handleWebSocketMessage = useCallback((message: any) => {
    if (message.type === 'devices') {
      setDevices(message.data);
      setLoading(false);
    }
  }, []);

  useWebSocket(handleWebSocketMessage);

  // 初始加载
  useEffect(() => {
    const fetchInitialDevices = async () => {
      const data = await api.listDevices(projectId);
      setDevices(data);
      setLoading(false);
    };

    fetchInitialDevices();
  }, [projectId]);

  const selectedDevice = devices.find(d => d.deviceId === selectedId);

  return {
    devices,
    loading,
    selectedDevice,
    selectedId,
    setSelectedId
  };
}
```

- [ ] **Step 2: 创建 DeviceList 组件**

```typescript
// packages/web/src/components/DeviceList.tsx
import type { Device } from '../types/index.js';

interface DeviceListProps {
  devices: Device[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function DeviceList({ devices, selectedId, onSelect }: DeviceListProps) {
  return (
    <div className="device-list">
      <h3>设备列表 ({devices.length})</h3>
      <ul>
        {devices.map(device => (
          <li
            key={device.deviceId}
            className={selectedId === device.deviceId ? 'selected' : ''}
            onClick={() => onSelect(device.deviceId)}
          >
            <div className="status">
              <span className={`indicator ${device.online ? 'online' : 'offline'}`} />
            </div>
            <div className="info">
              <div className="ua">{device.ua.slice(0, 50)}...</div>
              <div className="meta">
                {device.screen} | {new Date(device.lastActiveTime).toLocaleTimeString()}
              </div>
            </div>
          </li>
        ))}
      </ul>
      <style>{`
        .device-list {
          width: 280px;
          border-right: 1px solid #e5e5e5;
          padding: 16px;
        }
        .device-list h3 {
          margin: 0 0 16px;
          font-size: 14px;
          color: #666;
        }
        .device-list ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .device-list li {
          display: flex;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .device-list li:hover {
          background: #f5f5f5;
        }
        .device-list li.selected {
          background: #e3f2ff;
        }
        .indicator {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .indicator.online {
          background: #22c55e;
        }
        .indicator.offline {
          background: #9ca3af;
        }
        .ua {
          font-size: 13px;
          font-weight: 500;
        }
        .meta {
          font-size: 11px;
          color: #666;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 3: 提交**

```bash
git add packages/web/src/
git commit -m "feat(web): add DeviceList component"
```

---

#### Task 4.3: 日志面板组件

**Files:**
- Create: `packages/web/src/components/LogPanel.tsx`
- Create: `packages/web/src/components/LogEntry.tsx`
- Create: `packages/web/src/hooks/useLogs.ts`

- [ ] **Step 1: 创建 useLogs hook**

```typescript
// packages/web/src/hooks/useLogs.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client.js';
import { useWebSocket } from './useWebSocket.js';
import type { ConsoleLog } from '../types/index.js';

export function useLogs(deviceId: string | null, limit = 100) {
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const [loading, setLoading] = useState(false);
  const logsRef = useRef<ConsoleLog[]>([]);

  // WebSocket 实时更新处理
  const handleWebSocketMessage = useCallback((message: any) => {
    if (message.type === 'log' && message.data.deviceId === deviceId) {
      logsRef.current.push(message.data);
      // 限制日志数量
      if (logsRef.current.length > limit) {
        logsRef.current.shift();
      }
      setLogs([...logsRef.current]);
    }
  }, [deviceId, limit]);

  useWebSocket(handleWebSocketMessage);

  // 初始加载和切换设备时加载
  useEffect(() => {
    if (!deviceId) {
      setLogs([]);
      logsRef.current = [];
      return;
    }

    const fetchInitialLogs = async () => {
      setLoading(true);
      const data = await api.getLogs(deviceId, limit);
      logsRef.current = data;
      setLogs(data);
      setLoading(false);
    };

    fetchInitialLogs();
  }, [deviceId, limit]);

  return { logs, loading };
}
```

- [ ] **Step 2: 创建 LogEntry 组件**

```typescript
// packages/web/src/components/LogEntry.tsx
import type { ConsoleLog } from '../types/index.js';

interface LogEntryProps {
  log: ConsoleLog;
}

export function LogEntry({ log }: LogEntryProps) {
  const levelColors = {
    log: '#333',
    warn: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6'
  };

  return (
    <div className={`log-entry log-${log.level}`}>
      <span className="log-time">
        {new Date(log.timestamp).toLocaleTimeString()}
      </span>
      <span className="log-level">{log.level.toUpperCase()}</span>
      <span className="log-message">{log.message}</span>
      {log.stack && (
        <pre className="log-stack">{log.stack}</pre>
      )}
      <style>{`
        .log-entry {
          display: flex;
          gap: 8px;
          padding: 8px 12px;
          border-bottom: 1px solid #f0f0f0;
          font-family: 'SF Mono', Monaco, monospace;
          font-size: 12px;
        }
        .log-entry:hover {
          background: #f9f9f9;
        }
        .log-time {
          color: #9ca3af;
          flex-shrink: 0;
        }
        .log-level {
          font-weight: bold;
          color: ${levelColors[log.level]};
          flex-shrink: 0;
        }
        .log-message {
          flex: 1;
          word-break: break-all;
        }
        .log-stack {
          margin: 4px 0 0 0;
          padding: 8px;
          background: #f5f5f5;
          border-radius: 4px;
          font-size: 11px;
          color: #666;
        }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 3: 创建 LogPanel 组件**

```typescript
// packages/web/src/components/LogPanel.tsx
import { useLogs } from '../hooks/useLogs.js';
import { LogEntry } from './LogEntry.js';

interface LogPanelProps {
  deviceId: string | null;
}

export function LogPanel({ deviceId }: LogPanelProps) {
  const { logs, loading } = useLogs(deviceId);

  if (!deviceId) {
    return (
      <div className="log-panel empty">
        <p>请选择一个设备查看日志</p>
        <style>{`
          .log-panel.empty {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: #9ca3af;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="log-panel">
      <div className="log-header">
        <h3>Console 日志 ({logs.length})</h3>
        {loading && <span className="loading">加载中...</span>}
      </div>
      <div className="log-list">
        {logs.map((log, index) => (
          <LogEntry key={`${log.tabId}-${index}`} log={log} />
        ))}
      </div>
      <style>{`
        .log-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .log-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid #e5e5e5;
        }
        .log-header h3 {
          margin: 0;
          font-size: 14px;
        }
        .loading {
          font-size: 12px;
          color: #9ca3af;
        }
        .log-list {
          flex: 1;
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 4: 提交**

```bash
git add packages/web/src/
git commit -m "feat(web): add LogPanel component"
```

---

#### Task 4.4: 应用主组件

**Files:**
- Modify: `packages/web/src/App.tsx`
- Create: `packages/web/src/styles/global.css`

- [ ] **Step 1: 创建全局样式**

```css
/* packages/web/src/styles/global.css */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  color: #333;
}

#root {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.app {
  display: flex;
  width: 100%;
  height: 100%;
}

.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 50px;
  background: #fff;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  align-items: center;
  padding: 0 16px;
  z-index: 10;
}

.app-header h1 {
  font-size: 16px;
  font-weight: 600;
}

.app-content {
  display: flex;
  margin-top: 50px;
  width: 100%;
  height: calc(100vh - 50px);
}
```

- [ ] **Step 2: 更新 App.tsx**

```typescript
// packages/web/src/App.tsx
import { DeviceList } from './components/DeviceList.js';
import { LogPanel } from './components/LogPanel.js';
import { useDevices } from './hooks/useDevices.js';
import './styles/global.css';

export default function App() {
  const { devices, loading, selectedId, setSelectedId } = useDevices();

  return (
    <div className="app">
      <header className="app-header">
        <h1>AIConsole</h1>
      </header>
      <main className="app-content">
        <DeviceList
          devices={devices}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        <LogPanel deviceId={selectedId} />
      </main>
    </div>
  );
}
```

- [ ] **Step 3: 更新 main.tsx 引入样式**

```typescript
// packages/web/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 4: 提交**

```bash
git add packages/web/src/
git commit -m "feat(web): add main app layout"
```

---

### 阶段 5: 测试与文档

#### Task 5.1: 端到端测试

**Files:**
- Create: `packages/sdk/test/e2e/basic.test.ts`

- [ ] **Step 1: 创建 E2E 测试**

```typescript
// packages/sdk/test/e2e/basic.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { start } from '@aiconsole/server';
import AIConsole from 'aiconsole';

describe('AIConsole E2E', () => {
  let server: any;

  beforeAll(async () => {
    server = await start({ port: 3001 });
  });

  afterAll(async () => {
    server?.close();
  });

  it('should connect to server and register device', async () => {
    const vconsole = new AIConsole({
      projectId: 'test-app',
      server: 'ws://localhost:3001'
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    const response = await fetch('http://localhost:3001/api/devices');
    const devices = await response.json();

    expect(devices).toHaveLength(1);
    expect(devices[0].projectId).toBe('test-app');

    vconsole.destroy();
  });

  it('should send console logs to server', async () => {
    const vconsole = new AIConsole({
      projectId: 'test-app',
      server: 'ws://localhost:3001'
    });

    console.log('test message');

    await new Promise(resolve => setTimeout(resolve, 500));

    const response = await fetch('http://localhost:3001/api/devices');
    const devices = await response.json();
    const deviceId = devices[0].deviceId;

    const logsResponse = await fetch(`http://localhost:3001/api/devices/${deviceId}/logs`);
    const logs = await logsResponse.json();

    expect(logs.some((log: any) => log.message === 'test message')).toBe(true);

    vconsole.destroy();
  });
});
```

- [ ] **Step 2: 提交**

```bash
git add packages/sdk/test/
git commit -m "test(vconsole): add E2E tests"
```

---

#### Task 5.2: 使用文档

**Files:**
- Create: `packages/sdk/README.md`
- Create: `README.md` (根目录)

- [ ] **Step 1: 创建 SDK README**

```markdown
# AIConsole SDK

让 AI 实时查看移动端调试信息的工具。

## 安装

\`\`\`bash
npm install aiconsole
\`\`\`

## 使用

\`\`\`typescript
import AIConsole from 'aiconsole';

new AIConsole({
  projectId: 'my-app'
});
\`\`\`

## API

### 构造选项

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| projectId | string | 是 | 项目标识 |
| server | string | 否 | 服务器地址，默认自动检测 |

### 方法

- `enableRemote()` - 开启远程监控
- `disableRemote()` - 关闭远程监控
- `isRemoteEnabled()` - 查询远程监控状态
- `destroy()` - 销毁实例
```

- [ ] **Step 2: 创建根 README**

```markdown
# AIConsole

让 AI 实时查看移动端调试信息的工具。

## 快速开始

### 1. 启动服务

\`\`\`bash
npx aiconsole
\`\`\`

### 2. 在项目中引入 SDK

\`\`\`typescript
import AIConsole from 'aiconsole';

new AIConsole({
  projectId: 'my-app'
});
\`\`\`

### 3. 查看日志

打开浏览器访问 `http://localhost:3000`，或通过 Claude Code MCP 工具查看。

## 包结构

- `aiconsole` - SDK 包
- `@aiconsole/server` - 服务器包
- `@aiconsole/mcp` - MCP 服务器包
- `@aiconsole/web` - PC 查看页面包

## 开发

\`\`\`bash
# 安装依赖
pnpm install

# 构建
pnpm build

# 开发模式
pnpm dev
\`\`\`

## License

MIT
```

- [ ] **Step 3: 提交**

```bash
git add README.md packages/sdk/README.md
git commit -m "docs: add usage documentation"
```

---

## 完成检查清单

- [ ] 所有包都正确构建
- [ ] 所有测试通过
- [ ] E2E 测试通过
- [ ] 文档完整

## 运行验证命令

```bash
# 构建所有包
pnpm build

# 运行测试
pnpm test

# 启动服务器
node packages/server/dist/index.js

# 构建 SDK
cd packages/sdk && pnpm build

# 运行 E2E 测试
cd packages/sdk && pnpm test
```

---

**下一步：** 计划审查通过后，选择执行方式（Subagent-Driven 或 Inline Execution）。
