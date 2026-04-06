/**
 * openLog 统一数据标准
 * @version 1.0
 *
 * 所有平台（Web H5、React Native、Flutter、小程序）的 SDK 上报数据
 * 均遵循此 Envelope 格式。Server、PC 监控面板、MCP 工具均以此为准。
 *
 * 设计原则：
 *  - 版本字段 (v) 保证向前兼容
 *  - platform 字段标识数据来源平台，消费侧按需处理
 *  - PC 面板展示已知类型，未知类型展示 raw JSON
 *  - MCP 可查询全部类型
 */

import type { EventType, EventPayloadMap } from './events/index.js';

// ─── 平台标识 ──────────────────────────────────────────────────────────────

export type Platform =
  | 'web'           // 浏览器 H5（当前主要平台）
  | 'react-native'  // React Native
  | 'flutter'       // Flutter WebView / Dart
  | 'miniprogram'   // 微信/支付宝小程序
  | 'unknown';      // 未知平台（保留兼容）

// ─── 设备上下文（每条 Envelope 都携带） ──────────────────────────────────────

export interface DeviceContext {
  /** 设备唯一 ID，SDK 生成，持久化到 localStorage */
  deviceId: string;
  /** 项目标识，由开发者在 init() 时传入 */
  projectId: string;
  /** User-Agent 字符串（Web）或设备型号（Native） */
  ua: string;
  /** 屏幕分辨率，格式 "width×height" */
  screen: string;
  /** 设备像素比 */
  pixelRatio: number;
  /** 系统语言，如 "zh-CN" */
  language: string;
  /** 当前页面 URL（Web）或路由（Native） */
  url?: string;
}

// ─── 统一 Envelope ──────────────────────────────────────────────────────────

/**
 * 所有 SDK 上报数据的统一包装格式。
 * 使用 TypeScript discriminated union：type 字段决定 payload 的具体类型。
 */
export type OpenLogEnvelope<T extends EventType = EventType> = {
  /** Schema 版本，当前 "1"，消费方可据此做兼容处理 */
  v: '1';
  /** 数据来源平台 */
  platform: Platform;
  /** 设备上下文 */
  device: DeviceContext;
  /** Tab/会话 ID（同一设备可有多个 Tab） */
  tabId: string;
  /** 事件发生时间（Unix 毫秒时间戳） */
  ts: number;
  /** 事件类型（discriminant） */
  type: T;
  /** 具体事件数据（由 type 决定结构） */
  data: EventPayloadMap[T];
};

/**
 * 任意类型的 Envelope（用于泛型消费，如存储、转发）
 */
export type AnyEnvelope = OpenLogEnvelope<EventType>;

// ─── 工具类型 ──────────────────────────────────────────────────────────────

/** 从 Envelope 提取特定类型 */
export type EnvelopeOf<T extends EventType> = OpenLogEnvelope<T>;

/** 判断是否是某类 Envelope（类型守卫） */
export function isEnvelope<T extends EventType>(
  env: AnyEnvelope,
  type: T
): env is OpenLogEnvelope<T> {
  return env.type === type;
}
