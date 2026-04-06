import { startEmbeddedServer, stopEmbeddedServer } from '../launcher.js';
import { wsClient } from '../ws-client.js';
import { API_BASE_URL } from '../config.js';

export const startOpenlog = {
  name: 'start_openlog',
  description: '启动 openLog 监控服务并建立 WebSocket 长连接。在需要监控 H5 页面数据时调用，启动后 SDK 即可连入。',
  inputSchema: {
    type: 'object' as const,
    properties: {
      port: { type: 'number' as const, description: '服务端口号（默认 38291）' },
      openBrowser: { type: 'boolean' as const, description: '是否自动打开浏览器监控面板（默认 true）' }
    },
    required: []
  },
  async execute(args: { port?: number; openBrowser?: boolean }): Promise<unknown> {
    const { url } = await startEmbeddedServer({
      port: args.port,
      openBrowser: args.openBrowser ?? true
    });

    wsClient.connect(API_BASE_URL);

    return {
      status: 'started',
      url,
      message: `openLog 服务已启动：${url}，WebSocket 连接已建立。请在 H5 页面初始化 SDK 后使用 list_devices 查看设备。`
    };
  }
};

export const stopOpenlog = {
  name: 'stop_openlog',
  description: '停止 openLog 监控服务并断开 WebSocket 连接。在不再需要监控时调用。',
  inputSchema: {
    type: 'object' as const,
    properties: {},
    required: []
  },
  async execute(_args: Record<string, never>): Promise<unknown> {
    wsClient.disconnect();
    await stopEmbeddedServer();

    return {
      status: 'stopped',
      message: 'openLog 服务已关闭，WebSocket 连接已断开。'
    };
  }
};
