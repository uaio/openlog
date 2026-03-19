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

export class DeviceStore {
  private devices: Map<string, Device> = new Map();

  register(deviceId: string, info: Omit<Device, 'deviceId' | 'online' | 'activeTabs'>): void {
    const existing = this.devices.get(deviceId);
    this.devices.set(deviceId, {
      ...info,
      deviceId,
      online: true,
      activeTabs: existing ? existing.activeTabs + 1 : 1
    });
  }

  unregister(deviceId: string): void {
    const device = this.devices.get(deviceId);
    if (device) {
      device.activeTabs--;
      if (device.activeTabs <= 0) {
        device.online = false;
        device.lastActiveTime = Date.now();
      }
    }
  }

  get(deviceId: string): Device | undefined {
    return this.devices.get(deviceId);
  }

  list(projectId?: string): Device[] {
    const all = Array.from(this.devices.values());
    if (projectId) {
      return all.filter(d => d.projectId === projectId);
    }
    return all;
  }

  updateActiveTime(deviceId: string): void {
    const device = this.devices.get(deviceId);
    if (device) {
      device.lastActiveTime = Date.now();
      device.online = true;
    }
  }

  // 清理 30 分钟未活跃的设备
  cleanup(): void {
    const threshold = Date.now() - 30 * 60 * 1000;
    for (const [id, device] of this.devices) {
      if (!device.online && device.lastActiveTime < threshold) {
        this.devices.delete(id);
      }
    }
  }
}
