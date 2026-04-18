import { API_BASE_URL } from '../config.js';
import { sharedDeviceSelector as deviceSelector, type Device } from '../lib/device-selector.js';


export interface PageContext {
  device: Device | null;
  summary: {
    capturedAt: string;
    totalLogs: number;
    errorCount: number;
    warnCount: number;
    totalRequests: number;
    failedRequestCount: number;
    hasStorageData: boolean;
  };
  /** 最近的错误和警告（最多 20 条），优先级最高 */
  issues: Array<{
    timestamp: number;
    level: string;
    message: string;
    stack?: string;
  }>;
  /** 最近的所有日志（最多 30 条） */
  recentLogs: Array<{
    timestamp: number;
    level: string;
    message: string;
    stack?: string;
  }>;
  /** 失败的网络请求（status >= 400 或有 error） */
  failedRequests: Array<{
    timestamp: number;
    method: string;
    url: string;
    status?: number;
    error?: string;
    duration?: number;
  }>;
  /** 最近的网络请求（最多 20 条） */
  recentRequests: Array<{
    timestamp: number;
    method: string;
    url: string;
    status?: number;
    duration?: number;
    type: string;
  }>;
  /** 存储数据摘要 */
  storage: {
    localStorageKeys: string[];
    localStorageSize: number;
    sessionStorageKeys: string[];
    sessionStorageSize: number;
    cookieCount: number;
    /** 完整数据（localStorage + sessionStorage + cookies） */
    data?: {
      localStorage: Record<string, string>;
      sessionStorage: Record<string, string>;
      cookies: string;
    };
  } | null;
}

export const getPageContext = {
  name: 'get_page_context',
  description: `获取 H5 页面的完整上下文信息，供 AI 分析页面状态、排查问题。
一次调用即可获得：设备信息、错误日志摘要、网络请求状态、本地存储内容。
AI 可利用此工具进行页面自查，如：分析报错原因、检查接口调用、查看存储异常等。`,

  inputSchema: {
    type: 'object' as const,
    properties: {
      deviceId: {
        type: 'string' as const,
        description: '设备 ID（可选，不填则自动选择最近活跃设备）'
      },
      logLimit: {
        type: 'number' as const,
        description: '返回的最近日志条数，默认 30'
      },
      requestLimit: {
        type: 'number' as const,
        description: '返回的最近网络请求条数，默认 20'
      },
      includeStorage: {
        type: 'boolean' as const,
        description: '是否包含完整存储数据（localStorage/sessionStorage/cookies），默认 true'
      },
      includeDOM: {
        type: 'boolean' as const,
        description: '是否包含 DOM 快照（页面元素结构），默认 false，数据量较大时谨慎开启'
      }
    }
  },

  async execute(args: {
    deviceId?: string;
    logLimit?: number;
    requestLimit?: number;
    includeStorage?: boolean;
    includeDOM?: boolean;
  }): Promise<PageContext> {
    const logLimit = args.logLimit ?? 30;
    const requestLimit = args.requestLimit ?? 20;
    const includeStorage = args.includeStorage !== false;
    const includeDOM = args.includeDOM === true;

    // 自动选择设备
    const selectedDeviceId = await deviceSelector.selectDevice(args.deviceId);
    const device = await deviceSelector.getDevice(selectedDeviceId);

    // 并发获取所有数据
    const fetches: Promise<Response>[] = [
      fetch(`${API_BASE_URL}/api/devices/${selectedDeviceId}/logs?limit=${logLimit}`),
      fetch(`${API_BASE_URL}/api/devices/${selectedDeviceId}/network?limit=${requestLimit}`),
      fetch(`${API_BASE_URL}/api/devices/${selectedDeviceId}/storage`)
    ];
    if (includeDOM) {
      fetches.push(fetch(`${API_BASE_URL}/api/devices/${selectedDeviceId}/dom`));
    }

    const [logsRes, networkRes, storageRes, domRes] = await Promise.allSettled(fetches);

    // 解析日志
    const logs: Array<{ timestamp: number; level: string; message: string; stack?: string }> =
      logsRes.status === 'fulfilled' && logsRes.value.ok
        ? await logsRes.value.json()
        : [];

    // 解析网络请求
    const requests: Array<{
      timestamp: number; method: string; url: string;
      status?: number; error?: string; duration?: number; type: string;
    }> =
      networkRes.status === 'fulfilled' && networkRes.value.ok
        ? await networkRes.value.json()
        : [];

    // 解析存储
    let storage: PageContext['storage'] = null;
    if (storageRes.status === 'fulfilled' && storageRes.value.ok) {
      const snap = await storageRes.value.json();
      storage = {
        localStorageKeys: Object.keys(snap.localStorage || {}),
        localStorageSize: snap.localStorageSize ?? 0,
        sessionStorageKeys: Object.keys(snap.sessionStorage || {}),
        sessionStorageSize: snap.sessionStorageSize ?? 0,
        cookieCount: snap.cookies
          ? snap.cookies.split(';').filter(Boolean).length
          : 0,
        ...(includeStorage ? {
          data: {
            localStorage: snap.localStorage || {},
            sessionStorage: snap.sessionStorage || {},
            cookies: snap.cookies || ''
          }
        } : {})
      };
    }

    // 提取 issues（错误 + 警告）
    const issues = logs.filter(l => l.level === 'error' || l.level === 'warn').slice(0, 20);

    // 提取失败请求
    const failedRequests = requests
      .filter(r => r.error || (r.status !== undefined && r.status >= 400))
      .map(r => ({
        timestamp: r.timestamp,
        method: r.method,
        url: r.url,
        status: r.status,
        error: r.error,
        duration: r.duration
      }));

    // 精简 recentRequests（只保留关键字段）
    const recentRequests = requests.map(r => ({
      timestamp: r.timestamp,
      method: r.method,
      url: r.url,
      status: r.status,
      duration: r.duration,
      type: r.type
    }));

    // 解析 DOM（可选）
    let domSnapshot: unknown = null;
    if (includeDOM && domRes && domRes.status === 'fulfilled' && domRes.value.ok) {
      domSnapshot = await domRes.value.json();
    }

    const errorCount = logs.filter(l => l.level === 'error').length;
    const warnCount = logs.filter(l => l.level === 'warn').length;

    return {
      device,
      summary: {
        capturedAt: new Date().toISOString(),
        totalLogs: logs.length,
        errorCount,
        warnCount,
        totalRequests: requests.length,
        failedRequestCount: failedRequests.length,
        hasStorageData: storage !== null
      },
      issues,
      recentLogs: logs,
      failedRequests,
      recentRequests,
      storage,
      ...(includeDOM ? { dom: domSnapshot } : {})
    };
  }
};
