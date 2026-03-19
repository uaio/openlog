# AIConsole 设计文档

> 让 AI 实时查看移动端调试信息的工具

## 概述

AIConsole 是一个类似 vConsole 的移动端调试工具，在 vConsole 的基础上增加了远程推送能力，让 AI 工具（如 Claude Code）可以实时查看页面日志、网络请求等调试信息。

## 核心特性

- 基于 vConsole fork，复用成熟功能和 UI
- 实时推送日志到本地服务器
- MCP Server 集成，AI 可直接查看调试信息
- PC 端查看页面，类似 PageSpy/DevTools 风格
- 支持多设备连接，区分不同设备

## 架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      开发者电脑                                  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              本地服务器 (npx aiconsole)                   │   │
│  │                                                         │   │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │   │ WebSocket   │  │ 数据存储     │  │ MCP Server  │     │   │
│  │   │ 连接管理    │  │ 日志缓存     │  │ 工具接口    │     │   │
│  │   └─────────────┘  └─────────────┘  └─────────────┘     │   │
│  │                                                         │   │
│  │   ┌─────────────────────────────────────────────────┐   │   │
│  │   │           PC 查看页面 (localhost:3000)           │   │   │
│  │   └─────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ▲                                  │
│                              │ stdio                           │
│                              ▼                                  │
│                    ┌─────────────────┐                         │
│                    │   Claude Code   │                         │
│                    │   (AI 工具)     │                         │
│                    └─────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
                               ▲
                               │ WebSocket
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│   手机 A      │      │   手机 B      │      │   手机 C      │
│   SDK 连接    │      │   SDK 连接    │      │   SDK 连接    │
└───────────────┘      └───────────────┘      └───────────────┘
```

### 项目结构

```
aiconsole/
├── packages/
│   ├── vconsole/              # Fork 自 vconsole（添加推送能力）
│   │   ├── src/
│   │   │   ├── core/          # 原有核心（保持）
│   │   │   ├── plugins/       # 原有插件（保持）
│   │   │   ├── transport/     # 新增：WebSocket 推送
│   │   │   └── index.ts       # 扩展初始化逻辑
│   │   └── package.json
│   │
│   ├── server/                # 新增：本地服务器
│   │   ├── src/
│   │   │   ├── ws/            # WebSocket 服务
│   │   │   ├── api/           # HTTP API
│   │   │   ├── store/         # 数据存储
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── mcp/                   # 新增：MCP Server
│   │   ├── src/
│   │   │   ├── tools/         # MCP 工具定义
│   │   │   │   ├── list_devices.ts
│   │   │   │   ├── get_console_logs.ts
│   │   │   │   ├── get_network_logs.ts
│   │   │   │   ├── get_storage.ts
│   │   │   │   └── get_device_info.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── web/                   # 新增：PC 查看页面
│       ├── src/
│       │   ├── components/    # UI 组件
│       │   ├── pages/         # 页面
│       │   ├── hooks/         # React Hooks
│       │   └── App.tsx
│       └── package.json
│
├── package.json               # monorepo 根配置
├── pnpm-workspace.yaml
└── tsconfig.json
```

## 模块设计

### 1. 前端 SDK（基于 vConsole fork）

#### 初始化方式

```typescript
import VConsole from 'aiconsole';

new VConsole({
  projectId: 'my-app',                    // 项目标识（必填）
  server: 'ws://192.168.1.100:3000',      // 服务器地址（可选，默认自动检测）
  defaultPlugins: ['system', 'network', 'element', 'storage'],
});
```

#### server 参数自动检测逻辑

当 `server` 参数未指定时，SDK 按以下顺序尝试连接：

1. `ws://{当前页面host}:3000` - 假设服务器在当前开发服务器的 3000 端口
2. 连接失败则不启用远程推送，仅保留本地 vConsole 功能

示例：
- 页面地址 `http://192.168.1.100:8080` → 尝试 `ws://192.168.1.100:3000`
- 页面地址 `http://localhost:5173` → 尝试 `ws://localhost:3000`

#### 新增功能

| 模块 | 功能 | 说明 |
|------|------|------|
| Transport | WebSocket 连接 | 与服务器建立连接，推送数据 |
| DeviceInfo | 设备信息收集 | UA、屏幕尺寸、连接时间等 |
| Reporter | 数据上报 | 将各插件数据推送到服务器 |

#### UI 设计

- 保持 vConsole 原有风格
- 吸附屏幕右边缘的绿色按钮
- 点击展开面板，底部抽屉式滑出
- 面板：Console、Network、Element、Storage、System

### 2. 本地服务器

#### 启动方式

```bash
npx aiconsole              # 默认端口 3000
npx aiconsole --port 3001  # 指定端口
```

#### 启动输出

```
AIConsole server running!

  Local:    http://localhost:3000
  Network:  http://192.168.1.100:3000

  MCP Server: stdio transport ready

  Open http://localhost:3000 in browser to view devices
```

#### 服务组成

| 服务 | 端口/方式 | 说明 |
|------|----------|------|
| HTTP Server | 3000 | 静态资源、API |
| WebSocket | 3000 | SDK 连接、实时通信 |
| MCP Server | stdio | 供 Claude Code 等 AI 工具连接 |
| Web View | /view | PC 查看页面 |

### 3. MCP Server 工具

AI 可通过以下 MCP 工具查看设备信息：

| 工具名 | 功能 | 参数 |
|--------|------|------|
| `list_devices` | 列出当前连接的所有设备 | `projectId` (可选) |
| `get_console_logs` | 获取控制台日志 | `deviceId`, `limit`, `level` |
| `get_network_logs` | 获取网络请求记录 | `deviceId`, `limit`, `filter` |
| `get_storage` | 获取存储数据 | `deviceId`, `type` |
| `get_device_info` | 获取设备详细信息 | `deviceId` |

> **注意**：`execute_script` 功能因安全风险暂不实现。如需执行代码，用户应在设备端手动操作。

#### 使用示例

```
AI 调用 list_devices()
返回: [
  { id: 'abc123', projectId: 'my-app', ua: 'iPhone 14, iOS 17', lastActive: '10:30' },
  { id: 'def456', projectId: 'my-app', ua: 'Pixel 7, Android 14', lastActive: '10:28' }
]

AI 调用 get_console_logs({ deviceId: 'abc123', limit: 50 })
返回: [日志列表...]

AI 调用 get_network_logs({ deviceId: 'abc123', limit: 20 })
返回: [网络请求列表...]
```

### 4. PC 查看页面

#### 页面布局

```
┌─────────────────────────────────────────────────────────────────┐
│  AIConsole                              [设备列表] [设置]       │
├─────────────────────────────────────────────────────────────────┤
│ 设备列表 (左侧边栏)  │          主内容区                          │
│ ┌─────────────────┐ │ ┌─────────────────────────────────────────┐│
│ │ 🟢 iPhone 14    │ │ │ Console  Network  Element  Storage     ││
│ │    iOS 17       │ │ ├─────────────────────────────────────────┤│
│ │    10:30:15     │ │ │                                         ││
│ ├─────────────────┤ │ │  [日志/网络请求列表...]                  ││
│ │ ⚪ Pixel 7      │ │ │                                         ││
│ │    Android 14   │ │ │                                         ││
│ │    10:28:03     │ │ │                                         ││
│ └─────────────────┘ │ └─────────────────────────────────────────┘│
│                      │          详情面板 (可折叠)                 │
│                      │ ┌─────────────────────────────────────────┐│
│                      │ │ 请求详情 / 响应内容 / Headers...        ││
│                      │ └─────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

#### 功能模块

| 面板 | 功能 |
|------|------|
| Console | 日志过滤、搜索、级别筛选、堆栈信息 |
| Network | 请求列表、时间线、请求/响应详情、Headers、Preview |
| Element | DOM 树查看、样式查看 |
| Storage | localStorage/sessionStorage/cookie 查看和编辑 |
| System | 设备信息、UA、屏幕尺寸 |

## 数据存储策略

### 实时性要求

| 查看方式 | 实时性 | 数据来源 | 说明 |
|----------|--------|----------|------|
| PC 查看页面 | **实时** | WebSocket 推送 | 毫秒级同步，无需刷新 |
| 移动端 SDK 面板 | **实时** | 本地直接访问 | 无网络延迟 |
| AI 查询 (MCP) | **非实时** | 服务器缓存 | 查询历史数据，包含时间戳 |

### 日志存储（供 AI 查询）

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| 单设备日志上限 | 1000 条 | 超出后删除最旧的日志 |
| 网络请求上限 | 500 条 | 超出后删除最旧的请求 |
| 日志保留时长 | 30 分钟 | 设备断开后 30 分钟清理 |
| 存储方式 | 内存 | 不持久化到磁盘，重启服务清空 |

### 数据时间戳

所有数据都包含精确的时间戳，供 AI 分析时了解事件发生的时间顺序：

```typescript
interface LogEntry {
  timestamp: number;      // 毫秒级时间戳
  level: 'log' | 'warn' | 'error' | 'info';
  message: string;
  stack?: string;
}

interface NetworkEntry {
  timestamp: number;      // 请求发起时间
  duration: number;       // 请求耗时（毫秒）
  // ... 其他字段
}
```

### 设备管理

| 场景 | 处理方式 |
|------|----------|
| 首次访问 | 生成 deviceId，存入 localStorage |
| 刷新页面 | 读取 localStorage 中的 deviceId，保持不变 |
| 多标签页 | 合并为同一设备，日志通过 tabId 区分来源 |
| 设备断开 | 保留日志 30 分钟，标记设备为离线 |
| 设备重连 | 根据 deviceId 识别，追加日志历史 |
| 服务重启 | 所有日志清空，设备需重新连接 |

### 性能保护

- **限流策略**：日志上报频率限制为 100 条/秒，超出则批量合并
- **批量上报**：高频日志合并为单条 WebSocket 消息
- **大响应截断**：网络响应体超过 100KB 只保留前 100KB

## 设备标识机制

### 标识生成

```typescript
// deviceId 基于 URL（不含查询参数）生成
deviceId = hash(window.location.origin + window.location.pathname)

// 示例：
// http://192.168.1.100:8080/home → deviceId: "a1b2c3"
// http://192.168.1.100:8080/home?token=xxx → deviceId: "a1b2c3" (相同)
// http://192.168.1.100:8080/about → deviceId: "x9y8z7" (不同)
```

### 持久化策略

| 存储 | Key | 说明 |
|------|-----|------|
| localStorage | `aiconsole_device_id` | 设备 ID，首次访问生成后持久化 |
| localStorage | `aiconsole_device_info` | 设备基础信息缓存 |

### 多标签页处理

同一设备（相同 deviceId）打开多个标签页时：

| 策略 | 说明 |
|------|------|
| 合并显示 | PC 页面中同一 deviceId 只显示一个设备条目 |
| 日志来源 | 每条日志附带 `tabId`（session 级 UUID）区分来源 |
| 连接状态 | 任一标签页活跃即显示在线 |

### 设备信息

```typescript
interface DeviceInfo {
  deviceId: string;         // 设备唯一标识（基于 URL 持久化）
  projectId: string;        // 项目标识
  ua: string;               // User Agent
  screen: string;           // 屏幕尺寸 "390x844"
  pixelRatio: number;       // 设备像素比
  language: string;         // 语言
  url: string;              // 当前页面地址（不含参数）
  connectTime: number;      // 首次连接时间戳
  lastActiveTime: number;   // 最后活跃时间
  activeTabs: number;       // 活跃标签页数量
}

interface LogEntry {
  deviceId: string;         // 设备 ID
  tabId: string;            // 标签页 ID（区分同一设备的多标签页）
  // ... 其他字段
}
```

### projectId 作用

- 用于隔离不同项目的设备
- AI 调用 `list_devices` 时可按 `projectId` 过滤
- 不填写则所有设备归入 `default` 项目

## 错误处理策略

### WebSocket 连接

| 场景 | 处理方式 |
|------|----------|
| 连接失败 | 每 3 秒重试，最多 10 次，之后提示用户 |
| 连接断开 | 自动重连，重连成功后重新注册设备 |
| 消息发送失败 | 缓存到本地队列，重连后重发（最多 100 条） |

### 服务器端

| 场景 | 处理方式 |
|------|----------|
| 消息格式错误 | 丢弃消息，记录错误日志 |
| 未知消息类型 | 忽略，不做处理 |
| 设备未注册 | 返回错误，要求先注册 |

## 通信协议

### WebSocket 消息格式

#### 设备连接

```json
{
  "type": "register",
  "projectId": "my-app",
  "deviceInfo": {
    "ua": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)...",
    "screen": "390x844",
    "pixelRatio": 3,
    "language": "zh-CN"
  }
}
```

#### 日志上报

```json
{
  "type": "console",
  "deviceId": "abc123",
  "level": "error",
  "message": "Uncaught TypeError: ...",
  "timestamp": 1710739215000,
  "stack": "at foo (app.js:10)\nat bar (app.js:20)"
}
```

#### 网络请求

```json
{
  "type": "network",
  "deviceId": "abc123",
  "requestId": "req-001",
  "method": "GET",
  "url": "/api/data",
  "status": 200,
  "duration": 150,
  "request": {
    "headers": {},
    "body": null
  },
  "response": {
    "headers": {},
    "body": "{\"data\":[]}"
  },
  "timestamp": 1710739215000
}
```

## 技术选型

| 组件 | 技术栈 | 说明 |
|------|--------|------|
| SDK | TypeScript + vConsole fork | 复用 vConsole 核心能力 |
| Server | Node.js + WebSocket | 本地服务 |
| MCP | @modelcontextprotocol/sdk | MCP 协议实现 |
| Web | React + Vite | PC 查看页面 |
| 构建 | pnpm + Turborepo | Monorepo 管理 |
| 样式 | CSS Modules / Tailwind | 参考 vConsole 风格 |

### 版本要求

| 依赖 | 版本 |
|------|------|
| Node.js | >= 18.0.0 |
| TypeScript | >= 5.0.0 |
| pnpm | >= 8.0.0 |

### 浏览器兼容性

| 浏览器 | 最低版本 |
|--------|----------|
| Chrome | 60+ |
| Safari | 12+ |
| Firefox | 60+ |
| Edge | 79+ |
| iOS Safari | 12+ |
| Android Chrome | 60+ |

## 实现里程碑

### 阶段 1：MVP（核心功能）

- [ ] Fork vConsole，添加 transport 模块
- [ ] 本地服务器 + WebSocket 连接
- [ ] MCP Server：`list_devices` + `get_console_logs`
- [ ] PC 页面：设备列表 + Console 查看

### 阶段 2：网络调试

- [ ] SDK：Network 数据推送
- [ ] MCP：`get_network_logs`
- [ ] PC：Network 面板，请求/响应详情

### 阶段 3：丰富功能

- [ ] SDK：Element、Storage 数据推送
- [ ] MCP：`get_storage`
- [ ] PC：Element、Storage 面板

### 阶段 4：增强体验

- [ ] 日志搜索、过滤
- [ ] 性能监控
- [ ] 断点调试（可选）

## 使用场景

### 场景 1：移动端开发调试

```bash
# 1. 启动服务
npx aiconsole

# 2. 在项目中引入 SDK
import VConsole from 'aiconsole';
new VConsole({ projectId: 'my-app' });

# 3. 手机访问页面，AI 可以实时查看日志
```

### 场景 2：AI 辅助排查问题

```
用户: 我的页面在手机上报错了，帮我看看

AI: 让我查看一下你的设备日志...
[调用 list_devices]
[调用 get_console_logs]
我看到有一个 TypeError，在 app.js 第 10 行...
```

### 场景 3：多人协作调试

```
# 多个测试设备同时连接
设备 A: iPhone 14 - 演示环境
设备 B: Pixel 7 - 测试环境

# AI 可以查看所有设备日志，对比分析问题
```

## 参考资料

- [vConsole](https://github.com/Tencent/vConsole) - 轻量、可拓展的前端开发者调试面板
- [PageSpy](https://github.com/HuolalaTech/page-spy-web) - 远程调试工具
- [MCP Protocol](https://modelcontextprotocol.io/) - Model Context Protocol
