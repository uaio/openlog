# Network Monitoring

The SDK intercepts both `fetch` and `XMLHttpRequest` to capture network activity.

## Captured Data

- Request method, URL, headers, body
- Response status, headers, body (with size limits)
- Request duration (timing)
- Error information for failed requests

## Features

- **Method filtering** — Filter by GET, POST, PUT, DELETE, etc.
- **Status filtering** — Filter by success (2xx), redirect (3xx), client error (4xx), server error (5xx)
- **Text search** — Search by URL
- **Request details** — Click any request to view full headers and body
- **Throttle simulation** — Configurable network throttling
- **API Mocking** — Override responses for specific URL patterns

## Request Format

```typescript
interface NetworkRequestEntry {
  id: string;
  deviceId: string;
  tabId: string;
  timestamp: number;
  method: string;
  url: string;
  status?: number;
  statusText?: string;
  requestHeaders?: Record<string, string>;
  requestBody?: string;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  duration?: number;
  type: 'fetch' | 'xhr';
  error?: string;
}
```
