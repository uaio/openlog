import { WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer } from 'http';
import { DeviceStore, LogStore } from '../store/index.js';
import { handlers, type MessageContext, registerPCClient } from './handlers.js';

export function createWebSocketServer(httpServer: HTTPServer) {
  const deviceStore = new DeviceStore();
  const logStore = new LogStore();
  const deviceIds = new Map<WebSocket, string>();

  const wss = new WebSocketServer({ server: httpServer });

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

        if (!isViewer) {
          const handler = handlers[message.type];
          if (handler) {
            const context: MessageContext = {
              ws,
              deviceStore,
              logStore,
              deviceIds
            };
            handler(message, context);
          }
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
          deviceIds.delete(ws);
        }
      }
    });
  });

  return { wss, deviceStore, logStore };
}
