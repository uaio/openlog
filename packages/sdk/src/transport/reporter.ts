import type { DeviceInfo, ConsoleLogEntry, NetworkRequestEntry, StorageSnapshot, DOMSnapshot, PerformanceReport } from '../types/index.js';
import type { PlatformAdapter } from '../platform/types.js';
import type { DataBus } from '../core/DataBus.js';
import { WebSocketTransport } from './websocket.js';
import { RateLimiter } from '../core/rate-limiter.js';
import { serializeArgs } from '../core/utils/serialize.js';

// 也作为 WebSocketReporter 别名，供旧代码引用
export type { Reporter as WebSocketReporter };

export class Reporter {
  private transport: WebSocketTransport | null = null;
  private deviceInfo: DeviceInfo;
  private tabId: string;
  private platform: PlatformAdapter;
  private remoteEnabled = true;
  private onRefreshStorageCallback: (() => void) | null = null;
  private onRefreshDOMCallback: (() => void) | null = null;
  private onTakeScreenshotCallback: (() => void) | null = null;
  private onZenModeCallback: ((enabled: boolean) => void) | null = null;
  private onStartPerfRunCallback: (() => void) | null = null;
  private onStopPerfRunCallback: (() => void) | null = null;
  private onSetNetworkThrottleCallback: ((preset: string) => void) | null = null;
  private onAddMockCallback: ((rule: any) => void) | null = null;
  private onRemoveMockCallback: ((id: string) => void) | null = null;
  private onClearMocksCallback: (() => void) | null = null;
  private executeJsBus: DataBus | null = null;
  private rateLimiter = new RateLimiter(100);
  private serverUrl: string | undefined;
  private dataBusUnsubscribers: Array<() => void> = [];

  constructor(deviceInfo: DeviceInfo, tabId: string, platform: PlatformAdapter) {
    this.deviceInfo = deviceInfo;
    this.tabId = tabId;
    this.platform = platform;
  }

  connect(serverUrl?: string): void {
    if (!this.remoteEnabled) return;

    this.serverUrl = serverUrl ?? this.serverUrl;

    this.transport = new WebSocketTransport(
      { projectId: this.deviceInfo.projectId, server: this.serverUrl },
      {
        onConnect: () => {
          this.sendRegisterMessage();
        },
        onMessage: (data) => {
          if (data.type === 'refresh_storage') {
            this.onRefreshStorageCallback?.();
          }
          if (data.type === 'refresh_dom') {
            this.onRefreshDOMCallback?.();
          }
          if (data.type === 'take_screenshot') {
            this.onTakeScreenshotCallback?.();
          }
          if (data.type === 'execute_js' && data.code && this.executeJsBus) {
            this.runCode(data.code, this.executeJsBus);
          }
          if (data.type === 'reload_page') {
            try { window.location.reload(); } catch { /* ignore */ }
          }
          if (data.type === 'set_storage') {
            try {
              const store = data.storageType === 'session' ? sessionStorage : localStorage;
              store.setItem(data.key, data.value ?? '');
            } catch { /* ignore */ }
          }
          if (data.type === 'clear_storage') {
            try {
              if (data.storageType === 'session') sessionStorage.clear();
              else if (data.storageType === 'local') localStorage.clear();
              else { localStorage.clear(); sessionStorage.clear(); }
            } catch { /* ignore */ }
          }
          if (data.type === 'highlight_element' && data.selector) {
            this.highlightElement(data.selector, data.duration ?? 3000);
          }
          if (data.type === 'zen_mode') {
            this.onZenModeCallback?.(!!data.enabled);
          }
          if (data.type === 'start_perf_run') {
            this.onStartPerfRunCallback?.();
          }
          if (data.type === 'stop_perf_run') {
            this.onStopPerfRunCallback?.();
          }
          if (data.type === 'set_network_throttle' && data.preset) {
            this.onSetNetworkThrottleCallback?.(data.preset);
          }
          if (data.type === 'add_mock' && data.rule) {
            this.onAddMockCallback?.(data.rule);
          }
          if (data.type === 'remove_mock' && data.id) {
            this.onRemoveMockCallback?.(data.id);
          }
          if (data.type === 'clear_mocks') {
            this.onClearMocksCallback?.();
          }
        }
      },
      this.platform
    );

    this.transport.connect();
  }

  onRefreshStorage(callback: () => void): void {
    this.onRefreshStorageCallback = callback;
  }

  onRefreshDOM(callback: () => void): void {
    this.onRefreshDOMCallback = callback;
  }

  onTakeScreenshot(callback: () => void): void {
    this.onTakeScreenshotCallback = callback;
  }

  onZenMode(callback: (enabled: boolean) => void): void {
    this.onZenModeCallback = callback;
  }

  onStartPerfRun(callback: () => void): void { this.onStartPerfRunCallback = callback; }
  onStopPerfRun(callback: () => void): void { this.onStopPerfRunCallback = callback; }
  onSetNetworkThrottle(callback: (preset: string) => void): void { this.onSetNetworkThrottleCallback = callback; }
  onAddMock(callback: (rule: any) => void): void { this.onAddMockCallback = callback; }
  onRemoveMock(callback: (id: string) => void): void { this.onRemoveMockCallback = callback; }
  onClearMocks(callback: () => void): void { this.onClearMocksCallback = callback; }

  reportPerfRun(session: import('../types/index.js').PerfRunSession): void {
    if (!this.remoteEnabled || !this.transport) return;
    this.sendEnvelope('perf_run', session);
  }

  disconnect(): void {
    this.transport?.disconnect();
  }

  /**
   * 将 Reporter 绑定到 DataBus，订阅所有事件并通过 WebSocket 转发到远端 PC
   * 调用多次会先解绑旧的再重新绑定
   */
  attachDataBus(bus: DataBus): void {
    this.detachDataBus();
    this.executeJsBus = bus;
    this.dataBusUnsubscribers = [
      bus.on('console', (entry) => this.reportConsole(entry)),
      bus.on('network', (entry) => this.reportNetwork(entry)),
      bus.on('storage', (snap) => this.reportStorage(snap)),
      bus.on('dom', (snap) => this.reportDOM(snap)),
      bus.on('performance', (report) => this.reportPerformance(report)),
      bus.on('screenshot', (data) => this.reportScreenshot(data)),
      bus.on('perf_run', (session) => this.reportPerfRun(session)),
    ];
  }

  detachDataBus(): void {
    for (const unsub of this.dataBusUnsubscribers) {
      unsub();
    }
    this.dataBusUnsubscribers = [];
    this.executeJsBus = null;
  }

  /** PC 下发的 JS 代码在手机端执行，结果经 DataBus console 通道回传 */
  private runCode(code: string, bus: DataBus): void {
    // 先回显执行的代码（类似 DevTools 的 > 提示）
    bus.emit('console', {
      timestamp: Date.now(),
      level: 'log',
      message: `▶ ${code}`,
      args: [`▶ ${code}`]
    });

    try {
      // eslint-disable-next-line no-eval
      const result = (0, eval)(code);  // indirect eval：在全局作用域运行，不影响当前 scope
      const display = result === undefined ? '← undefined' : `← ${serializeArgs([result])}`;
      bus.emit('console', {
        timestamp: Date.now(),
        level: 'log',
        message: display,
        args: result === undefined ? ['← undefined'] : ['←', result]
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      bus.emit('console', {
        timestamp: Date.now(),
        level: 'error',
        message: `← Error: ${msg}`,
        args: [`← Error: ${msg}`]
      });
    }
  }

  private highlightElement(selector: string, duration: number): void {
    if (typeof document === 'undefined') return;
    try {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (!el) return;
      const prev = el.style.outline;
      const prevBg = el.style.backgroundColor;
      el.style.outline = '3px solid #ff4d4f';
      el.style.backgroundColor = 'rgba(255,77,79,0.15)';
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        el.style.outline = prev;
        el.style.backgroundColor = prevBg;
      }, duration);
    } catch { /* ignore */ }
  }

  enableRemote(): void {
    this.remoteEnabled = true;
    this.platform.storage.setItem(`openlog_remote_${this.deviceInfo.projectId}`, 'true');
    if (!this.transport || this.transport.getState() === 'disconnected') {
      this.connect();
    }
  }

  disableRemote(): void {
    this.remoteEnabled = false;
    this.platform.storage.setItem(`openlog_remote_${this.deviceInfo.projectId}`, 'false');
    this.transport?.disconnect();
  }

  isRemoteEnabled(): boolean {
    return this.remoteEnabled;
  }

  reportConsole(entry: Omit<ConsoleLogEntry, 'deviceId' | 'tabId'>): void {
    if (!this.remoteEnabled || !this.transport) return;
    if (!this.rateLimiter.check()) return;
    this.sendEnvelope('console', {
      level: entry.level,
      args: (entry as any).args ?? [entry.message],
      message: entry.message,
      stack: entry.stack,
    });
  }

  reportNetwork(entry: Omit<NetworkRequestEntry, 'deviceId' | 'tabId'>): void {
    if (!this.remoteEnabled || !this.transport) return;
    if (!this.rateLimiter.check()) return;
    this.sendEnvelope('network', entry);
  }

  reportStorage(snapshot: Omit<StorageSnapshot, 'deviceId' | 'tabId'>): void {
    if (!this.remoteEnabled || !this.transport) return;
    this.sendEnvelope('storage', snapshot);
  }

  reportDOM(snapshot: Omit<DOMSnapshot, 'deviceId' | 'tabId'>): void {
    if (!this.remoteEnabled || !this.transport) return;
    this.sendEnvelope('dom', snapshot);
  }

  reportPerformance(report: Omit<PerformanceReport, 'deviceId' | 'tabId'>): void {
    if (!this.remoteEnabled || !this.transport) return;
    this.sendEnvelope('performance', report);
  }

  reportScreenshot(data: import('../types/index.js').ScreenshotData): void {
    if (!this.remoteEnabled || !this.transport) return;
    this.sendEnvelope('screenshot', data);
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

  private sendEnvelope(type: string, data: unknown): void {
    this.send({
      v: '1',
      platform: 'web',
      device: {
        deviceId: this.deviceInfo.deviceId,
        projectId: this.deviceInfo.projectId,
        ua: this.deviceInfo.ua,
        screen: this.deviceInfo.screen,
        pixelRatio: this.deviceInfo.pixelRatio,
        language: this.deviceInfo.language,
        url: this.deviceInfo.url,
      },
      tabId: this.tabId,
      ts: Date.now(),
      type,
      data,
    });
  }

  private send(data: unknown): void {
    this.transport?.send(JSON.stringify(data));
  }
}
