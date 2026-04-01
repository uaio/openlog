# AIConsole 项目状态

**更新时间：** 2026-03-19
**当前版本：** 0.1.0
**完成进度：** MVP 已完成 (21/21 任务)

---

## 📊 项目概览

AIConsole 是一个让 AI 实时查看移动端调试信息的工具，基于 vConsole fork 扩展。

### 核心功能
- 移动端 SDK 拦截 console 日志
- WebSocket 实时推送到本地服务器
- PC 浏览器实时查看日志
- MCP 协议支持 AI 工具查询
- 多设备同时连接管理

### 技术栈
- **SDK**: TypeScript + Vite
- **Server**: Node.js + ws + express
- **MCP**: @modelcontextprotocol/sdk
- **Web**: React + Vite + TypeScript
- **构建**: pnpm + Turborepo
- **测试**: Vitest

---

## ✅ 已完成功能

### 阶段 1: SDK 实现 (任务 1-8)
- [x] Monorepo 初始化
- [x] 各包骨架创建
- [x] 设备 ID 生成逻辑（基于 URL + UA + projectId hash）
- [x] WebSocket Transport 模块
- [x] SDK 入口与初始化
  - console 拦截（log/warn/error/info）
  - 远程监控开关
  - 心跳机制
  - 实例检测防止竞态条件

### 阶段 2: 服务器实现 (任务 9-12)
- [x] 服务器存储层（DeviceStore、LogStore）
- [x] WebSocket 服务器（设备消息处理、PC 客户端管理）
- [x] HTTP API（设备列表、日志查询、设备详情）
- [x] CLI 入口（npx aiconsole）

### 阶段 3: MCP Server (任务 13-14)
- [x] MCP 工具实现（list_devices、get_console_logs）
- [x] MCP Server 入口（stdio 传输）

### 阶段 4: PC Web 页面 (任务 15-19)
- [x] WebSocket 客户端 hook（自动重连）
- [x] API 客户端（类型安全、错误处理）
- [x] 设备列表组件
- [x] 日志面板组件
- [x] 应用主组件（完整布局）

### 阶段 5: 测试与文档 (任务 20-21)
- [x] 端到端测试（27 个测试用例全部通过）
- [x] 使用文档（SDK README + 项目 README）
- [x] 测试流程指南

---

## 🏗️ 项目结构

```
aiconsole/
├── packages/
│   ├── sdk/               # SDK 包
│   │   ├── src/
│   │   │   ├── core/      # 设备 ID 生成
│   │   │   ├── transport/ # WebSocket + Reporter
│   │   │   ├── types/     # 类型定义
│   │   │   └── index.ts   # SDK 入口
│   │   ├── test/e2e/      # 端到端测试
│   │   └── build/         # Vite 配置
│   │
│   ├── server/            # 服务器包
│   │   ├── src/
│   │   │   ├── store/     # 设备/日志存储
│   │   │   ├── ws/        # WebSocket 服务器
│   │   │   ├── api/       # HTTP API
│   │   │   ├── cli/       # CLI 入口
│   │   │   └── index.ts   # 服务器入口
│   │   └── bin/
│   │       └── aiconsole  # 可执行文件
│   │
│   ├── mcp/               # MCP 服务器包
│   │   ├── src/
│   │   │   ├── tools/     # MCP 工具
│   │   │   ├── config.ts  # API 配置
│   │   │   └── server.ts  # MCP 服务器
│   │   └── bin/
│   │       └── aiconsole-mcp
│   │
│   └── web/               # PC 查看页面包
│       ├── src/
│       │   ├── components/ # React 组件
│       │   ├── hooks/      # 自定义 hooks
│       │   ├── api/        # API 客户端
│       │   ├── types/      # 类型定义
│       │   └── styles/     # 全局样式
│       └── public/         # 静态文件
│
├── docs/
│   ├── superpowers/
│   │   ├── specs/         # 设计文档
│   │   └── plans/         # 实现计划
│   └── TESTING_GUIDE.md   # 测试指南
│
├── turbo.json             # Turborepo 配置
├── pnpm-workspace.yaml    # pnpm workspace
└── tsconfig.json          # TypeScript 根配置
```

---

## 🎯 关键设计决策

### 设备标识策略
- **公式**: `hash(URL + pathname + UA + projectId)`
- **持久化**: localStorage 存储
- **多标签页**: 合并为同一设备，用 tabId 区分

### WebSocket 协议
```javascript
// 设备注册
{ type: 'register', projectId, deviceId, deviceInfo }

// PC 查看器注册
{ type: 'viewer' }

// 日志上报
{ type: 'console', deviceId, tabId, timestamp, level, message, stack }

// 心跳
{ type: 'heartbeat', deviceId, timestamp }

// 广播消息
{ type: 'devices', data: devices }
{ type: 'log', data: log }
```

### API 端点
- `GET /api/devices` - 设备列表（支持 ?projectId 过滤）
- `GET /api/devices/:deviceId` - 设备详情
- `GET /api/devices/:deviceId/logs` - 日志查询（支持 ?limit & ?level）

---

## 🔧 开发命令

```bash
# 安装依赖
pnpm install

# 构建
pnpm build

# 开发模式
pnpm dev

# 运行测试
pnpm test

# 启动服务器
npx aiconsole

# 指定端口启动
pnpm start
```

---

## 🐛 已知问题与限制

### 当前限制
1. **内存存储**: 服务器重启后数据丢失
2. **单机部署**: 不支持分布式部署
3. **日志限制**: 每设备最多 1000 条日志
4. **清理策略**: 30 分钟未活跃自动清理

### 待优化
1. 考虑添加数据库持久化
2. 考虑添加日志导出功能
3. 考虑添加用户认证
4. 考虑添加日志搜索功能

---

## 📋 下一步工作建议

### 短期优化
1. 修复测试中的 TypeScript 类型警告
2. 添加更多单元测试覆盖
3. 优化错误提示信息
4. 添加性能监控

### 中期功能
1. 添加网络请求拦截和展示
2. 添加性能监控 API
3. 添加源码映射支持
4. 添加日志筛选和搜索

### 长期规划
1. 支持多用户/多项目隔离
2. 支持数据持久化
3. 支持分布式部署
4. 提供云端服务

---

## 🚀 发布计划

### npm 包发布
```bash
# 发布 SDK
cd packages/sdk
npm publish --access public

# 发布 CLI
cd packages/server
npm publish --access public
```

### Docker 镜像（待实现）
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY packages/server/dist ./dist
COPY package*.json ./
RUN npm ci --production
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

---

## 📞 联系与支持

- **GitHub**: https://github.com/uaio/AIConsole
- **问题反馈**: GitHub Issues
- **文档**: 见各包的 README.md

---

## 🔄 如何继续开发

### 新功能开发流程
1. 在 `docs/superpowers/specs/` 创建设计文档
2. 在 `docs/superpowers/plans/` 创建实现计划
3. 使用 subagent-driven-development skill 执行
4. 编写测试
5. 更新此文档

### Bug 修复流程
1. 使用 systematic-debugging skill 诊断问题
2. 修复代码
3. 运行测试验证
4. 提交修复
5. 更新此文档（如涉及架构变更）

---

**最后更新人**: Claude Code
**最后更新时间**: 2026-03-19
