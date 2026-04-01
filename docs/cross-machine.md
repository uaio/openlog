# AIConsole 跨电脑开发指南

本指南说明如何在不同电脑之间无缝交接 AIConsole 项目给 Claude Code。

---

## 🖥️ 新电脑设置步骤

### 第一步：克隆项目并安装

```bash
# 1. 克隆项目
git clone https://github.com/uaio/AIConsole.git
cd AIConsole

# 2. 安装依赖
pnpm install

# 3. 构建项目
pnpm build

# 4. 验证安装
pnpm test
```

### 第二步：告诉 Claude Code 项目上下文

**在 Claude Code 中输入以下指令：**

```
请阅读以下文件了解项目上下文：

1. 先读 HANDOFF.md - 了解项目快速交接信息
2. 再读 PROJECT_STATUS.md - 了解项目整体状态
3. 最后读 TASK_STATUS.md - 了解详细任务完成状态

然后告诉我你理解了什么，准备从哪里开始继续开发。
```

**为什么这样做：**
- `HANDOFF.md` 是快速入门，5 分钟了解项目
- `PROJECT_STATUS.md` 包含技术栈、设计决策、下一步建议
- `TASK_STATUS.md` 包含每个任务的提交历史和关键修复

---

## 💬 推荐的 Claude Code 对话开场白

### 场景 A：继续开发新功能

```
我正在继续开发 AIConsole 项目。
当前状态：MVP 已完成，21 个任务全部完成。
GitHub 仓库：https://github.com/uaio/AIConsole

请阅读 HANDOFF.md、PROJECT_STATUS.md、TASK_STATUS.md 了解项目状态。

我想开发 [具体功能，如：数据持久化]，
请使用 brainstorming skill 帮我设计方案。
```

### 场景 B：修复 Bug

```
我正在修复 AIConsole 项目的问题。
GitHub 仓库：https://github.com/uaio/AIConsole

请阅读 PROJECT_STATUS.md 了解项目架构。

问题：[描述 bug]

请使用 systematic-debugging skill 帮我诊断和修复这个问题。
```

### 场景 C：从零开始了解项目

```
请帮我了解 AIConsole 项目。
工作目录：/Users/xxx/AIConsole

请先读 HANDOFF.md 快速了解项目，
然后告诉我项目的核心功能、技术栈、当前进度。
```

---

## 🎯 不同开发场景的具体指令

### 场景 1：添加新功能（网络请求拦截）

```
AIConsole 当前已完成 MVP，我想添加网络请求拦截功能。

请：
1. 阅读 docs/superpowers/specs/2026-03-18-aiconsole-design.md 了解现有设计
2. 使用 brainstorming skill 设计网络请求拦截方案
3. 创建新的设计文档到 docs/superpowers/specs/
```

### 场景 2：优化现有功能

```
AIConsole 的日志存储目前是内存存储，服务器重启会丢失。

请：
1. 阅读 PROJECT_STATUS.md 了解当前架构
2. 阅读 packages/server/src/store/ 了解存储实现
3. 帮我设计数据库持久化方案
4. 使用 writing-plans skill 创建实现计划
```

### 场景 3：修复测试失败

```
运行 pnpm test 时有测试失败。

请：
1. 使用 systematic-debugging skill 诊断问题
2. 修复失败的测试
3. 运行测试验证修复
4. 提交代码
```

### 场景 4：代码审查

```
我完成了 [某功能] 的开发，请帮我审查代码。

文件：
- packages/sdk/src/xxx.ts
- packages/server/src/yyy.ts

请使用 superpowers:requesting-code-review skill 进行代码审查。
```

---

## 📋 给 Claude Code 的完整上下文模板

**复制以下模板给 Claude Code：**

---

### 项目信息
- **项目名称**: AIConsole
- **GitHub**: https://github.com/uaio/AIConsole
- **工作目录**: `[当前路径]`
- **当前状态**: MVP 已完成 (21/21 任务)

### 需要你做的
1. 阅读 `HANDOFF.md` - 5 分钟快速了解项目
2. 阅读 `PROJECT_STATUS.md` - 了解项目架构和状态
3. 阅读 `TASK_STATUS.md` - 了解任务完成详情
4. 告诉我你理解了什么

### 我的开发目标
[在这里填写你的目标，例如：
- 添加数据持久化功能
- 修复 WebSocket 重连问题
- 优化日志查询性能
- 添加网络请求拦截
]

---

## 🔧 快速参考卡片

### 核心命令
```bash
pnpm install    # 安装依赖
pnpm build      # 构建所有包
pnpm test       # 运行测试
pnpm start # 启动服务器
pnpm dev        # 开发模式
```

### 关键文件位置
```
HANDOFF.md              # 快速交接（必读）
PROJECT_STATUS.md       # 项目状态（必读）
TASK_STATUS.md          # 任务详情（按需）
docs/superpowers/specs/ # 设计文档
packages/*/src/         # 源代码
```

### Claude Code Skills
- `superpowers:brainstorming` - 新功能设计
- `superpowers:writing-plans` - 创建实现计划
- `superpowers:subagent-driven-development` - 执行实现计划
- `superpowers:systematic-debugging` - 调试问题
- `superpowers:test-driven-development` - TDD 开发
- `superpowers:requesting-code-review` - 代码审查

---

## ✅ 验证交接成功

完成以下检查确保交接成功：

### 1. 文件检查
```bash
# 确认关键文档存在
ls -la HANDOFF.md PROJECT_STATUS.md TASK_STATUS.md
```

### 2. 构建检查
```bash
# 确认项目可以构建
pnpm build
# 应该显示 "Tasks: 4 successful, 4 total"
```

### 3. 测试检查
```bash
# 确认测试通过
pnpm test
# 应该显示 "27 passed"
```

### 4. 服务器检查
```bash
# 确认服务器可以启动
pnpm start &
# 应该显示 "AIConsole server running!"
```

---

## 💡 最佳实践

### 1. 开发前必读
- `HANDOFF.md` - 每次换电脑都读一遍
- `PROJECT_STATUS.md` - 了解当前状态
- `TASK_STATUS.md` - 查看具体任务细节

### 2. 开发中必用
- `superpowers:brainstorming` - 设计新功能
- `superpowers:systematic-debugging` - 调试问题
- `superpowers:test-driven-development` - 写代码

### 3. 提交前必做
- `pnpm test` - 确保测试通过
- `pnpm build` - 确保构建成功
- `superpowers:requesting-code-review` - 代码审查

---

## 🚨 常见问题

### Q: Claude Code 说找不到文件？
A: 确保在正确的工作目录，使用 `pwd` 确认。

### Q: pnpm install 失败？
A: 检查 Node.js 版本，建议使用 v20+。

### Q: 构建失败？
A: 先运行 `pnpm clean` 清理，再重新构建。

### Q: 测试失败？
A: 使用 `superpowers:systematic-debugging` 诊断问题。

---

**记住**: 这三个文档是关键 - `HANDOFF.md`、`PROJECT_STATUS.md`、`TASK_STATUS.md`！

每次换电脑都让 Claude Code 先读这三个文档，就能无缝衔接 🎯
