# Configuration

## SDK Options

```typescript
interface OpenLogConfig {
  /** WebSocket server URL */
  serverUrl: string;

  /** Project identifier for device grouping */
  projectId: string;

  /** Enable/disable console interception (default: true) */
  console?: boolean;

  /** Enable/disable network interception (default: true) */
  network?: boolean;

  /** Enable/disable performance monitoring (default: true) */
  performance?: boolean;

  /** Enable/disable storage snapshots (default: true) */
  storage?: boolean;

  /** Enable/disable error capture (default: true) */
  error?: boolean;

  /** Enable Eruda in-page console (default: false) */
  eruda?: boolean;

  /** Max logs per second rate limit (default: 100) */
  rateLimit?: number;
}
```

## Server Configuration

The server can be configured via CLI flags or environment variables:

| Option | Env Variable | Default | Description |
|--------|-------------|---------|-------------|
| `--port` | `OPENLOG_PORT` | 9898 | Server port |
| `--persist` | `OPENLOG_PERSIST` | false | Enable SQLite persistence |
| `--db-path` | `OPENLOG_DB_PATH` | `~/.openlog/data.db` | Database file path |
| `--retention-days` | `OPENLOG_RETENTION` | 1 | Days to retain data |
| `--api-key` | `OPENLOG_API_KEY` | — | API key for authentication |
| `--cors-origin` | `OPENLOG_CORS` | `*` | Allowed CORS origins |

## Persistence

When `--persist` is enabled, logs, network requests, performance sessions, and device info are stored in SQLite using WAL mode for performance. Data older than the retention period is automatically cleaned up hourly.

## API Key Authentication

When `--api-key` is set, all HTTP API requests must include the header:

```
X-API-Key: <your-key>
```

WebSocket connections must include the key as a query parameter:

```
ws://localhost:9898?apiKey=<your-key>
```
