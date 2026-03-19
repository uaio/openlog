import { Router } from 'express';
import { DeviceStore, LogStore } from '../store/index.js';
import { createDeviceRoutes } from './devices.js';

export function createRoutes(deviceStore: DeviceStore, logStore: LogStore): Router {
  const router = Router();
  const deviceRoutes = createDeviceRoutes(deviceStore, logStore);

  router.get('/api/devices', deviceRoutes.listDevices);
  router.get('/api/devices/:deviceId', deviceRoutes.getDevice);
  router.get('/api/devices/:deviceId/logs', deviceRoutes.getLogs);

  return router;
}
