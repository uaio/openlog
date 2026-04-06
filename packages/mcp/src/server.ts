import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { listDevices, getConsoleLogs, getNetworkRequests, watchLogs, getStorage, getPageContext, executeJs, takeScreenshot, reloadPage, setStorage, clearStorage, highlightElement, zenMode, networkThrottle, addMock, removeMock, clearMocks, healthCheck, aiAnalyze, startPerfRun, stopPerfRun, getPerfReport, verifyCheckpoint, startMonitor, pollMonitor, stopMonitor, listMonitors, initDevSession, startOpenlog, stopOpenlog, getCheckpoints } from './tools/index.js';
import { startEmbeddedServer, stopEmbeddedServer, type EmbeddedServerConfig } from './launcher.js';
import { wsClient } from './ws-client.js';
import { API_BASE_URL } from './config.js';

interface ToolArgs {
  [key: string]: unknown;
}

interface GetConsoleLogsArgs {
  deviceId: string;
  limit?: number;
  level?: 'log' | 'warn' | 'error' | 'info';
}

let isShuttingDown = false;

async function gracefulShutdown(server: Server, signal: string): Promise<void> {
  if (isShuttingDown) {
    console.error(`[${signal}] Already shutting down, forcing exit`);
    process.exit(1);
  }

  isShuttingDown = true;
  console.error(`[${signal}] Starting graceful shutdown...`);

  try {
    await server.close();
    console.error('[shutdown] MCP Server closed');

    // 停止内嵌服务器
    await stopEmbeddedServer();

    console.error('[shutdown] Shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('[shutdown] Error during shutdown:', error);
    process.exit(1);
  }
}

function setupGlobalErrorHandlers(server: Server): void {
  // 处理未捕获的异常
  process.on('uncaughtException', (error) => {
    console.error('[uncaughtException]', error);
    gracefulShutdown(server, 'uncaughtException').catch(() => {
      process.exit(1);
    });
  });

  // 处理未处理的 Promise 拒绝
  process.on('unhandledRejection', (reason, promise) => {
    console.error('[unhandledRejection]', 'Unhandled Promise Rejection at:', promise, 'reason:', reason);
    gracefulShutdown(server, 'unhandledRejection').catch(() => {
      process.exit(1);
    });
  });

  // 处理 SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    console.error('[SIGINT] Received interrupt signal');
    gracefulShutdown(server, 'SIGINT').catch(() => {
      process.exit(1);
    });
  });

  // 处理 SIGTERM
  process.on('SIGTERM', () => {
    console.error('[SIGTERM] Received termination signal');
    gracefulShutdown(server, 'SIGTERM').catch(() => {
      process.exit(1);
    });
  });
}

export async function startMCPServer(config?: EmbeddedServerConfig): Promise<void> {
  const server = new Server(
    {
      name: 'openlog-mcp',
      version: '0.1.0'
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  // 设置全局错误处理器
  setupGlobalErrorHandlers(server);

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
        },
        {
          name: getNetworkRequests.name,
          description: getNetworkRequests.description,
          inputSchema: getNetworkRequests.inputSchema
        },
        {
          name: watchLogs.name,
          description: watchLogs.description,
          inputSchema: watchLogs.inputSchema
        },
        {
          name: getStorage.name,
          description: getStorage.description,
          inputSchema: getStorage.inputSchema
        },
        {
          name: getPageContext.name,
          description: getPageContext.description,
          inputSchema: getPageContext.inputSchema
        },
        {
          name: executeJs.name,
          description: executeJs.description,
          inputSchema: executeJs.inputSchema
        },
        {
          name: takeScreenshot.name,
          description: takeScreenshot.description,
          inputSchema: takeScreenshot.inputSchema
        },
        {
          name: reloadPage.name,
          description: reloadPage.description,
          inputSchema: reloadPage.inputSchema
        },
        {
          name: setStorage.name,
          description: setStorage.description,
          inputSchema: setStorage.inputSchema
        },
        {
          name: clearStorage.name,
          description: clearStorage.description,
          inputSchema: clearStorage.inputSchema
        },
        {
          name: highlightElement.name,
          description: highlightElement.description,
          inputSchema: highlightElement.inputSchema
        },
        {
          name: zenMode.name,
          description: zenMode.description,
          inputSchema: zenMode.inputSchema
        },
        {
          name: networkThrottle.name,
          description: networkThrottle.description,
          inputSchema: networkThrottle.inputSchema
        },
        {
          name: addMock.name,
          description: addMock.description,
          inputSchema: addMock.inputSchema
        },
        {
          name: clearMocks.name,
          description: clearMocks.description,
          inputSchema: clearMocks.inputSchema
        },
        {
          name: removeMock.name,
          description: removeMock.description,
          inputSchema: removeMock.inputSchema
        },
        {
          name: startPerfRun.name,
          description: startPerfRun.description,
          inputSchema: startPerfRun.inputSchema
        },
        {
          name: stopPerfRun.name,
          description: stopPerfRun.description,
          inputSchema: stopPerfRun.inputSchema
        },
        {
          name: getPerfReport.name,
          description: getPerfReport.description,
          inputSchema: getPerfReport.inputSchema
        },
        {
          name: healthCheck.name,
          description: healthCheck.description,
          inputSchema: healthCheck.inputSchema
        },
        {
          name: aiAnalyze.name,
          description: aiAnalyze.description,
          inputSchema: aiAnalyze.inputSchema
        },
        {
          name: verifyCheckpoint.name,
          description: verifyCheckpoint.description,
          inputSchema: verifyCheckpoint.inputSchema
        },
        {
          name: startMonitor.name,
          description: startMonitor.description,
          inputSchema: startMonitor.inputSchema
        },
        {
          name: pollMonitor.name,
          description: pollMonitor.description,
          inputSchema: pollMonitor.inputSchema
        },
        {
          name: stopMonitor.name,
          description: stopMonitor.description,
          inputSchema: stopMonitor.inputSchema
        },
        {
          name: listMonitors.name,
          description: listMonitors.description,
          inputSchema: listMonitors.inputSchema
        },
        {
          name: initDevSession.name,
          description: initDevSession.description,
          inputSchema: initDevSession.inputSchema
        },
        {
          name: startOpenlog.name,
          description: startOpenlog.description,
          inputSchema: startOpenlog.inputSchema
        },
        {
          name: stopOpenlog.name,
          description: stopOpenlog.description,
          inputSchema: stopOpenlog.inputSchema
        },
        {
          name: getCheckpoints.name,
          description: getCheckpoints.description,
          inputSchema: getCheckpoints.inputSchema
        }
      ]
    };
  });

  // MCP Prompts — Claude Code 连接时自动载入，无需 CLAUDE.md
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: [
        {
          name: 'openlog_dev_workflow',
          description: 'openLog H5 开发自动验证工作流 SOP。开始开发 H5 功能时自动参考此流程。'
        }
      ]
    };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    if (request.params.name === 'openlog_dev_workflow') {
      return {
        description: 'openLog H5 开发工作流 — AI 埋点验证 SOP',
        messages: [
          {
            role: 'user' as const,
            content: {
              type: 'text' as const,
              text: `# openLog 开发工作流（自动加载）

你在开发 H5 页面功能时，必须遵循以下工作流，通过 openLog 在真实设备上验证每个关键节点。

---

## 核心原则

**在代码关键节点埋入 @openlog checkpoint 日志 → 用户跑一遍 → 读取验证 → 验证通过后清除**

这比写单元测试更直接：在真实设备上验证真实行为。

---

## 标准埋点格式

\`\`\`js
// 格式：console.log('@openlog[checkpoint] 节点名: 描述', { 可选附加数据 })
console.log('@openlog[checkpoint] login: 用户点击登录按钮')
console.log('@openlog[checkpoint] login: 接口请求发出', { url: '/api/login', method: 'POST' })
console.log('@openlog[checkpoint] login: 响应成功', { status: 200 })
console.log('@openlog[checkpoint] login: token 已写入', { hasToken: !!localStorage.getItem('token') })
\`\`\`

**规则：**
- 前缀固定为 \`@openlog[checkpoint]\`，openLog 专门识别此前缀
- 节点名用功能名命名（login / cart / payment 等）
- 描述清晰说明当前步骤
- 附加数据帮助判断状态是否正确
- **所有带 @openlog 前缀的 log 在验证完成后必须清除**

---

## 开发步骤

### 1. 开始前
确认监控已启动（/openlog:start），有设备在线：调用 list_devices

### 2. 写代码时（同步埋点）
在每个关键节点加入 @openlog checkpoint 日志：
- 用户操作触发点（点击、提交）
- 异步操作发起点（接口请求前）
- 异步操作完成点（接口响应后）
- 状态变更点（数据写入、页面跳转）
- 异常处理点（catch 块里）

### 3. 请用户执行操作
告知用户："请在手机上走一遍【功能名称】流程"

### 4. 读取验证
\`\`\`
get_checkpoints(feature: "login")
\`\`\`
返回：哪些节点被执行、附加数据是否符合预期、缺失的节点

### 5. 判断结果
- ✅ 所有预期节点出现且数据正确 → 功能验证通过 → **执行清除步骤**
- ❌ 某节点缺失 → 该节点前的代码有问题 → 修复后重新验证
- ❌ 附加数据不符合预期 → 逻辑错误 → 修复后重新验证

### 6. 有报错时
\`\`\`
get_console_logs(level: "error")
\`\`\`
结合 checkpoint 链路定位报错位置

### 7. 验证通过后 — 清除 @openlog 日志 ⚠️ 必须执行
验证通过后，在代码文件中搜索并删除所有包含 \`@openlog\` 的 console.log 行：
\`\`\`
grep -r "@openlog" src/ --include="*.js" --include="*.ts" --include="*.vue" -l
\`\`\`
逐文件删除所有 \`console.log('@openlog...')\` 行。
这些是开发期调试日志，不应出现在生产代码中。

---

## 典型示例

**埋点：**
\`\`\`js
async function handleLogin(username, password) {
  console.log('@openlog[checkpoint] login: 开始登录', { username })
  try {
    console.log('@openlog[checkpoint] login: 发起请求')
    const res = await api.login(username, password)
    console.log('@openlog[checkpoint] login: 请求成功', { status: res.status })
    localStorage.setItem('token', res.data.token)
    console.log('@openlog[checkpoint] login: token 已保存', { hasToken: true })
    router.push('/home')
    console.log('@openlog[checkpoint] login: 跳转首页')
  } catch (e) {
    console.log('@openlog[checkpoint] login: 请求失败', { error: e.message })
  }
}
\`\`\`

**验证通过后清除，代码变为：**
\`\`\`js
async function handleLogin(username, password) {
  try {
    const res = await api.login(username, password)
    localStorage.setItem('token', res.data.token)
    router.push('/home')
  } catch (e) {
    // handle error
  }
}
\`\`\`

---

**记住：@openlog 日志是开发期工具，验证通过即清除，不进入生产代码。**`
            }
          }
        ]
      };
    }
    throw new Error(`Prompt not found: ${request.params.name}`);
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'list_devices':
          return { content: [{ type: 'text', text: JSON.stringify(await listDevices.execute(args || {}), null, 2) }] };

        case 'get_console_logs': {
          if (!args) {
            throw new Error('get_console_logs requires arguments');
          }
          // 验证必需参数
          if (!args.deviceId || typeof args.deviceId !== 'string') {
            throw new Error('get_console_logs requires a valid deviceId');
          }
          // 类型安全的参数构建
          const logsArgs: GetConsoleLogsArgs = {
            deviceId: args.deviceId,
            limit: typeof args.limit === 'number' ? args.limit : undefined,
            level: typeof args.level === 'string' && ['log', 'warn', 'error', 'info'].includes(args.level)
              ? args.level as 'log' | 'warn' | 'error' | 'info'
              : undefined
          };
          return { content: [{ type: 'text', text: JSON.stringify(await getConsoleLogs.execute(logsArgs), null, 2) }] };
        }

        case 'get_network_requests': {
          const networkArgs = {
            deviceId: typeof args?.deviceId === 'string' ? args.deviceId : undefined,
            limit: typeof args?.limit === 'number' ? args.limit : undefined,
            method: typeof args?.method === 'string' ? args.method : undefined,
            urlPattern: typeof args?.urlPattern === 'string' ? args.urlPattern : undefined,
            status: typeof args?.status === 'number' ? args.status : undefined
          };
          return { content: [{ type: 'text', text: JSON.stringify(await getNetworkRequests.execute(networkArgs), null, 2) }] };
        }

        case 'watch_logs': {
          // 解析 levels 数组
          let levels: ('log' | 'warn' | 'error' | 'info')[] | undefined;
          if (Array.isArray(args?.levels)) {
            const validLevels = ['log', 'warn', 'error', 'info'];
            levels = args.levels.filter((l: unknown): l is 'log' | 'warn' | 'error' | 'info' =>
              typeof l === 'string' && validLevels.includes(l)
            );
            if (levels.length === 0) levels = undefined;
          }

          const watchArgs = {
            deviceId: typeof args?.deviceId === 'string' ? args.deviceId : undefined,
            levels,
            since: typeof args?.since === 'number' ? args.since : undefined,
            limit: typeof args?.limit === 'number' ? args.limit : undefined
          };
          return { content: [{ type: 'text', text: JSON.stringify(await watchLogs.execute(watchArgs), null, 2) }] };
        }

        case 'get_storage': {
          const storageArgs = {
            deviceId: typeof args?.deviceId === 'string' ? args.deviceId : undefined,
            type: typeof args?.type === 'string' ? args.type as 'all' | 'localStorage' | 'sessionStorage' | 'cookies' : undefined
          };
          return { content: [{ type: 'text', text: JSON.stringify(await getStorage.execute(storageArgs), null, 2) }] };
        }

        case 'get_page_context': {
          const ctxArgs = {
            deviceId: typeof args?.deviceId === 'string' ? args.deviceId : undefined,
            logLimit: typeof args?.logLimit === 'number' ? args.logLimit : undefined,
            requestLimit: typeof args?.requestLimit === 'number' ? args.requestLimit : undefined,
            includeStorage: typeof args?.includeStorage === 'boolean' ? args.includeStorage : undefined
          };
          return { content: [{ type: 'text', text: JSON.stringify(await getPageContext.execute(ctxArgs), null, 2) }] };
        }

        case 'execute_js': {
          const jsArgs = args as { code: string; deviceId?: string };
          if (!jsArgs?.code) throw new Error('execute_js requires code argument');
          const result = await executeJs.execute(jsArgs);
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        case 'take_screenshot': {
          const ssArgs = args as { deviceId?: string };
          const ssResult = await takeScreenshot.execute(ssArgs);
          return { content: [{ type: 'text', text: JSON.stringify({ ...ssResult, dataUrl: ssResult.dataUrl.slice(0, 80) + '...' }, null, 2) }] };
        }

        case 'reload_page': {
          const r = await reloadPage.execute(args as { deviceId?: string });
          return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
        }

        case 'set_storage': {
          const sa = args as { key: string; value?: string; storageType?: string; deviceId?: string };
          if (!sa?.key) throw new Error('set_storage requires key argument');
          const r = await setStorage.execute(sa);
          return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
        }

        case 'clear_storage': {
          const r = await clearStorage.execute(args as { storageType?: string; deviceId?: string });
          return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
        }

        case 'highlight_element': {
          const ha = args as { selector: string; duration?: number; deviceId?: string };
          if (!ha?.selector) throw new Error('highlight_element requires selector argument');
          const r = await highlightElement.execute(ha);
          return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
        }

        case 'zen_mode': {
          const za = args as { enabled: boolean; deviceId?: string };
          if (typeof za?.enabled !== 'boolean') throw new Error('zen_mode requires enabled (boolean)');
          const r = await zenMode.execute(za);
          return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
        }

        case 'network_throttle': {
          const r = await networkThrottle.execute(args as { preset: string; deviceId?: string });
          return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
        }

        case 'add_mock': {
          const r = await addMock.execute(args as { pattern: string; body: string; method?: string; status?: number; deviceId?: string });
          return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
        }

        case 'clear_mocks': {
          const r = await clearMocks.execute(args as { deviceId?: string });
          return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
        }

        case 'remove_mock': {
          const r = await removeMock.execute(args as { mockId: string; deviceId?: string });
          return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
        }

        case 'start_perf_run': {
          const r = await startPerfRun.execute(args as { deviceId?: string });
          return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
        }

        case 'stop_perf_run': {
          const r = await stopPerfRun.execute(args as { deviceId?: string });
          return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
        }

        case 'get_perf_report': {
          const r = await getPerfReport.execute(args as { deviceId?: string; sessionId?: string });
          return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
        }

        case 'health_check': {
          const r = await healthCheck.execute(args as { deviceId?: string });
          return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
        }

        case 'ai_analyze': {
          const r = await aiAnalyze.execute(args as { deviceId?: string; logLimit?: number });
          return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
        }

        case 'verify_checkpoint': {
          const r = await verifyCheckpoint.execute(args as {
            checkpoint: string;
            triggerJs?: string;
            waitMs?: number;
            expects?: import('./tools/verify_checkpoint.js').CheckpointExpect;
            deviceId?: string;
          });
          return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
        }

        case 'start_monitor': {
          const r = await startMonitor.execute(args as { type: 'error' | 'log'; deviceId?: string });
          return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
        }

        case 'poll_monitor': {
          const r = await pollMonitor.execute(args as { monitorId: string });
          return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
        }

        case 'stop_monitor': {
          const r = await stopMonitor.execute(args as { monitorId: string });
          return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
        }

        case 'list_monitors': {
          const r = await listMonitors.execute({} as Record<string, never>);
          return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
        }

        case 'init_dev_session': {
          const r = await initDevSession.execute(args as { deviceId?: string });
          return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
        }

        case 'start_openlog': {
          const r = await startOpenlog.execute(args as { port?: number; openBrowser?: boolean });
          return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
        }

        case 'stop_openlog': {
          const r = await stopOpenlog.execute(args as Record<string, never>);
          return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
        }

        case 'get_checkpoints': {
          const r = await getCheckpoints.execute(args as { deviceId?: string; feature?: string; limit?: number });
          return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      // 工具执行错误处理
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[Tool Error] ${name}:`, errorMessage);
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: errorMessage, tool: name }, null, 2) }],
        isError: true
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('openLog MCP Server running on stdio — use /openlog:start to begin monitoring');
}
