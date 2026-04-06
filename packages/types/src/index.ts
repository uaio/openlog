/**
 * @openlog/types — openLog 统一数据标准
 *
 * 这是 openLog 生态的唯一类型来源（Single Source of Truth）。
 * 所有包（sdk、server、web、mcp）均引用此包，不再各自定义类型。
 *
 * 版本兼容策略：
 *   - MINOR 版本：新增 EventType / 新增 Payload 字段（向后兼容）
 *   - MAJOR 版本：修改 Envelope 结构 / 修改现有 Payload 字段
 *   - 消费方应通过 envelope.v 判断版本，对未知字段宽容处理
 */

// ─── Envelope & Platform ──────────────────────────────────────────────────────
export type { OpenLogEnvelope, AnyEnvelope, EnvelopeOf, Platform, DeviceContext } from './envelope.js';
export { isEnvelope } from './envelope.js';

// ─── Event Payloads ───────────────────────────────────────────────────────────
export type {
  EventType,
  EventPayloadMap,
  // Console
  ConsolePayload,
  // Network
  NetworkPayload,
  // Storage
  StoragePayload,
  // DOM
  DOMPayload,
  DOMNode,
  // Performance
  PerformancePayload,
  PerformanceSample,
  WebVital,
  LongTask,
  ResourceTiming,
  InteractionTiming,
  // Error
  ErrorPayload,
  ErrorSource,
  // Screenshot
  ScreenshotPayload,
  // Perf Run
  PerfRunPayload,
  PerfScoreItem,
  // Lifecycle
  LifecyclePayload,
  LifecycleEvent,
  // Custom
  CustomPayload,
} from './events/index.js';

// ─── Protocol (WebSocket + REST) ─────────────────────────────────────────────
export type {
  // Device → Server
  DeviceToServerMessage,
  DeviceRegisterMessage,
  DeviceDataMessage,
  DeviceHeartbeatMessage,
  // Server → Device
  ServerToDeviceCommand,
  MockRule,
  // PC → Server
  ViewerToServerMessage,
  ViewerRegisterMessage,
  ViewerCommandMessage,
  // Server → PC
  ServerToViewerMessage,
  ServerDeviceListPush,
  ServerEventPush,
  // Device info
  ConnectedDevice,
  // REST API
  ApiResponse,
  ApiError,
  ApiResult,
} from './protocol.js';

// ─── Schema version constant ──────────────────────────────────────────────────
export { SCHEMA_VERSION } from './constants.js';
export type { SchemaVersion } from './constants.js';

/**
 * 创建标准 Envelope 的工厂函数（SDK 内部使用，外部消费方无需调用）
 */
export { createEnvelope } from './factory.js';
