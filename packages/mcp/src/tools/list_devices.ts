import type { Device } from '@aiconsole/server';
import { API_BASE_URL } from '../config';

export const listDevices = {
  name: 'list_devices',
  description: '列出所有当前连接的设备',
  inputSchema: {
    type: 'object' as const,
    properties: {
      projectId: {
        type: 'string' as const,
        description: '项目 ID，用于过滤设备'
      }
    }
  },

  async execute(args: { projectId?: string }): Promise<Device[]> {
    const url = args.projectId
      ? `${API_BASE_URL}/api/devices?projectId=${args.projectId}`
      : `${API_BASE_URL}/api/devices`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }
};
