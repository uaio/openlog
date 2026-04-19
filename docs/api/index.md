# SDK API Reference

## `init(config)`

Initialize the openLog SDK.

```typescript
import { init } from '@openlog/sdk';

const instance = init({
  serverUrl: 'ws://localhost:9898',
  projectId: 'my-app',
  console: true,
  network: true,
  performance: true,
  storage: true,
  error: true,
  eruda: false,
  rateLimit: 100,
});
```

### Returns

```typescript
interface OpenLogInstance {
  /** Destroy the instance and restore original console/fetch/XHR */
  destroy(): void;

  /** Get the generated device ID */
  deviceId: string;

  /** Get the current tab ID */
  tabId: string;
}
```

## DataBus

Internal event bus used by collectors. Available for advanced use:

```typescript
import { DataBus } from '@openlog/sdk/core/DataBus';

const bus = new DataBus();

// Subscribe to events
const unsub = bus.on('console', (entry) => {
  console.log('Captured:', entry.message);
});

// Emit events
bus.emit('console', { id: '1', level: 'log', message: 'hello', timestamp: Date.now(), args: [] });

// Unsubscribe
unsub();

// Clear all listeners
bus.clear();
```

## Event Types

```typescript
type DataBusEventMap = {
  console: DataBusConsoleEntry;
  network: NetworkRequestEntry;
  storage: StorageSnapshot;
  dom: DOMSnapshot;
  performance: PerformanceReport;
  screenshot: ScreenshotData;
  perf_run: PerfRunSession;
};
```
