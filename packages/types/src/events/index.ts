/**
 * 所有事件类型的 Payload 定义
 * 新平台接入时只需在此添加新的 EventType 和对应 Payload
 */

// ── Console ─────────────────────────────────────────────────────────────────

export interface ConsolePayload {
  level: 'log' | 'warn' | 'error' | 'info';
  /** 原始参数列表（已序列化为字符串，保留富文本） */
  args: string[];
  /** 合并后的可读消息（args.join(' ')，方便搜索过滤） */
  message: string;
  /** 调用栈（仅 error/warn 级别） */
  stack?: string;
}

// ── Network ──────────────────────────────────────────────────────────────────

export interface NetworkPayload {
  /** 请求唯一 ID（用于关联请求/响应事件） */
  id: string;
  method: string;
  url: string;
  type: 'xhr' | 'fetch';
  /** 请求头 */
  requestHeaders?: Record<string, string>;
  requestBody?: string;
  /** 响应状态码 */
  status?: number;
  statusText?: string;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  /** 请求耗时（ms），响应完成后才有值 */
  duration?: number;
  /** 发生错误时的错误信息 */
  error?: string;
}

// ── Storage ──────────────────────────────────────────────────────────────────

export interface StoragePayload {
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  /** Cookie 原始字符串 */
  cookies: string;
  localStorageSize: number;
  sessionStorageSize: number;
}

// ── DOM ──────────────────────────────────────────────────────────────────────

export interface DOMNode {
  tag: string;
  id?: string;
  className?: string;
  attrs?: Record<string, string>;
  /** 文本内容（截断至 150 字符） */
  text?: string;
  children?: DOMNode[];
  /** 实际子节点数（children 被截断时） */
  childCount?: number;
}

export interface DOMPayload {
  url: string;
  title: string;
  dom: DOMNode;
}

// ── Performance ───────────────────────────────────────────────────────────────

export interface PerformanceSample {
  ts: number;
  fps: number;
  heapUsed?: number;
  heapTotal?: number;
}

export interface WebVital {
  name: 'LCP' | 'CLS' | 'FCP' | 'TTFB' | 'INP' | string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export interface LongTask {
  startTime: number;
  duration: number;
  name: string;
}

export interface ResourceTiming {
  name: string;
  initiatorType: string;
  duration: number;
  transferSize: number;
  startTime: number;
}

export interface InteractionTiming {
  type: string;
  duration: number;
  startTime: number;
  target?: string;
}

export interface PerformancePayload {
  vitals: WebVital[];
  samples: PerformanceSample[];
  longTasks: LongTask[];
  resources: ResourceTiming[];
  interactions: InteractionTiming[];
}

// ── Error ─────────────────────────────────────────────────────────────────────

export type ErrorSource = 'uncaught' | 'unhandledrejection' | 'manual';

export interface ErrorPayload {
  source: ErrorSource;
  message: string;
  stack?: string;
  /** 对于 unhandledrejection，Promise rejection 的值 */
  reason?: string;
  /** 发生错误的文件 URL */
  filename?: string;
  lineno?: number;
  colno?: number;
}

// ── Screenshot ────────────────────────────────────────────────────────────────

export interface ScreenshotPayload {
  /** base64 data URL，格式 "data:image/png;base64,..." */
  dataUrl: string;
  width: number;
  height: number;
  url: string;
  title: string;
}

// ── Perf Run（跑分会话） ───────────────────────────────────────────────────────

export interface PerfScoreItem {
  name: string;
  score: number;
  weight: number;
  value: number | null;
  unit: string;
  rating: 'good' | 'needs-improvement' | 'poor' | 'unknown';
}

export interface PerfRunPayload {
  sessionId: string;
  startTime: number;
  endTime: number;
  duration: number;
  snapshot: Omit<PerformancePayload, never>;
  score: {
    total: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    items: PerfScoreItem[];
    issues: string[];
    summary: string;
  };
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

export type LifecycleEvent =
  | 'connect'       // SDK 建立 WebSocket 连接
  | 'disconnect'    // WebSocket 断开
  | 'page_show'     // 页面可见（visibilitychange / pageshow）
  | 'page_hide'     // 页面隐藏
  | 'page_load'     // DOMContentLoaded
  | 'page_unload';  // beforeunload

export interface LifecyclePayload {
  event: LifecycleEvent;
  url?: string;
  title?: string;
  /** 额外平台特定数据（Native 路由、小程序页面栈等） */
  extra?: Record<string, unknown>;
}

// ── Custom（开发者自定义上报） ────────────────────────────────────────────────

export interface CustomPayload {
  /** 自定义事件名 */
  name: string;
  /** 任意结构的数据（PC 面板以 JSON 树展示） */
  data: unknown;
}

// ─── EventType discriminant ───────────────────────────────────────────────────

/**
 * 所有事件类型的字符串枚举。
 * 新增类型时同步扩展 EventPayloadMap。
 */
export type EventType =
  | 'console'
  | 'network'
  | 'storage'
  | 'dom'
  | 'performance'
  | 'error'
  | 'screenshot'
  | 'perf_run'
  | 'lifecycle'
  | 'custom';

/**
 * EventType → Payload 的映射关系（TypeScript discriminated union 的核心）。
 * 消费方通过 envelope.type 可自动推断 envelope.data 的类型。
 */
export interface EventPayloadMap {
  console: ConsolePayload;
  network: NetworkPayload;
  storage: StoragePayload;
  dom: DOMPayload;
  performance: PerformancePayload;
  error: ErrorPayload;
  screenshot: ScreenshotPayload;
  perf_run: PerfRunPayload;
  lifecycle: LifecyclePayload;
  custom: CustomPayload;
}
