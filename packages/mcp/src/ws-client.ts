/**
 * OpenLog MCP WebSocket Client
 *
 * 以 viewer 身份连接 Server，与 PC 面板完全对等：
 * - 实时接收 ServerEventPush（SDK 上行数据）
 * - 发送指令到 Server（Server 转发给 SDK）
 */

import WebSocket from 'ws';

interface EventBuffer {
  console: any[];
  network: any[];
  storage: any | null;
  dom: any | null;
  performance: any | null;
  screenshot: any | null;
  perf_run: any[];
  error: any[];
}

class OpenLogWsClient {
  private ws: WebSocket | null = null;
  private serverUrl = 'ws://localhost:38291';
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private ready = false;

  /** 按 deviceId 分区的事件缓冲 */
  private buffers = new Map<string, EventBuffer>();
  /** 设备列表 */
  private devices: any[] = [];

  private makeBuffer(): EventBuffer {
    return { console: [], network: [], storage: null, dom: null, performance: null, screenshot: null, perf_run: [], error: [] };
  }

  private getBuffer(deviceId: string): EventBuffer {
    if (!this.buffers.has(deviceId)) this.buffers.set(deviceId, this.makeBuffer());
    return this.buffers.get(deviceId)!;
  }

  connect(serverUrl?: string): void {
    if (serverUrl) this.serverUrl = serverUrl.replace(/^http/, 'ws');
    this._connect();
  }

  private _connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    const wsUrl = this.serverUrl.replace(/^http/, 'ws');
    try {
      this.ws = new WebSocket(wsUrl);
    } catch {
      this._scheduleReconnect();
      return;
    }

    this.ws.on('open', () => {
      this.ready = true;
      this.ws!.send(JSON.stringify({ type: 'viewer' }));
    });

    this.ws.on('message', (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString());
        this._handleMessage(msg);
      } catch { /* ignore malformed */ }
    });

    this.ws.on('close', () => {
      this.ready = false;
      this._scheduleReconnect();
    });

    this.ws.on('error', () => {
      this.ready = false;
    });
  }

  private _handleMessage(msg: any): void {
    if (msg.type === 'devices') {
      this.devices = msg.data ?? [];
      return;
    }

    // ServerEventPush: { type: 'event', deviceId, envelope }
    if (msg.type === 'event' && msg.envelope) {
      const { deviceId, envelope } = msg;
      const buf = this.getBuffer(deviceId);
      const evType = envelope.type as string;

      if (evType === 'console' || evType === 'error') {
        const arr = buf[evType as 'console' | 'error'];
        arr.push({ ...envelope.data, deviceId, tabId: envelope.tabId, timestamp: envelope.ts });
        if (arr.length > 500) arr.shift();
      } else if (evType === 'network') {
        buf.network.push({ ...envelope.data, deviceId, tabId: envelope.tabId });
        if (buf.network.length > 200) buf.network.shift();
      } else if (evType === 'perf_run') {
        buf.perf_run.push({ ...envelope.data, deviceId });
        if (buf.perf_run.length > 50) buf.perf_run.shift();
      } else if (evType === 'storage') {
        buf.storage = { ...envelope.data, deviceId, tabId: envelope.tabId };
      } else if (evType === 'dom') {
        buf.dom = { ...envelope.data, deviceId, tabId: envelope.tabId };
      } else if (evType === 'performance') {
        buf.performance = { ...envelope.data, deviceId, tabId: envelope.tabId };
      } else if (evType === 'screenshot') {
        buf.screenshot = { ...envelope.data, deviceId, tabId: envelope.tabId, timestamp: envelope.ts };
      }
    }
  }

  private _scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this._connect();
    }, 3000);
  }

  // ── 数据读取 ────────────────────────────────────────────────────

  getDevices(): any[] { return this.devices; }

  getLogs(deviceId: string, limit = 200): any[] {
    return (this.getBuffer(deviceId).console).slice(-limit);
  }

  getNetwork(deviceId: string, limit = 100): any[] {
    return (this.getBuffer(deviceId).network).slice(-limit);
  }

  getStorage(deviceId: string): any | null {
    return this.getBuffer(deviceId).storage;
  }

  getDOM(deviceId: string): any | null {
    return this.getBuffer(deviceId).dom;
  }

  getPerformance(deviceId: string): any | null {
    return this.getBuffer(deviceId).performance;
  }

  getScreenshot(deviceId: string): any | null {
    return this.getBuffer(deviceId).screenshot;
  }

  getPerfRuns(deviceId: string): any[] {
    return this.getBuffer(deviceId).perf_run;
  }

  clearLogs(deviceId: string): void {
    this.getBuffer(deviceId).console = [];
  }

  // ── 指令下发（Server 转发给 SDK）────────────────────────────────

  sendCommand(deviceId: string, command: Record<string, unknown>): void {
    if (!this.ready || !this.ws) return;
    this.ws.send(JSON.stringify({ ...command, deviceId }));
  }

  isReady(): boolean { return this.ready; }
}

export const wsClient = new OpenLogWsClient();
