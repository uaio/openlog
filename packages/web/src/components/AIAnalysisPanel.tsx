import { useState, useCallback } from 'react';
import { api } from '../api/client.js';

interface AIAnalysisPanelProps {
  deviceId?: string;
}

interface AIAnalysisResult {
  deviceId: string;
  timestamp: number;
  summary: string;
  overallScore: number;
  issues: string[];
  recommendations: string[];
  raw: {
    errorCount: number;
    perfVitals: Array<{ name: string; value: number; rating: string }>;
    longTaskCount: number;
    health: any;
  };
}

export function AIAnalysisPanel({ deviceId }: AIAnalysisPanelProps) {
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logLimit, setLogLimit] = useState(50);

  const runAnalysis = useCallback(async () => {
    if (!deviceId) return;
    setLoading(true);
    setError('');
    try {
      const [logsRes, perfRes, healthRes, storageRes] = await Promise.allSettled([
        api.get(`/api/devices/${deviceId}/logs?limit=${logLimit}&level=error`),
        api.get(`/api/devices/${deviceId}/performance`),
        api.get(`/api/devices/${deviceId}/health`),
        api.get(`/api/devices/${deviceId}/storage`),
      ]);

      const errors = logsRes.status === 'fulfilled' ? (logsRes.value ?? []) : [];
      const perf = perfRes.status === 'fulfilled' ? perfRes.value : null;
      const health = healthRes.status === 'fulfilled' ? healthRes.value : null;
      const storage = storageRes.status === 'fulfilled' ? storageRes.value : null;

      const issues: string[] = [];
      const recommendations: string[] = [];

      const errorCount = Array.isArray(errors) ? errors.length : 0;
      if (errorCount > 0) {
        issues.push(`发现 ${errorCount} 条 JS 错误`);
        (errors as any[]).slice(0, 3).forEach((e: any) => {
          issues.push(`  · ${String(e.message ?? '').slice(0, 120)}`);
        });
        recommendations.push('优先修复 JS 错误，这是影响用户体验的直接原因');
      }

      if (perf?.vitals?.length) {
        const poor = perf.vitals.filter((v: any) => v.rating === 'poor');
        const needsImprovement = perf.vitals.filter((v: any) => v.rating === 'needs-improvement');
        if (poor.length > 0) {
          issues.push(
            `${poor.length} 个 Web Vitals 指标较差: ${poor.map((v: any) => v.name).join(', ')}`,
          );
          recommendations.push('重点优化 LCP/CLS/INP 等核心 Web Vitals');
        }
        if (needsImprovement.length > 0) {
          issues.push(
            `${needsImprovement.length} 个 Web Vitals 指标需改善: ${needsImprovement.map((v: any) => v.name).join(', ')}`,
          );
        }
      }

      const longTaskCount = perf?.longTasks?.length ?? 0;
      if (longTaskCount > 5) {
        issues.push(`主线程存在 ${longTaskCount} 个长任务，可能导致卡顿`);
        recommendations.push('将耗时操作移至 Web Worker 或拆分为小任务');
      }

      if (health) {
        if ((health.memoryMB ?? 0) > 200) {
          issues.push(`内存占用较高: ${Number(health.memoryMB).toFixed(1)}MB`);
          recommendations.push('检查内存泄漏，避免持有大量引用');
        }
        if (health.uncompressedResources > 0) {
          issues.push(`${health.uncompressedResources} 个资源未压缩 (>100KB)`);
          recommendations.push('开启 gzip/brotli 压缩，减少资源体积');
        }
        if (health.uncachedResources > 10) {
          issues.push(`${health.uncachedResources} 个资源未命中缓存`);
          recommendations.push('合理配置 Cache-Control，减少重复下载');
        }
      }

      if (storage) {
        const lsSize = storage.localStorageSize ?? 0;
        if (lsSize > 3 * 1024 * 1024) {
          issues.push(`localStorage 占用 ${(lsSize / 1024 / 1024).toFixed(1)}MB，接近上限`);
          recommendations.push('清理过期 localStorage 数据，避免配额超限');
        }
      }

      if (recommendations.length === 0) recommendations.push('当前状态良好，继续保持 👍');

      const overallScore = health?.score ?? 100;
      const summary =
        issues.length === 0
          ? '✅ 设备状态良好，未发现明显问题'
          : `⚠️ 发现 ${issues.length} 个问题，健康分 ${overallScore}/100`;

      setResult({
        deviceId,
        timestamp: Date.now(),
        summary,
        overallScore,
        issues,
        recommendations,
        raw: { errorCount, perfVitals: perf?.vitals ?? [], longTaskCount, health },
      });
    } catch (e: any) {
      setError(e.message ?? '分析失败');
    } finally {
      setLoading(false);
    }
  }, [deviceId, logLimit]);

  const handleExport = useCallback(() => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-analysis-${result.deviceId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result]);

  const scoreColor = result
    ? result.overallScore >= 80
      ? '#4caf50'
      : result.overallScore >= 50
        ? '#ff9800'
        : '#f44336'
    : '#9e9e9e';

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <span style={styles.title}>🧠 智能分析</span>
        <div style={styles.controls}>
          <label style={styles.label}>分析错误日志条数：</label>
          <select
            value={logLimit}
            onChange={(e) => setLogLimit(Number(e.target.value))}
            style={styles.select}
          >
            <option value={20}>20 条</option>
            <option value={50}>50 条</option>
            <option value={100}>100 条</option>
          </select>
          <button onClick={runAnalysis} disabled={loading || !deviceId} style={styles.runBtn}>
            {loading ? '分析中...' : '🚀 开始分析'}
          </button>
          {result && (
            <button onClick={handleExport} style={styles.exportBtn}>
              📤 导出
            </button>
          )}
        </div>
      </div>

      {!deviceId && <div style={styles.empty}>请先从左侧选择设备</div>}

      {error && <div style={styles.errorBox}>{error}</div>}

      {result && (
        <div style={styles.content}>
          {/* 总评 */}
          <div style={styles.summaryCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ ...styles.scoreCircle, borderColor: scoreColor }}>
                <span style={{ fontSize: 28, fontWeight: 'bold', color: scoreColor }}>
                  {result.overallScore}
                </span>
                <span style={{ fontSize: 11, color: '#888' }}>健康分</span>
              </div>
              <div>
                <div style={styles.summaryText}>{result.summary}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                  分析时间：{new Date(result.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>

          {/* Web Vitals 快览 */}
          {result.raw.perfVitals.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>📊 Web Vitals</div>
              <div style={styles.vitalsGrid}>
                {result.raw.perfVitals.map((v) => (
                  <div
                    key={v.name}
                    style={{
                      ...styles.vitalChip,
                      borderColor: RATING_COLOR[v.rating] ?? '#9e9e9e',
                    }}
                  >
                    <span
                      style={{ fontWeight: 'bold', color: RATING_COLOR[v.rating] ?? '#9e9e9e' }}
                    >
                      {v.name}
                    </span>
                    <span style={{ fontSize: 11, color: '#555' }}>
                      {formatVitalValue(v.name, v.value)}
                    </span>
                    <span style={{ fontSize: 10, color: RATING_COLOR[v.rating] ?? '#9e9e9e' }}>
                      {RATING_LABEL[v.rating] ?? v.rating}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 问题列表 */}
          {result.issues.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>⚠️ 发现的问题</div>
              <div style={styles.issueList}>
                {result.issues.map((issue, i) => (
                  <div
                    key={i}
                    style={{ ...styles.issueItem, paddingLeft: issue.startsWith('  ·') ? 28 : 12 }}
                  >
                    {issue.startsWith('  ·') ? issue : `• ${issue}`}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 优化建议 */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>💡 优化建议</div>
            <div style={styles.recList}>
              {result.recommendations.map((rec, i) => (
                <div key={i} style={styles.recItem}>
                  <span style={styles.recNum}>{i + 1}</span>
                  {rec}
                </div>
              ))}
            </div>
          </div>

          {/* 数据概览 */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>📋 数据概览</div>
            <div style={styles.statsRow}>
              <div style={styles.statChip}>
                JS错误 <b>{result.raw.errorCount}</b>
              </div>
              <div style={styles.statChip}>
                长任务 <b>{result.raw.longTaskCount}</b>
              </div>
              <div style={styles.statChip}>
                内存{' '}
                <b>
                  {result.raw.health?.memoryMB != null
                    ? `${Number(result.raw.health.memoryMB).toFixed(1)}MB`
                    : 'N/A'}
                </b>
              </div>
              <div style={styles.statChip}>
                大资源 <b>{result.raw.health?.uncompressedResources ?? 0}</b>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const RATING_COLOR: Record<string, string> = {
  good: '#4caf50',
  'needs-improvement': '#ff9800',
  poor: '#f44336',
};

const RATING_LABEL: Record<string, string> = {
  good: '良好',
  'needs-improvement': '需改善',
  poor: '较差',
};

function formatVitalValue(name: string, value: number): string {
  if (name === 'CLS') return value.toFixed(3);
  return `${Math.round(value)}ms`;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    overflow: 'hidden',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e0e0e0',
    flexWrap: 'wrap',
    gap: 8,
  },
  title: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  controls: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  label: { fontSize: 12, color: '#666' },
  select: { fontSize: 12, padding: '3px 6px', borderRadius: 4, border: '1px solid #ccc' },
  runBtn: {
    padding: '6px 16px',
    backgroundColor: '#7c4dff',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
  },
  exportBtn: {
    padding: '5px 12px',
    backgroundColor: '#fff',
    color: '#555',
    border: '1px solid #ccc',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
  },
  empty: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#aaa',
    fontSize: 14,
  },
  errorBox: {
    margin: 12,
    padding: '8px 12px',
    backgroundColor: '#fff2f0',
    border: '1px solid #ffccc7',
    borderRadius: 4,
    fontSize: 13,
    color: '#f44336',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: '14px 18px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  scoreCircle: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    border: '3px solid',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  summaryText: { fontSize: 15, fontWeight: 600, color: '#333' },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: '12px 16px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#555', marginBottom: 10 },
  vitalsGrid: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  vitalChip: {
    border: '1px solid',
    borderRadius: 6,
    padding: '6px 10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: 70,
  },
  issueList: { display: 'flex', flexDirection: 'column', gap: 4 },
  issueItem: {
    fontSize: 13,
    color: '#444',
    padding: '4px 12px',
    backgroundColor: '#fff8e1',
    borderRadius: 4,
    borderLeft: '3px solid #ff9800',
  },
  recList: { display: 'flex', flexDirection: 'column', gap: 8 },
  recItem: { display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#333' },
  recNum: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    backgroundColor: '#7c4dff',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 'bold',
    flexShrink: 0,
  },
  statsRow: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  statChip: {
    padding: '6px 12px',
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    fontSize: 13,
    color: '#555',
  },
};
