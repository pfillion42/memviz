# Contributing to memviz

Thanks for your interest in contributing! Whether it's a bug report, a feature idea, or a pull request, all contributions are welcome.

## Prerequisites

- Node.js 20+
- A SQLite-vec database from [MCP Memory Service](https://github.com/doobidoo/mcp-memory-service) (for manual testing)

## Getting started

```bash
git clone https://github.com/pfillion42/memviz.git
cd memviz

# Backend
cd server
npm install
cp .env.example .env
# Set MEMORY_DB_PATH in .env

# Frontend
cd ../client
npm install
```

## Development workflow

The project is a monorepo with two independent packages (`server/` and `client/`). Each has its own `package.json`, tests, and lint config.

```bash
# Start the backend (auto-reload)
cd server && npm run dev

# Start the frontend (Vite dev server, proxied to backend)
cd client && npm run dev
```

### Running tests

```bash
cd server && npm test       # Backend tests (Vitest)
cd client && npm test       # Frontend tests (Vitest + Testing Library)
```

Both packages also support watch mode:

```bash
npm run test:watch
```

### Linting

```bash
cd server && npm run lint
cd client && npm run lint
```

## Code style

- **TypeScript** strict mode in both packages
- **No accented characters** in code or comments (project convention)
- **Vitest** for all tests
- **React Query** hooks for data fetching on the frontend
- **Zod** schemas for request validation on the backend

## Pull requests

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Make sure all tests pass (`npm test` in both `server/` and `client/`)
4. Make sure lint passes (`npm run lint` in both packages)
5. Write a clear PR description explaining what changed and why

If you're adding a new feature, please include tests. The project currently has 339 tests and we'd like to keep coverage high.

## Reporting bugs

Open an issue with:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Your environment (Node version, OS)

## Feature ideas

Open an issue to discuss before starting work on large features. This helps avoid duplicate effort and lets us align on the approach.
