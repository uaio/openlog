import { wsClient } from '../ws-client.js';
import { DeviceSelector } from '../lib/device-selector.js';

const deviceSelector = new DeviceSelector();

export const executeJs = {
  name: 'execute_js',
  description: `在指定的手机 H5 页面执行 JavaScript 代码，执行结果（返回值/错误）会自动出现在控制台日志中。
可用于：
  - 检查变量状态：document.title、window.localStorage.getItem('key')
  - 触发页面逻辑：window.dispatchEvent(new Event('reload'))
  - 调试接口：fetch('/api/test').then(r=>r.json()).then(console.log)
  - 修改页面状态：document.body.style.background='red'
执行后调用 get_console_logs 可以看到返回值。`,

  inputSchema: {
    type: 'object' as const,
    properties: {
      code: {
        type: 'string' as const,
        description: '要执行的 JavaScript 代码'
      },
      deviceId: {
        type: 'string' as const,
        description: '设备 ID（可选，不填则自动选择最近活跃设备）'
      }
    },
    required: ['code']
  },

  async execute(args: { code: string; deviceId?: string }): Promise<{ ok: boolean; message: string }> {
    const selectedDeviceId = await deviceSelector.selectDevice(args.deviceId);
    wsClient.sendCommand(selectedDeviceId, { type: 'execute_js', code: args.code });
    return { ok: true, message: '代码已发送，结果将出现在 get_console_logs 中' };
  }
};
