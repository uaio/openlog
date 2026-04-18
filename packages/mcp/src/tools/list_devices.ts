import type { Device } from '@openlog/server';
import { API_BASE_URL } from '../config';
import { sharedDeviceSelector } from '../lib/device-selector.js';

export const listDevices = {
  name: 'list_devices',
  description: '列出所有当前连接的设备，标记当前聚焦设备（如有）',
  inputSchema: {
    type: 'object' as const,
    properties: {
      projectId: {
        type: 'string' as const,
        description: '项目 ID，用于过滤设备'
      }
    }
  },

  async execute(args: { projectId?: string }): Promise<{
    devices: Device[];
    focusedDeviceId: string | null;
    count: number;
  }> {
    const url = args.projectId
      ? `${API_BASE_URL}/api/devices?projectId=${args.projectId}`
      : `${API_BASE_URL}/api/devices`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const devices: Device[] = await response.json();
    const focusedDeviceId = sharedDeviceSelector.getFocusedDevice();

    return {
      devices,
      focusedDeviceId,
      count: devices.length
    };
  }
};
