# AIConsole

> 让 AI 实时查看移动端调试信息的工具

AIConsole 是一个移动端远程控制台工具，通过 WebSocket 实时传输移动设备的 console 日志到本地服务器，支持 PC 浏览器查看和 AI 工具直接查询。

---

## ✨ 特性

- 📱 **实时日志同步** - 查看移动设备的 console 输出
- 🌐 **WebSocket 通信** - 低延迟双向通信
- 🖥️ **Web 控制台** - 现代化的 React UI
- 🤖 **MCP 集成** - 支持 Claude Code 和其他 AI 工具
- 📦 **Monorepo** - pnpm + Turborepo 管理

---

## 🚀 快速开始

### 1️⃣ 安装

```bash
git clone https://github.com/uaio/AIConsole.git
cd AIConsole
pnpm install
pnpm build
```

### 2️⃣ 启动服务器

```bash
pnpm start
```

服务器将在 `http://localhost:38291` 启动。

**指定端口**：`PORT=3001 pnpm start`

### 3️⃣ 在移动设备中使用

```html
<script type="module">
  import AIConsole from './packages/sdk/dist/index.js';

  new AIConsole({
    projectId: 'my-app',
    server: 'ws://localhost:38291'
  });
</script>
```

### 4️⃣ 访问控制台

打开浏览器访问 `http://localhost:38291` 查看实时日志。

---

## 📚 完整文档

所有文档已整理到 **[文档中心](./docs/)**，包括：

| 文档 | 说明 |
|------|------|
| **[快速开始](./docs/getting-started.md)** | 5 分钟了解项目 |
| **[完整验证流程](./docs/verification.md)** | 验证所有功能 |
| **[文档导航](./docs/README.md)** | 所有文档索引 |
| **[项目状态](./docs/project-status.md)** | 当前进度和状态 |
| **[跨电脑开发](./docs/cross-machine.md)** | 在不同电脑间切换 |

---

## 🏗️ 架构

```
packages/
├── sdk/         # 移动端 SDK
├── server/      # Node.js 服务器 (WebSocket + HTTP API)
├── mcp/         # MCP Server
└── web/         # PC 查看页面 (React)
```

---

## 💻 开发

```bash
# 构建所有包
pnpm build

# 运行测试
pnpm test

# 开发模式
pnpm dev

# 启动服务器
pnpm start

# 指定端口
PORT=3001 pnpm start
```

---

## 🔌 API 端点

| 端点 | 说明 |
|------|------|
| `GET /api/devices` | 获取设备列表 |
| `GET /api/devices/:id` | 获取设备详情 |
| `GET /api/devices/:id/logs` | 获取日志 |

---

## 🤖 MCP 集成

```bash
export AICONSOLE_API_BASE_URL=http://localhost:38291/api
node packages/mcp/dist/index.js
```

可用工具：`list_devices`、`get_console_logs`

---

## 📝 开发资源

- **设计文档**: [docs/superpowers/specs/](./docs/superpowers/specs/)
- **实现计划**: [docs/superpowers/plans/](./docs/superpowers/plans/)
- **测试指南**: [docs/TESTING_GUIDE.md](./docs/TESTING_GUIDE.md)

---

## 📄 许可证

MIT

---

**GitHub**: https://github.com/uaio/AIConsole

**⚠️ 重要**: 首次使用请阅读 [快速开始](./docs/getting-started.md) 或 [完整验证流程](./docs/verification.md)
