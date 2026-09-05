# API Status Check MCP Server

An MCP (Model Context Protocol) server for checking real-time operational status of 285 cloud services and APIs directly from AI coding assistants.

## Features

| Tool | Description |
|------|-------------|
| `check_status` | Check the status of a specific API (e.g. `github`, `openai`, `stripe`) |
| `list_apis` | List all monitored APIs and their current status |
| `list_categories` | List available service categories (cloud, payments, etc.) |
| `check_category` | Check all APIs in a specific category |
| `check_url` | Check any public URL for availability |

## Supported Services

AWS, GitHub, Stripe, OpenAI, Vercel, Cloudflare, Datadog, PagerDuty, Twilio, Shopify, Slack, Zoom, and 270+ more. Full list at [apistatuscheck.com](https://apistatuscheck.com).

## Quick Start

### Hosted endpoint (recommended — nothing to install)

The server is also hosted, so the fastest path is the remote Streamable HTTP
endpoint. This is the same entry the official MCP Registry advertises as
`io.github.shibley/apistatuscheck`.

```bash
claude mcp add --transport http apistatuscheck https://apistatuscheck.com/api/mcp
```

For stdio-only clients:

```bash
npx -y mcp-remote https://apistatuscheck.com/api/mcp
```

### Using npx

```bash
npx -y apistatuscheck-mcp-server
```

> **Broken on published version `0.1.0`.** That tarball's `dist/index.js` shipped
> without a `#!/usr/bin/env node` shebang, so the shim was executed by `sh`
> instead of Node and the command failed with `command not found`. Fixed in this
> repo (shebang added, plus an `apistatuscheck-mcp-server` bin alias so the
> command matches the package name), but the fix is not on npm yet — `0.1.1`
> needs to be published. Until then, build from source:
>
> ```bash
> git clone https://github.com/shibley/apistatuscheck-mcp-server.git
> cd apistatuscheck-mcp-server && npm install && npm run build
> node dist/index.js
> ```

### Using Docker

```bash
docker build -t apistatuscheck-mcp .
docker run -i apistatuscheck-mcp
```

## Configuration

### Claude Desktop

Add to your `claude_desktop_config.json`. This points at the hosted endpoint —
**do not** use `"args": ["-y", "apistatuscheck-mcp-server"]`, because the only version
on npm (`0.1.0`) is the broken one described above and fails silently.

```json
{
  "mcpServers": {
    "apistatuscheck": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://apistatuscheck.com/api/mcp"]
    }
  }
}
```

### Cursor / Other MCP Clients

Same hosted endpoint via `mcp-remote`:

```json
{
  "mcpServers": {
    "apistatuscheck": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://apistatuscheck.com/api/mcp"]
    }
  }
}
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ASC_BASE_URL` | `https://apistatuscheck.com` | Base URL for the API |

## Local Development

```bash
git clone https://github.com/shibley/apistatuscheck-mcp-server.git
cd apistatuscheck-mcp-server
npm install
npm run build
node dist/index.js
```

## License

MIT — [Bity LLC](https://apistatuscheck.com)
