import type { Device, ConsoleLog } from '../types/index.js';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';

interface ApiError {
  message: string;
  status?: number;
  url?: string;
}

class ApiClientError extends Error implements ApiError {
  status?: number;
  url?: string;

  constructor(message: string, status?: number, url?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.url = url;
  }
}

async function handleResponse(res: Response, url: string): Promise<any> {
  if (!res.ok) {
    let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const contentType = res.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const errorData = await res.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      }
    } catch {
      // 如果无法解析错误响应，使用默认消息
    }
    throw new ApiClientError(errorMessage, res.status, url);
  }

  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return res.json();
  }
  return res.text();
}

export const api = {
  async listDevices(projectId?: string): Promise<Device[]> {
    const url = projectId ? `${API_BASE}/devices?projectId=${projectId}` : `${API_BASE}/devices`;
    const res = await fetch(url);
    return handleResponse(res, url);
  },

  async getLogs(deviceId: string, limit?: number, level?: string): Promise<ConsoleLog[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (level) params.append('level', level);

    const url = `${API_BASE}/devices/${deviceId}/logs?${params}`;
    const res = await fetch(url);
    return handleResponse(res, url);
  },

  async getDevice(deviceId: string): Promise<Device> {
    const url = `${API_BASE}/devices/${deviceId}`;
    const res = await fetch(url);
    return handleResponse(res, url);
  },

  async deleteLogs(deviceId: string): Promise<{ success: boolean; count: number }> {
    const url = `${API_BASE}/devices/${deviceId}/logs`;
    const res = await fetch(url, {
      method: 'DELETE'
    });
    return handleResponse(res, url);
  }
};

export { ApiClientError };
