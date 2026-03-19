import type { ConsoleLog } from '@aiconsole/server';
import { API_BASE_URL } from '../config';

export const getConsoleLogs = {
  name: 'get_console_logs',
  description: '获取指定设备的控制台日志',
  inputSchema: {
    type: 'object' as const,
    properties: {
      deviceId: {
        type: 'string' as const,
        description: '设备 ID'
      },
      limit: {
        type: 'number' as const,
        description: '返回的日志条数限制'
      },
      level: {
        type: 'string' as const,
        enum: ['log', 'warn', 'error', 'info'],
        description: '日志级别过滤'
      }
    },
    required: ['deviceId'] as const
  },

  async execute(args: {
    deviceId: string;
    limit?: number;
    level?: 'log' | 'warn' | 'error' | 'info';
  }): Promise<ConsoleLog[]> {
    const params = new URLSearchParams();
    if (args.limit) params.append('limit', args.limit.toString());
    if (args.level) params.append('level', args.level);

    const url = `${API_BASE_URL}/api/devices/${args.deviceId}/logs?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }
};
