/**
 * WebSocket 协议消息类型定义
 *
 * 三方通信：
 *   SDK (Device) ──────→ Server ──────→ PC Panel / MCP
 *                  ←────── Server ←──── PC Panel (指令)
 */

import type { AnyEnvelope, DeviceContext } from './envelope.js';

// ─── Device → Server ─────────────────────────────────────────────────────────

/** SDK 注册消息（连接后第一条） */
export interface DeviceRegisterMessage {
  type: 'register';
  deviceId: string;
  projectId: string;
  deviceInfo: Omit<DeviceContext, 'deviceId' | 'projectId'>;
}

/** SDK 上报数据消息（统一 Envelope 格式） */
export interface DeviceDataMessage {
  type: 'event';
  envelope: AnyEnvelope;
}

/** SDK 心跳消息 */
export interface DeviceHeartbeatMessage {
  type: 'heartbeat';
  deviceId: string;
  ts: number;
}

export type DeviceToServerMessage =
  | DeviceRegisterMessage
  | DeviceDataMessage
  | DeviceHeartbeatMessage;

// ─── Server → Device（指令下发）────────────────────────────────────────────────

export type ServerToDeviceCommand =
  | { type: 'execute_js'; code: string }
  | { type: 'take_screenshot' }
  | { type: 'reload_page' }
  | { type: 'refresh_storage' }
  | { type: 'refresh_dom' }
  | { type: 'set_storage'; storageType: 'local' | 'session' | 'cookie'; key: string; value: string }
  | { type: 'clear_storage'; storageType: 'local' | 'session' | 'cookie' | 'all' }
  | { type: 'highlight_element'; selector: string; duration: number }
  | { type: 'zen_mode'; enabled: boolean }
  | { type: 'start_perf_run' }
  | { type: 'stop_perf_run' }
  | { type: 'set_network_throttle'; preset: 'none' | '3g' | '2g' | 'offline' }
  | { type: 'add_mock'; rule: MockRule }
  | { type: 'remove_mock'; id: string }
  | { type: 'clear_mocks' };

export interface MockRule {
  id: string;
  pattern: string;
  method?: string;
  status: number;
  headers?: Record<string, string>;
  body: string;
}

// ─── PC Viewer → Server ───────────────────────────────────────────────────────

/** PC Panel 注册为 viewer */
export interface ViewerRegisterMessage {
  type: 'viewer';
}

/** PC Panel 向特定设备发送指令（透传） */
export type ViewerCommandMessage = ServerToDeviceCommand & { deviceId: string };

export type ViewerToServerMessage =
  | ViewerRegisterMessage
  | ViewerCommandMessage;

// ─── Server → PC Viewer（推送）────────────────────────────────────────────────

/** 设备列表更新推送 */
export interface ServerDeviceListPush {
  type: 'device_list';
  devices: ConnectedDevice[];
}

/** 新事件数据推送（包装 Envelope，附加 deviceId 便于面板路由） */
export interface ServerEventPush {
  type: 'event';
  deviceId: string;
  envelope: AnyEnvelope;
}

export type ServerToViewerMessage =
  | ServerDeviceListPush
  | ServerEventPush;

// ─── 设备在线信息（REST API 响应）─────────────────────────────────────────────

export interface ConnectedDevice {
  deviceId: string;
  projectId: string;
  platform: string;
  ua: string;
  screen: string;
  pixelRatio: number;
  language: string;
  url?: string;
  connectTime: number;
  lastActiveTime: number;
  activeTabs: number;
  online: boolean;
}

// ─── REST API 标准响应包装 ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  ok: true;
  data: T;
  ts: number;
}

export interface ApiError {
  ok: false;
  error: string;
  code?: string;
  ts: number;
}

export type ApiResult<T> = ApiResponse<T> | ApiError;
