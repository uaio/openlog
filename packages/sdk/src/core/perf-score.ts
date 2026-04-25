import type {
  PerfRunScore,
  PerfScoreItem,
  PerformancePayload,
  LongTask,
  ResourceTiming,
} from '../types/index.js';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function clamp(v: number): number {
  return Math.max(0, Math.min(100, v));
}

function scoreFPS(samples: PerformancePayload['samples']): { score: number; value: number } {
  if (!samples.length) return { score: 100, value: -1 };
  const avg = samples.reduce((s, x) => s + x.fps, 0) / samples.length;
  let score: number;
  if (avg >= 55) score = 100;
  else if (avg >= 30) score = lerp(50, 100, (avg - 30) / 25);
  else score = lerp(0, 50, avg / 30);
  return { score: clamp(score), value: Math.round(avg) };
}

function scoreLCP(value: number | null): number {
  if (value === null) return 100;
  if (value <= 2500) return 100;
  if (value <= 4000) return clamp(lerp(50, 100, (4000 - value) / 1500));
  return clamp(lerp(0, 50, (8000 - value) / 4000));
}

function scoreCLS(value: number | null): number {
  if (value === null) return 100;
  if (value <= 0.1) return 100;
  if (value <= 0.25) return clamp(lerp(50, 100, (0.25 - value) / 0.15));
  return clamp(lerp(0, 50, (0.5 - value) / 0.25));
}

function scoreFCP(value: number | null): number {
  if (value === null) return 100;
  if (value <= 1800) return 100;
  if (value <= 3000) return clamp(lerp(50, 100, (3000 - value) / 1200));
  return clamp(lerp(0, 50, (6000 - value) / 3000));
}

function scoreTTFB(value: number | null): number {
  if (value === null) return 100;
  if (value <= 800) return 100;
  if (value <= 1800) return clamp(lerp(50, 100, (1800 - value) / 1000));
  return clamp(lerp(0, 50, (3600 - value) / 1800));
}

function scoreINP(value: number | null): number {
  if (value === null) return 100;
  if (value <= 200) return 100;
  if (value <= 500) return clamp(lerp(50, 100, (500 - value) / 300));
  return clamp(lerp(0, 50, (1000 - value) / 500));
}

function scoreLongTasks(tasks: LongTask[]): number {
  const n = tasks.length;
  if (n === 0) return 100;
  if (n <= 3) return 80;
  if (n <= 10) return 50;
  return Math.max(0, 100 - n * 5);
}

function scoreResources(resources: ResourceTiming[]): number {
  if (!resources.length) return 100;
  const avg = resources.reduce((s, r) => s + r.duration, 0) / resources.length;
  if (avg <= 200) return 100;
  if (avg <= 500) return 75;
  if (avg <= 1000) return 50;
  return 25;
}

function rating(score: number): 'good' | 'needs-improvement' | 'poor' {
  if (score >= 75) return 'good';
  if (score >= 50) return 'needs-improvement';
  return 'poor';
}

export function scorePerfRun(snapshot: PerformancePayload): PerfRunScore {
  const vitalsMap = new Map(snapshot.vitals.map((v) => [v.name, v.value]));

  const fpsData = scoreFPS(snapshot.samples);
  const lcpScore = scoreLCP(vitalsMap.get('LCP') ?? null);
  const clsScore = scoreCLS(vitalsMap.get('CLS') ?? null);
  const fcpScore = scoreFCP(vitalsMap.get('FCP') ?? null);
  const ttfbScore = scoreTTFB(vitalsMap.get('TTFB') ?? null);
  const inpScore = scoreINP(vitalsMap.get('INP') ?? null);
  const ltScore = scoreLongTasks(snapshot.longTasks);
  const resScore = scoreResources(snapshot.resources);

  const items: PerfScoreItem[] = [
    {
      name: 'FPS',
      score: Math.round(fpsData.score),
      weight: 0.2,
      value: fpsData.value >= 0 ? fpsData.value : null,
      unit: 'fps',
      rating: rating(fpsData.score),
    },
    {
      name: 'LCP',
      score: Math.round(lcpScore),
      weight: 0.15,
      value: vitalsMap.get('LCP') ?? null,
      unit: 'ms',
      rating: rating(lcpScore),
    },
    {
      name: 'CLS',
      score: Math.round(clsScore),
      weight: 0.1,
      value: vitalsMap.get('CLS') ?? null,
      unit: '',
      rating: rating(clsScore),
    },
    {
      name: 'FCP',
      score: Math.round(fcpScore),
      weight: 0.1,
      value: vitalsMap.get('FCP') ?? null,
      unit: 'ms',
      rating: rating(fcpScore),
    },
    {
      name: 'TTFB',
      score: Math.round(ttfbScore),
      weight: 0.1,
      value: vitalsMap.get('TTFB') ?? null,
      unit: 'ms',
      rating: rating(ttfbScore),
    },
    {
      name: 'INP',
      score: Math.round(inpScore),
      weight: 0.1,
      value: vitalsMap.get('INP') ?? null,
      unit: 'ms',
      rating: rating(inpScore),
    },
    {
      name: 'LongTasks',
      score: Math.round(ltScore),
      weight: 0.15,
      value: snapshot.longTasks.length,
      unit: '次',
      rating: rating(ltScore),
    },
    {
      name: 'Resources',
      score: Math.round(resScore),
      weight: 0.1,
      value: snapshot.resources.length
        ? Math.round(
            snapshot.resources.reduce((s, r) => s + r.duration, 0) / snapshot.resources.length,
          )
        : null,
      unit: 'ms',
      rating: rating(resScore),
    },
  ];

  const total = Math.round(items.reduce((s, i) => s + i.score * i.weight, 0));

  let grade: PerfRunScore['grade'];
  if (total >= 90) grade = 'A';
  else if (total >= 75) grade = 'B';
  else if (total >= 60) grade = 'C';
  else if (total >= 45) grade = 'D';
  else grade = 'F';

  const summaries: Record<string, string> = {
    A: '性能优秀，可直接上线',
    B: '性能良好，有优化空间',
    C: '性能一般，建议优化',
    D: '性能较差，需要优化',
    F: '性能极差，亟需修复',
  };

  const issues: string[] = [];
  for (const item of items) {
    if (item.rating === 'poor') {
      if (item.name === 'FPS') issues.push(`FPS 过低 (均值 ${item.value} fps)，页面动画卡顿`);
      if (item.name === 'LCP') issues.push(`LCP 过高 (${item.value}ms)，最大内容元素加载慢`);
      if (item.name === 'CLS') issues.push(`CLS 过高 (${item.value})，页面布局频繁抖动`);
      if (item.name === 'FCP') issues.push(`FCP 过高 (${item.value}ms)，首次内容渲染慢`);
      if (item.name === 'TTFB') issues.push(`TTFB 过高 (${item.value}ms)，服务器响应慢`);
      if (item.name === 'INP') issues.push(`INP 过高 (${item.value}ms)，交互响应慢`);
      if (item.name === 'LongTasks') issues.push(`长任务过多 (${item.value} 个)，主线程长期阻塞`);
      if (item.name === 'Resources')
        issues.push(`资源加载慢 (均值 ${item.value}ms)，建议启用缓存/CDN`);
    } else if (item.rating === 'needs-improvement') {
      if (item.name === 'FPS') issues.push(`FPS 偏低 (均值 ${item.value} fps)，建议优化渲染`);
      if (item.name === 'LCP') issues.push(`LCP 需改善 (${item.value}ms)，建议优化关键资源`);
      if (item.name === 'CLS') issues.push(`CLS 需改善 (${item.value})，建议为图片指定尺寸`);
      if (item.name === 'LongTasks') issues.push(`存在 ${item.value} 个长任务，建议拆分耗时操作`);
    }
  }

  return { total, grade, items, issues, summary: summaries[grade] };
}
