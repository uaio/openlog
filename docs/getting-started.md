# AIConsole 快速开始

欢迎使用 AIConsole！本指南帮助你在 5 分钟内了解项目并启动验证。

---

## 🎯 项目简介

**AIConsole** 是一个让 AI 实时查看移动端调试信息的工具。

### 核心功能
- 📱 **移动端 SDK** - 拦截 console 日志
- 🌐 **WebSocket 实时推送** - 日志实时传输到本地服务器
- 💻 **PC 查看页面** - 浏览器实时查看日志
- 🤖 **MCP 协议支持** - AI 工具（如 Claude Code）可直接查询日志

### 技术栈
- **SDK**: TypeScript + Vite
- **Server**: Node.js + ws + express
- **MCP**: @modelcontextprotocol/sdk
- **Web**: React + Vite
- **构建**: pnpm + Turborepo

---

## 🚀 5 分钟快速启动

### Step 1: 安装依赖（2 分钟）

```bash
# 克隆项目
git clone https://github.com/uaio/AIConsole.git
cd AIConsole

# 安装依赖
pnpm install
```

### Step 2: 构建项目（1 分钟）

```bash
pnpm build
```

**预期输出：** `Tasks: 4 successful, 4 total`

### Step 3: 启动服务器（30 秒）

```bash
pnpm start
```

**预期输出：**
```
AIConsole server running!

  Local:    http://localhost:3000
  Network:  http://192.168.x.x:3000

  按 Ctrl+C 停止服务器
```

### Step 4: 验证功能（2 分钟）

1. **打开浏览器访问** `http://localhost:3000`
2. **创建测试页面** 或使用现有示例
3. **查看日志是否实时显示**

详细验证步骤见：[完整验证流程](./verification.md)

---

## 📂 项目结构

```
AIConsole/
├── packages/
│   ├── sdk/         # SDK 包（拦截 console）
│   ├── server/      # 服务器包（WebSocket + HTTP API）
│   ├── mcp/         # MCP 服务器包（AI 工具集成）
│   └── web/         # PC 查看页面包（React）
├── docs/            # 文档中心
│   ├── README.md    # 文档导航
│   ├── verification.md # 完整验证流程
│   └── ...
└── README.md        # 项目介绍
```

---

## 📖 更多文档

| 文档 | 用途 |
|------|------|
| **[完整验证流程](./verification.md)** | 验证所有功能 |
| **[项目状态](./project-status.md)** | 当前进度和技术栈 |
| **[任务状态](./tasks.md)** | 21 个任务详情 |
| **[跨电脑开发](./cross-machine.md)** | 在不同电脑间切换 |
| **[测试指南](./TESTING_GUIDE.md)** | 测试流程和问题排查 |
| **[设计文档](./superpowers/specs/)** | 技术设计规范 |
| **[实现计划](./superpowers/plans/)** | 详细实现步骤 |

---

## 🎯 快速命令参考

```bash
# 开发常用命令
pnpm install      # 安装依赖
pnpm build        # 构建所有包
pnpm test         # 运行测试
pnpm dev          # 开发模式

# 服务器命令
pnpm start          # 启动服务器（默认端口 3000）
PORT=3001 pnpm start # 指定端口

# 包管理
pnpm --filter <package> build   # 构建单个包
pnpm --filter <package> test     # 测试单个包
```

---

## 🔑 核心概念

### 设备标识
设备 ID 基于以下信息生成：
```
hash(URL + pathname + UserAgent + projectId)
```
这确保同一设备、同一地址、同一浏览器的多个标签页被识别为同一设备。

### WebSocket 协议
```javascript
// 设备注册
{ type: 'register', projectId, deviceId, deviceInfo }

// 日志上报
{ type: 'console', deviceId, tabId, timestamp, level, message }

// PC 查看者
{ type: 'viewer' }
```

### API 端点
- `GET /api/devices` - 获取设备列表
- `GET /api/devices/:id` - 获取设备详情
- `GET /api/devices/:id/logs` - 获取日志

---

## 💡 下一步

1. **验证功能** - 查看 [完整验证流程](./verification.md)
2. **了解项目** - 阅读 [项目状态](./project-status.md)
3. **添加功能** - 使用 Claude Code 的 brainstorming skill
4. **修复问题** - 使用 systematic-debugging skill

---

## 🆘 需要帮助？

- **遇到问题**？查看 [完整验证流程](./verification.md) 的"遇到问题"部分
- **想了解技术细节**？阅读 [设计文档](./superpowers/specs/)
- **想继续开发**？阅读 [跨电脑开发](./cross-machine.md)

---

**欢迎加入 AIConsole 开发！** 🎉
