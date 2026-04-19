# API Mocking & Network Throttling

openLog lets you mock API responses and simulate network conditions directly from the PC panel or AI tools — no backend changes needed.

## API Mocking

### How It Works

1. Add a mock rule (URL pattern + response) from the PC panel or via MCP
2. The SDK intercepts matching requests at the network layer
3. Instead of hitting the real server, the SDK returns your mock response
4. The mocked request still appears in the Network panel (marked as mocked)

### Adding Mock Rules

**From PC Panel (Mock Tab):**
- Enter a URL regex pattern (e.g., `/api/user.*`)
- Set response status code, body, and headers
- Toggle rules on/off

**From MCP (AI tools):**
```
add_mock: { urlPattern: "/api/login", status: 200, body: '{"token":"test"}' }
remove_mock: { id: "mock-xxx" }
clear_mocks: {}
```

**From SDK code:**
```typescript
const id = logger.addMock('/api/user', {
  status: 200,
  body: JSON.stringify({ name: 'Mock User', email: 'test@example.com' }),
  headers: { 'Content-Type': 'application/json' },
});

// Remove later
logger.removeMock(id);

// Or clear all
logger.clearMocks();
```

### Mock Rule Format

```typescript
interface MockRule {
  id: string;           // Auto-generated unique ID
  pattern: string;      // URL regex pattern
  status: number;       // HTTP status code
  body: string;         // Response body (usually JSON string)
  headers?: Record<string, string>;  // Response headers
}
```

### Pattern Matching

The `pattern` field is a **regex string** matched against the full request URL:

| Pattern | Matches |
|---------|---------|
| `/api/user` | Any URL containing `/api/user` |
| `/api/user$` | URLs ending with `/api/user` |
| `/api/(login\|register)` | `/api/login` or `/api/register` |
| `.*` | All requests (use with caution) |

## Network Throttling

Simulate slow network conditions to test loading states, timeouts, and offline behavior.

### Available Presets

| Preset | Latency | Download Speed |
|--------|---------|----------------|
| `none` | 0ms | Unlimited |
| `4g` | 50ms | 4 Mbps |
| `3g` | 300ms | 750 Kbps |
| `offline` | — | No connectivity |

### Usage

**From PC Panel (Console Tab):**
- Use the throttle dropdown to select a preset

**From MCP:**
```
network_throttle: { preset: "3g" }
```

**From SDK:**
```typescript
logger.setNetworkThrottle('3g');

// Disable throttling
logger.setNetworkThrottle('none');
```

### How Throttling Works

The `NetworkThrottle` module wraps the native `fetch` and `XMLHttpRequest` with artificial delays:
- **Latency** — Adds a delay before the request is sent
- **Bandwidth** — Throttles response data delivery based on simulated transfer speed
- **Offline** — Rejects all requests with a network error

> ⚠️ Throttling is client-side only. It simulates the experience but doesn't affect actual network conditions.
