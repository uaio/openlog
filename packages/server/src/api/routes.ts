import { Router } from 'express';
import { DeviceStore, LogStore, NetworkStore, StorageStore, DOMStore, PerformanceStore, ScreenshotStore, PerfRunStore } from '../store/index.js';
import { createDeviceRoutes } from './devices.js';
import { createIngestRoute } from './ingest.js';

export function createRoutes(deviceStore: DeviceStore, logStore: LogStore, networkStore: NetworkStore, storageStore: StorageStore, domStore: DOMStore, performanceStore: PerformanceStore, screenshotStore: ScreenshotStore, perfRunStore: PerfRunStore): Router {
  const router = Router();
  const deviceRoutes = createDeviceRoutes(deviceStore, logStore, networkStore, storageStore, domStore, performanceStore, screenshotStore, perfRunStore);

  // ── 外部数据接入（统一 Envelope 标准）──────────────────────────────
  router.post('/api/ingest', createIngestRoute({
    deviceStore, logStore, networkStore, storageStore, performanceStore, screenshotStore
  }));

  router.get('/api/devices', deviceRoutes.listDevices);
  router.get('/api/devices/:deviceId', deviceRoutes.getDevice);
  router.delete('/api/devices/:deviceId/logs', deviceRoutes.deleteLogs);
  router.get('/api/devices/:deviceId/logs', deviceRoutes.getLogs);
  router.get('/api/devices/:deviceId/network', deviceRoutes.getNetworkRequests);
  router.get('/api/devices/:deviceId/storage', deviceRoutes.getStorage);
  router.get('/api/devices/:deviceId/dom', deviceRoutes.getDOM);
  router.get('/api/devices/:deviceId/performance', deviceRoutes.getPerformance);
  router.post('/api/devices/:deviceId/execute', deviceRoutes.executeJs);
  router.post('/api/devices/:deviceId/screenshot', deviceRoutes.takeScreenshot);
  router.get('/api/devices/:deviceId/screenshot', deviceRoutes.getScreenshot);
  router.post('/api/devices/:deviceId/reload', deviceRoutes.reloadPage);
  router.post('/api/devices/:deviceId/storage/set', deviceRoutes.setStorage);
  router.post('/api/devices/:deviceId/storage/clear', deviceRoutes.clearStorage);
  router.post('/api/devices/:deviceId/highlight', deviceRoutes.highlightElement);
  router.post('/api/devices/:deviceId/zen', deviceRoutes.setZenMode);
  router.post('/api/devices/:deviceId/perf-run/start', deviceRoutes.startPerfRun);
  router.post('/api/devices/:deviceId/perf-run/stop', deviceRoutes.stopPerfRun);
  router.get('/api/devices/:deviceId/perf-run', deviceRoutes.listPerfRunSessions);
  router.get('/api/devices/:deviceId/perf-run/:sessionId', deviceRoutes.getPerfRunSession);
  router.post('/api/devices/:deviceId/network-throttle', deviceRoutes.setNetworkThrottle);
  router.post('/api/devices/:deviceId/mocks', deviceRoutes.addMock);
  router.delete('/api/devices/:deviceId/mocks/:mockId', deviceRoutes.removeMock);
  router.delete('/api/devices/:deviceId/mocks', deviceRoutes.clearMocks);
  router.get('/api/devices/:deviceId/health', deviceRoutes.getHealthCheck);

  return router;
}
