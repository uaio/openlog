import type {
  PerformancePayload,
  WebVital,
  LongTask,
  ResourceTiming,
  InteractionTiming,
} from '../types/index.js';
import type { PerformanceSample as SDKPerformanceSample } from '../types/index.js';
import type { DataBus } from '../core/DataBus.js';

// Re-export for backward compatibility
export type {
  SDKPerformanceSample as PerformanceSample,
  WebVital,
  LongTask,
  ResourceTiming,
  InteractionTiming,
};

declare global {
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }

  // event-timing API（部分 TS lib 版本缺失该类型）
  interface PerformanceEventTiming extends PerformanceEntry {
    duration: number;
  }
}

const SAMPLE_INTERVAL_MS = 3000;
const MAX_SAMPLES = 120; // 最多保留 6 分钟采样
const MAX_LONG_TASKS = 100; // 最多保留 100 条 long tasks
const MAX_RESOURCES = 200; // 最多保留 200 条资源
const MAX_INTERACTIONS = 100; // 最多保留 100 次交互

export class PerformanceCollector {
  private bus: DataBus;
  private samples: SDKPerformanceSample[] = [];
  private vitals: WebVital[] = [];
  private longTasks: LongTask[] = [];
  private resources: ResourceTiming[] = [];
  private interactions: InteractionTiming[] = [];
  private rafHandle = 0;
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private observers: PerformanceObserver[] = [];
  private destroyed = false;

  // FPS 计数
  private fpsFrames = 0;
  private fpsLastTick = performance.now();

  constructor(bus: DataBus) {
    this.bus = bus;
  }

  async start() {
    await this.collectVitals();
    this.startFPSLoop();
    this.startSamplingInterval();
    this.observeLongTasks();
    this.observeResources();
    this.observeInteractions();
  }

  private async collectVitals() {
    try {
      const { onLCP, onCLS, onFCP, onTTFB, onINP } = await import('web-vitals');

      const report = (name: string, value: number, rating: WebVital['rating']) => {
        const idx = this.vitals.findIndex((v) => v.name === name);
        const vital: WebVital = { name, value: Math.round(value * 100) / 100, rating };
        if (idx >= 0) this.vitals[idx] = vital;
        else this.vitals.push(vital);
        this.flush();
      };

      onLCP((m) => report('LCP', m.value, m.rating));
      onCLS((m) => report('CLS', m.value, m.rating));
      onFCP((m) => report('FCP', m.value, m.rating));
      onTTFB((m) => report('TTFB', m.value, m.rating));
      try {
        onINP((m) => report('INP', m.value, m.rating));
      } catch {}
    } catch (e) {
      console.warn('[openLog] web-vitals unavailable', e);
    }
  }

  private observeLongTasks() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.longTasks.push({
            startTime: Math.round(entry.startTime),
            duration: Math.round(entry.duration),
            name: entry.name,
          });
          if (this.longTasks.length > MAX_LONG_TASKS) this.longTasks.shift();
        }
        this.flush();
      });
      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    } catch {
      // longtask 不被所有浏览器支持，静默降级
    }
  }

  private observeResources() {
    try {
      // 先抓已存在的资源（页面加载期间）
      const existing = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      for (const e of existing.slice(-MAX_RESOURCES)) {
        this.resources.push(this.mapResource(e));
      }

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as PerformanceResourceTiming[]) {
          this.resources.push(this.mapResource(entry));
          if (this.resources.length > MAX_RESOURCES) this.resources.shift();
        }
        this.flush();
      });
      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch {
      // ignore
    }
  }

  private mapResource(e: PerformanceResourceTiming): ResourceTiming {
    return {
      name: e.name,
      initiatorType: e.initiatorType,
      duration: Math.round(e.duration),
      transferSize: e.transferSize ?? 0,
      startTime: Math.round(e.startTime),
    };
  }

  private observeInteractions() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const e = entry as PerformanceEventTiming;
          this.interactions.push({
            type: e.name,
            duration: Math.round(e.duration),
            startTime: Math.round(e.startTime),
            target: (() => {
              const t = (e as any).target;
              if (t instanceof Element)
                return `${t.tagName.toLowerCase()}${t.id ? '#' + t.id : ''}`;
              return undefined;
            })(),
          });
          if (this.interactions.length > MAX_INTERACTIONS) this.interactions.shift();
        }
        this.flush();
      });
      // 只关注响应时间 >= 16ms 的交互，过滤噪音
      observer.observe({
        type: 'event',
        buffered: true,
        durationThreshold: 16,
      } as PerformanceObserverInit);
      this.observers.push(observer);
    } catch {
      // event timing 部分浏览器不支持，静默降级
    }
  }

  private startFPSLoop() {
    const tick = () => {
      if (this.destroyed) return;
      this.fpsFrames++;
      this.rafHandle = requestAnimationFrame(tick);
    };
    this.rafHandle = requestAnimationFrame(tick);
  }

  private startSamplingInterval() {
    this.intervalHandle = setInterval(() => {
      if (this.destroyed) return;
      const now = performance.now();
      const elapsed = (now - this.fpsLastTick) / 1000;
      const fps = elapsed > 0 ? Math.round(this.fpsFrames / elapsed) : 0;
      this.fpsFrames = 0;
      this.fpsLastTick = now;

      const sample: SDKPerformanceSample = {
        ts: Date.now(),
        fps: Math.min(fps, 120),
      };

      if (performance.memory) {
        sample.heapUsed = parseFloat((performance.memory.usedJSHeapSize / 1048576).toFixed(2));
        sample.heapTotal = parseFloat((performance.memory.totalJSHeapSize / 1048576).toFixed(2));
      }

      this.samples.push(sample);
      if (this.samples.length > MAX_SAMPLES) this.samples.shift();

      this.flush();
    }, SAMPLE_INTERVAL_MS);
  }

  private flush() {
    const report: PerformancePayload = {
      vitals: [...this.vitals],
      samples: [...this.samples],
      longTasks: [...this.longTasks],
      resources: [...this.resources],
      interactions: [...this.interactions],
    };
    this.bus.emit('performance', report);
  }

  getSnapshot(): PerformancePayload {
    return {
      vitals: [...this.vitals],
      samples: [...this.samples],
      longTasks: [...this.longTasks],
      resources: [...this.resources],
      interactions: [...this.interactions],
    };
  }

  reset(): void {
    this.samples = [];
    this.vitals = [];
    this.longTasks = [];
    this.resources = [];
    this.interactions = [];
    this.fpsFrames = 0;
    this.fpsLastTick = performance.now();
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.rafHandle);
    if (this.intervalHandle) clearInterval(this.intervalHandle);
    for (const obs of this.observers) {
      try {
        obs.disconnect();
      } catch {}
    }
    this.observers = [];
  }
}
