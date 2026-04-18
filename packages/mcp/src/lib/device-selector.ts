import { API_BASE_URL } from '../config.js';

export interface Device {
  deviceId: string;
  projectId: string;
  ua: string;
  screen: string;
  pixelRatio: number;
  language: string;
  connectTime: number;
  lastActiveTime: number;
  activeTabs: number;
  online: boolean;
}

export class DeviceSelector {
  private cachedDevices: Device[] = [];
  private lastFetchTime: number = 0;
  private readonly cacheTTL: number;

  /** 会话级聚焦设备 — 设置后所有未指定 deviceId 的调用都使用此设备 */
  private focusedDeviceId: string | null = null;

  constructor(cacheTTL: number = 30000) {
    this.cacheTTL = cacheTTL;
  }

  /**
   * 设置聚焦设备（会话级）
   */
  setFocusedDevice(deviceId: string | null): void {
    this.focusedDeviceId = deviceId;
  }

  /**
   * 获取当前聚焦设备
   */
  getFocusedDevice(): string | null {
    return this.focusedDeviceId;
  }

  /**
   * 智能选择设备:
   * 1. 如果用户指定 deviceId，验证其存在
   * 2. 如果有聚焦设备且在线，使用聚焦设备
   * 3. 如果只有一个设备，自动选择
   * 4. 如果有多个设备，选择最近活跃的在线设备
   * 5. 如果没有设备，返回错误
   */
  async selectDevice(deviceId?: string): Promise<string> {
    const devices = await this.listDevices();

    // 用户指定了设备 ID
    if (deviceId) {
      const device = devices.find(d => d.deviceId === deviceId);
      if (!device) {
        throw new Error(`设备 ${deviceId} 不存在。当前设备: ${devices.map(d => d.deviceId).join(', ') || '无'}`);
      }
      return deviceId;
    }

    // 有聚焦设备时优先使用
    if (this.focusedDeviceId) {
      const focused = devices.find(d => d.deviceId === this.focusedDeviceId);
      if (focused && focused.online) {
        return this.focusedDeviceId;
      }
      // 聚焦设备离线或不存在，清除聚焦并 fallback
      this.focusedDeviceId = null;
    }

    // 没有设备
    if (devices.length === 0) {
      throw new Error('没有连接的设备。请确保移动端已启动并连接到 openLog。');
    }

    // 只有一个设备，自动选择
    if (devices.length === 1) {
      return devices[0].deviceId;
    }

    // 多个设备，优先选择在线且最近活跃的
    const onlineDevices = devices.filter(d => d.online);
    if (onlineDevices.length > 0) {
      // 按最后活跃时间排序，选择最近的
      onlineDevices.sort((a, b) => b.lastActiveTime - a.lastActiveTime);
      return onlineDevices[0].deviceId;
    }

    // 所有设备都离线，选择最近活跃的
    devices.sort((a, b) => b.lastActiveTime - a.lastActiveTime);
    return devices[0].deviceId;
  }

  /**
   * 获取所有设备列表（带缓存）
   */
  async listDevices(forceRefresh: boolean = false): Promise<Device[]> {
    const now = Date.now();

    // 使用缓存
    if (!forceRefresh && this.cachedDevices.length > 0 && (now - this.lastFetchTime) < this.cacheTTL) {
      return this.cachedDevices;
    }

    // 刷新缓存
    const response = await fetch(`${API_BASE_URL}/api/devices`);

    if (!response.ok) {
      throw new Error(`获取设备列表失败: HTTP ${response.status}`);
    }

    this.cachedDevices = await response.json();
    this.lastFetchTime = now;

    return this.cachedDevices;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cachedDevices = [];
    this.lastFetchTime = 0;
  }

  /**
   * 获取设备信息
   */
  async getDevice(deviceId: string): Promise<Device | null> {
    const response = await fetch(`${API_BASE_URL}/api/devices/${deviceId}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`获取设备信息失败: HTTP ${response.status}`);
    }

    return await response.json();
  }
}

/** 全局共享单例 — 所有工具必须使用此实例以共享聚焦状态 */
export const sharedDeviceSelector = new DeviceSelector();
