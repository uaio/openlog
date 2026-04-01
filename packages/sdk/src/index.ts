import { getDeviceInfo, generateTabId, updateDeviceActiveTime } from './core/device.js';
import { Reporter } from './transport/reporter.js';
import { NetworkInterceptor } from './interceptors/network.js';
import { StorageReader } from './interceptors/storage.js';
import type { RemoteConfig, ErudaConfig, NetworkInterceptorConfig } from './types/index.js';

// Eruda 类型声明
interface Eruda {
  init: (options?: ErudaConfig) => void;
  destroy: () => void;
  show: () => void;
  hide: () => void;
}

export const version = '0.1.0';

/** 默认心跳间隔（毫秒） */
const DEFAULT_HEARTBEAT_INTERVAL = 30000;

/** 用于检测已存在 AIConsole 实例的符号 */
const AICONSOLE_INSTANCE_KEY = Symbol.for('aiconsole.instance');

interface OriginalConsole {
  log: typeof console.log;
  warn: typeof console.warn;
  error: typeof console.error;
  info: typeof console.info;
}

export interface AIConsoleOptions extends RemoteConfig {
  defaultPlugins?: string[];
  /** 心跳间隔（毫秒），默认 30000 */
  heartbeatInterval?: number;
  /** Eruda 调试面板配置 */
  eruda?: ErudaConfig;
  /** 网络请求拦截配置 */
  network?: NetworkInterceptorConfig;
}

/** 将参数序列化为字符串，正确处理对象 */
function serializeArgs(args: unknown[]): string {
  return args.map(arg => {
    if (arg === undefined) {
      return 'undefined';
    }
    if (arg === null) {
      return 'null';
    }
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg);
      } catch {
        // 处理循环引用等情况
        return String(arg);
      }
    }
    return String(arg);
  }).join(' ');
}

/** 清理堆栈跟踪，移除拦截器帧 */
function cleanStackTrace(stack: string | undefined): string | undefined {
  if (!stack) return undefined;

  const lines = stack.split('\n');
  // 过滤掉包含 interceptConsole 或 serializeArgs 的帧
  const cleanedLines = lines.filter(line =>
    !line.includes('interceptConsole') &&
    !line.includes('serializeArgs') &&
    !line.includes('cleanStackTrace')
  );

  return cleanedLines.join('\n');
}

export class AIConsole {
  private reporter: Reporter;
  private deviceInfo: ReturnType<typeof getDeviceInfo>;
  private tabId: string;
  private projectId: string;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private heartbeatIntervalMs: number;
  private originalConsole: OriginalConsole | null = null;
  private erudaInitialized = false;
  private eruda: Eruda | null = null;
  private networkInterceptor: NetworkInterceptor | null = null;
  private storageReader: StorageReader | null = null;

  constructor(options: AIConsoleOptions) {
    if (!options.projectId) {
      throw new Error('projectId is required');
    }

    // 检测是否已存在 AIConsole 实例
    const existingInstance = (globalThis as Record<symbol, unknown>)[AICONSOLE_INSTANCE_KEY];
    if (existingInstance) {
      console.warn('AIConsole: 检测到已存在的实例，多个实例可能导致竞态条件');
    }

    this.projectId = options.projectId;
    this.deviceInfo = getDeviceInfo(options.projectId);
    this.tabId = generateTabId();
    this.heartbeatIntervalMs = options.heartbeatInterval ?? DEFAULT_HEARTBEAT_INTERVAL;

    this.reporter = new Reporter(this.deviceInfo, this.tabId);

    // 检查用户是否之前关闭了远程监控
    const remoteDisabled = localStorage.getItem(`aiconsole_remote_${this.projectId}`) === 'false';
    if (!remoteDisabled) {
      this.reporter.connect(options.server);
    }

    // 拦截 console
    this.interceptConsole();

    // 初始化网络请求拦截
    this.initNetworkInterceptor(options.network);

    // 初始化存储读取器
    this.initStorageReader();

    // 标记实例存在
    (globalThis as Record<symbol, unknown>)[AICONSOLE_INSTANCE_KEY] = this;

    // 定期更新活跃时间
    this.heartbeatInterval = setInterval(() => {
      updateDeviceActiveTime(this.projectId);
      this.reporter.updateDeviceInfo();
    }, this.heartbeatIntervalMs);

    // 初始化 Eruda 调试面板（默认启用）
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
          defaults: config?.defaults
        });
        this.erudaInitialized = true;
      } else {
        console.warn('AIConsole: Eruda 初始化失败 - 无效的 eruda 模块');
      }
    } catch (error) {
      console.warn('AIConsole: Eruda 加载失败', error);
    }
  }

  private interceptConsole(): void {
    // 保存原始 console 方法
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
        // 先调用原始方法
        originalFn.apply(console, args);

        // 安全地报告日志
        try {
          const message = serializeArgs(args);
          const entry: {
            timestamp: number;
            level: 'log' | 'warn' | 'error' | 'info';
            message: string;
            stack?: string;
          } = {
            timestamp: Date.now(),
            level,
            message
          };

          // 只为 error 级别添加堆栈跟踪
          if (level === 'error') {
            entry.stack = cleanStackTrace(new Error().stack);
          }

          self.reporter.reportConsole(entry);
        } catch {
          // 静默处理报告错误，避免影响原始 console 输出
        }
      };
    };

    console.log = createInterceptor('log', this.originalConsole.log);
    console.warn = createInterceptor('warn', this.originalConsole.warn);
    console.error = createInterceptor('error', this.originalConsole.error);
    console.info = createInterceptor('info', this.originalConsole.info);
  }

  private initNetworkInterceptor(config?: NetworkInterceptorConfig): void {
    const self = this;
    this.networkInterceptor = new NetworkInterceptor(
      (entry) => {
        self.reporter.reportNetwork(entry);
      },
      config
    );
    this.networkInterceptor.start();
  }

  private initStorageReader(): void {
    const self = this;
    this.storageReader = new StorageReader((snapshot) => {
      self.reporter.reportStorage(snapshot);
    });

    // 注册刷新存储的回调
    this.reporter.onRefreshStorage(() => {
      self.storageReader?.readAndReport();
    });
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
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
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
    if ((globalThis as Record<symbol, unknown>)[AICONSOLE_INSTANCE_KEY] === this) {
      delete (globalThis as Record<symbol, unknown>)[AICONSOLE_INSTANCE_KEY];
    }

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

    // 清理存储读取器
    if (this.storageReader) {
      this.storageReader = null;
    }

    this.reporter.disconnect();
  }
}

// 默认导出
export default AIConsole;
