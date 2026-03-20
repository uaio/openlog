import { useDevices } from '../hooks/useDevices.js';
import type { Device } from '../types/index.js';

interface DeviceListProps {
  projectId?: string;
  onSelectDevice?: (device: Device) => void;
  selectedDeviceId?: string;
}

export function DeviceList({ projectId, onSelectDevice, selectedDeviceId }: DeviceListProps) {
  const { devices, loading, selectedId, setSelectedId } = useDevices(projectId);

  const handleSelect = (device: Device) => {
    setSelectedId(device.deviceId);
    onSelectDevice?.(device);
  };

  // 使用外部传入的 selectedDeviceId（如果提供）
  const currentSelectedId = selectedDeviceId !== undefined ? selectedDeviceId : selectedId;

  if (loading) {
    return (
      <div style={styles.loading}>
        加载中...
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        设备列表 ({devices.length})
      </div>

      {devices.length === 0 ? (
        <div style={styles.empty}>
          暂无设备连接
        </div>
      ) : (
        <div style={styles.list}>
          {devices.map((device) => (
            <div
              key={device.deviceId}
              onClick={() => handleSelect(device)}
              style={{
                ...styles.deviceItem,
                ...(currentSelectedId === device.deviceId ? styles.selected : {}),
                ...(device.online ? styles.online : styles.offline)
              }}
            >
              <div style={styles.deviceInfo}>
                <div style={styles.deviceName}>
                  {device.ua}
                </div>
                <div style={styles.deviceDetails}>
                  {device.screen} · {device.language}
                </div>
              </div>

              <div style={styles.deviceMeta}>
                <div style={{
                  ...styles.status,
                  ...(device.online ? styles.online : styles.offline)
                }}>
                  {device.online ? '在线' : '离线'}
                </div>
                <div style={styles.tabs}>
                  {device.activeTabs} 标签
                </div>
              </div>
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
    borderRight: '1px solid #e0e0e0'
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#999'
  },
  header: {
    padding: '16px',
    fontSize: '16px',
    fontWeight: 'bold',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#fff'
  },
  empty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#999'
  },
  list: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '8px'
  },
  deviceItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    marginBottom: '8px',
    backgroundColor: '#fff',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    borderLeft: '3px solid transparent'
  },
  selected: {
    borderLeftColor: '#1890ff',
    boxShadow: '0 2px 8px rgba(24, 144, 255, 0.15)'
  },
  online: {
    borderLeftColor: '#52c41a'
  },
  offline: {
    borderLeftColor: '#ff4d4f'
  },
  deviceInfo: {
    flex: 1,
    minWidth: 0
  },
  deviceName: {
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const
  },
  deviceDetails: {
    fontSize: '12px',
    color: '#999'
  },
  deviceMeta: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: '4px'
  },
  status: {
    fontSize: '12px',
    padding: '2px 8px',
    borderRadius: '2px'
  },
  tabs: {
    fontSize: '11px',
    color: '#999'
  }
};
