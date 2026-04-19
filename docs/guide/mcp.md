# MCP Integration

openLog includes a Model Context Protocol (MCP) server that enables AI assistants to interact with debugging data.

## Setup

```bash
npx @openlog/mcp
```

Or add to your MCP client configuration:

```json
{
  "mcpServers": {
    "openlog": {
      "command": "npx",
      "args": ["@openlog/mcp"]
    }
  }
}
```

## Available Tools

| Tool | Description |
|------|-------------|
| `list_devices` | List all connected devices |
| `focus_device` | Select a device for subsequent queries |
| `get_logs` | Retrieve console logs with level filtering |
| `get_network` | Get network request history |
| `get_performance` | Get performance metrics and vitals |
| `get_storage` | Inspect localStorage/sessionStorage |
| `get_dom` | Get DOM tree snapshot |
| `analyze_errors` | AI-powered error pattern analysis |
| `ensure_sdk` | Auto-detect and inject SDK into a project |

## Example Prompts

With an AI assistant connected via MCP:

- "Show me the recent errors from device X"
- "What network requests are failing?"
- "Analyze the performance of the current page"
- "What's stored in localStorage?"
- "Help me set up openLog in my React project"

## SDK Auto-Injection

The `ensure_sdk` tool can automatically detect your project framework and add the openLog SDK:

```
> Use the ensure_sdk tool to add openLog to my project
```

It supports: React, Vue, Next.js, vanilla HTML, and more.
