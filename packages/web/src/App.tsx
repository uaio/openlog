import { useState } from 'react';
import { DeviceList } from './components/DeviceList.js';
import { LogPanel } from './components/LogPanel.js';
import { NetworkPanel } from './components/NetworkPanel.js';
import { SettingsPanel } from './components/SettingsPanel.js';
import { Tabs, type Tab } from './components/Tabs.js';
import type { Device } from './types/index.js';
import './styles/global.css';

function App() {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [activeTab, setActiveTab] = useState('console');

  const handleSelectDevice = (device: Device) => {
    setSelectedDevice(device);
  };

  const tabs: Tab[] = [
    {
      id: 'console',
      label: '控制台',
      icon: '📝',
      content: selectedDevice ? (
        <LogPanel deviceId={selectedDevice.deviceId} />
      ) : (
        <div style={styles.placeholder}>
          <div style={styles.placeholderIcon}>📱</div>
          <div style={styles.placeholderText}>
            从左侧选择一个设备开始调试
          </div>
        </div>
      )
    },
    {
      id: 'network',
      label: '网络',
      icon: '🌐',
      content: <NetworkPanel deviceId={selectedDevice?.deviceId} />
    },
    {
      id: 'settings',
      label: '设置',
      icon: '⚙️',
      content: <SettingsPanel deviceId={selectedDevice?.deviceId} />
    }
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>AIConsole Web Viewer</h1>
        <p style={styles.subtitle}>
          {selectedDevice
            ? `当前设备: ${selectedDevice.ua.slice(0, 50)}${selectedDevice.ua.length > 50 ? '...' : ''}`
            : '请选择一个设备查看日志'
          }
        </p>
      </div>

      <div style={styles.content}>
        <div style={styles.sidebar}>
          <DeviceList
            onSelectDevice={handleSelectDevice}
            selectedDeviceId={selectedDevice?.deviceId}
          />
        </div>

        <div style={styles.main}>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    backgroundColor: '#f5f5f5'
  },
  header: {
    backgroundColor: '#fff',
    borderBottom: '1px solid #e0e0e0',
    padding: '16px 24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold' as const,
    color: '#333',
    margin: 0
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: '4px 0 0 0'
  },
  content: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden'
  },
  sidebar: {
    width: '280px',
    borderRight: '1px solid #e0e0e0',
    overflow: 'auto'
  },
  main: {
    flex: 1,
    padding: '8px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#999'
  },
  placeholderIcon: {
    fontSize: '64px',
    marginBottom: '16px',
    opacity: 0.5
  },
  placeholderText: {
    fontSize: '16px',
    fontWeight: 500
  }
};

export default App;
