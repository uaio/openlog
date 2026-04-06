import { wsClient } from '../ws-client.js';
import { DeviceSelector } from '../lib/device-selector.js';

const deviceSelector = new DeviceSelector();

export const networkThrottle = {
  name: 'network_throttle',
  description: '设置手机端网络节流。可模拟 3G/2G/离线 网络环境，用于测试应用在弱网下的表现。',
  inputSchema: {
    type: 'object' as const,
    properties: {
      preset: { type: 'string' as const, enum: ['none', '3g', '2g', 'offline'], description: '节流预设' },
      deviceId: { type: 'string' as const, description: '设备 ID（可选）' }
    },
    required: ['preset']
  },
  async execute(args: { preset: string; deviceId?: string }): Promise<{ ok: boolean; preset: string }> {
    const id = await deviceSelector.selectDevice(args.deviceId);
    wsClient.sendCommand(id, { type: 'set_network_throttle', preset: args.preset });
    return { ok: true, preset: args.preset };
  }
};
