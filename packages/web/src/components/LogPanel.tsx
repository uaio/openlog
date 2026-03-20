import { useRef, useEffect } from 'react';
import { useLogs } from '../hooks/useLogs.js';
import { LogEntry } from './LogEntry.js';

interface LogPanelProps {
  deviceId?: string;
  maxHeight?: number;
}

export function LogPanel({ deviceId, maxHeight = 400 }: LogPanelProps) {
  const { logs, clearLogs } = useLogs(deviceId);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLogsLengthRef = useRef(0);

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

  const handleClear = () => {
    clearLogs();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>
          控制台日志 ({logs.length})
        </div>
        <button
          onClick={handleClear}
          style={styles.clearButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#ff4d4f';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#fff';
            e.currentTarget.style.color = '#ff4d4f';
          }}
        >
          清空
        </button>
      </div>

      <div
        ref={containerRef}
        style={{
          ...styles.logContainer,
          maxHeight: `${maxHeight}px`
        }}
      >
        {logs.length === 0 ? (
          <div style={styles.empty}>
            暂无日志
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
  title: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333'
  },
  clearButton: {
    padding: '4px 12px',
    fontSize: '12px',
    border: '1px solid #ff4d4f',
    borderRadius: '2px',
    backgroundColor: '#fff',
    color: '#ff4d4f',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  logContainer: {
    flex: 1,
    overflowY: 'auto' as const,
    backgroundColor: '#fafafa'
  },
  empty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#999',
    fontSize: '14px'
  }
};
