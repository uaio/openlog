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
│   │   │   │   ├── get_logs.ts
│   │   │   │   ├── get_network.ts
│   │   │   │   ├── get_storage.ts
│   │   │   │   ├── get_device_info.ts
│   │   │   │   └── execute_script.ts
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
| `execute_script` | 在设备上执行 JS | `deviceId`, `code` |

#### 使用示例

```
AI 调用 list_devices()
返回: [
  { id: 'abc123', projectId: 'my-app', ua: 'iPhone 14, iOS 17', lastActive: '10:30' },
  { id: 'def456', projectId: 'my-app', ua: 'Pixel 7, Android 14', lastActive: '10:28' }
]

AI 调用 get_console_logs({ deviceId: 'abc123', limit: 50 })
返回: [日志列表...]

AI 调用 execute_script({ deviceId: 'abc123', code: 'window.location.href' })
返回: 'http://192.168.1.100:8080/home'
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
- [ ] MCP：`get_storage`、`execute_script`
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
