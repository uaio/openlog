import type { Persistence } from './persistence.js';

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
  private cleanupTimer?: NodeJS.Timeout;
  private db?: Persistence;

  constructor(db?: Persistence) {
    this.db = db;

    // Load persisted devices on startup
    if (db) {
      for (const d of db.loadDevices()) {
        this.devices.set(d.deviceId, {
          deviceId: d.deviceId,
          projectId: d.projectId,
          ua: d.ua,
          screen: d.screen,
          pixelRatio: d.pixelRatio,
          language: d.language,
          connectTime: d.firstSeen,
          lastActiveTime: d.lastSeen,
          activeTabs: 0,
          online: false,
        });
      }
    }

    this.cleanupTimer = setInterval(
      () => {
        this.cleanup();
      },
      1 * 60 * 1000,
    );
  }

  register(deviceId: string, info: Omit<Device, 'deviceId' | 'online' | 'activeTabs'>): void {
    const existing = this.devices.get(deviceId);
    this.devices.set(deviceId, {
      ...info,
      deviceId,
      online: true,
      activeTabs: existing ? existing.activeTabs + 1 : 1,
    });
    this.db?.upsertDevice({
      deviceId,
      projectId: info.projectId,
      ua: info.ua,
      screen: info.screen,
      pixelRatio: info.pixelRatio,
      language: info.language,
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
      this.db?.touchDevice(deviceId);
    }
  }

  get(deviceId: string): Device | undefined {
    return this.devices.get(deviceId);
  }

  list(projectId?: string): Device[] {
    const all = Array.from(this.devices.values());
    if (projectId) {
      return all.filter((d) => d.projectId === projectId);
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

  cleanup(): void {
    const threshold = Date.now() - 10 * 60 * 1000;
    for (const [id, device] of this.devices.entries()) {
      if (!device.online && device.lastActiveTime < threshold) {
        this.devices.delete(id);
      }
    }
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }
}
