import { Request, Response } from 'express';
import { DeviceStore, LogStore } from '../store/index.js';

export function createDeviceRoutes(deviceStore: DeviceStore, logStore: LogStore) {
  return {
    listDevices: (req: Request, res: Response) => {
      const projectId = req.query.projectId as string;
      const devices = deviceStore.list(projectId);
      res.json(devices);
    },

    getLogs: (req: Request, res: Response) => {
      const { deviceId } = req.params;

      // 验证并处理 limit 参数
      const MAX_LOGS_LIMIT = 1000;
      let limit: number | undefined;
      if (req.query.limit) {
        const parsedLimit = parseInt(req.query.limit as string, 10);
        // 检查是否为有效数字且在合理范围内
        if (!isNaN(parsedLimit) && parsedLimit > 0) {
          limit = Math.min(parsedLimit, MAX_LOGS_LIMIT);
        }
        // 如果 limit 无效，默认使用 undefined（返回所有日志）
      }

      // 验证 level 参数（白名单检查）
      const validLevels = ['log', 'warn', 'error', 'info'];
      const level = req.query.level as string;
      const validatedLevel = level && validLevels.includes(level)
        ? (level as 'log' | 'warn' | 'error' | 'info')
        : undefined;

      const logs = logStore.get(deviceId, limit, validatedLevel);

      // 如果设备不存在，返回空数组（保持一致性）
      if (!logs) {
        return res.status(404).json({ error: 'Device not found' });
      }

      res.json(logs);
    },

    getDevice: (req: Request, res: Response) => {
      const { deviceId } = req.params;
      const device = deviceStore.get(deviceId);

      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }

      res.json(device);
    },

    deleteLogs: (req: Request, res: Response) => {
      const { deviceId } = req.params;

      // 检查设备是否存在
      const device = deviceStore.get(deviceId);
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }

      // 获取删除前的日志数量
      const logsBefore = logStore.get(deviceId);
      const count = logsBefore ? logsBefore.length : 0;

      // 清除日志
      logStore.clear(deviceId);

      console.log(`[Server] 已清除设备 ${deviceId} 的 ${count} 条日志`);

      res.json({
        success: true,
        count
      });
    }
  };
}
