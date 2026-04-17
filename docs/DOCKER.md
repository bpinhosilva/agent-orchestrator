# Docker Guide

This document is the definitive reference for running Agent Orchestrator with Docker Compose.

## Overview

The repository ships three Compose files:

| File | Purpose |
| --- | --- |
| `docker-compose.yml` | Production-style stack — PostgreSQL, API, Caddy (HTTPS) |
| `docker-compose.dev.yml` | Development stack — API hot reload, Vite UI dev server |
| `docker-compose.test.yml` | Integration stack — migration checks, CLI/runtime, API, UI reachability |

---

## Production stack

### Prerequisites

- [Docker](https://www.docker.com/) 24 or newer
- Docker Compose v2 (`docker compose`, not `docker-compose`)

### Environment variables

Create a `.env` file in the project root. The production stack requires:

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `POSTGRES_USER` | ✅ | — | PostgreSQL username |
| `POSTGRES_PASSWORD` | ✅ | — | PostgreSQL password |
| `POSTGRES_DB` | ✅ | — | PostgreSQL database name |
| `JWT_SECRET` | ✅ | — | HS256 signing secret for access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | ✅ | — | HS256 signing secret for refresh tokens (min 32 chars) |
| `ADMIN_EMAIL` | ✅ (seed-admin) | — | Admin user email (used by `seed-admin` service) |
| `ADMIN_PASSWORD` | ✅ (seed-admin) | — | Admin user password (used by `seed-admin` service) |
| `ADMIN_NAME` | ❌ | `Admin` | Admin user display name |
| `DOMAIN` | ❌ | `localhost` | Domain name for Caddy virtual host and TLS |
| `ALLOWED_ORIGINS` | ❌ | `https://localhost` | Comma-separated allowed CORS origins |

Minimal `.env` for local use:

```bash
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change_me
POSTGRES_DB=agent_orchestrator

JWT_SECRET=<at-least-32-char-secret>
JWT_REFRESH_SECRET=<at-least-32-char-secret>

# Admin seed
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change_me
```

> Use strong randomly generated values for `JWT_SECRET` and `JWT_REFRESH_SECRET` in any environment that handles real data.

### One-time setup

Run these once before the first `docker compose up`, and again after schema-changing updates.

**Run pending migrations:**

```bash
docker compose --profile tools run --rm migrate
```

**Seed the initial admin user:**

```bash
docker compose --profile tools run --rm seed-admin
```

Admin credentials are read from `ADMIN_EMAIL`, `ADMIN_PASSWORD` (and optionally `ADMIN_NAME`) in `.env`. They are never passed as CLI flags — see [Security notes](#security-notes).

### Starting and stopping

```bash
docker compose up -d          # start in background
docker compose logs -f        # follow logs
docker compose down           # stop, keep data volumes
docker compose down -v        # stop and delete all volumes (wipes the database)
```

### Upgrading

```bash
docker compose down
docker compose pull            # or rebuild: docker compose build
docker compose --profile tools run --rm migrate
docker compose up -d
```

### Custom domain and TLS

Set `DOMAIN` and `ALLOWED_ORIGINS` in `.env`:

```bash
DOMAIN=mysite.com
ALLOWED_ORIGINS=https://mysite.com
```

Caddy automatically provisions Let's Encrypt certificates for public domains. No additional TLS configuration is required.

For `localhost`, Caddy uses a locally-trusted self-signed certificate. Browsers will display a warning — click through or add the certificate to your trust store.

### Endpoints (default `DOMAIN=localhost`)

| Service | URL |
| --- | --- |
| Dashboard | `https://localhost` |
| API | `https://localhost/api/v1` |

---

## Development stack

```bash
npm run docker:dev
```

The dev stack mounts your source tree into the containers and enables hot reload for both the API (NestJS) and the UI (Vite).

| Service | URL |
| --- | --- |
| UI (Vite dev server) | `http://localhost:5173` |
| API | `http://localhost:3000/api/v1` |
| Swagger UI | `http://localhost:3000/api` |
| Health endpoint | `http://localhost:3000/health` |
| PostgreSQL | `localhost:5433` |

---

## How it works

```
Browser / client
      │
      ▼
  Caddy (ports 80 / 443)
      │
      ├─ /api/*  ──────────────────────► API service (port 3000, internal)
      │                                        │
      └─ everything else                       ▼
           serve static files           PostgreSQL (port 5432, internal)
           (index.html fallback)
```

- **Caddy** terminates TLS and routes traffic. `/api/*` is proxied to the API; all other paths are served from the UI static build with an `index.html` fallback for client-side routing. The `handle` blocks in `docker/Caddyfile` ensure API requests are proxied before the SPA fallback can intercept them.
- **API** binds to `HOST=0.0.0.0` inside the container so it is reachable from other containers on the Docker network. Port 3000 is only exposed to the internal `frontend` network — it is not mapped to the host.
- **PostgreSQL** is on the `backend` network which is `internal: true`. It is not accessible from the host.
- **Caddy** is on the `frontend` network (Caddy ↔ API) and exposes ports 80 and 443 to the host.

---

## Tooling services (`--profile tools`)

These one-shot services share the API image and connect to the `backend` network. They are excluded from `docker compose up` unless you pass `--profile tools`.

### `migrate`

Runs pending TypeORM migrations against the production database.

```bash
docker compose --profile tools run --rm migrate
```

### `seed-admin`

Creates an initial admin user directly via TypeORM. Reads credentials from environment variables — it does not accept CLI flags.

```bash
docker compose --profile tools run --rm seed-admin
```

Required env vars: `ADMIN_EMAIL`, `ADMIN_PASSWORD`  
Optional env var: `ADMIN_NAME` (defaults to `"Admin"`)

The service exits non-zero if credentials are missing or user creation fails.

---

## Security notes

- **Admin credentials via env vars**: `seed-admin` reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` from the environment, not from CLI flags. Passing secrets as CLI arguments exposes them in the process table and shell history.
- **Internal network**: the `backend` network is declared `internal: true`. PostgreSQL is not reachable from the host — only from containers on that network.
- **API bind address**: `HOST=0.0.0.0` is required for the API to be reachable from Caddy inside Docker. Port 3000 has no host-port mapping, so it is not accessible from outside the Docker network.
- **JWT secrets**: use long, randomly generated values. The minimum accepted length is 32 characters. Rotate them with `agent-orchestrator rotate-secrets` if they are ever exposed.

---

## Troubleshooting

### Stale PostgreSQL volume (version mismatch)

**Symptom**: `db` fails its health check with a message like:

```
FATAL: data directory was initialized by PostgreSQL version 14, which is not compatible with this version 17
```

**Fix**: wipe the volume and restart.

```bash
docker compose down -v
docker compose --profile tools run --rm migrate
docker compose up -d
```

> `down -v` deletes all data. Back up anything you need first.

### API container stays unhealthy

The API has a 30-second `start_period` before health check failures count. If it is still unhealthy after that, check the logs:

```bash
docker compose logs api
```

Common causes: missing or invalid `JWT_SECRET`, failed database connection, pending migrations blocking startup (`CHECK_PENDING_MIGRATIONS_ON_STARTUP=true`).

### 502 Bad Gateway from Caddy

Caddy cannot reach the API. Likely causes:

- `HOST` is not set to `0.0.0.0` in the API service — the API will bind to `127.0.0.1` in production mode by default, making it unreachable from other containers.
- The API container is not healthy yet — wait for it to pass its health check.
- A network misconfiguration — verify the API is on the `frontend` network.

### Browser certificate warning on localhost

Expected behavior. Caddy issues a locally-signed certificate for `localhost`. Click through the warning or add the certificate to your OS trust store. For public domains, Caddy provisions a real Let's Encrypt certificate automatically.

### Tasks stay in backlog and are never picked up

The scheduler only processes tasks that belong to **ACTIVE** projects. Projects are created in `PLANNING` status by default.

To enable task execution, open the project in the UI and change its status to **Active**. The scheduler polls every 20 seconds, so tasks should start moving shortly after.
