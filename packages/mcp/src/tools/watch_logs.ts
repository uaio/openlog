import { API_BASE_URL } from '../config.js';
import { sharedDeviceSelector as deviceSelector, type Device } from '../lib/device-selector.js';


export interface ConsoleLog {
  deviceId: string;
  tabId: string;
  timestamp: number;
  level: 'log' | 'warn' | 'error' | 'info';
  message: string;
  stack?: string;
}

export const watchLogs = {
  name: 'watch_logs',
  description: '监听设备日志，获取最近的日志并等待新日志。适合实时调试场景。如果不指定 deviceId，会自动选择唯一或最近活跃的设备。',
  inputSchema: {
    type: 'object' as const,
    properties: {
      deviceId: {
        type: 'string' as const,
        description: '设备 ID（可选，不填则自动选择）'
      },
      levels: {
        type: 'array' as const,
        items: {
          type: 'string' as const,
          enum: ['log', 'warn', 'error', 'info']
        },
        description: '过滤的日志级别，默认全部'
      },
      since: {
        type: 'number' as const,
        description: '起始时间戳（毫秒），获取此时间之后的日志'
      },
      limit: {
        type: 'number' as const,
        description: '返回条数限制，默认 100'
      }
    }
  },

  async execute(args: {
    deviceId?: string;
    levels?: ('log' | 'warn' | 'error' | 'info')[];
    since?: number;
    limit?: number;
  }): Promise<{ device: Device | null; logs: ConsoleLog[]; hasMore: boolean }> {
    // 智能选择设备
    const selectedDeviceId = await deviceSelector.selectDevice(args.deviceId);
    const device = await deviceSelector.getDevice(selectedDeviceId);

    // 构建查询参数
    const params = new URLSearchParams();
    const limit = args.limit || 100;
    params.append('limit', limit.toString());

    // 如果指定了日志级别，只获取第一个级别（API 限制）
    // 注意：如果需要多级别过滤，需要客户端过滤
    if (args.levels && args.levels.length === 1) {
      params.append('level', args.levels[0]);
    }

    const url = `${API_BASE_URL}/api/devices/${selectedDeviceId}/logs?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    let logs: ConsoleLog[] = await response.json();

    // 客户端过滤：多级别和起始时间
    if (args.levels && args.levels.length > 1) {
      logs = logs.filter(log => args.levels!.includes(log.level));
    }

    if (args.since) {
      logs = logs.filter(log => log.timestamp > args.since!);
    }

    // 检查是否还有更多日志
    const hasMore = logs.length >= limit;

    return { device, logs, hasMore };
  }
};
