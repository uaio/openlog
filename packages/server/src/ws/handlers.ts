import { WebSocket } from 'ws';
import { DeviceStore, LogStore, NetworkStore, StorageStore, DOMStore, PerformanceStore, ScreenshotStore, PerfRunStore } from '../store/index.js';

export interface MessageContext {
  ws: WebSocket;
  deviceStore: DeviceStore;
  logStore: LogStore;
  networkStore: NetworkStore;
  storageStore: StorageStore;
  domStore: DOMStore;
  performanceStore: PerformanceStore;
  screenshotStore: ScreenshotStore;
  perfRunStore: PerfRunStore;
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

    // 输入验证
    if (!deviceInfo || typeof deviceInfo !== 'object') {
      console.error('Missing or invalid deviceInfo in register message');
      return;
    }

    const validatedDeviceInfo = {
      ua: String(deviceInfo.ua || ''),
      screen: String(deviceInfo.screen || ''),
      pixelRatio: Number(deviceInfo.pixelRatio) || 1,
      language: String(deviceInfo.language || '')
    };

    deviceStore.register(deviceId, {
      projectId,
      ...validatedDeviceInfo,
      connectTime: Date.now(),
      lastActiveTime: Date.now()
    });

    deviceIds.set(ws, deviceId);
    registerDeviceClient(ws, deviceId);
    broadcastDeviceList(context);
  },

  console: (envelope, context) => {
    const { logStore } = context;
    const deviceId = envelope.device.deviceId;
    const flat = {
      deviceId,
      tabId: envelope.tabId,
      timestamp: envelope.ts,
      level: envelope.data.level,
      message: envelope.data.message,
      stack: envelope.data.stack,
    };
    logStore.push(deviceId, flat);
    broadcastEvent(envelope, context);
  },

  heartbeat: (data, context) => {
    const { deviceStore, deviceIds } = context;
    const deviceId = deviceIds.get(context.ws);
    if (deviceId) {
      deviceStore.updateActiveTime(deviceId);
    }
  },

  network: (envelope, context) => {
    const { networkStore } = context;
    const deviceId = envelope.device.deviceId;
    networkStore.push(deviceId, { deviceId, tabId: envelope.tabId, ...envelope.data });
    broadcastEvent(envelope, context);
  },

  storage: (envelope, context) => {
    const { storageStore } = context;
    const deviceId = envelope.device.deviceId;
    storageStore.update(deviceId, { deviceId, tabId: envelope.tabId, ...envelope.data });
    broadcastEvent(envelope, context);
  },

  dom: (envelope, context) => {
    const { domStore } = context;
    const deviceId = envelope.device.deviceId;
    domStore.update(deviceId, { deviceId, tabId: envelope.tabId, ...envelope.data });
    broadcastEvent(envelope, context);
  },

  performance: (envelope, context) => {
    const { performanceStore } = context;
    const deviceId = envelope.device.deviceId;
    performanceStore.update(deviceId, { deviceId, tabId: envelope.tabId, ...envelope.data });
    broadcastEvent(envelope, context);
  },

  screenshot: (envelope, context) => {
    const { screenshotStore } = context;
    const deviceId = envelope.device.deviceId;
    screenshotStore.update(deviceId, {
      deviceId,
      tabId: envelope.tabId,
      timestamp: envelope.ts,
      dataUrl: envelope.data.dataUrl ?? '',
      width: envelope.data.width ?? 0,
      height: envelope.data.height ?? 0,
    });
    broadcastEvent(envelope, context);
  },

  perf_run: (envelope, context) => {
    const { perfRunStore } = context;
    perfRunStore.add({ ...envelope.data, deviceId: envelope.device.deviceId });
    broadcastEvent(envelope, context);
  },
};

const pcClients = new Set<WebSocket>();
const deviceClients = new Map<WebSocket, string>();

export function registerDeviceClient(ws: WebSocket, deviceId: string): void {
  deviceClients.set(ws, deviceId);
  ws.on('close', () => deviceClients.delete(ws));
}

function broadcastDeviceList(context: MessageContext): void {
  const devices = context.deviceStore.list();
  const message = JSON.stringify({ type: 'devices', data: devices });
  for (const client of pcClients) {
    if (client.readyState === WebSocket.OPEN) client.send(message);
  }
}

/** 统一广播：向所有 viewer（PC + MCP）推送 ServerEventPush */
function broadcastEvent(envelope: any, _context: MessageContext): void {
  const message = JSON.stringify({
    type: 'event',
    deviceId: envelope.device.deviceId,
    envelope,
  });
  for (const client of pcClients) {
    if (client.readyState === WebSocket.OPEN) client.send(message);
  }
}

export function sendToDevice(deviceId: string, message: any): void {
  const msg = JSON.stringify(message);
  for (const [client, id] of deviceClients) {
    if (id === deviceId && client.readyState === WebSocket.OPEN) {
      client.send(msg);
      return;
    }
  }
}

/**
 * 向所有 viewer 广播 Envelope（供 ingest API 使用）
 */
export function broadcastToViewers(envelope: any): void {
  const msg = JSON.stringify({
    type: 'event',
    deviceId: envelope.device?.deviceId ?? 'unknown',
    envelope,
  });
  for (const client of pcClients) {
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  }
}

export function registerPCClient(ws: WebSocket): void {
  console.log('[Server] 注册 PC 客户端，当前总数:', pcClients.size + 1);
  pcClients.add(ws);
  ws.on('close', () => {
    console.log('[Server] PC 客户端断开，剩余:', pcClients.size - 1);
    pcClients.delete(ws);
  });
}

// 定期清理无效的 PC 客户端连接（每 5 分钟）
setInterval(() => {
  for (const client of pcClients) {
    if (client.readyState !== WebSocket.OPEN) {
      pcClients.delete(client);
    }
  }
}, 5 * 60 * 1000);
