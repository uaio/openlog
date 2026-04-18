import { API_BASE_URL } from '../config.js';
import { sharedDeviceSelector as deviceSelector } from '../lib/device-selector.js';


export const aiAnalyze = {
  name: 'ai_analyze',
  description: `对设备当前状态进行综合 AI 分析，汇总 console 错误、性能数据、Web Vitals、健康检查结果，
输出问题列表、优先级建议和修复方向。适合在发现问题后快速获取全局诊断。`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      deviceId: { type: 'string' as const, description: '设备 ID（可选）' },
      logLimit: { type: 'number' as const, description: '拉取最近日志条数，默认 50' }
    },
    required: []
  },
  async execute(args: { deviceId?: string; logLimit?: number }): Promise<any> {
    const id = await deviceSelector.selectDevice(args.deviceId);
    const limit = args.logLimit ?? 50;

    const [logsRes, perfRes, healthRes] = await Promise.allSettled([
      fetch(`${API_BASE_URL}/api/devices/${id}/logs?limit=${limit}&level=error`).then(r => r.json()),
      fetch(`${API_BASE_URL}/api/devices/${id}/performance`).then(r => r.json()),
      fetch(`${API_BASE_URL}/api/devices/${id}/health`).then(r => r.json()),
    ]);

    const errors = logsRes.status === 'fulfilled' ? logsRes.value : [];
    const perf = perfRes.status === 'fulfilled' ? perfRes.value : null;
    const health = healthRes.status === 'fulfilled' ? healthRes.value : null;

    const issues: string[] = [];
    const recommendations: string[] = [];

    const errorCount = Array.isArray(errors) ? errors.length : 0;
    if (errorCount > 0) {
      issues.push(`发现 ${errorCount} 条 JS 错误`);
      const topErrors = (errors as any[]).slice(0, 3).map((e: any) => e.message);
      issues.push(...topErrors.map((m: string) => `  - ${m.slice(0, 100)}`));
      recommendations.push('优先修复 JS 错误，这些是影响用户体验的直接原因');
    }

    if (perf?.vitals?.length) {
      const poorVitals = perf.vitals.filter((v: any) => v.rating === 'poor');
      if (poorVitals.length > 0) {
        issues.push(`${poorVitals.length} 个 Web Vitals 指标较差: ${poorVitals.map((v: any) => v.name).join(', ')}`);
        recommendations.push('重点优化 LCP/CLS/INP 等核心 Web Vitals 指标');
      }
    }
    if (perf?.longTasks?.length > 5) {
      issues.push(`主线程存在 ${perf.longTasks.length} 个长任务，可能导致卡顿`);
      recommendations.push('将耗时操作移至 Web Worker 或拆分为小任务');
    }

    if (health) {
      if (health.memoryMB > 200) {
        issues.push(`内存占用较高: ${health.memoryMB.toFixed(1)}MB`);
        recommendations.push('检查内存泄漏，避免持有大量引用');
      }
      if (health.uncompressedResources > 0) {
        issues.push(`${health.uncompressedResources} 个资源未压缩（>100KB）`);
        recommendations.push('开启 gzip/brotli 压缩，减少资源体积');
      }
    }

    const overallScore = health?.score ?? 100;
    const summary = issues.length === 0
      ? '✅ 设备状态良好，未发现明显问题'
      : `⚠️ 发现 ${issues.length} 个问题，健康分 ${overallScore}/100`;

    return {
      deviceId: id,
      timestamp: Date.now(),
      summary,
      overallScore,
      issues,
      recommendations,
      raw: {
        errorCount,
        perfVitals: perf?.vitals ?? [],
        longTaskCount: perf?.longTasks?.length ?? 0,
        health,
      }
    };
  }
};
