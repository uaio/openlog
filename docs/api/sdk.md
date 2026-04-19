# SDK API Reference

## Installation

```bash
npm install @openlog/sdk
```

Or via CDN:

```html
<script src="https://unpkg.com/@openlog/sdk/dist/openlog.iife.js"></script>
```

## Initialization

### ES Module

```typescript
import { OpenLog } from '@openlog/sdk';

const logger = new OpenLog({
  projectId: 'my-app',
  server: 'ws://192.168.1.100:9898',
});
```

### IIFE (CDN)

```html
<script>
  OpenLog.init({
    projectId: 'my-app',
    server: 'ws://192.168.1.100:9898',
  });
</script>
```

## Configuration Options

```typescript
interface OpenLogOptions {
  /** Required. Project identifier for device grouping */
  projectId: string;

  /** WebSocket server URL (e.g., 'ws://192.168.1.100:9898') */
  server?: string;

  /** Server port shorthand (alternative to server). SDK infers ws://[page hostname]:port */
  port?: number;

  /** UI language: 'zh' (default) or 'en' */
  lang?: 'zh' | 'en';

  /** Heartbeat interval in ms (default: 30000) */
  heartbeatInterval?: number;

  /** Eruda on-device panel config */
  eruda?: ErudaConfig;

  /** Network interception config */
  network?: NetworkInterceptorConfig;

  /** Enable global error capture (default: true) */
  captureErrors?: boolean;

  /** DOM snapshot config */
  dom?: {
    enabled?: boolean;       // default: true
    initialDelay?: number;   // ms delay for first snapshot (default: 2000)
  };

  /** Performance monitoring config */
  performance?: {
    enabled?: boolean;       // default: true
  };
}
```

### ErudaConfig

```typescript
interface ErudaConfig {
  /** Enable Eruda panel (default: true) */
  enabled?: boolean;
  /** Tools to show: ['console', 'elements', 'network', ...] */
  tool?: string[];
  /** Auto-scale for mobile (default: true) */
  autoScale?: boolean;
  /** Use Shadow DOM isolation (default: true) */
  useShadowDom?: boolean;
  /** Default settings */
  defaults?: {
    transparency?: number;
    displaySize?: number;
    theme?: string;
  };
}
```

### NetworkInterceptorConfig

```typescript
interface NetworkInterceptorConfig {
  /** Enable network interception (default: true) */
  enabled?: boolean;
  /** Max request body capture size in bytes (default: 10240) */
  maxRequestBodySize?: number;
  /** Max response body capture size in bytes (default: 10240) */
  maxResponseBodySize?: number;
  /** URL patterns to ignore (regex strings) */
  ignoreUrls?: string[];
}
```

## Instance Methods

### `takeScreenshot()`

Captures a screenshot of the current page using html2canvas.

```typescript
await logger.takeScreenshot();
```

### `startPerfRun()`

Starts a performance benchmark session. Enters Zen Mode automatically (disables high-overhead collectors to avoid interference).

```typescript
logger.startPerfRun();
```

### `stopPerfRun()`

Stops the benchmark and returns the scored result.

```typescript
const session = await logger.stopPerfRun();
// session.score.total — 0-100 composite score
// session.score.grade — 'A' | 'B' | 'C' | 'D' | 'F'
// session.score.issues — array of issue descriptions
```

### `getPerfReport()`

Returns the last performance run session (or `null`).

```typescript
const report = logger.getPerfReport();
```

### `setNetworkThrottle(preset)`

Simulates network conditions.

```typescript
logger.setNetworkThrottle('3g');    // Slow 3G
logger.setNetworkThrottle('4g');    // Fast 4G
logger.setNetworkThrottle('offline'); // No network
logger.setNetworkThrottle('none');  // Disable throttling
```

Available presets: `'none'` | `'3g'` | `'4g'` | `'offline'`

### `addMock(urlPattern, response)`

Adds a mock rule for matching network requests.

```typescript
const mockId = logger.addMock('/api/user', {
  status: 200,
  body: JSON.stringify({ name: 'Test User' }),
  headers: { 'Content-Type': 'application/json' },
});
```

### `removeMock(id)`

Removes a mock rule by ID.

```typescript
logger.removeMock(mockId);
```

### `clearMocks()`

Removes all mock rules.

```typescript
logger.clearMocks();
```

### `getMocks()`

Returns all active mock rules.

```typescript
const rules = logger.getMocks();
```

### `enterZenMode()`

Stops all high-overhead collectors (FPS, network, storage, DOM). Only console + error capture remain active. Used during performance benchmarking.

```typescript
logger.enterZenMode();
```

### `exitZenMode()`

Restores all collectors after Zen Mode.

```typescript
logger.exitZenMode();
```

### `isZenMode()`

Returns whether Zen Mode is active.

```typescript
if (logger.isZenMode()) { /* ... */ }
```

### `enableRemote()` / `disableRemote()`

Toggle WebSocket connection to the server.

```typescript
logger.disableRemote();  // Stop sending data
logger.enableRemote();   // Resume sending
```

### `isRemoteEnabled()`

Check if remote reporting is active.

```typescript
const connected = logger.isRemoteEnabled();
```

### `destroy()`

Completely tears down the SDK: restores original `console.*`, disconnects WebSocket, stops all collectors, destroys Eruda.

```typescript
logger.destroy();
```

## Static Method

### `OpenLog.init(options)` (IIFE only)

When using the CDN build, `OpenLog.init()` creates and returns the singleton instance:

```javascript
const logger = OpenLog.init({ projectId: 'my-app' });
```

## Data Types

### PerfRunSession

```typescript
interface PerfRunSession {
  sessionId: string;
  deviceId: string;
  tabId: string;
  startTime: number;
  endTime: number;
  duration: number;        // ms
  snapshot: PerformanceReport;
  score: PerfRunScore;
  audit?: PageAuditReport;
}
```

### PerfRunScore

```typescript
interface PerfRunScore {
  total: number;           // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  items: PerfScoreItem[];
  issues: string[];
  summary: string;
}
```

### MockRule

```typescript
interface MockRule {
  id: string;
  pattern: string;         // URL regex pattern
  status: number;
  body: string;
  headers?: Record<string, string>;
}
```

## Events & Data Flow

The SDK uses an internal **DataBus** (pub/sub event bus) as the single source of truth:

```
console.log() → intercept → DataBus.emit('console', ...) → Reporter → WebSocket → Server
                                                         → ErudaPlugin → Eruda panel
```

All collectors (Console, Network, Storage, DOM, Performance, Error, Screenshot) emit to DataBus. The Reporter subscribes and forwards to the server. ErudaPlugin subscribes and displays locally.
