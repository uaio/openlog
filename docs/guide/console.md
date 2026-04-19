# Console Logs

The SDK intercepts `console.log`, `console.warn`, `console.error`, `console.info`, `console.debug`, and `console.trace` calls.

## Features

- **Level filtering** — Filter by log/warn/error/info/debug level in the web dashboard
- **Stack traces** — Error and trace logs include full call stacks
- **Rate limiting** — Prevents flooding (default: 100 logs/second)
- **Buffered delivery** — Logs are batched for network efficiency
- **Persistence** — Optionally stored in SQLite for later retrieval

## How It Works

1. SDK patches `console.*` methods on initialization
2. Each call is captured with timestamp, level, serialized message, and optional stack
3. Data is emitted to the internal DataBus
4. Reporter subscribes to DataBus and sends via WebSocket to the server
5. Server broadcasts to connected web dashboard clients

## Message Format

```typescript
interface ConsoleLogEntry {
  id: string;
  deviceId: string;
  tabId: string;
  timestamp: number;
  level: 'log' | 'warn' | 'error' | 'info' | 'debug';
  message: string;
  stack?: string;
}
```
