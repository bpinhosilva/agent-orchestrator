# Agent Orchestrator

<p align="center">
  <img src="docs/assets/lupy-mascot.png" alt="Lupy, the Agent Orchestrator mascot" width="760" />
</p>

<p align="center"><em>Lupy, the project mascot, inspired by Bruno's dog and companion of 10 years.</em></p>

[![CI](https://github.com/bpinhosilva/agent-orchestrator/actions/workflows/ci.yml/badge.svg)](https://github.com/bpinhosilva/agent-orchestrator/actions/workflows/ci.yml)
[![Gitleaks](https://github.com/bpinhosilva/agent-orchestrator/actions/workflows/gitleaks.yml/badge.svg)](https://github.com/bpinhosilva/agent-orchestrator/actions/workflows/gitleaks.yml)
[![Socket Badge](https://socket.dev/api/badge/npm/package/@bpinhosilva/agent-orchestrator)](https://socket.dev/npm/package/@bpinhosilva/agent-orchestrator)

Agent Orchestrator is an open-source platform for managing AI agents, tasks, and project-scoped automation across multiple model providers. It combines a NestJS API, a React dashboard, a packaged CLI/runtime, and Docker deployment options for both local use and production-style environments.

## Current capabilities

- Multi-provider agent execution with Google Gemini and Anthropic Claude
- Agent profiles with provider/model selection
- Project management with project membership and RBAC
- Task execution plus recurring scheduling
- File upload and artifact-backed task workflows
- Packaged CLI/runtime for setup, run, status, logs, stop, and migrate
- React dashboard served by the backend or packaged runtime

## Planned direction

- Richer workflow orchestration and agent chaining
- Broader agent tool integrations
- Expanded runtime and deployment ergonomics

## Architecture at a glance

| Area | Stack |
| --- | --- |
| Backend | NestJS 11 + TypeScript 5 |
| Frontend | React SPA |
| Database | PostgreSQL (production) / SQLite via `better-sqlite3` (local/runtime) |
| ORM | TypeORM |
| Auth | JWT access/refresh tokens via httpOnly cookies |
| Packaging | npm package with bundled backend, CLI, and UI assets |

## Prerequisites

- [Node.js](https://nodejs.org/) 24 or newer
- npm
- [Docker](https://www.docker.com/) and Docker Compose (optional)
- At least one provider API key to execute agents:
  - [Google Gemini API key](https://aistudio.google.com/)
  - [Anthropic API key](https://console.anthropic.com/)

## Quick start

Choose the path that matches how you want to use the project:

- **Packaged CLI/runtime**: quickest way to run the app locally as an installed tool
- **Source checkout**: best path for development and contributing

### Option A: packaged CLI/runtime

```bash
npm install -g @bpinhosilva/agent-orchestrator
agent-orchestrator setup
agent-orchestrator run
agent-orchestrator status
```

`setup` can create the runtime `.env`, run migrations, and seed an admin user. The default runtime home is `~/.agent-orchestrator`, or `${AGENT_ORCHESTRATOR_HOME}` if you set it explicitly.

For deeper CLI usage, see [docs/CLI.md](docs/CLI.md).

### Option B: source checkout

```bash
git clone https://github.com/bpinhosilva/agent-orchestrator.git
cd agent-orchestrator
npm install
npm rebuild
npm run build:all
```

> **Note**: The repository uses `ignore-scripts=true` in `.npmrc` for supply-chain hardening. After `npm install`, run `npm rebuild --ignore-scripts=false` so native modules such as `bcrypt` and `better-sqlite3` are actually compiled.

If you want to use the packaged CLI behavior from a source checkout, run the built entrypoint directly:

```bash
node dist/cli/index.js --help
```

## Configure the runtime

The app loads configuration from:

- `${AGENT_ORCHESTRATOR_HOME}/.env` when `AGENT_ORCHESTRATOR_HOME` is set
- `.env` in the project/package root otherwise

Example `.env`:

```bash
# Required
JWT_SECRET="replace-with-a-secret-at-least-32-characters-long"

# Provider keys (optional until you want to execute agents)
GEMINI_API_KEY=""
ANTHROPIC_API_KEY=""

# Database
DB_TYPE=sqlite
DATABASE_URL=

# Runtime
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
SCHEDULER_ENABLED=true
DB_LOGGING=false
SERVE_STATIC_UI=true
CHECK_PENDING_MIGRATIONS_ON_STARTUP=false
```

## Database setup

### SQLite

SQLite is the default local/runtime option when `DATABASE_URL` is not set. The database file lives at:

- `local.sqlite` in the project/package root, or
- `${AGENT_ORCHESTRATOR_HOME}/local.sqlite` when runtime home is set

### PostgreSQL

Use PostgreSQL by setting `DATABASE_URL` or `DB_TYPE=postgres`:

```bash
export DATABASE_URL="postgresql://orchestrator:orchestrator_password@localhost:5433/agent_orchestrator"
```

### Initialize the schema

Run migrations before the first app start:

```bash
npm run migration:run
```

Create the initial admin user if you want to sign in through the dashboard:

```bash
npm run seed:admin
```

If you use the packaged CLI, `agent-orchestrator setup` can perform both steps for you.

## Run the application

### Local development

```bash
npm run dev
```

That starts:

- UI dev server: `http://localhost:5173`
- API: `http://localhost:3000/api/v1`
- Swagger UI: `http://localhost:3000/api` (non-production only)
- Health endpoint: `http://localhost:3000/health`

If you only want the API in watch mode:

```bash
npm run start:dev
```

### Packaged/runtime mode

```bash
agent-orchestrator run
agent-orchestrator status
agent-orchestrator logs --lines 50
agent-orchestrator stop
```

When running the packaged app or a production build with static UI enabled, the dashboard is served from `http://localhost:3000`.

## Docker

The repository ships three Compose entrypoints:

| File | Purpose |
| --- | --- |
| `docker-compose.yml` | Production-style stack with PostgreSQL, API, and Caddy-served UI |
| `docker-compose.dev.yml` | Development stack with API hot reload and Vite UI dev server |
| `docker-compose-test.yml` | Integration stack for migration, CLI/runtime, API, and UI checks |

### Production-style stack

```bash
npm run docker:up
docker compose run --rm api dist/cli/index.js migrate --yes
```

Endpoints:

- UI: `https://localhost` or `https://agent-orchestrator.localhost`
- API: `http://localhost:3000/api/v1`

In this stack the UI is served by **Caddy**, not by the Nest app. Docker explicitly sets `SERVE_STATIC_UI=false` so the backend only serves the API.

### Development stack

```bash
npm run docker:dev
```

Endpoints:

- UI: `http://localhost:5173`
- API: `http://localhost:3000/api/v1`
- PostgreSQL: `localhost:5433`

### Integration stack

Use `docker-compose-test.yml` when you want to exercise migration behavior, packaged CLI/runtime flows, API startup, and UI reachability together.

## Development workflow

| Task | Command |
| --- | --- |
| Start API + UI | `npm run dev` |
| Start API only | `npm run start:dev` |
| Lint API + UI | `npm run lint:all` |
| Run API + UI + E2E tests | `npm run test:all` |
| Run coverage | `npm run test:cov` |
| Run E2E tests | `npm run test:e2e` |
| Build backend + UI package output | `npm run build:all` |
| Apply migrations | `npm run migration:run` |

## Auth and access model

- Access and refresh tokens are issued by the auth service and transported via **httpOnly cookies**
- System roles are **`admin`** and **`user`**
- Project membership roles are **`owner`** and **`member`**
- Routes are protected by default; use `@Public()` for public endpoints
- Global throttling defaults to `60/min`, with stricter limits on auth endpoints

## Useful docs

- [CLI reference](docs/CLI.md)
- [CI/CD pipeline](docs/CI_CD.md)
- [Release process](docs/RELEASE.md)
- [Contributing guide](CONTRIBUTING.md)

## Troubleshooting

- **Native module errors after install**: run `npm rebuild`
- **`JWT_SECRET` rejected**: it must be at least 32 characters
- **Agent execution fails immediately**: confirm `GEMINI_API_KEY` and/or `ANTHROPIC_API_KEY` are set
- **Schema/startup issues**: run `npm run migration:run`
- **Need to undo the latest migration**: run `npm run migration:revert`

## License

See [LICENSE](LICENSE).
