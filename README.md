# Agent Orchestrator

[![CI](https://github.com/bpinhosilva/agent-orchestrator/actions/workflows/ci.yml/badge.svg)](https://github.com/bpinhosilva/agent-orchestrator/actions/workflows/ci.yml)
[![Release](https://github.com/bpinhosilva/agent-orchestrator/actions/workflows/release.yml/badge.svg)](https://github.com/bpinhosilva/agent-orchestrator/actions/workflows/release.yml)
[![Gitleaks](https://github.com/bpinhosilva/agent-orchestrator/actions/workflows/gitleaks.yml/badge.svg)](https://github.com/bpinhosilva/agent-orchestrator/actions/workflows/gitleaks.yml)
[![Socket Badge](https://socket.dev/api/badge/npm/package/@bpinhosilva/agent-orchestrator)](https://socket.dev/npm/package/@bpinhosilva/agent-orchestrator)

Agent Orchestrator is an open-source project designed to manage and orchestrate AI agents using both back-end services and front-end applications. It provides an automated agentic execution environment where you can create multiple agent profiles (e.g., Head Agent, Researcher, CMO) and delegate tasks to them through automated workflows.

## Features (In Progress & Planned)
- **Agent Delegation**: Delegate tasks to specialized AI agents.
- **Multi-Provider Support**: Google Gemini and Anthropic Claude providers.
- **Job Scheduler**: Create and schedule recurring agentic tasks.
- **Workflow Engine**: Drag-and-drop workflow builder supporting triggers, agent chaining, and outputs.
- **Agent Capabilities**: File reading/writing, web search, email capabilities, and image generation.
- **Role-Based Access Control**: Admin and member roles with project-level membership.
- **TUI/CLI Tooling**: CLI executables to manage the installation and local agent configuration.

## Architecture
- **Backend Framework**: NestJS 11 + TypeScript 5
- **Frontend SPA**: React (built separately, served as static files)
- **Database**: PostgreSQL (production) / SQLite (development)
- **Testing**: Jest (TDD Approach with Unit & E2E)
- **Architecture**: 3-Tier (Controller → Service → Repository)

## Prerequisites
- [Node.js](https://nodejs.org/) (v24+)
- [Docker](https://www.docker.com/) and Docker Compose (optional, for the containerized stack)
- A [Google Gemini API Key](https://aistudio.google.com/) or [Anthropic API Key](https://console.anthropic.com/)

## Quick Start

### 1. Choose an installation path

**Option A: install the packaged CLI**

```bash
npm install -g @bpinhosilva/agent-orchestrator
agent-orchestrator --help
```

**Option B: run from a source checkout**

```bash
git clone <repo> && cd agent-orchestrator
npm install
npm rebuild
npm run build:all
```

> **Note**: The project uses `ignore-scripts=true` in `.npmrc` for supply chain security. After installing dependencies from source, run `npm rebuild` to compile native modules (bcrypt, sqlite3).

### 2. Configure the runtime

**CLI-driven setup (recommended for local/runtime installs)**

```bash
agent-orchestrator setup
```

The CLI writes `${AGENT_ORCHESTRATOR_HOME}/.env` with user-only permissions (`0600`), can run migrations, and can seed an admin user. It also supports non-interactive setup:

```bash
agent-orchestrator setup \
  --yes \
  --db-type postgres \
  --database-url postgresql://orchestrator:orchestrator_password@localhost:5433/agent_orchestrator \
  --provider gemini \
  --gemini-key your-gemini-api-key \
  --skip-admin-setup
```

**Manual `.env` setup**

Create a `.env` file in the project root (or set `AGENT_ORCHESTRATOR_HOME` to point to a directory containing `.env`):

```bash
# Required
JWT_SECRET="at-least-32-characters-long-secret-key"

# AI Providers (at least one required for agent functionality)
GEMINI_API_KEY="your-gemini-api-key"
ANTHROPIC_API_KEY="your-anthropic-api-key"

# Optional
PORT=3000                           # Server port (default: 3000)
NODE_ENV=development                # development | production | test
DATABASE_URL=                       # PostgreSQL connection string (omit for SQLite)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
SCHEDULER_ENABLED=true              # Enable/disable task scheduler CRON
DB_LOGGING=false                    # Enable TypeORM query logging
SERVE_STATIC_UI=true                # Set false when the UI is served by a separate container/proxy
CHECK_PENDING_MIGRATIONS_ON_STARTUP=false
```

### 3. Set Up the Database

**Option A: SQLite (Development — zero config)**

SQLite is used automatically when `DATABASE_URL` is not set. The database file is created at `local.sqlite` in the project root (or `$AGENT_ORCHESTRATOR_HOME/local.sqlite`).

**Option B: PostgreSQL (Production / Docker)**

```bash
# Start only PostgreSQL
docker compose up -d db

# Set the connection string
export DATABASE_URL="postgresql://orchestrator:orchestrator_password@localhost:5433/agent_orchestrator"
```

Then run migrations and seed the admin user:

```bash
# Apply database migrations
npm run migration:run

# Create the initial admin user (interactive prompt)
npm run seed:admin
```

### 4. Run the Application

```bash
# Packaged/runtime CLI
agent-orchestrator run
agent-orchestrator status
agent-orchestrator logs --lines 50
agent-orchestrator stop

# Development (API + UI with hot reload)
npm run dev

# Or API only in watch mode
npm run start:dev

# Production build
npm run build
npm run start:prod
```

The dashboard is available at `http://localhost:3000` and the API at `http://localhost:3000/api/v1/`.

### 5. Run with Docker

The repository now includes three compose entrypoints:

- `docker-compose.yml` — production-like stack with **PostgreSQL + distroless API + Caddy UI**
- `docker-compose.dev.yml` — development stack with hot reload for API and UI
- `docker-compose-test.yml` — containerized integration stack for migration, CLI, API, and UI checks

All Docker entrypoints read from the repository-root `.env` file. For the Docker flows, the most relevant variables are:

```bash
JWT_SECRET="at-least-32-characters-long-secret-key"
POSTGRES_USER=orchestrator
POSTGRES_PASSWORD=orchestrator_password
POSTGRES_DB=agent_orchestrator
POSTGRES_PORT=5433
POSTGRES_TEST_DB=agent_orchestrator_test
POSTGRES_TEST_PORT=5434
GEMINI_API_KEY=
ANTHROPIC_API_KEY=
```

#### Production-like Docker stack

```bash
# Build and start PostgreSQL + API + UI
npm run docker:up

# The API will refuse to start until migrations are applied
docker compose run --rm api dist/cli/index.js migrate --yes

# Stop the stack
npm run docker:down
```

- UI: `https://localhost` or `https://agent-orchestrator.localhost`
- API: `http://localhost:3000/api/v1`

The API container does **not** serve the SPA in Docker mode. The UI is served by **Caddy**, which also proxies `/api/*` traffic to the API container so the browser can use the same origin for UI + API.

The UI container uses **Caddy** with `tls internal`, so HTTPS works locally without an external CA. Browsers will still warn until you trust Caddy's local root certificate on your host machine. You can copy it out of the container with:

```bash
docker compose cp ui:/data/caddy/pki/authorities/local/root.crt ./caddy-local-root.crt
```

After trusting that certificate in your OS/browser trust store, local HTTPS becomes trusted as well.

#### Development Docker stack

```bash
npm run docker:dev

# Stop the dev stack
docker compose -f docker-compose.dev.yml down
```

- UI dev server: `http://localhost:5173`
- API: `http://localhost:3000/api/v1`
- PostgreSQL: `localhost:5433`

The dev stack disables bundled UI serving in the API container and points the Vite dev proxy at the `api` service over the Docker network.

#### Docker integration / end-to-end stack

Use the test compose file when you want to exercise migration behavior, CLI commands, API startup, and the UI together:

```bash
# Start only the database first
docker compose -f docker-compose-test.yml up -d db

# Verify pending migrations block API startup
docker compose -f docker-compose-test.yml up api

# Apply migrations with the packaged CLI runtime
docker compose -f docker-compose-test.yml run --rm migrate

# Then bring up the full app stack
docker compose -f docker-compose-test.yml up ui api

# Run ad hoc CLI checks
docker compose -f docker-compose-test.yml run --rm cli dist/cli/index.js status

# Tear the test stack down
docker compose -f docker-compose-test.yml down -v
```

The test stack is designed for:

- verifying that pending migrations block API startup,
- applying migrations through the packaged CLI/runtime path,
- checking UI reachability through Caddy,
- exercising future CLI-driven Docker behaviors without depending on the local SQLite test path.

## Database Management

The project uses [TypeORM](https://typeorm.io/) migrations to manage schema changes. **Never rely on `synchronize: true`** — it is disabled in all environments.

### Migration Commands

```bash
# Generate a new migration from entity changes
npm run typeorm -- migration:generate src/migrations/DescriptiveName

# Apply all pending migrations
npm run migration:run

# Revert the last applied migration
npm run migration:revert

# Drop the entire database schema (use with caution!)
npm run schema:drop
```

### Migration Workflow

1. Modify your entity files in `src/`
2. Generate a migration: `npm run typeorm -- migration:generate src/migrations/YourMigrationName`
3. Review the generated file in `src/migrations/`
4. Apply it: `npm run migration:run`
5. Verify with tests: `npm run test:all`

### Seeding

```bash
# Create the initial admin user
npm run seed:admin
```

This creates a user with the `admin` role. All subsequent users registered via `POST /auth/register` (admin-only endpoint) default to `member` role.

## Deployment

### Production Checklist

1. **Database**: Use PostgreSQL — set `DATABASE_URL` environment variable
2. **Migrations**: Run `npm run migration:run` before starting the app
3. **Environment**:
   - `NODE_ENV=production` — disables Swagger UI and enables secure cookies
   - `JWT_SECRET` — strong secret, minimum 32 characters
   - `ALLOWED_ORIGINS` — comma-separated list of allowed CORS origins (required in production)
4. **Build**: Run `npm run build` to compile TypeScript and bundle the UI
5. **Start**: `npm run start:prod` (or `node dist/main.js`)

### Docker

```bash
# Production-like stack
npm run docker:up

# Apply migrations with the packaged runtime inside the API container
docker compose run --rm api dist/cli/index.js migrate --yes

# Stop the stack
npm run docker:down
```

The API container is configured to **fail fast when migrations are pending**. This keeps schema changes explicit instead of silently mutating the database during startup.

This behavior is controlled by `CHECK_PENDING_MIGRATIONS_ON_STARTUP=true` in the Docker API service. Docker mode also sets `SERVE_STATIC_UI=false` so the backend does not try to serve bundled frontend assets.

### Updating an Existing Deployment

1. Pull the latest code
2. Install dependencies: `npm ci && npm rebuild`
3. Build: `npm run build`
4. Run new migrations: `npm run migration:run`
5. Restart the application

## Testing

```bash
# Unit tests
npm test

# Unit tests in watch mode
npm run test:watch

# E2E tests
npm run test:e2e

# All tests (unit + UI + E2E)
npm run test:all

# Test coverage
npm run test:cov

# Run a single test file
npm test -- src/auth/auth.service.spec.ts

# Run tests matching a name pattern
npm test -- --testNamePattern="should validate email"
```

## Security

### Authentication & Authorization

- **JWT-based authentication** with httpOnly cookie transport (no tokens in response bodies)
- **Role-Based Access Control (RBAC)**: `admin` and `member` roles
  - **Admin**: Full access to all resources
  - **Member**: Access scoped to projects they own or are members of
- **Project membership**: Many-to-many model with `owner` and `member` roles per project
- **Rate limiting**: 60 req/min globally, 5 req/min on auth endpoints
- All routes protected by default — use `@Public()` decorator for public endpoints

### Supply Chain Protection

- `.npmrc` hardened: registry pinned to `registry.npmjs.org`, install scripts disabled
- `lockfile-lint` validates lockfile integrity in CI and pre-commit hooks
- `npm audit signatures` checks package provenance in CI
- [Socket.dev](https://socket.dev) monitors dependencies for supply chain risks

### Additional Hardening

- Helmet.js security headers with Content Security Policy
- CORS restricted to `ALLOWED_ORIGINS` (deny-all in production without explicit config)
- Swagger UI disabled in production
- File upload validation: MIME type allowlist + 10MB size limit
- Input length limits on all text fields via class-validator

## API Usage

**Endpoint**: `POST /api/v1/agents/process`
**Payload**:
```json
{
  "input": "Write a short poem about automation."
}
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Additional Documentation

- [CLI reference](docs/CLI.md)
- [CI/CD pipeline](docs/CI_CD.md)
- [Release process](docs/RELEASE.md)

## License

See [LICENSE](LICENSE) for details.
