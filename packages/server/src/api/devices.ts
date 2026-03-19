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
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const level = req.query.level as 'log' | 'warn' | 'error' | 'info' | undefined;

      const logs = logStore.get(deviceId, limit, level);
      res.json(logs);
    },

    getDevice: (req: Request, res: Response) => {
      const { deviceId } = req.params;
      const device = deviceStore.get(deviceId);

      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }

      res.json(device);
    }
  };
}
