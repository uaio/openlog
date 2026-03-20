import { CSSProperties } from 'react';

interface SettingsPanelProps {
  deviceId?: string;
}

export function SettingsPanel({ deviceId }: SettingsPanelProps) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>设置</h3>
        {deviceId && <span style={styles.deviceId}>设备: {deviceId.slice(0, 8)}...</span>}
      </div>
      <div style={styles.content}>
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>设备信息</h4>
          {deviceId ? (
            <div style={styles.info}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>设备 ID:</span>
                <span style={styles.infoValue}>{deviceId}</span>
              </div>
            </div>
          ) : (
            <div style={styles.empty}>未选择设备</div>
          )}
        </div>

        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>显示设置</h4>
          <div style={styles.setting}>
            <label style={styles.settingLabel}>
              <input type="checkbox" style={styles.checkbox} />
              <span>显示时间戳</span>
            </label>
          </div>
          <div style={styles.setting}>
            <label style={styles.settingLabel}>
              <input type="checkbox" style={styles.checkbox} defaultChecked />
              <span>显示日志级别</span>
            </label>
          </div>
          <div style={styles.setting}>
            <label style={styles.settingLabel}>
              <input type="checkbox" style={styles.checkbox} defaultChecked />
              <span>自动滚动到底部</span>
            </label>
          </div>
        </div>

        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>关于</h4>
          <div style={styles.info}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>版本:</span>
              <span style={styles.infoValue}>0.1.0</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>项目:</span>
              <span style={styles.infoValue}>AIConsole</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>GitHub:</span>
              <a href="https://github.com/uaio/AIConsole" style={styles.link} target="_blank" rel="noopener noreferrer">
                github.com/uaio/AIConsole
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    backgroundColor: '#fff'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #e8e8e8',
    backgroundColor: '#fafafa'
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333'
  },
  deviceId: {
    fontSize: '12px',
    color: '#999',
    padding: '4px 8px',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px'
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '20px'
  },
  section: {
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#fafafa',
    borderRadius: '8px',
    border: '1px solid #e8e8e8'
  },
  sectionTitle: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333'
  },
  info: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px'
  },
  infoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #e8e8e8'
  },
  infoLabel: {
    fontSize: '13px',
    color: '#666',
    fontWeight: '500'
  },
  infoValue: {
    fontSize: '13px',
    color: '#333',
    fontFamily: 'monospace'
  },
  link: {
    fontSize: '13px',
    color: '#1890ff',
    textDecoration: 'none'
  },
  empty: {
    fontSize: '13px',
    color: '#999',
    fontStyle: 'italic'
  },
  setting: {
    padding: '8px 0'
  },
  settingLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#333',
    cursor: 'pointer'
  },
  checkbox: {
    margin: 0,
    cursor: 'pointer'
  }
};
