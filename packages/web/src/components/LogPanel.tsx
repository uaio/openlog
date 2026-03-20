import { useRef, useEffect, useState } from 'react';
import { useLogs } from '../hooks/useLogs.js';
import { LogEntry } from './LogEntry.js';
import { api } from '../api/client.js';

interface LogPanelProps {
  deviceId?: string;
}

export function LogPanel({ deviceId }: LogPanelProps) {
  const { logs, clearLogs, loading } = useLogs(deviceId);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLogsLengthRef = useRef(0);
  const [clearingHistory, setClearingHistory] = useState(false);

  // 调试：监控 logs 变化
  useEffect(() => {
    console.log('[LogPanel] logs 数量变化:', logs.length, 'deviceId:', deviceId);
  }, [logs, deviceId]);

  // 自动滚动到底部
  useEffect(() => {
    if (logs.length > prevLogsLengthRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
    prevLogsLengthRef.current = logs.length;
  }, [logs.length]);

  const handleClearCurrent = () => {
    clearLogs();
  };

  const handleClearHistory = async () => {
    if (!deviceId) return;

    if (!confirm('确定要清空该设备的历史日志吗？此操作不可恢复。')) {
      return;
    }

    setClearingHistory(true);

    try {
      const result = await api.deleteLogs(deviceId);
      console.log('[LogPanel] 清空历史日志成功:', result);
      clearLogs();
    } catch (error) {
      console.error('[LogPanel] 清空历史日志失败:', error);
      alert('清空历史日志失败：' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setClearingHistory(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleSection}>
          <div style={styles.title}>
            控制台日志 {loading && <span style={styles.loadingText}> (加载中...)</span>}
          </div>
          {!loading && logs.length > 0 && (
            <div style={styles.hint}>
              已加载 {logs.length} 条历史日志
            </div>
          )}
        </div>
        <div style={styles.buttonGroup}>
          <button
            onClick={handleClearCurrent}
            style={styles.clearCurrentButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1890ff';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fff';
              e.currentTarget.style.color = '#1890ff';
            }}
          >
            清空当前
          </button>
          <button
            onClick={handleClearHistory}
            disabled={clearingHistory || !deviceId}
            style={{
              ...styles.clearHistoryButton,
              ...(clearingHistory ? styles.buttonDisabled : {})
            }}
            onMouseEnter={(e) => {
              if (!clearingHistory) {
                e.currentTarget.style.backgroundColor = '#ff4d4f';
                e.currentTarget.style.color = '#fff';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fff';
              e.currentTarget.style.color = '#ff4d4f';
            }}
          >
            {clearingHistory ? '清空中...' : '清空历史'}
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        style={styles.logContainer}
      >
        {loading ? (
          <div style={styles.empty}>
            <div style={styles.loadingIcon}>⏳</div>
            <div>正在加载历史日志...</div>
          </div>
        ) : logs.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>📝</div>
            <div style={styles.emptyText}>
              暂无日志
            </div>
            <div style={styles.emptyHint}>
              在移动设备上执行操作后，日志将自动显示在这里
            </div>
          </div>
        ) : (
          logs.map((log, index) => (
            <LogEntry key={`${log.timestamp}-${index}`} log={log} />
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    backgroundColor: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#fafafa'
  },
  titleSection: {
    display: 'flex',
    flexDirection: 'column' as const
  },
  title: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333'
  },
  loadingText: {
    fontSize: '12px',
    color: '#999',
    fontWeight: 'normal' as const
  },
  hint: {
    fontSize: '11px',
    color: '#999',
    marginTop: '2px'
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px'
  },
  clearCurrentButton: {
    padding: '4px 12px',
    fontSize: '12px',
    border: '1px solid #1890ff',
    borderRadius: '2px',
    backgroundColor: '#fff',
    color: '#1890ff',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  clearHistoryButton: {
    padding: '4px 12px',
    fontSize: '12px',
    border: '1px solid #ff4d4f',
    borderRadius: '2px',
    backgroundColor: '#fff',
    color: '#ff4d4f',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  logContainer: {
    flex: 1,
    overflowY: 'auto' as const,
    backgroundColor: '#fafafa'
  },
  empty: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#999',
    fontSize: '14px'
  },
  loadingIcon: {
    fontSize: '32px',
    marginBottom: '12px'
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '12px',
    opacity: 0.5
  },
  emptyText: {
    fontSize: '14px',
    marginBottom: '8px'
  },
  emptyHint: {
    fontSize: '12px',
    color: '#bbb',
    textAlign: 'center' as const,
    maxWidth: '300px'
  }
};
