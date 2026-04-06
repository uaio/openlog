import { wsClient } from '../ws-client.js';
import { DeviceSelector } from '../lib/device-selector.js';

const deviceSelector = new DeviceSelector();

export const addMock = {
  name: 'add_mock',
  description: '向手机端设备添加 API Mock 规则。URL 支持正则，匹配的请求将返回指定的响应。',
  inputSchema: {
    type: 'object' as const,
    properties: {
      pattern: { type: 'string' as const, description: 'URL 匹配规则（字符串或正则）' },
      method: { type: 'string' as const, description: 'HTTP 方法（可选）' },
      status: { type: 'number' as const, description: 'HTTP 状态码，默认 200' },
      body: { type: 'string' as const, description: '响应体（JSON 字符串）' },
      deviceId: { type: 'string' as const, description: '设备 ID（可选）' }
    },
    required: ['pattern', 'body']
  },
  async execute(args: { pattern: string; method?: string; status?: number; body: string; deviceId?: string }): Promise<{ ok: boolean }> {
    const id = await deviceSelector.selectDevice(args.deviceId);
    wsClient.sendCommand(id, {
      type: 'add_mock',
      rule: { pattern: args.pattern, method: args.method, status: args.status ?? 200, headers: {}, body: args.body }
    });
    return { ok: true };
  }
};

export const removeMock = {
  name: 'remove_mock',
  description: '删除手机端设备指定 ID 的 API Mock 规则。',
  inputSchema: {
    type: 'object' as const,
    properties: {
      mockId: { type: 'string' as const, description: 'Mock 规则 ID（由 add_mock 返回）' },
      deviceId: { type: 'string' as const, description: '设备 ID（可选）' }
    },
    required: ['mockId']
  },
  async execute(args: { mockId: string; deviceId?: string }): Promise<{ ok: boolean }> {
    const id = await deviceSelector.selectDevice(args.deviceId);
    wsClient.sendCommand(id, { type: 'remove_mock', id: args.mockId });
    return { ok: true };
  }
};

export const clearMocks = {
  name: 'clear_mocks',
  description: '清空手机端设备所有 API Mock 规则。',
  inputSchema: {
    type: 'object' as const,
    properties: {
      deviceId: { type: 'string' as const, description: '设备 ID（可选）' }
    },
    required: []
  },
  async execute(args: { deviceId?: string }): Promise<{ ok: boolean }> {
    const id = await deviceSelector.selectDevice(args.deviceId);
    wsClient.sendCommand(id, { type: 'clear_mocks' });
    return { ok: true };
  }
};

