import { API_BASE_URL } from '../config.js';
import { sharedDeviceSelector as deviceSelector, type Device } from '../lib/device-selector.js';


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

export const getStorage = {
  name: 'get_storage',
  description: '获取设备的本地存储信息（localStorage、sessionStorage、cookies）。如果不指定 deviceId，会自动选择唯一或最近活跃的设备。注意：首次调用可能返回空数据，需要等待移动端上报。',
  inputSchema: {
    type: 'object' as const,
    properties: {
      deviceId: {
        type: 'string' as const,
        description: '设备 ID（可选，不填则自动选择）'
      },
      type: {
        type: 'string' as const,
        enum: ['all', 'localStorage', 'sessionStorage', 'cookies'],
        description: '存储类型，默认 all'
      }
    }
  },

  async execute(args: {
    deviceId?: string;
    type?: 'all' | 'localStorage' | 'sessionStorage' | 'cookies';
  }): Promise<{ device: Device | null; storage: StorageSnapshot | Partial<StorageSnapshot> | null }> {
    // 智能选择设备
    const selectedDeviceId = await deviceSelector.selectDevice(args.deviceId);
    const device = await deviceSelector.getDevice(selectedDeviceId);

    const url = `${API_BASE_URL}/api/devices/${selectedDeviceId}/storage`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        return { device, storage: null };
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const snapshot: StorageSnapshot = await response.json();

    // 根据类型过滤
    if (args.type === 'localStorage') {
      return {
        device,
        storage: {
          deviceId: snapshot.deviceId,
          timestamp: snapshot.timestamp,
          localStorage: snapshot.localStorage,
          localStorageSize: snapshot.localStorageSize
        }
      };
    }

    if (args.type === 'sessionStorage') {
      return {
        device,
        storage: {
          deviceId: snapshot.deviceId,
          timestamp: snapshot.timestamp,
          sessionStorage: snapshot.sessionStorage,
          sessionStorageSize: snapshot.sessionStorageSize
        }
      };
    }

    if (args.type === 'cookies') {
      return {
        device,
        storage: {
          deviceId: snapshot.deviceId,
          timestamp: snapshot.timestamp,
          cookies: snapshot.cookies
        }
      };
    }

    return { device, storage: snapshot };
  }
};
