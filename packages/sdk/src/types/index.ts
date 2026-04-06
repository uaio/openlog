export interface DeviceInfo {
  deviceId: string;
  projectId: string;
  ua: string;
  screen: string;
  pixelRatio: number;
  language: string;
  url: string;
  connectTime: number;
  lastActiveTime: number;
}

export interface ConsoleLogEntry {
  deviceId: string;
  tabId: string;
  timestamp: number;
  level: 'log' | 'warn' | 'error' | 'info';
  message: string;
  stack?: string;
}

export interface RemoteConfig {
  projectId: string;
  server?: string;
  /**
   * 服务器端口简写（与 server 二选一）。
   * 填写后 SDK 自动推断 ws://[当前页面 hostname]:port。
   * 适合 PC 和手机在同一局域网、页面由同一台机器提供服务的场景。
   */
  port?: number;
  /**
   * 界面语言，默认 'zh'。
   * 'zh' 中文  |  'en' 英文
   */
  lang?: 'zh' | 'en';
}

export interface ErudaConfig {
  /** 是否启用 Eruda，默认 true */
  enabled?: boolean;
  /** 选择工具，如 ['console', 'elements', 'network'] */
  tool?: string[];
  /** 自动缩放，默认 true */
  autoScale?: boolean;
  /** 使用 Shadow DOM，默认 true */
  useShadowDom?: boolean;
  /** 默认配置 */
  defaults?: {
    transparency?: number;
    displaySize?: number;
    theme?: string;
    /** 是否覆盖 console（openLog 中默认 false，避免双重采集） */
    overrideConsole?: boolean;
  };
}

/** 网络请求记录 */
export interface NetworkRequestEntry {
  deviceId: string;
  tabId: string;
  id: string;
  timestamp: number;
  method: string;
  url: string;
  status?: number;
  statusText?: string;
  requestHeaders?: Record<string, string>;
  requestBody?: string;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  duration?: number;
  type: 'xhr' | 'fetch';
  error?: string;
}

/** 网络拦截器配置 */
export interface NetworkInterceptorConfig {
  /** 是否启用，默认 true */
  enabled?: boolean;
  /** 请求体最大捕获大小（字节），默认 10KB */
  maxRequestBodySize?: number;
  /** 响应体最大捕获大小（字节），默认 10KB */
  maxResponseBodySize?: number;
  /** 忽略的 URL 模式（正则字符串数组） */
  ignoreUrls?: string[];
}

/** 存储快照 */
export interface StorageSnapshot {
  deviceId: string;
  tabId: string;
  timestamp: number;
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  cookies: string;
  localStorageSize: number;
  sessionStorageSize: number;
}

/** DOM 节点（序列化后） */
export interface DOMNode {
  tag: string;
  id?: string;
  className?: string;
  /** 关键属性（去除 class/id，限制数量） */
  attrs?: Record<string, string>;
  /** 文本内容（截断至 150 字符） */
  text?: string;
  children?: DOMNode[];
  /** 实际子节点数（当 children 被截断时） */
  childCount?: number;
}

/** DOM 快照 */
export interface DOMSnapshot {
  deviceId: string;
  tabId: string;
  timestamp: number;
  url: string;
  title: string;
  dom: DOMNode;
}

export interface ScreenshotData {
  timestamp: number;
  dataUrl: string;
  width: number;
  height: number;
  url: string;
  title: string;
}
export interface PerformanceSample {
  timestamp: number;
  fps: number;
  heapUsed?: number;
  heapTotal?: number;
}

/** Web Vital 指标 */
export interface WebVital {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

/** Long Task —— 主线程阻塞超过 50ms 的任务 */
export interface LongTask {
  startTime: number;  // ms since page load
  duration: number;   // ms
  name: string;
}

/** 资源加载耗时 */
export interface ResourceTiming {
  name: string;           // URL
  initiatorType: string;  // fetch / xmlhttprequest / script / css / img…
  duration: number;       // ms (responseEnd - startTime)
  transferSize: number;   // bytes (0 = cache hit)
  startTime: number;      // ms since page load
}

/** 交互延迟（INP 辅助数据） */
export interface InteractionTiming {
  type: string;         // click / keydown / pointerdown…
  duration: number;     // ms
  startTime: number;
  target?: string;      // element tag/id hint
}

/** 性能上报数据 */
export interface PerformanceReport {
  deviceId: string;
  tabId: string;
  vitals: WebVital[];
  samples: PerformanceSample[];
  longTasks: LongTask[];
  resources: ResourceTiming[];
  interactions: InteractionTiming[];
}

/** 单项评分 */
export interface PerfScoreItem {
  name: string;
  score: number;        // 0-100
  weight: number;       // 权重（加权求和时使用）
  value: number | null; // 原始值（ms / count / fps 等）
  unit: string;
  rating: 'good' | 'needs-improvement' | 'poor' | 'unknown';
}

/** 综合评分结果 */
export interface PerfRunScore {
  total: number;           // 0-100 综合分
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  items: PerfScoreItem[];
  issues: string[];        // 具体问题描述，供 AI 分析
  summary: string;         // 一句话评语
}

/** 跑分会话 */
export interface PerfRunSession {
  sessionId: string;
  deviceId: string;
  tabId: string;
  startTime: number;
  endTime: number;
  duration: number;          // ms
  snapshot: Omit<PerformanceReport, 'deviceId' | 'tabId'>;
  score: PerfRunScore;
}
