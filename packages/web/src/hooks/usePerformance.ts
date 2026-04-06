import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket.js';
import { api } from '../api/client.js';
import type { PerformanceReport } from '../types/index.js';

export function usePerformance(deviceId?: string) {
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    if (!deviceId) return;
    setLoading(true);
    try {
      const data = await api.getPerformance(deviceId);
      setReport(data);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handleMessage = useCallback((message: any) => {
    if (message.type === 'event' && message.envelope?.type === 'performance' && message.deviceId === deviceId) {
      const envelope = message.envelope;
      setReport({ deviceId: envelope.device.deviceId, tabId: envelope.tabId, ...envelope.data } as PerformanceReport);
    }
  }, [deviceId]);

  useWebSocket(handleMessage);

  return { report, loading };
}
