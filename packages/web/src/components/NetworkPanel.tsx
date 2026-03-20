import { CSSProperties } from 'react';

interface NetworkPanelProps {
  deviceId?: string;
}

export function NetworkPanel({ deviceId }: NetworkPanelProps) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>网络请求</h3>
        {deviceId && <span style={styles.deviceId}>设备: {deviceId.slice(0, 8)}...</span>}
      </div>
      <div style={styles.content}>
        <div style={styles.placeholder}>
          <div style={styles.icon}>🌐</div>
          <div style={styles.text}>网络请求监控功能开发中...</div>
          <div style={styles.hint}>即将支持拦截和展示 fetch/XHR 请求</div>
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
  placeholder: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#999'
  },
  icon: {
    fontSize: '64px',
    marginBottom: '16px',
    opacity: 0.5
  },
  text: {
    fontSize: '16px',
    marginBottom: '8px'
  },
  hint: {
    fontSize: '13px',
    color: '#bbb'
  }
};
