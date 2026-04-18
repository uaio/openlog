import { wsClient } from '../ws-client.js';
import { sharedDeviceSelector as deviceSelector } from '../lib/device-selector.js';


export const reloadPage = {
  name: 'reload_page',
  description: '刷新手机 H5 页面（等同于按下 F5）。调试完成后可用来验证修复效果。',
  inputSchema: {
    type: 'object' as const,
    properties: {
      deviceId: { type: 'string' as const, description: '设备 ID（可选）' }
    },
    required: []
  },
  async execute(args: { deviceId?: string }): Promise<{ ok: boolean }> {
    const id = await deviceSelector.selectDevice(args.deviceId);
    wsClient.sendCommand(id, { type: 'reload_page' });
    return { ok: true };
  }
};

export const setStorage = {
  name: 'set_storage',
  description: '在手机端设置 localStorage / sessionStorage 的值，常用于模拟不同用户状态（token、feature flag 等）。',
  inputSchema: {
    type: 'object' as const,
    properties: {
      key: { type: 'string' as const, description: 'storage key' },
      value: { type: 'string' as const, description: 'storage value' },
      storageType: { type: 'string' as const, description: '"local"（默认）或 "session"' },
      deviceId: { type: 'string' as const, description: '设备 ID（可选）' }
    },
    required: ['key']
  },
  async execute(args: { key: string; value?: string; storageType?: string; deviceId?: string }): Promise<{ ok: boolean }> {
    const id = await deviceSelector.selectDevice(args.deviceId);
    wsClient.sendCommand(id, { type: 'set_storage', key: args.key, value: args.value ?? '', storageType: args.storageType || 'local' });
    return { ok: true };
  }
};

export const clearStorage = {
  name: 'clear_storage',
  description: '清空手机端 storage（localStorage、sessionStorage 或全部）。用于重置页面状态。',
  inputSchema: {
    type: 'object' as const,
    properties: {
      storageType: { type: 'string' as const, description: '"local" | "session" | "all"（默认 all）' },
      deviceId: { type: 'string' as const, description: '设备 ID（可选）' }
    },
    required: []
  },
  async execute(args: { storageType?: string; deviceId?: string }): Promise<{ ok: boolean }> {
    const id = await deviceSelector.selectDevice(args.deviceId);
    wsClient.sendCommand(id, { type: 'clear_storage', storageType: args.storageType || 'all' });
    return { ok: true };
  }
};

export const highlightElement = {
  name: 'highlight_element',
  description: '在手机页面上高亮指定 CSS selector 对应的元素（红色边框 + 半透明背景），持续数秒后自动还原。用于确认某个 DOM 元素的位置。',
  inputSchema: {
    type: 'object' as const,
    properties: {
      selector: { type: 'string' as const, description: 'CSS selector，如 "#app" 或 ".login-btn"' },
      duration: { type: 'number' as const, description: '高亮持续毫秒数（默认 3000）' },
      deviceId: { type: 'string' as const, description: '设备 ID（可选）' }
    },
    required: ['selector']
  },
  async execute(args: { selector: string; duration?: number; deviceId?: string }): Promise<{ ok: boolean }> {
    const id = await deviceSelector.selectDevice(args.deviceId);
    wsClient.sendCommand(id, { type: 'highlight_element', selector: args.selector, duration: args.duration ?? 3000 });
    return { ok: true };
  }
};

