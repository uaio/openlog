# openLog 完整调试流程指南（小白版）

> openLog 有三种使用方式，由简到繁。你可以只用其中一种，也可以组合使用。

---

## 总览：三种模式对比

```
┌───────────────┬──────────────────────┬────────────────────┬───────────────────────────────┐
│               │  模式 A: 仅 SDK      │  模式 B: SDK + PC  │  模式 C: SDK + Claude Code    │
├───────────────┼──────────────────────┼────────────────────┼───────────────────────────────┤
│  需要安装     │  一行 <script>       │  npx @openlog/cli       │  npx @openlog/cli init             │
│  调试面板     │  手机上 Eruda 浮球    │  电脑浏览器 PC 面板 │  Claude Code 直接读取数据      │
│  网络要求     │  无                  │  手机电脑同局域网   │  同左                         │
│  适合场景     │  快速看日志/报错      │  远程监控/团队协作   │  AI 自动验证/排错             │
│  数据去向     │  手机本地 Eruda      │  → PC 实时展示      │  → Claude Code 通过 MCP 查询  │
└───────────────┴──────────────────────┴────────────────────┴───────────────────────────────┘
```

---

## 模式 A：仅 SDK（最简单，10 秒上手）

### 你会得到什么

手机页面左下角出现一个调试浮球，点开后看到完整的控制台、网络请求、存储、DOM 树 —— 跟 Chrome DevTools 类似。

### 安装步骤

在你的 H5 页面 `<head>` 或 `<body>` 末尾加一行：

```html
<script src="https://unpkg.com/@openlog/sdk@latest/dist/openlog.iife.js"></script>
<script>
  OpenLog.init({ projectId: 'my-app', lang: 'zh' })
</script>
```

**没有 `server` 参数 → SDK 不会连接远端，只启动本地 Eruda 面板。**

### 使用流程

```
1. 把上面代码加到你的 H5 页面
2. 手机打开页面
3. 看到左下角绿色浮球 → 点击展开
4. 查看 Console / Network / Elements / Storage 等 Tab
5. 调试完毕 → 删掉那两行 <script>
```

### 适合什么场景

- 手机上白屏了，想看报错信息
- 想确认某个接口有没有调通
- 不方便连 WiFi，纯本地快速排查

---

## 模式 B：SDK + PC 监控面板（远程调试）

### 你会得到什么

手机上的所有日志、网络请求、存储、性能数据 **实时同步到电脑浏览器**。支持多设备同时接入。

### 安装步骤

#### 第一步：电脑上启动服务（零安装）

```bash
npx @openlog/cli
```

启动后终端会打印：

```
┌─────────────────────────────────────────┐
│         openLog  已启动 🚀               │
├─────────────────────────────────────────┤
│  PC 监控面板                             │
│    本机:   http://localhost:38291        │
│  局域网：                                │
│    en0          http://192.168.1.5:38291 │
│                 SDK server: 'ws://192.168.1.5:38291' │
├─────────────────────────────────────────┤
│  SDK 接入：                              │
│  <script src="https://unpkg.com/@openlog/sdk@latest/dist/openlog.iife.js"></script>
│  <script>                                │
│    OpenLog.init({                        │
│      projectId: 'my-app',               │
│      server: 'ws://192.168.1.5:38291',  │
│      lang: 'zh'                          │
│    })                                    │
│  </script>                               │
└─────────────────────────────────────────┘
```

**直接复制终端里打印的代码就行。** IP 地址已经帮你填好了。

#### 第二步：H5 页面接入 SDK

把终端打印的代码粘贴到你的 H5 页面：

```html
<script src="https://unpkg.com/@openlog/sdk@latest/dist/openlog.iife.js"></script>
<script>
  OpenLog.init({
    projectId: 'my-app',
    server: 'ws://192.168.1.5:38291',   // ← 换成你终端显示的地址
    lang: 'zh'
  })
</script>
```

**有了 `server` 参数 → SDK 会通过 WebSocket 把数据发到你电脑上。**

> 也可以用 npm 方式：
> ```bash
> npm install @openlog/sdk
> ```
> ```javascript
> import OpenLog from '@openlog/sdk'
> new OpenLog({ projectId: 'my-app', server: 'ws://192.168.1.5:38291', lang: 'zh' })
> ```

#### 第三步：电脑打开 PC 面板

浏览器访问 `http://localhost:38291`（或终端显示的地址）。

### 使用流程

```
1. 电脑：npx @openlog/cli                    → 服务启动
2. H5 页面：粘贴 SDK 代码                → SDK 连接服务
3. 手机：打开 H5 页面                    → 设备出现在 PC 面板左侧
4. 电脑：选中设备                        → 看到实时日志/网络/存储/性能
5. 在手机上操作                          → PC 面板实时刷新
6. 电脑可以：远程执行 JS / 截图 / Mock 接口 / 模拟弱网
7. 调试完毕：Ctrl+C 停止服务 + 删除 SDK 代码
```

### PC 面板有什么

| Tab | 功能 |
|-----|------|
| 📝 控制台 | 实时日志 + 远程执行 JS + 日志导出 |
| 🌐 网络 | 请求瀑布流，看请求体/响应体/耗时 |
| 💾 存储 | localStorage / sessionStorage / Cookie 查看和修改 |
| 🌲 Element | DOM 树结构 |
| 📊 Performance | FPS 曲线 + Web Vitals + 长任务 + 资源加载 |
| 🏁 跑分 | 性能评分（A/B/C 等级 + 问题建议 + 历史对比） |
| 🎭 Mock | API Mock 规则管理 |
| 🩺 健康 | 页面健康检查（错误数/内存/Vitals 综合评分） |
| 🤖 AI 分析 | 汇总数据，生成问题清单和优化建议 |

### 常见问题

**Q: 手机和电脑不在同一 WiFi 怎么办？**
A: 确保它们在同一局域网。终端打印了所有网卡地址，选手机能访问到的那个。

**Q: 换端口？**
A: `npx @openlog/cli -p 8080`

---

## 模式 C：SDK + Claude Code（AI 辅助调试）

### 你会得到什么

Claude Code 通过 MCP 直接读取手机上的日志、网络请求、截图，帮你自动排错。**不需要手动打开 PC 面板** —— Claude 就是你的调试面板。你写代码时 AI 会在真机上验证每个功能节点。

### 安装步骤

#### 第一步：配置 MCP（一次性，以后不用再做）

```bash
npx @openlog/cli init
```

这条命令会：
- **自动检测** 你装了哪些 AI 工具（Claude Code / Cursor / Windsurf）
- **自动写入** MCP 配置文件
- 如果是 Claude Code，还会安装 7 个 **slash commands**

> 也可以指定：`npx @openlog/cli init --for=claude`

**然后重启 Claude Code。**

#### 第二步：在 Claude Code 里开始

直接输入：

```
/openlog:setup
```

这条命令会自动完成所有事情：
1. 启动 openLog 监控服务
2. 检测你的项目是否已接入 SDK
3. 如果没有 → 自动注入（HTML 项目直接注入 CDN；npm 项目帮你 install + 插入代码）
4. 等待设备连接
5. 报告就绪状态

**你只需要在手机上打开 H5 页面，剩下的 Claude 全搞定。**

### 所有 slash commands

| 命令 | 干什么 |
|------|--------|
| `/openlog:setup` | **一键从零到就绪**（检测→注入→启动→确认连接） |
| `/openlog:start` | 启动监控服务 |
| `/openlog:stop` | 停止监控服务 |
| `/openlog:status` | 查看设备连接状态 |
| `/openlog:logs` | 查看日志 + checkpoint 验证链路 |
| `/openlog:screenshot` | 截取手机当前页面 |
| `/openlog:clean` | 清除代码中所有 @openlog 调试日志 |

### AI 开发调试流程

```
你                        Claude Code                   手机
│                              │                          │
│  /openlog:setup              │                          │
│ ───────────────────────────► │ ensure_sdk → 注入 SDK    │
│                              │ start_openlog → 启动服务  │
│                              │────── WS 连接 ──────────►│
│                              │                          │
│  "帮我写登录功能"             │                          │
│ ───────────────────────────► │ 写代码                   │
│                              │ + 埋入 @openlog 验证日志  │
│ ◄─────────────────────────── │                          │
│                              │                          │
│  (手机上走登录流程)            │                     SDK 上报
│                              │ ◄────────────────────────│
│                              │                          │
│  "验证一下"                   │                          │
│ ───────────────────────────► │ get_checkpoints("login") │
│ ◄─────────────────────────── │ ✅ 5 个节点全部命中       │
│                              │                          │
│  "有个报错帮我看看"           │                          │
│ ───────────────────────────► │ get_console_logs("error") │
│                              │ + get_network_requests()  │
│ ◄─────────────────────────── │ 定位到 API 返回 401       │
│                              │                          │
│  /openlog:clean              │                          │
│ ───────────────────────────► │ 删除所有 @openlog 日志    │
```

### Claude 可以调用的核心工具

**查数据：**
- `get_console_logs` — 查日志（可按 level 过滤：error/warn/log）
- `get_network_requests` — 查网络请求（URL/状态码/耗时/请求体/响应体）
- `get_storage` — 查 localStorage / sessionStorage / Cookie
- `get_checkpoints` — 查 @openlog[checkpoint] 验证节点
- `take_screenshot` — 截图
- `health_check` — 页面健康评分

**控设备：**
- `execute_js` — 远程执行 JS（在手机上跑代码）
- `reload_page` — 刷新页面
- `set_storage` / `clear_storage` — 修改存储
- `network_throttle` — 模拟弱网
- `add_mock` / `remove_mock` — Mock 接口返回

**自动检测：**
- `ensure_sdk` — 检测项目是否已接入 SDK，没有则自动注入

### 典型排错场景

**场景 1：页面白屏**
```
你: "手机打开页面白屏了"
Claude: 调 get_console_logs(level: "error")
       → 发现 "Cannot read property 'map' of undefined"
       → 调 get_network_requests()
       → 发现 /api/list 返回 500
       → 定位到服务端问题，建议修复
```

**场景 2：逻辑验证**
```
你: "帮我写一个登录功能"
Claude: 写代码 + 在关键节点埋入 @openlog[checkpoint] 日志
你: 在手机上走一遍登录流程
Claude: 调 get_checkpoints(feature: "login")
       → 发现 "token 已保存" 节点存在但 hasToken: false
       → 定位到 localStorage.setItem 写入了空值
       → 修复代码 → 重新验证 → 通过 → 清除 @openlog 日志
```

**场景 3：性能问题**
```
你: "页面打开太慢"
Claude: 调 health_check() → 健康分 45/100
       → 调 get_perf_report() → LCP 4.2s, 3 个长任务 > 200ms
       → 截图 take_screenshot() 确认首屏内容
       → 给出优化建议：图片懒加载 + 拆分大组件 + API 预加载
```

---

## 完整对比：什么时候用哪个

| 场景 | 推荐模式 | 理由 |
|------|----------|------|
| 手机上快速看一下报错 | A（仅 SDK） | 不需要电脑，加一行代码就行 |
| 联调接口，看请求详情 | B（SDK + PC） | PC 上看请求体/响应体更方便 |
| 多人协作，QA 反馈问题 | B（SDK + PC） | 多台手机同时接入，PC 面板统一查看 |
| AI 帮我写代码并验证 | C（SDK + Claude Code） | Claude 自动在真机上验证每个节点 |
| 追踪复杂逻辑 bug | C（SDK + Claude Code） | AI 自动关联日志/网络/存储综合分析 |
| 性能优化 | B 或 C | 跑分 + Vitals + 长任务分析 |

---

## 注意事项

1. **openLog 是开发工具，不要带到生产环境**
   - CDN `<script>` 标签：调试完删掉
   - npm 安装：生产打包时排除，或用环境变量 guard
   - `@openlog[checkpoint]` 日志：用 `/openlog:clean` 自动清除

2. **手机和电脑必须在同一局域网**（模式 B/C）
   - 连同一个 WiFi 最简单
   - 不在同一 WiFi？看终端打印的多个网卡地址，选手机能访问到的

3. **模式 B 和模式 C 可以同时用**
   - 如果你在用 Claude Code（模式 C）的同时也想看 PC 面板，打开 `http://localhost:38291` 即可
   - 服务是同一个，两边看到的数据一样

4. **端口默认 38291**
   - 被占用？`npx @openlog/cli -p 8080` 换一个
