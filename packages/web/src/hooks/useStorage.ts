import { useState, useCallback, useEffect } from 'react';
import { useWebSocket } from './useWebSocket.js';
import { api } from '../api/client.js';
import { websocketManager } from '../lib/websocketManager.js';
import type { StorageSnapshot } from '../types/index.js';

export function useStorage(deviceId?: string) {
  const [snapshot, setSnapshot] = useState<StorageSnapshot | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStorage = useCallback(async () => {
    if (!deviceId) {
      setSnapshot(null);
      return;
    }
    setLoading(true);
    try {
      const data = await api.getStorage(deviceId);
      setSnapshot(data);
    } catch (error) {
      console.error('[useStorage] 加载失败:', error);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  // 设备切换时重新拉取
  useEffect(() => {
    fetchStorage();
  }, [fetchStorage]);

  const handleMessage = useCallback((message: any) => {
    if (message.type === 'event' && message.envelope?.type === 'storage' && message.deviceId === deviceId) {
      const envelope = message.envelope;
      setSnapshot({ deviceId: envelope.device.deviceId, tabId: envelope.tabId, ...envelope.data });
    }
  }, [deviceId]);

  useWebSocket(handleMessage);

  // 请求设备刷新 storage
  const refresh = useCallback(() => {
    if (!deviceId) return;
    websocketManager.send({ type: 'refresh_storage', deviceId });
    // 同时主动拉取一次（兜底）
    setTimeout(fetchStorage, 500);
  }, [deviceId, fetchStorage]);

  return { snapshot, loading, refresh };
}
