import type { DeviceInfo, ConsoleLogEntry, NetworkRequestEntry, StorageSnapshot } from '../types/index.js';
import { WebSocketTransport } from './websocket.js';
import type { ConnectionState } from './websocket.js';

export class Reporter {
  private transport: WebSocketTransport | null = null;
  private deviceInfo: DeviceInfo;
  private tabId: string;
  private remoteEnabled = true;
  private onRefreshStorageCallback: (() => void) | null = null;
  private rateLimiter: {
    count: number;
    resetTime: number;
  } = {
    count: 0,
    resetTime: 0
  };
  private readonly maxRatePerSecond = 100;

  constructor(deviceInfo: DeviceInfo, tabId: string) {
    this.deviceInfo = deviceInfo;
    this.tabId = tabId;
  }

  connect(serverUrl?: string): void {
    if (!this.remoteEnabled) return;

    this.transport = new WebSocketTransport(
      {
        projectId: this.deviceInfo.projectId,
        server: serverUrl
      },
      {
        onConnect: () => {
          this.sendRegisterMessage();
        },
        onMessage: (data) => {
          // 处理服务端请求
          if (data.type === 'refresh_storage') {
            this.onRefreshStorageCallback?.();
          }
        }
      }
    );

    this.transport.connect();
  }

  onRefreshStorage(callback: () => void): void {
    this.onRefreshStorageCallback = callback;
  }

  disconnect(): void {
    this.transport?.disconnect();
  }

  enableRemote(): void {
    this.remoteEnabled = true;
    localStorage.setItem(`aiconsole_remote_${this.deviceInfo.projectId}`, 'true');
    if (!this.transport || this.transport.getState() === 'disconnected') {
      this.connect();
    }
  }

  disableRemote(): void {
    this.remoteEnabled = false;
    localStorage.setItem(`aiconsole_remote_${this.deviceInfo.projectId}`, 'false');
    this.transport?.disconnect();
  }

  isRemoteEnabled(): boolean {
    return this.remoteEnabled;
  }

  reportConsole(entry: Omit<ConsoleLogEntry, 'deviceId' | 'tabId'>): void {
    if (!this.remoteEnabled || !this.transport) return;

    if (!this.checkRateLimit()) {
      return;
    }

    const logEntry: ConsoleLogEntry = {
      ...entry,
      deviceId: this.deviceInfo.deviceId,
      tabId: this.tabId
    };

    this.send({
      type: 'console',
      ...logEntry
    });
  }

  reportNetwork(entry: Omit<NetworkRequestEntry, 'deviceId' | 'tabId'>): void {
    if (!this.remoteEnabled || !this.transport) return;

    // 网络请求使用独立的速率限制检查（因为数据量更大）
    if (!this.checkRateLimit()) {
      return;
    }

    const networkEntry: NetworkRequestEntry = {
      ...entry,
      deviceId: this.deviceInfo.deviceId,
      tabId: this.tabId
    };

    this.send({
      ...networkEntry,
      type: 'network'
    });
  }

  reportStorage(snapshot: Omit<StorageSnapshot, 'deviceId' | 'tabId'>): void {
    if (!this.remoteEnabled || !this.transport) return;

    const storageEntry: StorageSnapshot = {
      ...snapshot,
      deviceId: this.deviceInfo.deviceId,
      tabId: this.tabId
    };

    this.send({
      ...storageEntry,
      type: 'storage'
    });
  }

  updateDeviceInfo(): void {
    this.deviceInfo.lastActiveTime = Date.now();
    this.send({
      type: 'heartbeat',
      deviceId: this.deviceInfo.deviceId,
      timestamp: Date.now()
    });
  }

  private sendRegisterMessage(): void {
    this.send({
      type: 'register',
      projectId: this.deviceInfo.projectId,
      deviceId: this.deviceInfo.deviceId,
      deviceInfo: {
        ua: this.deviceInfo.ua,
        screen: this.deviceInfo.screen,
        pixelRatio: this.deviceInfo.pixelRatio,
        language: this.deviceInfo.language
      }
    });
  }

  private send(data: any): void {
    this.transport?.send(JSON.stringify(data));
  }

  private checkRateLimit(): boolean {
    const now = Date.now();
    if (now > this.rateLimiter.resetTime + 1000) {
      this.rateLimiter.count = 0;
      this.rateLimiter.resetTime = now;
    }

    if (this.rateLimiter.count >= this.maxRatePerSecond) {
      return false;
    }

    this.rateLimiter.count++;
    return true;
  }
}
