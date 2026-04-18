import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { listDevices, getConsoleLogs, getNetworkRequests, watchLogs, getStorage, getPageContext, executeJs, takeScreenshot, reloadPage, setStorage, clearStorage, highlightElement, zenMode, networkThrottle, addMock, removeMock, clearMocks, healthCheck, aiAnalyze, startPerfRun, stopPerfRun, getPerfReport, verifyCheckpoint, startMonitor, pollMonitor, stopMonitor, listMonitors, focusDevice, initDevSession, startOpenlog, stopOpenlog, getCheckpoints, ensureSdk } from './tools/index.js';
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
        tools: {},
        prompts: {}
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
          name: focusDevice.name,
          description: focusDevice.description,
          inputSchema: focusDevice.inputSchema
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
        },
        {
          name: ensureSdk.name,
          description: ensureSdk.description,
          inputSchema: ensureSdk.inputSchema
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
        description: 'openLog H5 development workflow — auto-detection + checkpoint verification SOP',
        messages: [
          {
            role: 'user' as const,
            content: {
              type: 'text' as const,
              text: `# openLog Development Workflow (auto-loaded)

When developing H5 pages, follow this workflow to verify every key node on real devices via openLog.

---

## Step 0: Auto-detect & Inject SDK (ALWAYS do this first)

Before any monitoring/debugging, call \`ensure_sdk\` to check if the user's project has the openLog SDK:

\`\`\`
ensure_sdk(mode: "auto")
\`\`\`

- If \`detected: true\` → SDK is ready, proceed to Step 1.
- If \`detected: false\` → Read the \`instructions\` and \`injectionCode\` fields:
  - For **HTML projects**: call \`ensure_sdk(mode: "inject")\` to auto-inject the CDN snippet.
  - For **npm projects** (React/Vue/Next.js/etc): install the package (\`npm install @openlog/sdk\`) and insert the init code into the entry file yourself.
  - The \`serverAddresses\` field lists all available LAN IPs for mobile connection.

**Important**: The SDK injection is for development only. CDN script tags should be removed after debugging. npm dependencies can stay but \`OpenLog.init()\` should be removed or guarded by \`process.env.NODE_ENV !== 'production'\`.

---

## Step 1: Start Monitoring

Call \`start_openlog\` — it will start the server AND auto-run ensure_sdk detection.

---

## Core Principle

**Embed @openlog checkpoint logs at key code nodes → User runs the flow on device → Read & verify → Clean up after passing**

This is more direct than unit tests: verify real behavior on real devices.

---

## Checkpoint Format

\`\`\`js
// Format: console.log('@openlog[checkpoint] featureName: step description', { optional data })
console.log('@openlog[checkpoint] login: user clicked login', { username })
console.log('@openlog[checkpoint] login: API request sent', { url: '/api/login', method: 'POST' })
console.log('@openlog[checkpoint] login: response received', { status: 200 })
console.log('@openlog[checkpoint] login: token saved', { hasToken: !!localStorage.getItem('token') })
\`\`\`

**Rules:**
- Prefix is always \`@openlog[checkpoint]\` — openLog specifically recognizes this
- Name checkpoints by feature (login / cart / payment)
- Describe each step clearly
- Attach data to help verify correctness
- **All @openlog logs MUST be removed after verification passes**

---

## Development Steps

### 1. Before coding
Confirm monitoring is started (\`start_openlog\` or /openlog:start), device is online: call \`list_devices\`
- If multiple devices connected, call \`focus_device(deviceId)\` to lock the target device for this session
- All subsequent tool calls will auto-target the focused device

### 2. While coding (embed checkpoints)
Add @openlog checkpoint logs at every key node:
- User action triggers (click, submit)
- Async operation start (before API call)
- Async operation complete (after response)
- State changes (data write, page navigation)
- Error handling (in catch blocks)

### 3. Ask user to execute
Tell user: "Please run the [feature] flow on your phone"

### 4. Verify
\`\`\`
get_checkpoints(feature: "login")
\`\`\`
Returns: which nodes executed, whether attached data matches expectations, missing nodes

### 5. Judge results
- ✅ All expected nodes present with correct data → Verified → **Execute cleanup**
- ❌ A node is missing → Code before that node has issues → Fix and re-verify
- ❌ Attached data doesn't match → Logic error → Fix and re-verify

### 6. On errors
\`\`\`
get_console_logs(level: "error")
\`\`\`
Cross-reference with checkpoint chain to locate the error

### 7. After verification passes — Clean up @openlog logs ⚠️ MANDATORY
Search and delete all console.log lines containing \`@openlog\`:
\`\`\`
grep -r "@openlog" src/ --include="*.js" --include="*.ts" --include="*.vue" --include="*.tsx" --include="*.jsx" -l
\`\`\`
Delete all \`console.log('@openlog...')\` lines from each file.

**For CDN-injected SDK**: also remove the \`<script>\` tags that were added by ensure_sdk.
**For npm-installed SDK**: keep the dependency but remove or guard \`OpenLog.init()\`.

These are development-time debug logs and must NOT ship to production.

---

**Remember: @openlog logs are dev tools — clean up after verification, never ship to production.**`
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

        case 'focus_device':
          return { content: [{ type: 'text', text: JSON.stringify(await focusDevice.execute(args as any || {}), null, 2) }] };

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

        case 'ensure_sdk': {
          const r = await ensureSdk.execute(args as { projectDir?: string; mode?: 'check' | 'inject' | 'auto'; server?: string });
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
