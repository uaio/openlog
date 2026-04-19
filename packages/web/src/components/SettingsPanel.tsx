import { CSSProperties } from 'react';
import { useI18n, type Lang } from '../i18n/index.js';

interface SettingsPanelProps {
  deviceId?: string;
}

export function SettingsPanel({ deviceId }: SettingsPanelProps) {
  const { t, lang, setLang } = useI18n();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>{t.settings.title}</h3>
        {deviceId && <span style={styles.deviceId}>ID: {deviceId.slice(0, 8)}...</span>}
      </div>
      <div style={styles.content}>
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>{t.settings.deviceInfo}</h4>
          {deviceId ? (
            <div style={styles.info}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Device ID:</span>
                <span style={styles.infoValue}>{deviceId}</span>
              </div>
            </div>
          ) : (
            <div style={styles.empty}>{t.common.selectDevice}</div>
          )}
        </div>

        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>{t.settings.display}</h4>
          <div style={styles.setting}>
            <label style={styles.settingLabel}>
              <input type="checkbox" style={styles.checkbox} />
              <span>{t.settings.showTimestamp}</span>
            </label>
          </div>
          <div style={styles.setting}>
            <label style={styles.settingLabel}>
              <input type="checkbox" style={styles.checkbox} defaultChecked />
              <span>{t.settings.autoScroll}</span>
            </label>
          </div>
        </div>

        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Language / 语言</h4>
          <div style={styles.setting}>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              style={styles.langSelect}
            >
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>About</h4>
          <div style={styles.info}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Version:</span>
              <span style={styles.infoValue}>0.1.0</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>GitHub:</span>
              <a
                href="https://github.com/uaio/openLog"
                style={styles.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/uaio/openLog
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
    backgroundColor: '#fff',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #e8e8e8',
    backgroundColor: '#fafafa',
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
  },
  deviceId: {
    fontSize: '12px',
    color: '#999',
    padding: '4px 8px',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '20px',
  },
  section: {
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#fafafa',
    borderRadius: '8px',
    border: '1px solid #e8e8e8',
  },
  sectionTitle: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333',
  },
  info: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  infoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #e8e8e8',
  },
  infoLabel: {
    fontSize: '13px',
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: '13px',
    color: '#333',
    fontFamily: 'monospace',
  },
  link: {
    fontSize: '13px',
    color: '#1890ff',
    textDecoration: 'none',
  },
  empty: {
    fontSize: '13px',
    color: '#999',
    fontStyle: 'italic',
  },
  setting: {
    padding: '8px 0',
  },
  settingLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#333',
    cursor: 'pointer',
  },
  checkbox: {
    margin: 0,
    cursor: 'pointer',
  },
  langSelect: {
    padding: '6px 12px',
    fontSize: '13px',
    borderRadius: '4px',
    border: '1px solid #d9d9d9',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
};
