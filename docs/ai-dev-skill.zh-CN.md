# openLog AI 开发 Skill — 节点验证 SOP

将此文件内容放入项目的 `CLAUDE.md`（或 Cursor Rules / Copilot Instructions），
即可让 AI 工具在开发过程中自动使用 openLog 验证每个功能节点。

---

## 使用方式

将下方 **「粘贴到 CLAUDE.md 的内容」** 复制到你项目根目录的 `CLAUDE.md`。

---

## 粘贴到 CLAUDE.md 的内容

```markdown
## 🔬 开发验证 SOP（由 openLog 提供）

你在开发 H5 页面功能时，**必须** 在每个关键节点完成后，
通过 openLog MCP 工具在真机上验证该节点是否正常工作。
**不要跳过验证直接继续下一节点。**

### 验证工具

优先使用 `verify_checkpoint` 一次性完成多项检查。
如需实时观测，可在触发前先调用 `watch_logs`。

### 各类功能节点的验证方式

#### 事件绑定节点
```
verify_checkpoint(
  checkpoint: "描述功能",
  triggerJs: "触发操作的 JS",
  expects: {
    noErrors: true,
    js: [{ code: "!!document.querySelector('#your-element')", description: "元素存在" }]
  }
)
```

#### 接口调用节点
```
verify_checkpoint(
  checkpoint: "描述功能",
  triggerJs: "触发接口的 JS",
  waitMs: 1500,
  expects: {
    noErrors: true,
    network: [{ urlPattern: "/api/your-endpoint", method: "POST", status: 200 }]
  }
)
```

#### 状态存储节点（登录 / 鉴权）
```
verify_checkpoint(
  checkpoint: "描述功能",
  expects: {
    noErrors: true,
    storage: [{ key: "token", storageType: "localStorage" }]
  }
)
```

#### 页面跳转节点
```
verify_checkpoint(
  checkpoint: "描述功能",
  expects: {
    noErrors: true,
    js: [{ code: "location.pathname === '/target-path'", description: "已跳转到目标页" }]
  }
)
```

#### 完整功能交付前
```
health_check()       → 健康分不低于 80
ai_analyze()         → 无高优先级问题
take_screenshot()    → 截图存档
```

### 验证失败处理规则

1. `failed_checks` 不为空 → 定位问题，修复代码，重新验证，**不得跳过**
2. 连续两次失败同一项 → 使用 `get_console_logs(level="error")` + `get_network_requests` 深入排查
3. 全部通过 → 在回复中标注 `✅ 节点已验证`，然后继续下一节点
```

---

## 完整开发循环示意

```
[AI 写代码] → [热更新到设备] → [verify_checkpoint] 
     ↑                                    |
     |         ✅ passed                  |
     └──────────────────────────────────┘
                     ↓ ❌ failed
              [get_console_logs / get_network_requests]
                     ↓
              [AI 修复代码] → 重新 verify_checkpoint
```

---

## 🤖 子代理后台监听模式

**核心原则：日志监听和报错监听交给子代理，不阻塞主代理写代码。**

### 开发会话启动时（主代理执行一次）

```
start_monitor(type="error") → errorMonitorId   # 交给「报错子代理」
start_monitor(type="log")   → logMonitorId     # 交给「日志子代理」
```

### 报错子代理（独立运行，循环执行）

```
loop:
  result = poll_monitor(errorMonitorId)
  if result.hasAlert:
    → 立即通知主代理：result.alertSummary
    → 主代理暂停当前任务，优先处理报错
  sleep(3000ms)   # 每 3 秒轮询一次
```

### 日志子代理（独立运行，循环执行）

```
loop:
  result = poll_monitor(logMonitorId)
  if result.hasAlert:
    → 汇总 result.newEvents 中 warn/error，通知主代理
  elif result.newEvents.length > 0:
    → 静默积累，供主代理需要时查询
  sleep(5000ms)   # 每 5 秒轮询一次
```

### 主代理收到告警后的处理

```
1. 暂停当前节点开发
2. get_console_logs(level="error") 获取完整错误上下文
3. 定位 + 修复
4. verify_checkpoint 重新验证当前节点
5. 继续开发
```

### 会话结束时

```
stop_monitor(errorMonitorId)
stop_monitor(logMonitorId)
```

### 架构示意

```
┌─────────────────────────────────────┐
│           主代理（写代码）            │
│  verify_checkpoint  →  继续开发      │
│         ↑ 收到告警，暂停处理          │
└────────────┬────────────────────────┘
             │ 告警通知
    ┌────────┴──────────┐
    │                   │
┌───▼──────┐      ┌─────▼─────┐
│ 报错子代理 │      │ 日志子代理  │
│poll_monitor│     │poll_monitor│
│(error)    │      │(log)      │
│每 3s 轮询  │      │每 5s 轮询  │
└───────────┘      └───────────┘
         ↑               ↑
    MCP 进程内 watcher 注册表（游标推进）
         ↓               ↓
    openLog Server API（/logs?since=cursor）
```

---

## 各节点检查速查表

| 功能节点 | 推荐 expects 配置 |
|---------|-----------------|
| DOM 渲染完成 | `js: [{ code: "!!document.querySelector('#el')" }]` |
| 表单校验触发 | `logs: [{ contains: "validate", level: "log" }]` |
| 接口调用 | `network: [{ urlPattern: "/api/xxx", status: 200 }]` |
| 登录成功 | `storage: [{ key: "token" }]` + `js: location.pathname` |
| 错误处理 | `logs: [{ contains: "错误提示文案" }]` + `noErrors: false` |
| 页面跳转 | `js: [{ code: "location.pathname === '/xxx'" }]` |
| 数据渲染 | `js: [{ code: "document.querySelectorAll('.item').length > 0" }]` |
