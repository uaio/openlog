# Performance Monitoring

openLog provides comprehensive performance monitoring via Web Vitals and runtime metrics.

## Metrics Collected

### Web Vitals
- **LCP** (Largest Contentful Paint) — Loading performance
- **CLS** (Cumulative Layout Shift) — Visual stability
- **FCP** (First Contentful Paint) — First render speed
- **TTFB** (Time to First Byte) — Server response time
- **INP** (Interaction to Next Paint) — Interactivity

### Runtime Metrics
- **FPS** — Frames per second via requestAnimationFrame sampling
- **Memory** — JS heap usage (when available)
- **Long Tasks** — Tasks blocking the main thread >50ms
- **Resource Timing** — Individual resource load durations

## Performance Scoring

The Perf Run feature provides a comprehensive score (0-100) with grades:

| Grade | Score Range | Description |
|-------|------------|-------------|
| A | 90-100 | Excellent performance |
| B | 75-89 | Good, minor optimizations possible |
| C | 60-74 | Average, optimization recommended |
| D | 45-59 | Poor, needs optimization |
| F | 0-44 | Critical, immediate action needed |

## Health Checks

The Health Panel automatically evaluates:
- Recent error rate (5-minute window)
- Long task total duration
- Memory usage
- Uncompressed large resources
