import { sharedDeviceSelector } from '../lib/device-selector.js';

export const focusDevice = {
  name: 'focus_device',
  description: `切换/锁定当前会话的目标设备。设置后，后续所有工具调用（get_console_logs、get_network_requests 等）自动使用该设备，无需每次传 deviceId。

使用场景：
- 多个设备连接时，用户说"看一下 iPhone 上的日志" → 先 list_devices 找到 iPhone 的 deviceId，再 focus_device 锁定
- 用户说"切换到另一个设备" → focus_device 切换
- 传 null 取消锁定，恢复自动选择最近活跃设备

注意：如果聚焦设备离线，系统会自动解除锁定并回退到自动选择。`,

  inputSchema: {
    type: 'object' as const,
    properties: {
      deviceId: {
        type: 'string' as const,
        description: '要聚焦的设备 ID（从 list_devices 获取）。传空字符串或不传则取消聚焦。'
      }
    },
    required: [] as const
  },

  async execute(args: { deviceId?: string }): Promise<{
    focused: boolean;
    deviceId: string | null;
    message: string;
  }> {
    const targetId = args.deviceId?.trim() || null;

    if (targetId) {
      // 验证设备存在
      const devices = await sharedDeviceSelector.listDevices(true);
      const device = devices.find(d => d.deviceId === targetId);
      if (!device) {
        const available = devices.map(d => `  - ${d.deviceId} (${d.ua}, ${d.online ? '🟢 在线' : '⚫ 离线'})`).join('\n');
        throw new Error(`设备 ${targetId} 不存在。\n可用设备:\n${available || '  无设备连接'}`);
      }

      sharedDeviceSelector.setFocusedDevice(targetId);

      return {
        focused: true,
        deviceId: targetId,
        message: `🎯 已锁定设备: ${targetId}\n设备信息: ${device.ua}\n状态: ${device.online ? '🟢 在线' : '⚫ 离线'}\n\n后续所有操作将自动使用此设备。`
      };
    } else {
      sharedDeviceSelector.setFocusedDevice(null);
      return {
        focused: false,
        deviceId: null,
        message: '🔓 已取消设备锁定，恢复自动选择最近活跃设备。'
      };
    }
  }
};
