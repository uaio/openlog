import { WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer, IncomingMessage } from 'http';
import { URL } from 'url';
import {
  DeviceStore,
  LogStore,
  NetworkStore,
  StorageStore,
  DOMStore,
  PerformanceStore,
  ScreenshotStore,
  PerfRunStore,
  MockStore,
} from '../store/index.js';
import {
  handlers,
  type MessageContext,
  registerPCClient,
  registerDeviceClient,
  sendToDevice,
} from './handlers.js';

export interface WebSocketServerOptions {
  apiKey?: string;
}

export function createWebSocketServer(
  httpServer: HTTPServer,
  options: WebSocketServerOptions = {},
) {
  const deviceStore = new DeviceStore();
  const logStore = new LogStore();
  const networkStore = new NetworkStore();
  const storageStore = new StorageStore();
  const domStore = new DOMStore();
  const performanceStore = new PerformanceStore();
  const screenshotStore = new ScreenshotStore();
  const perfRunStore = new PerfRunStore();
  const mockStore = new MockStore();
  const deviceIds = new Map<WebSocket, string>();

  const wss = new WebSocketServer({
    server: httpServer,
    perMessageDeflate: {
      zlibDeflateOptions: { chunkSize: 1024, memLevel: 7, level: 3 },
      zlibInflateOptions: { chunkSize: 10 * 1024 },
      threshold: 1024, // only compress messages > 1KB
    },
    verifyClient: options.apiKey
      ? (
          info: { req: IncomingMessage },
          cb: (result: boolean, code?: number, message?: string) => void,
        ) => {
          const url = new URL(info.req.url || '/', `http://${info.req.headers.host}`);
          const token = url.searchParams.get('apiKey');
          if (token === options.apiKey) {
            cb(true);
          } else {
            cb(false, 401, 'Unauthorized');
          }
        }
      : undefined,
  });

  wss.on('connection', (ws: WebSocket) => {
    let isViewer = false;

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === 'viewer') {
          isViewer = true;
          registerPCClient(ws);
          return;
        }

        // PC viewer 发来的指令（注册后）
        if (isViewer) {
          if (message.type === 'refresh_storage' && message.deviceId) {
            sendToDevice(message.deviceId, { type: 'refresh_storage' });
          }
          if (message.type === 'refresh_dom' && message.deviceId) {
            sendToDevice(message.deviceId, { type: 'refresh_dom' });
          }
          if (message.type === 'execute_js' && message.deviceId && message.code) {
            sendToDevice(message.deviceId, { type: 'execute_js', code: message.code });
          }
          if (message.type === 'take_screenshot' && message.deviceId) {
            sendToDevice(message.deviceId, { type: 'take_screenshot' });
          }
          if (message.type === 'reload_page' && message.deviceId) {
            sendToDevice(message.deviceId, { type: 'reload_page' });
          }
          if (message.type === 'set_storage' && message.deviceId && message.key !== undefined) {
            sendToDevice(message.deviceId, {
              type: 'set_storage',
              storageType: message.storageType || 'local',
              key: message.key,
              value: message.value ?? '',
            });
          }
          if (message.type === 'clear_storage' && message.deviceId) {
            sendToDevice(message.deviceId, {
              type: 'clear_storage',
              storageType: message.storageType || 'all',
            });
          }
          if (message.type === 'highlight_element' && message.deviceId && message.selector) {
            sendToDevice(message.deviceId, {
              type: 'highlight_element',
              selector: message.selector,
              duration: message.duration ?? 3000,
            });
          }
          if (message.type === 'zen_mode' && message.deviceId) {
            sendToDevice(message.deviceId, { type: 'zen_mode', enabled: !!message.enabled });
          }
          if (message.type === 'start_perf_run' && message.deviceId) {
            sendToDevice(message.deviceId, { type: 'start_perf_run' });
          }
          if (message.type === 'stop_perf_run' && message.deviceId) {
            sendToDevice(message.deviceId, { type: 'stop_perf_run' });
          }
          if (message.type === 'set_network_throttle' && message.deviceId) {
            sendToDevice(message.deviceId, {
              type: 'set_network_throttle',
              preset: message.preset,
            });
          }
          if (message.type === 'add_mock' && message.deviceId) {
            sendToDevice(message.deviceId, { type: 'add_mock', rule: message.rule });
          }
          if (message.type === 'remove_mock' && message.deviceId) {
            sendToDevice(message.deviceId, { type: 'remove_mock', id: message.id });
          }
          if (message.type === 'clear_mocks' && message.deviceId) {
            sendToDevice(message.deviceId, { type: 'clear_mocks' });
          }
          return;
        }

        // 移动端设备消息：Envelope（数据）或协议消息（register/heartbeat）
        const handler = handlers[message.type];
        if (handler) {
          const context: MessageContext = {
            ws,
            deviceStore,
            logStore,
            networkStore,
            storageStore,
            domStore,
            performanceStore,
            screenshotStore,
            perfRunStore,
            deviceIds,
          };
          handler(message, context);
        }
      } catch (error) {
        console.error('Failed to handle message:', error);
      }
    });

    ws.on('close', () => {
      if (!isViewer) {
        const deviceId = deviceIds.get(ws);
        if (deviceId) {
          deviceStore.unregister(deviceId);
          logStore.cleanup(deviceId);
          networkStore.cleanup(deviceId);
          storageStore.cleanup(deviceId);
          domStore.cleanup(deviceId);
          performanceStore.clear(deviceId);
          screenshotStore.clear(deviceId);
          perfRunStore.clear(deviceId);
          mockStore.cleanup(deviceId);
          deviceIds.delete(ws);
        }
      }
    });
  });

  return {
    wss,
    deviceStore,
    logStore,
    networkStore,
    storageStore,
    domStore,
    performanceStore,
    screenshotStore,
    perfRunStore,
    mockStore,
  };
}

// P0-2: 导出清理函数，用于服务器关闭时清理资源
export function cleanupWebSocketServer(
  deviceStore: DeviceStore,
  logStore: LogStore,
  networkStore: NetworkStore,
  storageStore: StorageStore,
  wss: WebSocketServer,
): void {
  // 关闭 WebSocket 服务器
  wss.close((err) => {
    if (err) {
      console.error('Error closing WebSocket server:', err);
    }
  });

  // 清理设备存储
  deviceStore.destroy();

  // 清理所有日志
  // 注意：LogStore 没有 destroy 方法，因为它的定时器是在 cleanup 中管理的
  // 当所有设备断开连接后，定时器会自动清理
}
