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
}

export interface ErudaConfig {
  /** 是否启用 Eruda，默认 true */
  enabled?: boolean;
  /** 选择工具，如 ['console', 'elements', 'network'] */
  tool?: string[];
  /** 自动缩放，默认 true */
  autoScale?: boolean;
  /** 默认配置 */
  defaults?: {
    transparency?: number;
    displaySize?: number;
    theme?: string;
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
