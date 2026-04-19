# Health Checks

The Health panel provides an automated diagnostic score for the current page, helping quickly identify performance and stability issues.

## Health Score

The composite health score (0–100) is calculated from four dimensions:

| Dimension | Weight | What It Measures |
|-----------|--------|-----------------|
| Error Rate | 30% | JS errors in the last 5 minutes |
| Long Tasks | 25% | Main thread blocking (>50ms tasks) |
| Memory Usage | 25% | JS heap utilization |
| Web Vitals | 20% | LCP + CLS + INP composite |

### Grades

| Grade | Score | Meaning |
|-------|-------|---------|
| 🟢 Healthy | 80–100 | Page is performing well |
| 🟡 Warning | 60–79 | Some issues detected |
| 🔴 Critical | 0–59 | Immediate attention needed |

## What's Checked

### Error Rate
- Counts `console.error` and uncaught exceptions in a 5-minute sliding window
- Score = 100 when 0 errors; degrades linearly with error count

### Long Tasks
- Total duration of tasks blocking the main thread >50ms
- Score = 100 when total blocking time <100ms
- Degrades toward 0 as blocking time increases

### Memory Usage
- Reads `performance.memory.usedJSHeapSize` (Chrome only)
- Score based on ratio of used/total heap
- Falls back to neutral score (70) on unsupported browsers

### Web Vitals Composite
- Combines LCP, CLS, and INP ratings
- Each vital contributes equally
- `good` = 100, `needs-improvement` = 50, `poor` = 0

## Using Health Checks

### PC Panel

The **Health** tab (🩺) shows:
- Overall score and grade badge
- Individual dimension scores with progress bars
- Specific issues and recommendations
- Historical score trend (if persistence is enabled)

### MCP Tool

```
health_check: {}
```

Returns structured health data for AI analysis:
```json
{
  "score": 72,
  "grade": "Warning",
  "dimensions": {
    "errorRate": { "score": 90, "details": "2 errors in 5min" },
    "longTasks": { "score": 55, "details": "320ms total blocking" },
    "memory": { "score": 70, "details": "45MB / 100MB heap" },
    "vitals": { "score": 75, "details": "LCP good, CLS good, INP needs-improvement" }
  },
  "recommendations": [
    "Reduce main thread blocking — consider code splitting or web workers",
    "Optimize INP — check event handlers for heavy computation"
  ]
}
```

### SDK (Programmatic)

Health checks are computed server-side from collected data. The SDK itself doesn't expose a health check method — use the REST API or MCP tool.

```bash
curl http://localhost:9898/api/devices/:id/health
```

## Tips

- Health checks work best after the page has been active for >30 seconds (enough data)
- Enable performance monitoring in SDK config (`performance.enabled: true`) for accurate vitals
- Memory metrics are only available in Chromium-based browsers
- Use `--persist` flag to track health score over time
