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

## Internationalization (i18n)

openLog supports English and Chinese for both the SDK (Eruda panel) and the PC web panel.

### SDK Language

Set the `lang` option when initializing:

```typescript
new OpenLog({
  projectId: 'my-app',
  lang: 'en',   // 'zh' (default) or 'en'
});
```

### PC Panel Language

The web panel auto-detects the browser's language. Users can also switch manually via the language toggle in the panel header.

Language preference is persisted to `localStorage` (`openlog_lang`).

### Adding a Language

Both SDK and web panel use a simple key-value locale system:
- SDK: `packages/sdk/src/i18n/`
- Web: `packages/web/src/i18n/` (implements the `Locale` TypeScript interface)

## Multi-tab Support

When a user has multiple browser tabs open on the same device, each tab gets a unique `tabId`. The PC panel can filter data by tab:

- **TabFilter component** — Dropdown in the panel header showing all active tabs
- **Per-tab filtering** — Console logs and network requests can be filtered to a specific tab
- **Tab identification** — Each tab reports its URL, so you can identify which page it represents

The `tabId` is auto-generated when the SDK initializes and included in every data envelope sent to the server.
