import type { StorageSnapshot } from '../types/index.js';

export type StorageReportCallback = (snapshot: Omit<StorageSnapshot, 'deviceId' | 'tabId'>) => void;

export class StorageReader {
  private onReport: StorageReportCallback;

  constructor(onReport: StorageReportCallback) {
    this.onReport = onReport;
  }

  /** 读取并上报存储快照 */
  readAndReport(): void {
    try {
      const snapshot = this.readStorage();
      this.onReport(snapshot);
    } catch (error) {
      console.error('[AIConsole] Failed to read storage:', error);
    }
  }

  /** 读取存储数据 */
  readStorage(): Omit<StorageSnapshot, 'deviceId' | 'tabId'> {
    const localStorageData: Record<string, string> = {};
    const sessionStorageData: Record<string, string> = {};
    let localStorageSize = 0;
    let sessionStorageSize = 0;

    // 读取 localStorage
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key) || '';
          localStorageData[key] = value;
          localStorageSize += key.length + value.length;
        }
      }
    } catch (error) {
      console.error('[AIConsole] Failed to read localStorage:', error);
    }

    // 读取 sessionStorage
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          const value = sessionStorage.getItem(key) || '';
          sessionStorageData[key] = value;
          sessionStorageSize += key.length + value.length;
        }
      }
    } catch (error) {
      console.error('[AIConsole] Failed to read sessionStorage:', error);
    }

    // 读取 cookies
    let cookies = '';
    try {
      cookies = document.cookie;
    } catch (error) {
      console.error('[AIConsole] Failed to read cookies:', error);
    }

    return {
      timestamp: Date.now(),
      localStorage: localStorageData,
      sessionStorage: sessionStorageData,
      cookies,
      localStorageSize,
      sessionStorageSize
    };
  }
}
