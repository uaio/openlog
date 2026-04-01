# AIConsole 项目记忆索引

本目录存储 AIConsole 项目的持久化上下文信息，用于在不同会话和不同电脑之间无缝衔接。

## 记忆文件

- **project_progress.md** - 项目整体进度和状态
  - 包含：已完成功能、技术栈、设计决策、待优化功能
  - 用途：让新的 Claude Code 实例快速了解项目状态
  - 更新时间：2026-03-20

- **TASK_STATUS.md** - 任务状态清单
  - 包含：进行中任务、待处理事项、已完成任务
  - 用途：快速了解当前工作进度和待办事项
  - 更新时间：2026-03-20

## 如何使用

当在新环境或新会话中开始工作时：

1. **克隆代码后**，阅读 `memory/project_progress.md` 了解项目状态
2. **查看任务状态**，阅读 `memory/TASK_STATUS.md` 了解当前工作进度
3. **查看具体设计**，阅读 `docs/superpowers/specs/` 中的设计文档
4. **查看实现计划**，阅读 `docs/superpowers/plans/` 中的实现计划
5. **查看测试页面**，打开 `packages/sdk/test/test-demo.html` 进行功能测试

## 更新指南

当以下情况发生时，更新记忆文件：

- **完成新功能**: 更新 project_progress.md
- **修复重大 bug**: 更新 project_progress.md 记录问题和解决方案
- **改变技术栈**: 更新 project_progress.md
- **添加新设计**: 在 docs/superpowers/specs/ 添加新文档
