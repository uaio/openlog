# Storage Monitoring

openLog captures real-time snapshots of browser storage, letting you inspect and modify data remotely.

## What's Captured

| Storage Type | Read | Write (from PC) |
|-------------|------|-----------------|
| localStorage | ✅ | ✅ |
| sessionStorage | ✅ | ✅ |
| Cookies | ✅ | — |

## How It Works

1. SDK's `StorageReader` takes periodic snapshots of all storage
2. Snapshots include key-value pairs and total byte sizes
3. Data is sent to the server via WebSocket
4. The PC panel displays storage in an editable table view
5. PC panel can send `set_storage` / `clear_storage` commands back to the device

## PC Panel Features

- **View all keys** — Full list of localStorage and sessionStorage entries
- **Edit values** — Click to modify any key's value in real-time
- **Delete keys** — Remove individual entries
- **Clear all** — Wipe an entire storage type
- **Size indicator** — Shows total bytes used per storage type
- **Cookie display** — Read-only view of document.cookie

## MCP Tools

| Tool | Description |
|------|-------------|
| `get_storage` | Get current storage snapshot |
| `set_storage` | Set a key-value pair in localStorage/sessionStorage |
| `clear_storage` | Clear all entries in a storage type |

## Data Format

```typescript
interface StorageSnapshot {
  deviceId: string;
  tabId: string;
  timestamp: number;
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  cookies: string;
  localStorageSize: number;      // bytes
  sessionStorageSize: number;    // bytes
}
```

## Configuration

Storage monitoring is enabled by default. There is no separate toggle — it's part of the core SDK collectors.

The SDK automatically detects storage changes via a polling mechanism to ensure cross-browser compatibility (since `storage` events only fire across tabs, not within the same tab).
