import { wsClient } from '../ws-client.js';
import { DeviceSelector } from '../lib/device-selector.js';

const deviceSelector = new DeviceSelector();

export const zenMode = {
  name: 'zen_mode',
  description: `控制手机端 openLog 的禅模式。
开启（enabled=true）：停止 FPS/PerformanceObserver/Network/Storage 监听，只保留 console+error，
避免 SDK 自身干扰性能测试。
关闭（enabled=false）：恢复所有采集。`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      enabled: { type: 'boolean' as const, description: 'true=开启禅模式，false=关闭' },
      deviceId: { type: 'string' as const, description: '设备 ID（可选）' }
    },
    required: ['enabled']
  },
  async execute(args: { enabled: boolean; deviceId?: string }): Promise<{ ok: boolean; zenMode: boolean }> {
    const id = await deviceSelector.selectDevice(args.deviceId);
    wsClient.sendCommand(id, { type: 'zen_mode', enabled: args.enabled });
    return { ok: true, zenMode: args.enabled };
  }
};
