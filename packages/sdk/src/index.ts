import { getDeviceInfo, generateTabId, updateDeviceActiveTime } from './core/device.js';
import { DataBus } from './core/DataBus.js';
import { Reporter } from './transport/reporter.js';
import { NetworkInterceptor } from './interceptors/network.js';
import { StorageReader } from './interceptors/storage.js';
import { ErrorInterceptor } from './interceptors/error.js';
import { DOMCollector } from './interceptors/dom.js';
import { PerformanceCollector } from './interceptors/performance.js';
import { ScreenshotCollector } from './interceptors/screenshot.js';
import { ErudaPlugin } from './plugins/ErudaPlugin.js';
import { BrowserAdapter } from './platform/browser/index.js';
import { scorePerfRun } from './core/perf-score.js';
import { NetworkThrottle } from './interceptors/network-throttle.js';
import { MockAPI } from './interceptors/mock-api.js';
import type { PlatformAdapter } from './platform/types.js';
import type { RemoteConfig, ErudaConfig, NetworkInterceptorConfig } from './types/index.js';
import type { ThrottlePreset } from './interceptors/network-throttle.js';
import type { MockRule } from './interceptors/mock-api.js';
import type { PerfRunSession } from './types/index.js';
import { serializeArgs, cleanStackTrace } from './core/utils/serialize.js';

// Eruda 类型声明
interface Eruda {
  init: (options?: ErudaConfig) => void;
  destroy: () => void;
  show: () => void;
  hide: () => void;
  get: (name: string) => unknown;
}

export const version = '0.1.0';

/** 默认心跳间隔（毫秒） */
const DEFAULT_HEARTBEAT_INTERVAL = 30000;

/** 用于检测已存在 OpenLog 实例的符号 */
const OPENLOG_INSTANCE_KEY = Symbol.for('openlog.instance');

interface OriginalConsole {
  log: typeof console.log;
  warn: typeof console.warn;
  error: typeof console.error;
  info: typeof console.info;
}

export interface OpenLogOptions extends RemoteConfig {
  defaultPlugins?: string[];
  /** 心跳间隔（毫秒），默认 30000 */
  heartbeatInterval?: number;
  /** Eruda 调试面板配置 */
  eruda?: ErudaConfig;
  /** 网络请求拦截配置 */
  network?: NetworkInterceptorConfig;
  /** 是否自动捕获全局 JS 错误和未处理的 Promise rejection，默认 true */
  captureErrors?: boolean;
  /** DOM 快照配置 */
  dom?: {
    /** 是否启用 DOM 快照，默认 true */
    enabled?: boolean;
    /** 页面加载后延迟多少毫秒自动采集一次，默认 2000 */
    initialDelay?: number;
  };
  /** 性能监控配置 */
  performance?: {
    /** 是否启用性能监控，默认 true */
    enabled?: boolean;
  };
  /** 平台适配器，默认 BrowserAdapter */
  platform?: PlatformAdapter;
}

export class OpenLog {
  private dataBus: DataBus;
  private reporter: Reporter;
  private erudaPlugin: ErudaPlugin;
  private deviceInfo: ReturnType<typeof getDeviceInfo>;
  private tabId: string;
  private projectId: string;
  private platform: PlatformAdapter;
  private heartbeatTimerId: number | null = null;
  private heartbeatIntervalMs: number;
  private originalConsole: OriginalConsole | null = null;
  private erudaInitialized = false;
  private eruda: Eruda | null = null;
  private networkInterceptor: NetworkInterceptor | null = null;
  private storageReader: StorageReader | null = null;
  private errorInterceptor: ErrorInterceptor | null = null;
  private domCollector: DOMCollector | null = null;
  private performanceCollector: PerformanceCollector | null = null;
  private screenshotCollector: ScreenshotCollector | null = null;
  private zenMode = false;
  private networkConfig: NetworkInterceptorConfig | undefined;
  private perfRunning = false;
  private perfRunCollector: PerformanceCollector | null = null;
  private perfRunStartTime = 0;
  private lastPerfRunSession: PerfRunSession | null = null;
  private networkThrottle: NetworkThrottle | null = null;
  private mockApi: MockAPI | null = null;

  constructor(options: OpenLogOptions) {
    if (!options.projectId) {
      throw new Error('projectId is required');
    }

    // 检测是否已存在 OpenLog 实例
    const existingInstance = (globalThis as Record<symbol, unknown>)[OPENLOG_INSTANCE_KEY];
    if (existingInstance) {
      console.warn('openLog: 检测到已存在的实例，多个实例可能导致竞态条件');
    }

    this.projectId = options.projectId;
    this.platform = options.platform ?? new BrowserAdapter();
    this.deviceInfo = getDeviceInfo(options.projectId, this.platform);
    this.tabId = generateTabId();
    this.heartbeatIntervalMs = options.heartbeatInterval ?? DEFAULT_HEARTBEAT_INTERVAL;

    // ① 创建 DataBus — 所有数据采集的唯一来源，最先初始化
    this.dataBus = new DataBus();

    // ② Reporter 订阅 DataBus → 转发到远端 PC
    this.reporter = new Reporter(this.deviceInfo, this.tabId, this.platform);
    this.reporter.attachDataBus(this.dataBus);

    // ③ Eruda 展示插件实例（会在 Eruda 异步加载后绑定）
    this.erudaPlugin = new ErudaPlugin();

    // 解析服务器地址：优先 server，其次 port（自动推断 hostname）
    const resolvedServer = options.server ?? resolveServerUrl(options.port);

    // 检查用户是否之前关闭了远程监控
    const remoteDisabled = this.platform.storage.getItem(`openlog_remote_${this.projectId}`) === 'false';
    if (!remoteDisabled) {
      this.reporter.connect(resolvedServer);
    }

    // ④ Console 拦截 — DataBus emit 发生在第一时间，之后再调用原始 console（Eruda 链）
    this.interceptConsole();

    // ⑤ 其余采集器全部通过 DataBus 上报
    this.networkConfig = options.network;
    this.initNetworkInterceptor(options.network);
    this.initStorageReader();

    if (options.captureErrors !== false) {
      this.initErrorInterceptor();
    }

    if (options.dom?.enabled !== false) {
      this.initDOMCollector(options.dom?.initialDelay);
    }

    if (options.performance?.enabled !== false) {
      this.initPerformanceCollector();
    }

    // ScreenshotCollector 始终初始化，按需触发（PC 端命令 / 主动调用）
    this.initScreenshotCollector();

    // 注册跑分/Mock/节流相关回调
    this.reporter.onStartPerfRun(() => { this.startPerfRun(); });
    this.reporter.onStopPerfRun(() => { this.stopPerfRun(); });
    this.reporter.onSetNetworkThrottle((preset) => { this.setNetworkThrottle(preset as ThrottlePreset); });
    this.reporter.onAddMock((rule) => {
      if (!this.mockApi) { this.mockApi = new MockAPI(); this.mockApi.start(); }
      this.mockApi.addRule(rule);
    });
    this.reporter.onRemoveMock((id) => { this.removeMock(id); });
    this.reporter.onClearMocks(() => { this.clearMocks(); });

    // 标记实例存在
    (globalThis as Record<symbol, unknown>)[OPENLOG_INSTANCE_KEY] = this;

    // 定期更新活跃时间
    this.heartbeatTimerId = this.platform.timer.setInterval(() => {
      updateDeviceActiveTime(this.projectId, this.platform);
      this.reporter.updateDeviceInfo();
    }, this.heartbeatIntervalMs);

    // ⑥ Eruda 最后异步加载（加载完成后将其与 DataBus 绑定，避免重复采集）
    if (options.eruda?.enabled !== false) {
      this.initEruda(options.eruda);
    }
  }

  private async initEruda(config?: ErudaConfig): Promise<void> {
    try {
      // 动态导入 eruda UMD 模块
      const erudaModule = await import('eruda');
      // @ts-ignore - eruda is UMD module, default export is the eruda object
      this.eruda = erudaModule.default || erudaModule;

      if (this.eruda && typeof this.eruda.init === 'function') {
        this.eruda.init({
          tool: config?.tool,
          autoScale: config?.autoScale ?? true,
          useShadowDom: true,
          defaults: {
            ...config?.defaults,
            // 禁用 Eruda 自身的 console override：
            // DataBus 已是唯一采集源，ErudaPlugin 负责将数据推入 Eruda 面板。
            // 若保留 overrideConsole，Eruda 会二次 patch 我们的 patch，导致：
            //   1. 数据双重采集
            //   2. DataBus emit 不再"第一时间"（Eruda 先于 DataBus 触发）
            overrideConsole: false,
          }
        });

        // 绑定 ErudaPlugin：订阅 DataBus → 将日志推入 Eruda console 面板
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.erudaPlugin.attach(this.eruda as any, this.dataBus, this);
        this.erudaInitialized = true;
      } else {
        console.warn('openLog: Eruda 初始化失败 - 无效的 eruda 模块');
      }
    } catch (error) {
      console.warn('openLog: Eruda 加载失败', error);
    }
  }

  private interceptConsole(): void {
    // 保存原始 console 方法（此时尚未被 Eruda patch，因为 Eruda 异步加载）
    this.originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info
    };

    const self = this;

    // 创建通用的 console 拦截处理函数
    const createInterceptor = (level: 'log' | 'warn' | 'error' | 'info', originalFn: typeof console.log) => {
      return function (...args: unknown[]) {
        // ① DataBus emit 在第一时间发生（先于原始 console 调用，先于 Eruda 面板展示）
        try {
          const message = serializeArgs(args);
          const entry = {
            timestamp: Date.now(),
            level,
            message,
            args,  // 原始参数，供 ErudaPlugin 富文本渲染
            ...(level === 'error' ? { stack: cleanStackTrace(new Error().stack) } : {})
          };
          self.dataBus.emit('console', entry);
        } catch {
          // 静默处理，避免影响原始 console 输出
        }

        // ② 调用原始方法（浏览器 DevTools、Eruda 若在 overrideConsole 模式下也会在这里接管，
        //    但我们已通过 overrideConsole:false 禁用了 Eruda 的 patch，所以这里是真正的原始 fn）
        originalFn.apply(console, args);
      };
    };

    console.log = createInterceptor('log', this.originalConsole.log);
    console.warn = createInterceptor('warn', this.originalConsole.warn);
    console.error = createInterceptor('error', this.originalConsole.error);
    console.info = createInterceptor('info', this.originalConsole.info);
  }

  private initNetworkInterceptor(config?: NetworkInterceptorConfig): void {
    const bus = this.dataBus;
    this.networkInterceptor = new NetworkInterceptor(
      (entry) => bus.emit('network', entry),
      config
    );
    this.networkInterceptor.start();
  }

  private initStorageReader(): void {
    const bus = this.dataBus;
    this.storageReader = new StorageReader((snapshot) => {
      bus.emit('storage', snapshot);
    });

    // 开始监听所有存储写操作（localStorage / sessionStorage / cookie）
    // 任何写入（包括 Eruda 面板操作）都会自动防抖上报到 PC
    this.storageReader.watch();

    // 注册刷新存储的回调
    this.reporter.onRefreshStorage(() => {
      this.storageReader?.readAndReport();
    });
  }

  private initErrorInterceptor(): void {
    this.errorInterceptor = new ErrorInterceptor(this.platform, this.dataBus);
    this.errorInterceptor.start();
  }

  private initDOMCollector(initialDelay = 2000): void {
    const bus = this.dataBus;
    this.domCollector = new DOMCollector(this.platform, (snapshot) => {
      bus.emit('dom', snapshot);
    });

    // 延迟初次采集，等页面渲染稳定
    this.platform.timer.setTimeout(() => {
      this.domCollector?.collect();
    }, initialDelay);

    // 响应 PC 端刷新指令
    this.reporter.onRefreshDOM(() => {
      this.domCollector?.collect();
    });
  }

  private initPerformanceCollector(): void {
    this.performanceCollector = new PerformanceCollector(this.dataBus);
    this.performanceCollector.start();
  }

  private initScreenshotCollector(): void {
    this.screenshotCollector = new ScreenshotCollector(this.dataBus);
    // 响应 PC 端截图指令
    this.reporter.onTakeScreenshot(() => {
      this.screenshotCollector?.capture();
    });
    // 响应 PC 端禅模式指令
    this.reporter.onZenMode((enabled) => {
      if (enabled) this.enterZenMode();
      else this.exitZenMode();
    });
  }

  /** 手动触发截图（供外部调用） */
  async takeScreenshot(): Promise<void> {
    return this.screenshotCollector?.capture();
  }

  startPerfRun(): void {
    if (this.perfRunning) return;
    this.enterZenMode();
    this.perfRunCollector = new PerformanceCollector(this.dataBus);
    this.perfRunCollector.start();
    this.perfRunStartTime = Date.now();
    this.perfRunning = true;
    this.dataBus.emit('console', {
      timestamp: Date.now(),
      level: 'log',
      message: '[openLog] 🏁 跑分开始...',
      args: ['[openLog] 🏁 跑分开始...'],
    });
  }

  async stopPerfRun(): Promise<PerfRunSession | null> {
    if (!this.perfRunning) return null;
    const snapshot = this.perfRunCollector?.getSnapshot() ?? { vitals: [], samples: [], longTasks: [], resources: [], interactions: [] };
    this.perfRunCollector?.destroy();
    this.perfRunCollector = null;
    this.exitZenMode();
    const scoreResult = scorePerfRun(snapshot);
    const endTime = Date.now();
    const session: PerfRunSession = {
      sessionId: Date.now().toString(36),
      deviceId: this.deviceInfo.deviceId,
      tabId: this.tabId,
      startTime: this.perfRunStartTime,
      endTime,
      duration: endTime - this.perfRunStartTime,
      snapshot,
      score: scoreResult,
    };
    this.dataBus.emit('perf_run', session);
    this.lastPerfRunSession = session;
    this.perfRunning = false;
    this.dataBus.emit('console', {
      timestamp: Date.now(),
      level: 'log',
      message: `[openLog] 🏁 跑分结束，综合评分: ${scoreResult.total}`,
      args: [`[openLog] 🏁 跑分结束，综合评分: ${scoreResult.total}`],
    });
    return session;
  }

  getPerfReport(): PerfRunSession | null {
    return this.lastPerfRunSession;
  }

  setNetworkThrottle(preset: ThrottlePreset): void {
    if (!this.networkThrottle) {
      this.networkThrottle = new NetworkThrottle();
    }
    this.networkThrottle.setPreset(preset);
  }

  addMock(urlPattern: string, response: Omit<MockRule, 'id' | 'pattern'>): string {
    if (!this.mockApi) {
      this.mockApi = new MockAPI();
      this.mockApi.start();
    }
    return this.mockApi.addRule({ pattern: urlPattern, ...response });
  }

  removeMock(id: string): void {
    this.mockApi?.removeRule(id);
  }

  clearMocks(): void {
    this.mockApi?.clearRules();
  }

  getMocks(): MockRule[] {
    return this.mockApi?.getRules() ?? [];
  }

  /**
   * 禅模式：停止所有高开销采集（FPS/PerformanceObserver/Network/Storage 监听），
   * 只保留 console + error 捕获和 WebSocket 传输。
   * 适合跑性能报告时使用，避免 SDK 自身干扰测量结果。
   */
  enterZenMode(): void {
    if (this.zenMode) return;
    this.zenMode = true;

    // 停止 FPS/内存/长任务/资源采集
    if (this.performanceCollector) {
      this.performanceCollector.destroy();
      this.performanceCollector = null;
    }

    // 停止 Network 拦截（XHR/fetch patch）
    if (this.networkInterceptor) {
      this.networkInterceptor.stop();
      this.networkInterceptor = null;
    }

    // 停止 Storage 实时监听（保留快照读能力）
    this.storageReader?.unwatch();

    // 停止 DOM 采集轮询（如有）
    this.domCollector?.destroy();
    this.domCollector = null;

    // 发一条日志告知用户
    this.dataBus.emit('console', {
      timestamp: Date.now(),
      level: 'warn',
      message: '[openLog] Zen Mode ON — 已停止高开销采集',
      args: ['[openLog] Zen Mode ON — 已停止高开销采集'],
    });
  }

  /**
   * 退出禅模式，恢复所有采集器。
   */
  exitZenMode(): void {
    if (!this.zenMode) return;
    this.zenMode = false;

    this.initNetworkInterceptor(this.networkConfig);
    this.initStorageReader();
    this.initPerformanceCollector();

    this.dataBus.emit('console', {
      timestamp: Date.now(),
      level: 'log',
      message: '[openLog] Zen Mode OFF — 已恢复所有采集',
      args: ['[openLog] Zen Mode OFF — 已恢复所有采集'],
    });
  }

  /** 当前是否处于禅模式 */
  isZenMode(): boolean {
    return this.zenMode;
  }

  enableRemote(): void {
    this.reporter.enableRemote();
  }

  disableRemote(): void {
    this.reporter.disableRemote();
  }

  isRemoteEnabled(): boolean {
    return this.reporter.isRemoteEnabled();
  }

  destroy(): void {
    // 清除心跳定时器
    if (this.heartbeatTimerId !== null) {
      this.platform.timer.clearInterval(this.heartbeatTimerId);
      this.heartbeatTimerId = null;
    }

    // 恢复原始 console 方法
    if (this.originalConsole) {
      console.log = this.originalConsole.log;
      console.warn = this.originalConsole.warn;
      console.error = this.originalConsole.error;
      console.info = this.originalConsole.info;
      this.originalConsole = null;
    }

    // 清除全局实例标记
    if ((globalThis as Record<symbol, unknown>)[OPENLOG_INSTANCE_KEY] === this) {
      delete (globalThis as Record<symbol, unknown>)[OPENLOG_INSTANCE_KEY];
    }

    // 解绑 Eruda 插件
    this.erudaPlugin.detach();

    // 销毁 Eruda
    if (this.erudaInitialized && this.eruda) {
      this.eruda.destroy();
      this.erudaInitialized = false;
      this.eruda = null;
    }

    // 停止网络拦截
    if (this.networkInterceptor) {
      this.networkInterceptor.stop();
      this.networkInterceptor = null;
    }

    // 停止错误拦截
    if (this.errorInterceptor) {
      this.errorInterceptor.stop();
      this.errorInterceptor = null;
    }

    // 清理 DOM 采集器
    if (this.domCollector) {
      this.domCollector = null;
    }

    // 停止性能采集
    if (this.performanceCollector) {
      this.performanceCollector.destroy();
      this.performanceCollector = null;
    }

    // 清理存储读取器（先停止监听再置空）
    if (this.storageReader) {
      this.storageReader.unwatch();
      this.storageReader = null;
    }

    // 解绑 Reporter，清空 DataBus 订阅
    if (this.networkThrottle) {
      this.networkThrottle.destroy();
      this.networkThrottle = null;
    }
    if (this.mockApi) {
      this.mockApi.stop();
      this.mockApi = null;
    }
    if (this.perfRunCollector) {
      this.perfRunCollector.destroy();
      this.perfRunCollector = null;
    }
    this.reporter.detachDataBus();
    this.dataBus.clear();

    this.reporter.disconnect();
  }
}

// 默认导出
export default OpenLog;

// 导出平台适配接口，供外部平台实现
export type { PlatformAdapter, StorageAdapter, DeviceAdapter, TimerAdapter, WSConnection, WSEvents } from './platform/types.js';
export { BrowserAdapter } from './platform/browser/index.js';

// ─────────────────────────────────────────────────────────────
// CDN / IIFE 友好 API
// 用法：<script src="https://unpkg.com/openlog/dist/openlog.iife.js"></script>
//       OpenLog.init({ projectId: 'my-app', lang: 'zh', port: 38291 })
// ─────────────────────────────────────────────────────────────

let _instance: OpenLog | null = null;

/**
 * 全局初始化入口，适用于 CDN script 标签引入场景。
 * 重复调用会销毁旧实例并重新初始化。
 */
export function init(options: OpenLogOptions): OpenLog {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
  _instance = new OpenLog(options);
  return _instance;
}

/** 获取当前全局实例（CDN 场景下使用） */
export function getInstance(): OpenLog | null {
  return _instance;
}

/**
 * 根据 port 自动推断 WebSocket 服务器地址。
 * 使用当前页面的 hostname，适合 PC 和手机在同一局域网、
 * 页面由开发服务器（同一台机器）提供的场景。
 */
export function resolveServerUrl(port?: number): string | undefined {
  if (!port) return undefined;
  const protocol = typeof location !== 'undefined' && location.protocol === 'https:' ? 'wss' : 'ws';
  const host = typeof location !== 'undefined' ? location.hostname : 'localhost';
  return `${protocol}://${host}:${port}`;
}
