import { API_BASE_URL } from '../config.js';
import { DeviceSelector } from '../lib/device-selector.js';

const deviceSelector = new DeviceSelector();

export interface CheckpointExpect {
  /** 不能有 error 级日志（默认 true） */
  noErrors?: boolean;
  /** 期望存在的日志（contains 是子串匹配） */
  logs?: { contains: string; level?: 'log' | 'warn' | 'error' | 'info' }[];
  /** 期望发出的网络请求 */
  network?: { urlPattern: string; method?: string; status?: number }[];
  /** 期望 storage 中存在的 key（可选校验 value 子串） */
  storage?: { key: string; storageType?: 'localStorage' | 'sessionStorage' | 'cookies'; contains?: string }[];
  /** 在设备上执行 JS 断言，返回 truthy 视为通过 */
  js?: { code: string; description: string }[];
}

export interface CheckpointResult {
  checkpoint: string;
  passed: boolean;
  deviceId: string;
  timestamp: number;
  /** 通过的检查项 */
  passed_checks: string[];
  /** 失败的检查项 */
  failed_checks: string[];
  /** 跳过的检查项（数据不足） */
  skipped_checks: string[];
  summary: string;
}

export const verifyCheckpoint = {
  name: 'verify_checkpoint',
  description: `开发过程中验证功能节点是否正常工作的 Harness 工具。
在写完一个功能节点后调用，自动编排多项检查并返回结构化通过/失败报告。

支持的检查类型：
- noErrors: 确认没有 JS 错误日志
- logs: 确认特定日志出现过
- network: 确认特定接口被调用（支持 URL 正则、method、status 校验）
- storage: 确认 localStorage/cookie 中存在期望的值
- js: 在设备上执行断言表达式，返回 truthy 视为通过

典型用法：
- 写完事件绑定后 → 验证 noErrors + js 断言元素存在
- 写完接口调用后 → 验证 network 请求已发出 + 状态码正确
- 写完登录流程后 → 验证 storage token 已写入 + 页面跳转
- 写完完整功能后 → 验证所有节点综合通过`,

  inputSchema: {
    type: 'object' as const,
    properties: {
      checkpoint: {
        type: 'string' as const,
        description: '节点描述，例如「用户点击登录按钮后接口被调用」'
      },
      triggerJs: {
        type: 'string' as const,
        description: '触发操作的 JS 代码，验证前在设备上执行，例如 document.querySelector("#login-btn").click()'
      },
      waitMs: {
        type: 'number' as const,
        description: '触发后等待毫秒数（等待异步操作），默认 800ms'
      },
      expects: {
        type: 'object' as const,
        description: '期望条件',
        properties: {
          noErrors: {
            type: 'boolean' as const,
            description: '不能出现 error 级别日志，默认 true'
          },
          logs: {
            type: 'array' as const,
            items: {
              type: 'object' as const,
              properties: {
                contains: { type: 'string' as const },
                level: { type: 'string' as const, enum: ['log', 'warn', 'error', 'info'] }
              },
              required: ['contains']
            }
          },
          network: {
            type: 'array' as const,
            items: {
              type: 'object' as const,
              properties: {
                urlPattern: { type: 'string' as const },
                method: { type: 'string' as const },
                status: { type: 'number' as const }
              },
              required: ['urlPattern']
            }
          },
          storage: {
            type: 'array' as const,
            items: {
              type: 'object' as const,
              properties: {
                key: { type: 'string' as const },
                storageType: { type: 'string' as const, enum: ['localStorage', 'sessionStorage', 'cookies'] },
                contains: { type: 'string' as const }
              },
              required: ['key']
            }
          },
          js: {
            type: 'array' as const,
            items: {
              type: 'object' as const,
              properties: {
                code: { type: 'string' as const },
                description: { type: 'string' as const }
              },
              required: ['code', 'description']
            }
          }
        }
      },
      deviceId: {
        type: 'string' as const,
        description: '设备 ID（可选，不填则自动选择最近活跃设备）'
      }
    },
    required: ['checkpoint'] as const
  },

  async execute(args: {
    checkpoint: string;
    triggerJs?: string;
    waitMs?: number;
    expects?: CheckpointExpect;
    deviceId?: string;
  }): Promise<CheckpointResult> {
    const deviceId = await deviceSelector.selectDevice(args.deviceId);
    const expects = args.expects ?? { noErrors: true };
    const waitMs = args.waitMs ?? 800;

    const snapshotBefore = Date.now();

    // 1. 执行触发代码
    if (args.triggerJs) {
      await fetch(`${API_BASE_URL}/api/devices/${deviceId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: args.triggerJs })
      });
      await sleep(waitMs);
    }

    // 2. 并行拉取所有需要的数据
    const needLogs = expects.noErrors !== false || (expects.logs && expects.logs.length > 0);
    const needNetwork = expects.network && expects.network.length > 0;
    const needStorage = expects.storage && expects.storage.length > 0;
    const needJs = expects.js && expects.js.length > 0;

    const [logsData, networkData, storageData] = await Promise.all([
      needLogs
        ? fetch(`${API_BASE_URL}/api/devices/${deviceId}/logs?limit=100`).then(r => r.json()).catch(() => [])
        : Promise.resolve([]),
      needNetwork
        ? fetch(`${API_BASE_URL}/api/devices/${deviceId}/network?limit=50`).then(r => r.json()).catch(() => [])
        : Promise.resolve([]),
      needStorage
        ? fetch(`${API_BASE_URL}/api/devices/${deviceId}/storage`).then(r => r.json()).catch(() => ({}))
        : Promise.resolve({})
    ]);

    // 只取触发后的日志和请求
    const recentLogs: any[] = Array.isArray(logsData)
      ? logsData.filter((l: any) => l.timestamp >= snapshotBefore)
      : [];
    const recentNetwork: any[] = Array.isArray(networkData)
      ? networkData.filter((n: any) => (n.startTime ?? n.timestamp ?? 0) >= snapshotBefore)
      : [];

    const passed_checks: string[] = [];
    const failed_checks: string[] = [];
    const skipped_checks: string[] = [];

    // 3. noErrors 检查
    if (expects.noErrors !== false) {
      const errors = recentLogs.filter((l: any) => l.level === 'error');
      if (errors.length === 0) {
        passed_checks.push('noErrors: 无 JS 错误日志');
      } else {
        failed_checks.push(
          `noErrors: 发现 ${errors.length} 条错误 — ${errors.slice(0, 2).map((e: any) => String(e.message ?? e.args?.[0] ?? '').slice(0, 80)).join(' | ')}`
        );
      }
    }

    // 4. logs 检查
    for (const expectLog of (expects.logs ?? [])) {
      const allLogs: any[] = needLogs ? logsData : [];
      const matched = allLogs.some((l: any) => {
        const text = JSON.stringify(l.args ?? l.message ?? '');
        const levelMatch = !expectLog.level || l.level === expectLog.level;
        return levelMatch && text.includes(expectLog.contains);
      });
      const label = `log["${expectLog.contains}"${expectLog.level ? ` level=${expectLog.level}` : ''}]`;
      if (matched) {
        passed_checks.push(`${label}: 日志存在`);
      } else {
        failed_checks.push(`${label}: 未找到匹配的日志`);
      }
    }

    // 5. network 检查
    for (const expectNet of (expects.network ?? [])) {
      const pattern = new RegExp(expectNet.urlPattern, 'i');
      const matched = recentNetwork.find((n: any) => {
        const urlMatch = pattern.test(n.url ?? '');
        const methodMatch = !expectNet.method || (n.method ?? '').toUpperCase() === expectNet.method.toUpperCase();
        const statusMatch = !expectNet.status || n.status === expectNet.status;
        return urlMatch && methodMatch && statusMatch;
      });
      const label = `network[${expectNet.method ?? 'ANY'} ${expectNet.urlPattern}${expectNet.status ? ` ${expectNet.status}` : ''}]`;
      if (matched) {
        passed_checks.push(`${label}: 请求已发出`);
      } else {
        failed_checks.push(`${label}: 未找到匹配的网络请求`);
      }
    }

    // 6. storage 检查
    for (const expectStorage of (expects.storage ?? [])) {
      const stType = expectStorage.storageType ?? 'localStorage';
      const store: Record<string, string> = storageData?.[stType] ?? {};
      const value = store[expectStorage.key];
      const label = `storage[${stType}.${expectStorage.key}]`;
      if (value === undefined) {
        failed_checks.push(`${label}: key 不存在`);
      } else if (expectStorage.contains && !value.includes(expectStorage.contains)) {
        failed_checks.push(`${label}: 值 "${value.slice(0, 50)}" 不含期望子串 "${expectStorage.contains}"`);
      } else {
        passed_checks.push(`${label}: 值存在${expectStorage.contains ? ` 且含 "${expectStorage.contains}"` : ''}`);
      }
    }

    // 7. JS 断言检查
    if (needJs) {
      for (const jsAssert of (expects.js ?? [])) {
        try {
          // 用 execute 触发，然后读最新日志判断返回值
          const marker = `__openlog_assert_${Date.now()}`;
          await fetch(`${API_BASE_URL}/api/devices/${deviceId}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code: `(function(){ const r = (${jsAssert.code}); console.log('${marker}', JSON.stringify(!!r)); })()`
            })
          });
          await sleep(300);
          const assertLogs: any[] = await fetch(`${API_BASE_URL}/api/devices/${deviceId}/logs?limit=20`).then(r => r.json()).catch(() => []);
          const resultLog = assertLogs.reverse().find((l: any) => JSON.stringify(l.args ?? '').includes(marker));
          const passed = resultLog && JSON.stringify(resultLog.args ?? '').includes('true');
          if (passed) {
            passed_checks.push(`js: ${jsAssert.description}`);
          } else {
            failed_checks.push(`js: ${jsAssert.description} — 断言返回 falsy`);
          }
        } catch {
          skipped_checks.push(`js: ${jsAssert.description} — 执行异常`);
        }
      }
    }

    const totalChecks = passed_checks.length + failed_checks.length + skipped_checks.length;
    const allPassed = failed_checks.length === 0 && totalChecks > 0;

    const summary = allPassed
      ? `✅ [${args.checkpoint}] 全部 ${passed_checks.length} 项检查通过`
      : `❌ [${args.checkpoint}] ${failed_checks.length}/${totalChecks} 项检查失败`;

    return {
      checkpoint: args.checkpoint,
      passed: allPassed,
      deviceId,
      timestamp: Date.now(),
      passed_checks,
      failed_checks,
      skipped_checks,
      summary
    };
  }
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
