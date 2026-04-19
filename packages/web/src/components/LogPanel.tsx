import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useLogs } from '../hooks/useLogs.js';
import { useI18n } from '../i18n/index.js';
import { LogEntry } from './LogEntry.js';
import { api } from '../api/client.js';
import { websocketManager } from '../lib/websocketManager.js';
import type { ConsoleLog } from '../types/index.js';
interface LogPanelProps {
  deviceId?: string;
  tabId?: string | null;
}

export function LogPanel({ deviceId, tabId }: LogPanelProps) {
  const { logs, clearLogs, loading } = useLogs(deviceId, 500, tabId);
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLogsLengthRef = useRef(0);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [filterLevel, setFilterLevel] = useState<ConsoleLog['level'] | 'all'>('all');
  const [searchText, setSearchText] = useState('');
  const [jsInput, setJsInput] = useState('');
  const [jsHistory, setJsHistory] = useState<string[]>([]);
  const [jsHistoryIndex, setJsHistoryIndex] = useState(-1);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [networkThrottle, setNetworkThrottleState] = useState<string>('none');
  const [aiModal, setAiModal] = useState(false);
  const jsInputRef = useRef<HTMLInputElement>(null);

  // 调试：监控 logs 变化 — removed (debug log removed)

  // 切换设备时重置筛选
  useEffect(() => {
    setFilterLevel('all');
    setSearchText('');
  }, [deviceId]);

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

  const handleExecuteJs = useCallback(() => {
    const code = jsInput.trim();
    if (!code || !deviceId) return;
    websocketManager.send({ type: 'execute_js', deviceId, code });
    setJsHistory((prev) => [code, ...prev.filter((h) => h !== code)].slice(0, 50));
    setJsHistoryIndex(-1);
    setJsInput('');
  }, [jsInput, deviceId]);

  const handleTakeScreenshot = useCallback(async () => {
    if (!deviceId) return;
    setScreenshotLoading(true);
    try {
      await api.post(`/api/devices/${deviceId}/screenshot`);
      // wait a moment for the device to capture and send back
      await new Promise((r) => setTimeout(r, 2500));
      const result = await api.get(`/api/devices/${deviceId}/screenshot`);
      setScreenshotUrl(result.dataUrl || null);
    } catch {
      // ignore
    } finally {
      setScreenshotLoading(false);
    }
  }, [deviceId]);

  const handleReloadPage = useCallback(() => {
    if (!deviceId) return;
    api.post(`/api/devices/${deviceId}/reload`).catch(() => {});
  }, [deviceId]);

  const handleNetworkThrottle = useCallback(
    async (preset: string) => {
      if (!deviceId) return;
      setNetworkThrottleState(preset);
      try {
        await api.post(`/api/devices/${deviceId}/network-throttle`, { preset });
      } catch {
        /* ignore */
      }
    },
    [deviceId],
  );

  const handleJsKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleExecuteJs();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(jsHistoryIndex + 1, jsHistory.length - 1);
      setJsHistoryIndex(next);
      setJsInput(jsHistory[next] ?? '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.max(jsHistoryIndex - 1, -1);
      setJsHistoryIndex(next);
      setJsInput(next === -1 ? '' : jsHistory[next]);
    }
  };

  const handleClearHistory = async () => {
    if (!deviceId) return;

    if (!confirm(t.logPanel.clearHistoryConfirm)) {
      return;
    }

    setClearingHistory(true);

    try {
      await api.deleteLogs(deviceId);
      clearLogs();
    } catch (error) {
      console.error('[LogPanel] clear history failed:', error);
      alert(t.logPanel.clearHistoryFailed + '：' + (error instanceof Error ? error.message : t.common.unknownError));
    } finally {
      setClearingHistory(false);
    }
  };

  const filteredLogs = useMemo(
    () =>
      logs.filter((log) => {
        const levelMatch = filterLevel === 'all' || log.level === filterLevel;
        const textMatch =
          !searchText || log.message.toLowerCase().includes(searchText.toLowerCase());
        return levelMatch && textMatch;
      }),
    [logs, filterLevel, searchText],
  );

  const handleExportLogs = useCallback(() => {
    if (!logs.length) return;
    const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${deviceId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [logs, filteredLogs, deviceId]);

  // 虚拟列表 — 只渲染视口中的行，日志量无上限也不卡顿
  const virtualizer = useVirtualizer({
    count: filteredLogs.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 36,
    overscan: 15,
  });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleSection}>
          <div style={styles.title}>
            {t.logPanel.title}{' '}
            {loading && <span style={styles.loadingText}> ({t.common.loading})</span>}
          </div>
          {!loading && logs.length > 0 && (
            <div style={styles.hint}>
              {t.logPanel.historicalLoaded.replace('{count}', String(logs.length))}
            </div>
          )}
        </div>
        <div style={styles.buttonGroup}>
          <button
            onClick={handleReloadPage}
            disabled={!deviceId}
            style={{
              ...styles.clearCurrentButton,
              borderColor: '#faad14',
              color: !deviceId ? '#999' : '#faad14',
            }}
            title="刷新手机页面"
          >
            🔄 重载
          </button>
          <button
            onClick={handleTakeScreenshot}
            disabled={screenshotLoading || !deviceId}
            style={{
              ...styles.clearCurrentButton,
              borderColor: '#52c41a',
              color: screenshotLoading || !deviceId ? '#999' : '#52c41a',
            }}
            title="截图手机屏幕"
          >
            {screenshotLoading ? '截图中...' : '📷 截图'}
          </button>
          <button
            onClick={handleExportLogs}
            disabled={!logs.length}
            style={{
              ...styles.clearCurrentButton,
              borderColor: '#722ed1',
              color: !logs.length ? '#999' : '#722ed1',
            }}
            title="导出日志为 JSON"
          >
            📤 导出
          </button>
          <select
            value={networkThrottle}
            onChange={(e) => handleNetworkThrottle(e.target.value)}
            disabled={!deviceId}
            style={{
              padding: '4px 8px',
              fontSize: 12,
              border: '1px solid #d9d9d9',
              borderRadius: 2,
              backgroundColor: networkThrottle !== 'none' ? '#fff7e6' : '#fff',
              color: networkThrottle !== 'none' ? '#fa8c16' : '#333',
              cursor: 'pointer',
            }}
            title="网络节流"
          >
            <option value="none">网速: 正常</option>
            <option value="3g">网速: 3G</option>
            <option value="2g">网速: 2G</option>
            <option value="offline">网速: 离线</option>
          </select>
          <button
            onClick={() => setAiModal(true)}
            disabled={!logs.length}
            style={{
              ...styles.clearCurrentButton,
              borderColor: '#13c2c2',
              color: !logs.length ? '#999' : '#13c2c2',
            }}
            title="智能分析日志"
          >
            🧠 智能分析
          </button>
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
              ...(clearingHistory ? styles.buttonDisabled : {}),
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
            {clearingHistory ? t.logPanel.clearing : t.logPanel.clearHistory}
          </button>
        </div>
      </div>

      {/* 筛选工具栏 */}
      <div style={styles.toolbar}>
        <div style={styles.levelButtons}>
          {(['all', 'log', 'warn', 'error', 'info'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setFilterLevel(level)}
              style={{
                ...styles.levelButton,
                ...(filterLevel === level ? styles.levelButtonActive : {}),
              }}
            >
              {level === 'all' ? t.logPanel.all : level.toUpperCase()}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder={t.logPanel.search}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      <div ref={containerRef} style={styles.logContainer}>
        {loading ? (
          <div style={styles.empty}>
            <div style={styles.loadingIcon}>⏳</div>
            <div>{t.common.loading}</div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>{logs.length === 0 ? '📝' : '🔍'}</div>
            <div style={styles.emptyText}>{t.common.noData}</div>
          </div>
        ) : (
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map((virtualRow) => (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <LogEntry log={filteredLogs[virtualRow.index]} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* JS 控制台输入栏 — 类似 Chrome DevTools Console */}
      <div style={styles.jsConsole}>
        <span style={styles.jsPrompt}>▶</span>
        <input
          ref={jsInputRef}
          type="text"
          value={jsInput}
          onChange={(e) => setJsInput(e.target.value)}
          onKeyDown={handleJsKeyDown}
          placeholder={deviceId ? t.logPanel.jsPlaceholder : t.logPanel.jsPlaceholderNoDevice}
          disabled={!deviceId}
          style={styles.jsInput}
          spellCheck={false}
          autoComplete="off"
        />
        <button
          onClick={handleExecuteJs}
          disabled={!deviceId || !jsInput.trim()}
          style={{
            ...styles.jsRunButton,
            ...(!deviceId || !jsInput.trim() ? styles.jsRunButtonDisabled : {}),
          }}
        >
          {t.logPanel.run}
        </button>
      </div>

      {/* AI 分析模态框 */}
      {aiModal && (
        <div style={styles.screenshotOverlay} onClick={() => setAiModal(false)}>
          <div
            style={{ ...styles.screenshotModal, minWidth: 400, maxWidth: 600 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.screenshotHeader}>
              <span>🤖 {t.logPanel.aiLogAnalysis}</span>
              <button style={styles.screenshotClose} onClick={() => setAiModal(false)}>
                ✕
              </button>
            </div>
            <div style={{ padding: 16, color: '#e0e0e0', fontSize: 13 }}>
              {(() => {
                const errors = filteredLogs.filter((l) => l.level === 'error');
                const warns = filteredLogs.filter((l) => l.level === 'warn');
                const topErrors = errors.slice(-5).reverse();
                return (
                  <div>
                    <div style={{ marginBottom: 12 }}>
                      <span style={{ color: '#f44336' }}>错误: {errors.length}</span>
                      {' · '}
                      <span style={{ color: '#ff9800' }}>警告: {warns.length}</span>
                      {' · '}
                      <span style={{ color: '#9e9e9e' }}>总计: {filteredLogs.length}</span>
                    </div>
                    {topErrors.length > 0 && (
                      <div>
                        <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#f44336' }}>
                          最近错误:
                        </div>
                        {topErrors.map((l, i) => (
                          <div
                            key={i}
                            style={{
                              marginBottom: 6,
                              padding: '6px 8px',
                              background: '#2d2d3f',
                              borderRadius: 4,
                              fontSize: 12,
                              fontFamily: 'monospace',
                              wordBreak: 'break-all' as const,
                            }}
                          >
                            {l.message.slice(0, 200)}
                          </div>
                        ))}
                      </div>
                    )}
                    {errors.length === 0 && (
                      <div style={{ color: '#4caf50' }}>✅ 未发现错误日志</div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 截图预览模态框 */}
      {screenshotUrl && (
        <div style={styles.screenshotOverlay} onClick={() => setScreenshotUrl(null)}>
          <div style={styles.screenshotModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.screenshotHeader}>
              <span>📷 手机截图</span>
              <button style={styles.screenshotClose} onClick={() => setScreenshotUrl(null)}>
                ✕
              </button>
            </div>
            <img src={screenshotUrl} alt="screenshot" style={styles.screenshotImage} />
          </div>
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
    backgroundColor: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#fafafa',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 16px',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#fafafa',
  },
  levelButtons: {
    display: 'flex',
    gap: '4px',
  },
  levelButton: {
    padding: '4px 10px',
    fontSize: '12px',
    border: '1px solid #d9d9d9',
    borderRadius: '3px',
    backgroundColor: '#fff',
    color: '#666',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  levelButtonActive: {
    backgroundColor: '#1890ff',
    color: '#fff',
    borderColor: '#1890ff',
  },
  searchInput: {
    flex: 1,
    padding: '4px 10px',
    fontSize: '12px',
    border: '1px solid #d9d9d9',
    borderRadius: '3px',
    outline: 'none',
    backgroundColor: '#fff',
  },
  titleSection: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  title: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333',
  },
  loadingText: {
    fontSize: '12px',
    color: '#999',
    fontWeight: 'normal' as const,
  },
  hint: {
    fontSize: '11px',
    color: '#999',
    marginTop: '2px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
  },
  clearCurrentButton: {
    padding: '4px 12px',
    fontSize: '12px',
    border: '1px solid #1890ff',
    borderRadius: '2px',
    backgroundColor: '#fff',
    color: '#1890ff',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  clearHistoryButton: {
    padding: '4px 12px',
    fontSize: '12px',
    border: '1px solid #ff4d4f',
    borderRadius: '2px',
    backgroundColor: '#fff',
    color: '#ff4d4f',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  logContainer: {
    flex: 1,
    overflowY: 'auto' as const,
    backgroundColor: '#fafafa',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#999',
    fontSize: '14px',
  },
  loadingIcon: {
    fontSize: '32px',
    marginBottom: '12px',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '12px',
    opacity: 0.5,
  },
  emptyText: {
    fontSize: '14px',
    marginBottom: '8px',
  },
  emptyHint: {
    fontSize: '12px',
    color: '#bbb',
    textAlign: 'center' as const,
    maxWidth: '300px',
  },
  jsConsole: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderTop: '1px solid #e0e0e0',
    backgroundColor: '#1a1a2e',
  },
  jsPrompt: {
    color: '#4fc3f7',
    fontSize: '13px',
    fontFamily: 'monospace',
    userSelect: 'none' as const,
    flexShrink: 0,
  },
  jsInput: {
    flex: 1,
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#e0e0e0',
    fontSize: '13px',
    fontFamily: 'monospace',
    caretColor: '#4fc3f7',
  },
  jsRunButton: {
    padding: '4px 12px',
    fontSize: '12px',
    border: '1px solid #4fc3f7',
    borderRadius: '3px',
    backgroundColor: 'transparent',
    color: '#4fc3f7',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'all 0.15s',
  },
  jsRunButtonDisabled: {
    opacity: 0.35,
    cursor: 'not-allowed',
  },
  screenshotOverlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  screenshotModal: {
    background: '#1e1e2e',
    borderRadius: '8px',
    overflow: 'hidden',
    maxWidth: '90vw',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column' as const,
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  },
  screenshotHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 14px',
    background: '#2d2d3f',
    color: '#cdd6f4',
    fontSize: '13px',
  },
  screenshotClose: {
    background: 'transparent',
    border: 'none',
    color: '#cdd6f4',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '0 4px',
  },
  screenshotImage: {
    maxWidth: '100%',
    maxHeight: 'calc(90vh - 40px)',
    objectFit: 'contain' as const,
    display: 'block',
  },
};
