# CLI Reference

## Installation

```bash
npm install -g @openlog/cli
# or use directly
npx @openlog/cli
```

## Commands

### `openlog` (default)

Start the openLog server with web dashboard.

```bash
openlog [options]
```

### Options

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--port` | `-p` | `9898` | Server port |
| `--no-open` | | | Don't auto-open browser |
| `--persist` | | `false` | Enable SQLite persistence |
| `--db-path` | | `~/.openlog/data.db` | Database file location |
| `--retention-days` | | `1` | Data retention period (days) |
| `--api-key` | | — | Require API key authentication |
| `--cors-origin` | | `*` | Allowed CORS origins |

## Examples

```bash
# Start with defaults
openlog

# Custom port, no browser
openlog -p 3000 --no-open

# With persistence
openlog --persist --retention-days 7

# With API key protection
openlog --api-key my-secret-key

# Production-like setup
openlog --persist --api-key $OPENLOG_KEY --cors-origin https://myapp.com
```

## Environment Variables

All CLI options can also be set via environment variables:

- `OPENLOG_PORT` — Server port
- `OPENLOG_PERSIST` — Enable persistence (`true`/`false`)
- `OPENLOG_DB_PATH` — Database file path
- `OPENLOG_RETENTION` — Retention days
- `OPENLOG_API_KEY` — API key
- `OPENLOG_CORS` — CORS origins
