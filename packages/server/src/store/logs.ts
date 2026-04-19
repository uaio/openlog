import type { Persistence } from './persistence.js';

export interface ConsoleLog {
  deviceId: string;
  tabId: string;
  timestamp: number;
  level: 'log' | 'warn' | 'error' | 'info';
  message: string;
  stack?: string;
}

export class LogStore {
  private logs: Map<string, ConsoleLog[]> = new Map();
  private cleanupTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly maxLogsPerDevice = 1000;
  private db?: Persistence;

  constructor(db?: Persistence) {
    this.db = db;
  }

  push(deviceId: string, log: ConsoleLog): void {
    let logs = this.logs.get(deviceId);
    if (!logs) {
      logs = [];
      this.logs.set(deviceId, logs);
    }

    logs.push(log);

    if (logs.length > this.maxLogsPerDevice) {
      logs.shift();
    }

    this.db?.insertLog(log);
  }

  get(deviceId: string, limit?: number, level?: ConsoleLog['level']): ConsoleLog[] {
    let logs = this.logs.get(deviceId) || [];

    // If memory is empty but we have persistence, try loading from db
    if (logs.length === 0 && this.db) {
      logs = this.db.loadLogs(deviceId, limit || this.maxLogsPerDevice) as ConsoleLog[];
      if (logs.length > 0) {
        this.logs.set(deviceId, logs);
      }
    }

    if (level) {
      logs = logs.filter((l) => l.level === level);
    }

    if (limit) {
      logs = logs.slice(-limit);
    }

    return logs;
  }

  clear(deviceId: string): void {
    this.logs.delete(deviceId);
    this.cancelCleanup(deviceId);
    this.db?.clearLogs(deviceId);
  }

  cleanup(deviceId: string): void {
    this.cancelCleanup(deviceId);

    const timer = setTimeout(
      () => {
        this.logs.delete(deviceId);
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
}
