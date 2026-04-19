import type { Persistence } from './persistence.js';

/** 网络请求记录 */
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

export interface NetworkQueryOptions {
  limit?: number;
  method?: string;
  urlPattern?: string;
  status?: number;
}

export class NetworkStore {
  private requests: Map<string, NetworkRequest[]> = new Map();
  private readonly maxRequestsPerDevice: number;
  private cleanupTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private db?: Persistence;

  constructor(maxRequestsPerDevice = 500, db?: Persistence) {
    this.maxRequestsPerDevice = maxRequestsPerDevice;
    this.db = db;
  }

  push(deviceId: string, request: NetworkRequest): void {
    if (!this.requests.has(deviceId)) {
      this.requests.set(deviceId, []);
    }

    const deviceRequests = this.requests.get(deviceId)!;

    const existingTimer = this.cleanupTimers.get(deviceId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.cleanupTimers.delete(deviceId);
    }

    deviceRequests.push(request);

    if (deviceRequests.length > this.maxRequestsPerDevice) {
      deviceRequests.splice(0, deviceRequests.length - this.maxRequestsPerDevice);
    }

    this.db?.insertNetworkRequest(request);
  }

  get(deviceId: string, options?: NetworkQueryOptions): NetworkRequest[] {
    let requests = this.requests.get(deviceId);

    // If memory is empty but we have persistence, try loading from db
    if ((!requests || requests.length === 0) && this.db) {
      requests = this.db.loadNetworkRequests(deviceId, options?.limit || this.maxRequestsPerDevice) as NetworkRequest[];
      if (requests.length > 0) {
        this.requests.set(deviceId, requests);
      }
    }

    if (!requests) {
      return [];
    }

    if (options) {
      requests = requests.filter((req) => {
        if (options.method && req.method.toUpperCase() !== options.method.toUpperCase()) {
          return false;
        }
        if (options.status !== undefined && req.status !== options.status) {
          return false;
        }
        if (options.urlPattern) {
          try {
            const regex = new RegExp(options.urlPattern, 'i');
            if (!regex.test(req.url)) {
              return false;
            }
          } catch {
            // ignore invalid regex
          }
        }
        return true;
      });
    }

    if (options?.limit && options.limit > 0) {
      requests = requests.slice(-options.limit);
    }

    return requests;
  }

  clear(deviceId: string): void {
    this.requests.delete(deviceId);

    const timer = this.cleanupTimers.get(deviceId);
    if (timer) {
      clearTimeout(timer);
      this.cleanupTimers.delete(deviceId);
    }
  }

  cleanup(deviceId: string): void {
    const timer = setTimeout(
      () => {
        this.requests.delete(deviceId);
        this.cleanupTimers.delete(deviceId);
      },
      30 * 60 * 1000,
    );

    this.cleanupTimers.set(deviceId, timer);
  }

  cancelCleanup(deviceId: string): void {
    const timer = this.cleanupTimers.get(deviceId);
    if (timer) {
      clearTimeout(timer);
      this.cleanupTimers.delete(deviceId);
    }
  }

  getTotalCount(): number {
    let total = 0;
    for (const requests of this.requests.values()) {
      total += requests.length;
    }
    return total;
  }
}
