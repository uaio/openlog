import { WebSocket } from 'ws';
import { DeviceStore, LogStore } from '../store/index.js';

export interface MessageContext {
  ws: WebSocket;
  deviceStore: DeviceStore;
  logStore: LogStore;
  deviceIds: Map<WebSocket, string>;
}

export type MessageHandler = (data: any, context: MessageContext) => void | Promise<void>;

export const handlers: Record<string, MessageHandler> = {
  register: (data, context) => {
    const { ws, deviceStore, deviceIds } = context;
    const { projectId, deviceId, deviceInfo } = data;

    if (!deviceId) {
      console.error('Missing deviceId in register message');
      return;
    }

    deviceStore.register(deviceId, {
      projectId,
      ua: deviceInfo.ua,
      screen: deviceInfo.screen,
      pixelRatio: deviceInfo.pixelRatio,
      language: deviceInfo.language,
      connectTime: Date.now(),
      lastActiveTime: Date.now()
    });

    deviceIds.set(ws, deviceId);
    broadcastDeviceList(context);
  },

  console: (data, context) => {
    const { logStore } = context;
    logStore.push(data.deviceId, data);
    broadcastLog(data, context);
  },

  heartbeat: (data, context) => {
    const { deviceStore, deviceIds } = context;
    const deviceId = deviceIds.get(context.ws);
    if (deviceId) {
      deviceStore.updateActiveTime(deviceId);
    }
  }
};

const pcClients = new Set<WebSocket>();

function broadcastDeviceList(context: MessageContext): void {
  const devices = context.deviceStore.list();
  const message = JSON.stringify({ type: 'devices', data: devices });

  for (const client of pcClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

function broadcastLog(log: any, context: MessageContext): void {
  const message = JSON.stringify({ type: 'log', data: log });

  for (const client of pcClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

export function registerPCClient(ws: WebSocket): void {
  pcClients.add(ws);
  ws.on('close', () => pcClients.delete(ws));
}
