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
  private readonly maxLogsPerDevice = 1000;

  push(deviceId: string, log: ConsoleLog): void {
    let logs = this.logs.get(deviceId);
    if (!logs) {
      logs = [];
      this.logs.set(deviceId, logs);
    }

    logs.push(log);

    // 超出限制，删除最旧的
    if (logs.length > this.maxLogsPerDevice) {
      logs.shift();
    }
  }

  get(deviceId: string, limit?: number, level?: string): ConsoleLog[] {
    let logs = this.logs.get(deviceId) || [];

    if (level) {
      logs = logs.filter(l => l.level === level);
    }

    if (limit) {
      logs = logs.slice(-limit);
    }

    return logs;
  }

  clear(deviceId: string): void {
    this.logs.delete(deviceId);
  }

  cleanup(deviceId: string): void {
    // 当设备断开 30 分钟后清理
    setTimeout(() => {
      this.logs.delete(deviceId);
    }, 30 * 60 * 1000);
  }
}
