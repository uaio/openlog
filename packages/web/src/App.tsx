import { useState } from 'react';
import { DeviceList } from './components/DeviceList.js';
import { LogPanel } from './components/LogPanel.js';
import { NetworkPanel } from './components/NetworkPanel.js';
import { StoragePanel } from './components/StoragePanel.js';
import { DOMPanel } from './components/DOMPanel.js';
import { PerformancePanel } from './components/PerformancePanel.js';
import { SettingsPanel } from './components/SettingsPanel.js';
import { PerfRunPanel } from './components/PerfRunPanel.js';
import { MockPanel } from './components/MockPanel.js';
import { HealthPanel } from './components/HealthPanel.js';
import { AIAnalysisPanel } from './components/AIAnalysisPanel.js';
import { Tabs, type Tab } from './components/Tabs.js';
import { useI18n } from './i18n/index.js';
import type { Device } from './types/index.js';
import './styles/global.css';

function App() {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [activeTab, setActiveTab] = useState('console');
  const { t } = useI18n();

  const handleSelectDevice = (device: Device) => {
    setSelectedDevice(device);
  };

  const tabs: Tab[] = [
    {
      id: 'console',
      label: t.tabs.console,
      icon: '📝',
      content: selectedDevice ? (
        <LogPanel deviceId={selectedDevice.deviceId} />
      ) : (
        <div style={styles.placeholder}>
          <div style={styles.placeholderIcon}>📱</div>
          <div style={styles.placeholderText}>{t.common.selectDevice}</div>
        </div>
      ),
    },
    {
      id: 'network',
      label: t.tabs.network,
      icon: '🌐',
      content: <NetworkPanel deviceId={selectedDevice?.deviceId} />,
    },
    {
      id: 'storage',
      label: t.tabs.storage,
      icon: '💾',
      content: <StoragePanel deviceId={selectedDevice?.deviceId} />,
    },
    {
      id: 'element',
      label: 'Element',
      icon: '🌲',
      content: <DOMPanel deviceId={selectedDevice?.deviceId} />,
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: '📊',
      content: <PerformancePanel deviceId={selectedDevice?.deviceId} />,
    },
    {
      id: 'perf_run',
      label: t.tabs.perf,
      icon: '🏁',
      content: <PerfRunPanel deviceId={selectedDevice?.deviceId} />,
    },
    {
      id: 'mock',
      label: t.tabs.mock,
      icon: '🎭',
      content: <MockPanel deviceId={selectedDevice?.deviceId} />,
    },
    {
      id: 'health',
      label: t.tabs.health,
      icon: '🩺',
      content: <HealthPanel deviceId={selectedDevice?.deviceId} />,
    },
    {
      id: 'ai',
      label: t.tabs.analysis,
      icon: '🧠',
      content: <AIAnalysisPanel deviceId={selectedDevice?.deviceId} />,
    },
    {
      id: 'settings',
      label: t.tabs.settings,
      icon: '⚙️',
      content: <SettingsPanel deviceId={selectedDevice?.deviceId} />,
    },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>openLog Web Viewer</h1>
        <p style={styles.subtitle}>
          {selectedDevice
            ? `${selectedDevice.ua.slice(0, 50)}${selectedDevice.ua.length > 50 ? '...' : ''}`
            : t.common.selectDevice}
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    borderBottom: '1px solid #e0e0e0',
    padding: '16px 24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold' as const,
    color: '#333',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: '4px 0 0 0',
  },
  content: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  sidebar: {
    width: '280px',
    borderRight: '1px solid #e0e0e0',
    overflow: 'auto',
  },
  main: {
    flex: 1,
    padding: '8px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#999',
  },
  placeholderIcon: {
    fontSize: '64px',
    marginBottom: '16px',
    opacity: 0.5,
  },
  placeholderText: {
    fontSize: '16px',
    fontWeight: 500,
  },
};

export default App;
