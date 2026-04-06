/**
 * Envelope 工厂函数 — SDK 内部使用
 * 确保所有上报数据都遵循统一格式
 */

import type { OpenLogEnvelope, Platform, DeviceContext } from './envelope.js';
import type { EventType, EventPayloadMap } from './events/index.js';
import { SCHEMA_VERSION } from './constants.js';

export interface EnvelopeFactoryContext {
  platform: Platform;
  device: DeviceContext;
  tabId: string;
}

/**
 * 创建标准 Envelope。SDK 通过此函数构造所有上报数据。
 *
 * @example
 * const env = createEnvelope(ctx, 'console', {
 *   level: 'error',
 *   args: ['something went wrong'],
 *   message: 'something went wrong',
 * });
 */
export function createEnvelope<T extends EventType>(
  ctx: EnvelopeFactoryContext,
  type: T,
  data: EventPayloadMap[T],
  ts?: number
): OpenLogEnvelope<T> {
  return {
    v: SCHEMA_VERSION,
    platform: ctx.platform,
    device: ctx.device,
    tabId: ctx.tabId,
    ts: ts ?? Date.now(),
    type,
    data,
  };
}
