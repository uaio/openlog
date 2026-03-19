import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client.js';
import { useWebSocket } from './useWebSocket.js';
import type { Device } from '../types/index.js';

export function useDevices(projectId?: string) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleWebSocketMessage = useCallback((message: any) => {
    if (message.type === 'devices') {
      setDevices(message.data);
      setLoading(false);
    }
  }, []);

  useWebSocket(handleWebSocketMessage);

  useEffect(() => {
    const fetchInitialDevices = async () => {
      const data = await api.listDevices(projectId);
      setDevices(data);
      setLoading(false);
    };

    fetchInitialDevices();
  }, [projectId]);

  const selectedDevice = devices.find(d => d.deviceId === selectedId);

  return {
    devices,
    loading,
    selectedDevice,
    selectedId,
    setSelectedId
  };
}
