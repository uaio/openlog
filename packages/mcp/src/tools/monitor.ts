import { wsClient } from '../ws-client.js';
import { sharedDeviceSelector as deviceSelector } from '../lib/device-selector.js';
import { randomUUID } from 'crypto';


// MCP 进程内全局 watcher 注册表
const watcherRegistry = new Map<string, WatcherEntry>();

type MonitorType = 'error' | 'log';

interface WatcherEntry {
  monitorId: string;
  deviceId: string;
  type: MonitorType;
  /** 下次 poll 时只取 > cursor 的事件 */
  cursor: number;
  createdAt: number;
  lastPollAt: number;
  totalSeen: number;
}

export interface MonitorEvent {
  timestamp: number;
  level: string;
  message: string;
  stack?: string;
}

export interface PollResult {
  monitorId: string;
  type: MonitorType;
  deviceId: string;
  newEvents: MonitorEvent[];
  totalSeen: number;
  cursor: number;
  /** 是否发现了需要关注的内容（方便子代理判断是否需要上报主代理） */
  hasAlert: boolean;
  alertSummary?: string;
}

// ─────────────────────────────────────────────
// start_monitor
// ─────────────────────────────────────────────
export const startMonitor = {
  name: 'start_monitor',
  description: `启动一个后台日志监听器，返回 monitorId。
专为子代理（sub-agent）设计：主代理调用此工具后立即返回，
由独立的子代理持续调用 poll_monitor 消费事件，不阻塞主代理。

type:
- "error"  → 只监听 error 级别日志，任何报错立即触发告警
- "log"    → 监听所有日志（log/warn/error/info），用于完整日志流

典型用法：
  主代理开发时先调用两次：
    start_monitor(type="error") → errorMonitorId
    start_monitor(type="log")   → logMonitorId
  然后分别交给两个子代理循环调用 poll_monitor 消费。`,

  inputSchema: {
    type: 'object' as const,
    properties: {
      type: {
        type: 'string' as const,
        enum: ['error', 'log'],
        description: '"error" 只监听报错；"log" 监听全部日志'
      },
      deviceId: {
        type: 'string' as const,
        description: '设备 ID（可选，默认自动选择最近活跃设备）'
      }
    },
    required: ['type'] as const
  },

  async execute(args: { type: MonitorType; deviceId?: string }): Promise<{
    monitorId: string;
    type: MonitorType;
    deviceId: string;
    message: string;
  }> {
    const deviceId = await deviceSelector.selectDevice(args.deviceId);
    const monitorId = randomUUID();
    const now = Date.now();

    watcherRegistry.set(monitorId, {
      monitorId,
      deviceId,
      type: args.type,
      cursor: now,
      createdAt: now,
      lastPollAt: now,
      totalSeen: 0
    });

    return {
      monitorId,
      type: args.type,
      deviceId,
      message: `✅ 监听器已启动。将此 monitorId 交给子代理，让其循环调用 poll_monitor("${monitorId}") 消费事件。`
    };
  }
};

// ─────────────────────────────────────────────
// poll_monitor
// ─────────────────────────────────────────────
export const pollMonitor = {
  name: 'poll_monitor',
  description: `轮询一个已启动的后台监听器，获取上次 poll 之后的新事件。
立即返回，不阻塞（若无新事件则 newEvents 为空数组）。

专为子代理循环调用设计：
  while true:
    result = poll_monitor(monitorId)
    if result.hasAlert → 上报主代理
    sleep(pollIntervalMs)

hasAlert 为 true 的条件：
- type=error：有任何新 error 日志
- type=log：有 warn 或 error 日志，或日志量突增（>20条/次）`,

  inputSchema: {
    type: 'object' as const,
    properties: {
      monitorId: {
        type: 'string' as const,
        description: 'start_monitor 返回的 monitorId'
      }
    },
    required: ['monitorId'] as const
  },

  async execute(args: { monitorId: string }): Promise<PollResult> {
    const entry = watcherRegistry.get(args.monitorId);
    if (!entry) {
      throw new Error(`监听器 ${args.monitorId} 不存在或已被停止。请先调用 start_monitor 创建新监听器。`);
    }

    const { deviceId, type, cursor } = entry;

    // 从 WS 实时缓冲读取（无需轮询 REST）
    const allLogs: any[] = wsClient.getLogs(deviceId, 500);
    if (type === 'error') {
      // error monitor 只关心 error 级别
    }
    const newRaw = allLogs.filter((l: any) => l.timestamp > cursor && (type === 'log' || l.level === 'error'));

    const newEvents: MonitorEvent[] = newRaw.map((l: any) => ({
      timestamp: l.timestamp,
      level: l.level,
      message: extractMessage(l),
      stack: l.stack
    }));

    // 更新游标
    const newCursor = newEvents.length > 0
      ? Math.max(...newEvents.map(e => e.timestamp))
      : cursor;

    entry.cursor = newCursor;
    entry.lastPollAt = Date.now();
    entry.totalSeen += newEvents.length;

    // 判断是否需要告警
    let hasAlert = false;
    let alertSummary: string | undefined;

    if (type === 'error' && newEvents.length > 0) {
      hasAlert = true;
      alertSummary = `🚨 发现 ${newEvents.length} 条新报错：${newEvents.slice(0, 2).map(e => e.message.slice(0, 80)).join(' | ')}`;
    } else if (type === 'log') {
      const alertEvents = newEvents.filter(e => e.level === 'error' || e.level === 'warn');
      if (alertEvents.length > 0) {
        hasAlert = true;
        alertSummary = `⚠️ 发现 ${alertEvents.length} 条 warn/error：${alertEvents.slice(0, 2).map(e => e.message.slice(0, 80)).join(' | ')}`;
      } else if (newEvents.length > 20) {
        hasAlert = true;
        alertSummary = `📊 日志突增：${newEvents.length} 条新日志`;
      }
    }

    return {
      monitorId: args.monitorId,
      type,
      deviceId,
      newEvents,
      totalSeen: entry.totalSeen,
      cursor: newCursor,
      hasAlert,
      alertSummary
    };
  }
};

// ─────────────────────────────────────────────
// stop_monitor
// ─────────────────────────────────────────────
export const stopMonitor = {
  name: 'stop_monitor',
  description: '停止并清除一个后台监听器，释放资源。开发会话结束或功能验证完成后调用。',

  inputSchema: {
    type: 'object' as const,
    properties: {
      monitorId: {
        type: 'string' as const,
        description: 'start_monitor 返回的 monitorId'
      }
    },
    required: ['monitorId'] as const
  },

  async execute(args: { monitorId: string }): Promise<{ ok: boolean; message: string }> {
    const existed = watcherRegistry.delete(args.monitorId);
    return {
      ok: existed,
      message: existed
        ? `✅ 监听器 ${args.monitorId} 已停止`
        : `⚠️ 监听器 ${args.monitorId} 不存在（可能已停止）`
    };
  }
};

// ─────────────────────────────────────────────
// list_monitors
// ─────────────────────────────────────────────
export const listMonitors = {
  name: 'list_monitors',
  description: '列出当前所有活跃的后台监听器，包含状态和统计信息。',

  inputSchema: {
    type: 'object' as const,
    properties: {},
    required: []
  },

  async execute(_args: Record<string, never>): Promise<{
    count: number;
    monitors: Array<{
      monitorId: string;
      type: MonitorType;
      deviceId: string;
      totalSeen: number;
      runningMs: number;
      lastPollAgo: number;
    }>;
  }> {
    const now = Date.now();
    const monitors = Array.from(watcherRegistry.values()).map(e => ({
      monitorId: e.monitorId,
      type: e.type,
      deviceId: e.deviceId,
      totalSeen: e.totalSeen,
      runningMs: now - e.createdAt,
      lastPollAgo: now - e.lastPollAt
    }));
    return { count: monitors.length, monitors };
  }
};

// ─────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────
function extractMessage(log: any): string {
  if (log.message) return String(log.message);
  if (Array.isArray(log.args)) return log.args.map(String).join(' ');
  return JSON.stringify(log);
}
