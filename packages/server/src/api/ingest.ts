/**
 * POST /api/ingest — 外部数据接入接口
 *
 * 任何系统（CI/CD、服务端日志、Native App、第三方工具）
 * 均可通过此接口向 openLog 推送数据，数据将：
 *  1. 存入对应 Store（供 PC 面板展示和 MCP 工具查询）
 *  2. 实时广播到所有已连接的 PC viewer
 *
 * 接受格式：
 *  - 单条 Envelope：{ v, platform, device, tabId, ts, type, data }
 *  - 批量 Envelope：[ {...}, {...} ]
 *
 * 响应格式：
 *  - 成功：{ ok: true, accepted: number, ts: number }
 *  - 失败：{ ok: false, error: string, ts: number }
 */

import type { Request, Response } from 'express';
import type {
  DeviceStore,
  LogStore,
  NetworkStore,
  StorageStore,
  PerformanceStore,
  ScreenshotStore,
} from '../store/index.js';
import { broadcastToViewers } from '../ws/handlers.js';

// 支持接入的 Event 类型（PC 面板可展示的类型）
const SUPPORTED_TYPES = new Set([
  'console', 'network', 'storage', 'dom',
  'performance', 'error', 'screenshot', 'perf_run',
  'lifecycle', 'custom'
]);

interface IngestContext {
  deviceStore: DeviceStore;
  logStore: LogStore;
  networkStore: NetworkStore;
  storageStore: StorageStore;
  performanceStore: PerformanceStore;
  screenshotStore: ScreenshotStore;
}

/**
 * 验证 Envelope 基础结构
 */
function validateEnvelope(env: any): { valid: boolean; error?: string } {
  if (!env || typeof env !== 'object') return { valid: false, error: 'envelope must be an object' };
  if (env.v !== '1') return { valid: false, error: `unsupported schema version: "${env.v}", expected "1"` };
  if (!env.platform) return { valid: false, error: 'missing field: platform' };
  if (!env.device?.deviceId) return { valid: false, error: 'missing field: device.deviceId' };
  if (!env.device?.projectId) return { valid: false, error: 'missing field: device.projectId' };
  if (!env.tabId) return { valid: false, error: 'missing field: tabId' };
  if (typeof env.ts !== 'number') return { valid: false, error: 'missing field: ts (unix ms)' };
  if (!env.type) return { valid: false, error: 'missing field: type' };
  if (!env.data) return { valid: false, error: 'missing field: data' };
  return { valid: true };
}

/**
 * 将 Envelope 路由到对应 Store
 */
function routeToStore(env: any, ctx: IngestContext): void {
  const { device, tabId, ts, type, data } = env;
  const deviceId = device.deviceId;

  // 确保设备已注册
  const existingDevice = ctx.deviceStore.get(deviceId);
  if (!existingDevice) {
    ctx.deviceStore.register(deviceId, {
      projectId: device.projectId,
      ua: device.ua ?? `ingest/${env.platform}`,
      screen: device.screen ?? 'unknown',
      pixelRatio: device.pixelRatio ?? 1,
      language: device.language ?? 'unknown',
      connectTime: ts,
      lastActiveTime: ts,
    });
  } else {
    ctx.deviceStore.updateActiveTime(deviceId);
  }

  switch (type) {
    case 'console':
    case 'error': {
      // error 类型也存为 console log（level=error）
      ctx.logStore.push(deviceId, {
        deviceId,
        tabId,
        timestamp: ts,
        level: type === 'error' ? 'error' : (data.level ?? 'log'),
        message: data.message ?? (Array.isArray(data.args) ? data.args.join(' ') : JSON.stringify(data)),
        stack: data.stack,
      });
      break;
    }
    case 'network': {
      ctx.networkStore.push(deviceId, {
        deviceId,
        tabId,
        id: data.id ?? `ingest-${ts}`,
        timestamp: ts,
        method: data.method ?? 'GET',
        url: data.url ?? '',
        type: data.type ?? 'fetch',
        status: data.status,
        statusText: data.statusText,
        requestHeaders: data.requestHeaders,
        requestBody: data.requestBody,
        responseHeaders: data.responseHeaders,
        responseBody: data.responseBody,
        duration: data.duration,
        error: data.error,
      });
      break;
    }
    case 'storage': {
      ctx.storageStore.update(deviceId, {
        deviceId,
        tabId,
        timestamp: ts,
        localStorage: data.localStorage ?? {},
        sessionStorage: data.sessionStorage ?? {},
        cookies: data.cookies ?? '',
        localStorageSize: data.localStorageSize ?? 0,
        sessionStorageSize: data.sessionStorageSize ?? 0,
      });
      break;
    }
    case 'performance': {
      ctx.performanceStore.update(deviceId, {
        deviceId,
        tabId,
        vitals: data.vitals ?? [],
        samples: data.samples ?? [],
        longTasks: data.longTasks ?? [],
        resources: data.resources ?? [],
        interactions: data.interactions ?? [],
      });
      break;
    }
    case 'screenshot': {
      ctx.screenshotStore.update(deviceId, {
        deviceId,
        tabId,
        timestamp: ts,
        dataUrl: data.dataUrl ?? '',
        width: data.width ?? 0,
        height: data.height ?? 0,
      });
      break;
    }
    // lifecycle / dom / perf_run / custom — PC 面板通过 raw event 广播展示
    default:
      break;
  }
}

/**
 * 创建 ingest 路由处理函数
 */
export function createIngestRoute(ctx: IngestContext) {
  return async (req: Request, res: Response): Promise<void> => {
    const body = req.body;

    // 支持单条和批量
    const envelopes: any[] = Array.isArray(body) ? body : [body];

    if (envelopes.length === 0) {
      res.status(400).json({ ok: false, error: 'empty request body', ts: Date.now() });
      return;
    }

    if (envelopes.length > 500) {
      res.status(400).json({ ok: false, error: 'batch too large, max 500 per request', ts: Date.now() });
      return;
    }

    const errors: string[] = [];
    let accepted = 0;

    for (let i = 0; i < envelopes.length; i++) {
      const env = envelopes[i];
      const { valid, error } = validateEnvelope(env);

      if (!valid) {
        errors.push(`[${i}] ${error}`);
        continue;
      }

      try {
        routeToStore(env, ctx);

        // 广播给 PC viewer（包含原始 envelope，面板可展示所有类型）
        broadcastToViewers({
          type: 'event',
          deviceId: env.device.deviceId,
          envelope: env,
        });

        accepted++;
      } catch (e) {
        errors.push(`[${i}] store error: ${(e as Error).message}`);
      }
    }

    const statusCode = accepted === 0 ? 400 : errors.length > 0 ? 207 : 200;
    res.status(statusCode).json({
      ok: accepted > 0,
      accepted,
      rejected: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      ts: Date.now(),
    });
  };
}
