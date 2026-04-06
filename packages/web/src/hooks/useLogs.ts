import { useState, useCallback, useRef, useEffect } from 'react';
import { useWebSocket } from './useWebSocket.js';
import { api } from '../api/client.js';
import type { ConsoleLog } from '../types/index.js';

export function useLogs(deviceId?: string, maxLogs = 500) {
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const logBufferRef = useRef<ConsoleLog[]>([]);
  const lastFetchCountRef = useRef(0);

  // 当 deviceId 变化时，加载历史日志
  useEffect(() => {
    if (!deviceId) {
      setLogs([]);
      setHasMore(false);
      return;
    }

    const loadHistoricalLogs = async () => {
      console.log('[useLogs] 加载设备历史日志:', deviceId);
      setLoading(true);

      try {
        const historicalLogs = await api.getLogs(deviceId, maxLogs);
        console.log('[useLogs] 历史日志加载完成，数量:', historicalLogs.length);
        // 反转顺序，让最新的日志在最上面
        setLogs(historicalLogs.reverse());
        setHasMore(historicalLogs.length >= maxLogs);
        lastFetchCountRef.current = historicalLogs.length;
      } catch (error) {
        console.error('[useLogs] 加载历史日志失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHistoricalLogs();
  }, [deviceId, maxLogs]);

  const handleWebSocketMessage = useCallback((message: any) => {
    if (message.type === 'event' && message.envelope?.type === 'console') {
      const envelope = message.envelope;
      if (deviceId && message.deviceId !== deviceId) return;

      const newLog: ConsoleLog = {
        deviceId: envelope.device.deviceId,
        tabId: envelope.tabId,
        timestamp: envelope.ts,
        level: envelope.data.level,
        message: envelope.data.message,
        stack: envelope.data.stack,
      };

      logBufferRef.current.push(newLog);
      if (logBufferRef.current.length >= 10) flushLogs();
    }
  }, [deviceId]);

  const flushLogs = useCallback(() => {
    if (logBufferRef.current.length === 0) return;
    const logsToAdd = [...logBufferRef.current];
    setLogs(prevLogs => [...logsToAdd, ...prevLogs].slice(0, maxLogs));
    logBufferRef.current = [];
  }, [maxLogs]);

  useWebSocket(handleWebSocketMessage);

  // 定期刷新缓冲区
  useEffect(() => {
    const interval = setInterval(flushLogs, 100);
    return () => clearInterval(interval);
  }, [flushLogs]);

  const clearLogs = useCallback(() => {
    setLogs([]);
    logBufferRef.current = [];
  }, []);

  return {
    logs,
    clearLogs,
    loading,
    hasMore
  };
}
