# Contributing to openLog

Thank you for your interest in contributing to openLog! This guide will help you get started.

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Getting Started

```bash
# Clone the repository
git clone https://github.com/uaio/openLog.git
cd openLog

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Start dev mode
pnpm dev
```

## Project Structure

```
packages/
├── types/      # Shared TypeScript types (@openlog/types)
├── sdk/        # Mobile SDK (@openlog/sdk)
├── server/     # Node.js WebSocket + REST server (@openlog/server)
├── web/        # PC debug panel (React, @openlog/web)
├── mcp/        # MCP AI toolset (@openlog/mcp)
├── cli/        # CLI entry point (@openlog/cli)
├── eruda/      # Forked Eruda for on-device panel
└── demo/       # Demo app for testing
```

## Development Workflow

### Local Development (Full Stack)

To run and test the complete openLog stack locally:

**Terminal 1 — Start the server:**
```bash
pnpm build                          # Build all packages first
node packages/cli/bin/openlog.js    # Start server (default port 9898)

# Useful flags:
#   -p 3000          Custom port
#   --persist        Enable SQLite persistence
#   --no-open        Don't auto-open browser
```

**Terminal 2 — Start the demo app (simulates a mobile H5 page):**
```bash
pnpm demo    # Starts at http://localhost:5274
```

**Terminal 3 — (Optional) Watch mode for active development:**
```bash
# Watch a specific package:
pnpm --filter @openlog/server dev   # Recompile server on change
pnpm --filter @openlog/sdk dev      # Recompile SDK on change
pnpm --filter @openlog/web dev      # Web panel with HMR
```

### Verification Steps

1. Open the PC panel at `http://localhost:9898`
2. Open the demo page at `http://localhost:5274`
3. The demo device should appear in the PC panel's device list
4. Interact with the demo page — logs, network requests, and performance data stream in real-time
5. Test MCP tools by running `npx @openlog/mcp` in a separate terminal

### Package-specific Development

| Package | Dev Command | Notes |
|---------|-------------|-------|
| `@openlog/server` | `pnpm --filter @openlog/server dev` | TypeScript watch mode |
| `@openlog/sdk` | `pnpm --filter @openlog/sdk dev` | Vite build watch |
| `@openlog/web` | `pnpm --filter @openlog/web dev` | Vite HMR (port 5173) |
| `@openlog/cli` | `pnpm --filter @openlog/cli dev` | TypeScript watch mode |
| `@openlog/mcp` | Rebuild after changes | No watch mode |
| `docs` | `pnpm docs:dev` | VitePress dev server |

### Running the Full Build

```bash
pnpm build    # Builds all 8 packages via Turborepo
```

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make your changes** in the relevant package(s).

3. **Run lint and tests**:
   ```bash
   pnpm lint
   pnpm test
   ```

4. **Build** to ensure no type errors:
   ```bash
   pnpm build
   ```

5. **Commit** using conventional commit messages:
   ```
   feat(sdk): add new collector for X
   fix(server): handle disconnection gracefully
   docs: update README with new API
   ```

6. **Push and create a Pull Request**.

## Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

Scope should be the package name: `sdk`, `server`, `mcp`, `cli`, `web`, `types`.

## Testing

```bash
# Run all tests
pnpm test

# Run tests for a specific package
pnpm --filter @openlog/server test
pnpm --filter @openlog/mcp test
pnpm --filter @openlog/cli test
pnpm --filter @openlog/sdk test
```

## Code Style

- We use ESLint and Prettier for code formatting
- Run `pnpm lint` to check for issues
- TypeScript strict mode is enabled

## Reporting Issues

- Use GitHub Issues to report bugs
- Include reproduction steps, expected behavior, and actual behavior
- Include your Node.js version and OS

## Pull Request Guidelines

- Keep PRs focused on a single change
- Update documentation if your change affects public APIs
- Add tests for new features
- Ensure CI passes before requesting review

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
