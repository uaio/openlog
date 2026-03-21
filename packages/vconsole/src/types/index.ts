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
