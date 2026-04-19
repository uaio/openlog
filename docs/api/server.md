# Server API Reference

## HTTP Endpoints

All endpoints return JSON. When `--api-key` is configured, include `X-API-Key` header.

### Devices

```
GET /api/devices
```

Returns list of connected devices with metadata.

### Logs

```
GET /api/logs?deviceId=<id>&limit=<n>
DELETE /api/logs?deviceId=<id>
```

### Network Requests

```
GET /api/network?deviceId=<id>&limit=<n>
```

### Performance

```
GET /api/performance?deviceId=<id>
GET /api/perf-runs?deviceId=<id>
```

### Storage

```
GET /api/storage?deviceId=<id>
```

### DOM

```
GET /api/dom?deviceId=<id>
```

### Screenshots

```
GET /api/screenshots?deviceId=<id>
```

### Health

```
GET /api/health?deviceId=<id>
```

### Mock Rules

```
GET /api/mock-rules?deviceId=<id>
POST /api/mock-rules
DELETE /api/mock-rules/:id
```

## WebSocket Protocol

Connect via `ws://host:port` (add `?apiKey=<key>` if auth is enabled).

### Incoming Messages (from SDK)

```json
{
  "type": "event",
  "deviceId": "device-xxx",
  "envelope": {
    "type": "console|network|storage|dom|performance|screenshot|perf_run",
    "tabId": "tab-xxx",
    "ts": 1234567890,
    "data": { ... }
  }
}
```

### Outgoing Messages (to dashboard)

Same format as incoming — server broadcasts events to all connected dashboard clients filtered by device subscription.

### Device Registration

```json
{
  "type": "register",
  "device": {
    "deviceId": "...",
    "projectId": "...",
    "ua": "...",
    "screen": "...",
    "url": "..."
  }
}
```
