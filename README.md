# Agent Orchestrator

<p align="center">
  <img src="https://raw.githubusercontent.com/bpinhosilva/agent-orchestrator/main/docs/assets/lupy-mascot.webp" alt="Lupy, the Agent Orchestrator mascot" width="500" />
</p>

<p align="center"><em>Lupy, the project mascot, inspired by Bruno's dog and companion of 10 years.</em></p>

<p align="center">
  <a href="https://github.com/bpinhosilva/agent-orchestrator/actions/workflows/ci.yml"><img src="https://github.com/bpinhosilva/agent-orchestrator/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://github.com/bpinhosilva/agent-orchestrator/actions/workflows/gitleaks.yml"><img src="https://github.com/bpinhosilva/agent-orchestrator/actions/workflows/gitleaks.yml/badge.svg" alt="Gitleaks" /></a>
  <a href="https://socket.dev/npm/package/@bpinhosilva/agent-orchestrator"><img src="https://socket.dev/api/badge/npm/package/@bpinhosilva/agent-orchestrator" alt="Socket Badge" /></a>
</p>

<p align="center">
  <a href="docs/i18n/pt-br/README.md">🇧🇷 Português (Brasil)</a> &nbsp;&middot;&nbsp;
  <a href="docs/i18n/es-es/README.md">🇪🇸 Español (España)</a>
</p>

Agent Orchestrator is an open-source platform for managing AI agents, tasks, and project-scoped automation across multiple model providers. It combines a NestJS API, a React dashboard, a packaged CLI/runtime, and Docker deployment options for both local use and production-style environments.

## Current capabilities

- Multi-provider agent execution with Google Gemini, Anthropic Claude, and Ollama (local or cloud)
- Agent profiles with provider/model selection
- Project management with project membership and RBAC
- Task execution plus recurring scheduling
- File upload and artifact-backed task workflows
- Packaged CLI/runtime with full lifecycle management: `setup`, `run`, `restart`, `stop`, `status`, `health`, `logs`, `migrate`, `config`, `reset-password`, and `rotate-secrets`
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
- At least one provider API key or local model server to execute agents:
  - [Google Gemini API key](https://aistudio.google.com/)
  - [Anthropic API key](https://console.anthropic.com/)
  - [Ollama](https://ollama.com/) running locally (no key required) or a cloud Ollama endpoint

## Quick start

Choose the path that matches how you want to use the project:

- **Packaged CLI/runtime**: quickest way to run the app locally as an installed tool
- **Source checkout**: best path for development and contributing

### Option A: packaged CLI/runtime

```bash
npm install -g @bpinhosilva/agent-orchestrator
agent-orchestrator setup
agent-orchestrator run
agent-orchestrator restart
agent-orchestrator status
agent-orchestrator health
```

`setup` can create the runtime `.env`, run migrations, seed an admin user, and prompt you to apply pending migrations after package updates. `run` does not upgrade the database automatically. The default runtime home is `~/.agent-orchestrator`, or `${AGENT_ORCHESTRATOR_HOME}` if you set it explicitly.

For deeper CLI usage, see [docs/CLI.md](docs/CLI.md).

### Option B: source checkout

```bash
git clone https://github.com/bpinhosilva/agent-orchestrator.git
cd agent-orchestrator
npm install
npm rebuild --ignore-scripts=false
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
JWT_REFRESH_SECRET="replace-with-another-secret-at-least-32-characters-long"

# Provider keys (optional until you want to execute agents)
GEMINI_API_KEY=""
ANTHROPIC_API_KEY=""

# Ollama (local by default, fill in OLLAMA_HOST and OLLAMA_API_KEY for cloud usage)
OLLAMA_HOST=http://127.0.0.1:11434
OLLAMA_API_KEY=""

# Database
DB_TYPE=sqlite
DATABASE_URL=

# Runtime
HOST=127.0.0.1
PORT=15789
NODE_ENV=production
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
SCHEDULER_ENABLED=true
DB_LOGGING=false
SERVE_STATIC_UI=true
CHECK_PENDING_MIGRATIONS_ON_STARTUP=false
LOG_LEVEL=error
```

## Database setup

### SQLite

SQLite is the default local/runtime option when `DATABASE_URL` is not set. The database file lives at:

- `local.sqlite` in the project/package root, or
- `${AGENT_ORCHESTRATOR_HOME}/local.sqlite` when runtime home is set

> **Important — dev server vs. packaged CLI runtime use different databases by default.**
> Running `npm run dev` or `npm run start:dev` uses `./local.sqlite` in the project root.
> Running `node dist/cli/index.js` (or the installed `agent-orchestrator` binary) defaults to `~/.agent-orchestrator/local.sqlite`.
> If you run the dev server and also use CLI admin commands (e.g. `reset-password`, `migrate`), point the CLI at the project root database:
>
> ```bash
> AGENT_ORCHESTRATOR_HOME=/path/to/agent-orchestrator node dist/cli/index.js reset-password
> ```

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

- UI dev server: `http://localhost:5173` (accessible from your network)
- API: `http://localhost:3000/api/v1` (accessible from your network)
- Swagger UI: `http://localhost:3000/api` (non-production only)
- Health endpoint: `http://localhost:3000/health`

By default, the development servers bind to `0.0.0.0`, allowing access from other devices on the same network using your machine's local IP address.

If you only want the API in watch mode:

```bash
npm run start:dev
```

### Packaged/runtime mode

```bash
agent-orchestrator setup
agent-orchestrator run
agent-orchestrator status
agent-orchestrator health
agent-orchestrator logs --lines 50
agent-orchestrator restart
agent-orchestrator stop
agent-orchestrator config show
agent-orchestrator rotate-secrets
```

When running the packaged app or a production build with static UI enabled, the dashboard is served from `http://localhost:15789` by default.

## Docker

> For the full Docker guide, see [docs/DOCKER.md](docs/DOCKER.md).

The repository ships three Compose entrypoints:

| File | Purpose |
| --- | --- |
| `docker-compose.yml` | Production-style stack with PostgreSQL, API, and Caddy-served UI |
| `docker-compose.dev.yml` | Development stack with API hot reload and Vite UI dev server |
| `docker-compose.test.yml` | Integration stack for migration, CLI/runtime, API, and UI checks |

### Production-style stack

**Step 1: Create `.env`** — copy the example in the repo root and fill in your values:

```bash
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change_me
POSTGRES_DB=agent_orchestrator

JWT_SECRET=<at-least-32-char-secret>
JWT_REFRESH_SECRET=<at-least-32-char-secret>

# For seed-admin:
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change_me
```

**Step 2: Run migrations**

```bash
docker compose --profile tools run --rm migrate
```

**Step 3: Seed the admin user** — credentials are read from `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`, never from CLI flags.

```bash
docker compose --profile tools run --rm seed-admin
```

**Step 4: Start the stack**

```bash
docker compose up -d
```

Access at `https://localhost` (your browser will warn about a self-signed cert — click through).

**Stopping:**

```bash
docker compose down      # stop, keep data
docker compose down -v   # stop and wipe all data (including the PostgreSQL volume)
```

**Custom domain:**

```bash
DOMAIN=mysite.com
ALLOWED_ORIGINS=https://mysite.com
```

Caddy automatically provisions Let's Encrypt certificates for real public domains.

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

Use `docker-compose.test.yml` when you want to exercise migration behavior, packaged CLI/runtime flows, API startup, and UI reachability together.

```bash
npm run docker:test
docker compose -f docker-compose.test.yml --profile tools run --rm migrate
docker compose -f docker-compose.test.yml --profile tools run --rm cli
```

Endpoints:

- UI: `https://localhost:8444`
- API: `https://localhost:8444/api/v1`

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

- [Docker guide](docs/DOCKER.md)
- [CLI reference](docs/CLI.md)
- [CI/CD pipeline](docs/CI_CD.md)
- [Release process](docs/RELEASE.md)
- [Contributing guide](CONTRIBUTING.md)

## Troubleshooting

- **Native module errors after install**: run `npm rebuild`
- **`JWT_SECRET` rejected**: it must be at least 32 characters
- **Agent execution fails immediately**: confirm `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, or Ollama (`OLLAMA_HOST`) are set correctly for the provider in use
- **Schema/startup issues**: run `npm run migration:run`
- **Need to undo the latest migration**: run `npm run migration:revert`
- **Need to reset a user's password**: use `agent-orchestrator reset-password` — this also revokes all active sessions for that user. If the dev server (`npm run dev`) is running instead of the packaged runtime, the CLI targets a different database by default; override with `AGENT_ORCHESTRATOR_HOME=$(pwd) node dist/cli/index.js reset-password`
- **Need to rotate JWT secrets** (e.g. after a credential leak): use `agent-orchestrator rotate-secrets` — this regenerates `JWT_SECRET` and `JWT_REFRESH_SECRET`, invalidating all active sessions, and restarts the server automatically if it is running
- **Stale PostgreSQL volume (version mismatch)**: if the `db` container fails its health check with "data directory was initialized by PostgreSQL version X, which is not compatible with this version", run `docker compose down -v` to wipe the volume and start fresh

## License

See [LICENSE](LICENSE).
