import { API_BASE_URL } from '../config.js';
import { sharedDeviceSelector as deviceSelector, type Device } from '../lib/device-selector.js';


export interface NetworkRequest {
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

export const getNetworkRequests = {
  name: 'get_network_requests',
  description: '获取设备的网络请求记录，用于分析 API 调用、调试请求问题。如果不指定 deviceId，会自动选择唯一或最近活跃的设备。',
  inputSchema: {
    type: 'object' as const,
    properties: {
      deviceId: {
        type: 'string' as const,
        description: '设备 ID（可选，不填则自动选择）'
      },
      limit: {
        type: 'number' as const,
        description: '返回条数限制，默认 50'
      },
      method: {
        type: 'string' as const,
        description: 'HTTP 方法过滤 (GET/POST/PUT/DELETE 等)'
      },
      urlPattern: {
        type: 'string' as const,
        description: 'URL 匹配模式（正则表达式）'
      },
      status: {
        type: 'number' as const,
        description: '状态码过滤（如 200, 404, 500）'
      }
    }
  },

  async execute(args: {
    deviceId?: string;
    limit?: number;
    method?: string;
    urlPattern?: string;
    status?: number;
  }): Promise<{ device: Device | null; requests: NetworkRequest[] }> {
    // 智能选择设备
    const selectedDeviceId = await deviceSelector.selectDevice(args.deviceId);
    const device = await deviceSelector.getDevice(selectedDeviceId);

    // 构建查询参数
    const params = new URLSearchParams();
    if (args.limit) params.append('limit', args.limit.toString());
    if (args.method) params.append('method', args.method);
    if (args.urlPattern) params.append('urlPattern', args.urlPattern);
    if (args.status !== undefined) params.append('status', args.status.toString());

    const url = `${API_BASE_URL}/api/devices/${selectedDeviceId}/network?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const requests = await response.json();

    return { device, requests };
  }
};
