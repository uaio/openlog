import { API_BASE_URL } from '../config.js';
import { sharedDeviceSelector as deviceSelector } from '../lib/device-selector.js';


export const healthCheck = {
  name: 'health_check',
  description: '获取手机端设备健康状态报告，包含近期错误数、长任务耗时、内存占用、Web Vitals 等。',
  inputSchema: {
    type: 'object' as const,
    properties: {
      deviceId: { type: 'string' as const, description: '设备 ID（可选）' }
    },
    required: []
  },
  async execute(args: { deviceId?: string }): Promise<any> {
    const id = await deviceSelector.selectDevice(args.deviceId);
    const res = await fetch(`${API_BASE_URL}/api/devices/${id}/health`);
    if (!res.ok) throw new Error(`health_check failed: ${res.statusText}`);
    return res.json();
  }
};
