import { wsClient } from '../ws-client.js';
import { sharedDeviceSelector as deviceSelector } from '../lib/device-selector.js';


export const takeScreenshot = {
  name: 'take_screenshot',
  description: `对指定手机 H5 页面进行截图，返回 base64 图片 URL。
可用于：
  - 检查当前页面视觉状态
  - 发现 UI 异常或布局错误
  - 记录某一时刻的页面快照
截图会自动推送到 PC 端显示。`,

  inputSchema: {
    type: 'object' as const,
    properties: {
      deviceId: {
        type: 'string' as const,
        description: '设备 ID（可选，不填则自动选择最近活跃设备）'
      }
    },
    required: []
  },

  async execute(args: { deviceId?: string }): Promise<any> {
    const selectedDeviceId = await deviceSelector.selectDevice(args.deviceId);

    wsClient.sendCommand(selectedDeviceId, { type: 'take_screenshot' });

    // 等待截图推送到 WS buffer
    await new Promise(r => setTimeout(r, 3000));

    const screenshot = wsClient.getScreenshot(selectedDeviceId);
    if (!screenshot) {
      return { ok: false, message: '截图未返回，请确认设备在线并重试' };
    }
    return screenshot;
  }
};
