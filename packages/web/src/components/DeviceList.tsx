import { useMemo } from 'react';
import { useDevices } from '../hooks/useDevices.js';
import { useI18n } from '../i18n/index.js';
import type { Device } from '../types/index.js';

interface DeviceListProps {
  projectId?: string;
  onSelectDevice?: (device: Device) => void;
  selectedDeviceId?: string;
}

export function DeviceList({ projectId, onSelectDevice, selectedDeviceId }: DeviceListProps) {
  const { devices, loading, selectedId, setSelectedId } = useDevices(projectId);
  const { t } = useI18n();

  const handleSelect = (device: Device) => {
    setSelectedId(device.deviceId);
    onSelectDevice?.(device);
  };

  // Group devices by projectId
  const grouped = useMemo(() => {
    const map = new Map<string, Device[]>();
    for (const device of devices) {
      const key = device.projectId || 'default';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(device);
    }
    // Sort: online first within each group
    for (const [, list] of map) {
      list.sort((a, b) => (b.online ? 1 : 0) - (a.online ? 1 : 0));
    }
    return map;
  }, [devices]);

  const currentSelectedId = selectedDeviceId !== undefined ? selectedDeviceId : selectedId;
  const hasMultipleProjects = grouped.size > 1;

  if (loading) {
    return <div style={styles.loading}>{t.common.loading}</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        {t.deviceList.title} ({devices.length})
      </div>

      {devices.length === 0 ? (
        <div style={styles.empty}>{t.deviceList.empty}</div>
      ) : (
        <div style={styles.list}>
          {[...grouped.entries()].map(([pid, groupDevices]) => (
            <div key={pid}>
              {hasMultipleProjects && (
                <div style={styles.groupHeader}>
                  <span style={styles.groupIcon}>📦</span>
                  <span style={styles.groupName}>{pid}</span>
                  <span style={styles.groupCount}>{groupDevices.length}</span>
                </div>
              )}
              {groupDevices.map((device) => (
                <div
                  key={device.deviceId}
                  onClick={() => handleSelect(device)}
                  style={{
                    ...styles.deviceItem,
                    ...(currentSelectedId === device.deviceId ? styles.selected : {}),
                    ...(device.online ? styles.onlineBorder : styles.offlineBorder),
                  }}
                >
                  <div style={styles.deviceInfo}>
                    <div style={styles.deviceName}>{device.ua}</div>
                    <div style={styles.deviceDetails}>
                      {device.screen} · {device.language}
                    </div>
                    {!hasMultipleProjects && (
                      <div style={styles.projectBadge}>{device.projectId}</div>
                    )}
                  </div>

                  <div style={styles.deviceMeta}>
                    <div
                      style={{
                        ...styles.status,
                        backgroundColor: device.online ? '#f6ffed' : '#fff2f0',
                        color: device.online ? '#52c41a' : '#ff4d4f',
                      }}
                    >
                      {device.online ? t.common.online : t.common.offline}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    backgroundColor: '#f5f5f5',
    borderRight: '1px solid #e0e0e0',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#999',
  },
  header: {
    padding: '16px',
    fontSize: '16px',
    fontWeight: 'bold',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#fff',
  },
  empty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#999',
  },
  list: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '8px',
  },
  groupHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px 4px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#666',
    marginTop: '4px',
  },
  groupIcon: {
    fontSize: '12px',
  },
  groupName: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  groupCount: {
    fontSize: '11px',
    color: '#999',
    backgroundColor: '#e8e8e8',
    borderRadius: '8px',
    padding: '1px 6px',
  },
  deviceItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    marginBottom: '6px',
    backgroundColor: '#fff',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    borderLeft: '3px solid transparent',
  },
  selected: {
    borderLeftColor: '#1890ff',
    boxShadow: '0 2px 8px rgba(24, 144, 255, 0.15)',
  },
  onlineBorder: {
    borderLeftColor: '#52c41a',
  },
  offlineBorder: {
    borderLeftColor: '#ff4d4f',
  },
  deviceInfo: {
    flex: 1,
    minWidth: 0,
  },
  deviceName: {
    fontSize: '13px',
    fontWeight: 500,
    marginBottom: '3px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  deviceDetails: {
    fontSize: '11px',
    color: '#999',
  },
  projectBadge: {
    display: 'inline-block',
    marginTop: '3px',
    fontSize: '10px',
    color: '#8c8c8c',
    backgroundColor: '#f0f0f0',
    padding: '1px 6px',
    borderRadius: '3px',
    fontFamily: 'monospace',
  },
  deviceMeta: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: '4px',
  },
  status: {
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '10px',
    fontWeight: 500,
  },
};
