# Quick Start

## Install and Run

The fastest way to start openLog:

```bash
npx @openlog/cli
```

This starts the server on port 9898 and opens the web dashboard.

## Integrate SDK

Add the SDK to your H5 page:

### Via CDN (IIFE)

```html
<script src="https://unpkg.com/@openlog/sdk/dist/openlog.iife.js"></script>
<script>
  OpenLog.init({
    serverUrl: 'ws://localhost:9898',
    projectId: 'my-app',
  });
</script>
```

### Via npm

```bash
npm install @openlog/sdk
```

```typescript
import { init } from '@openlog/sdk';

init({
  serverUrl: 'ws://localhost:9898',
  projectId: 'my-app',
});
```

## CLI Options

```bash
npx @openlog/cli [options]

Options:
  -p, --port <number>       Server port (default: 9898)
  --no-open                 Don't auto-open browser
  --persist                 Enable SQLite persistence
  --db-path <path>          Database file path (default: ~/.openlog/data.db)
  --retention-days <days>   Data retention in days (default: 1)
  --api-key <key>           Require API key for access
  --cors-origin <origin>    Allowed CORS origins (comma-separated)
```

## Verify Connection

Once the SDK is initialized and the server is running:

1. Open the web dashboard (auto-opened or visit `http://localhost:9898`)
2. Your device should appear in the device list on the left
3. Console logs, network requests, and performance data will stream in real-time
