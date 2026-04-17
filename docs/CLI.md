# CLI Reference

The package exposes the `agent-orchestrator` CLI for packaged runtime setup and lifecycle management.

- **Node.js requirement:** 24.0.0 or later
- **Packaged install:** `npm install -g @bpinhosilva/agent-orchestrator`
- **Source checkout:** build first, then run `node dist/cli/index.js ...`

For general project setup and development guidance, start with [README.md](../README.md).

## Installation paths

### Published package

```bash
npm install -g @bpinhosilva/agent-orchestrator
agent-orchestrator --help
```

### Source checkout

```bash
npm install
npm rebuild
npm run build:all
node dist/cli/index.js --help
```

The published package includes the backend build and the UI bundle required by `agent-orchestrator run`. In a source checkout, `npm run build:all` produces the same packaged runtime layout under `dist/`.

> **Database path when using the CLI from a source checkout:**
> `node dist/cli/index.js` defaults to `~/.agent-orchestrator/local.sqlite` — **not** `./local.sqlite`.
> The dev server (`npm run dev` / `npm run start:dev`) uses `./local.sqlite` in the project root.
> These are separate databases. To run CLI admin commands against the dev server's database, set `AGENT_ORCHESTRATOR_HOME` to the project root:
>
> ```bash
> AGENT_ORCHESTRATOR_HOME=$(pwd) node dist/cli/index.js reset-password
> AGENT_ORCHESTRATOR_HOME=$(pwd) node dist/cli/index.js migrate --yes
> ```

## Commands

| Command | Description |
| --- | --- |
| `setup` | Create or update the runtime `.env`, configure providers, optionally run migrations, and optionally create an admin user |
| `run` | Start the orchestrator server in detached mode after verifying the packaged build exists |
| `restart` | Restart the orchestrator server (smart: stop if running, then start) |
| `status` | Show the currently running orchestrator process; exits 1 when not running |
| `health` | Check whether the orchestrator HTTP server is responding |
| `logs` | Print the most recent orchestrator log lines |
| `stop` | Stop the detached orchestrator process after verifying it is the expected runtime |
| `migrate` | Run pending database migrations |
| `seed-admin` | Create an initial admin user from environment variables. Intended for non-interactive environments (Docker, CI). Reads `ADMIN_NAME` (optional, default: `"Admin"`), `ADMIN_EMAIL`, and `ADMIN_PASSWORD` from the process environment. Exits non-zero if credentials are missing or user creation fails. |
| `config show` | Display the current runtime configuration with secrets masked by default |
| `reset-password` | Reset a user's password and revoke all their active sessions |
| `rotate-secrets` | Generate new JWT secrets, update the runtime `.env`, and restart the server |

## Common flows

### First-time packaged runtime setup

```bash
agent-orchestrator setup
agent-orchestrator run
agent-orchestrator restart
agent-orchestrator status
```

`setup` initializes an empty packaged runtime database on first use and prompts you to apply pending migrations after package updates. `run` does not upgrade the database automatically.

### Non-interactive setup

```bash
agent-orchestrator setup \
  --yes \
  --db-type postgres \
  --database-url postgresql://orchestrator:orchestrator_password@localhost:5433/agent_orchestrator \
  --provider gemini \
  --gemini-key YOUR_KEY \
  --skip-admin-setup
```

Non-interactive setup with Ollama (local):

```bash
agent-orchestrator setup \
  --yes \
  --provider ollama \
  --ollama-host http://127.0.0.1:11434 \
  --skip-admin-setup
```

Non-interactive setup with Ollama (cloud):

```bash
agent-orchestrator setup \
  --yes \
  --provider ollama \
  --ollama-host https://your-ollama-cloud-host \
  --ollama-key YOUR_OLLAMA_API_KEY \
  --skip-admin-setup
```

### Logs, restart, and shutdown

```bash
agent-orchestrator logs --lines 100
agent-orchestrator restart
agent-orchestrator stop
```

### Health check

```bash
# Human-readable
agent-orchestrator health

# Machine-readable, with a custom timeout
agent-orchestrator health --format json --timeout 10000

# Scripting: exit code 0 = healthy, 1 = unhealthy
agent-orchestrator health && echo "Server is up"
```

### View configuration

```bash
# Show current config with secrets masked
agent-orchestrator config show

# Reveal secret values
agent-orchestrator config show --show-secrets

# JSON output
agent-orchestrator config show --format json
```

### Reset a user's password

```bash
# Interactive (recommended)
agent-orchestrator reset-password

# Non-interactive — use env var to avoid password in shell history
SETUP_ADMIN_PASSWORD=newpassword agent-orchestrator reset-password --email user@example.com --yes
```

Password reset also revokes all active refresh tokens for that user, forcing re-authentication on all devices.

### Rotate JWT secrets

```bash
# Interactive (prompts for confirmation)
agent-orchestrator rotate-secrets

# Non-interactive
agent-orchestrator rotate-secrets --yes
```

Rotating secrets generates new `JWT_SECRET` and `JWT_REFRESH_SECRET`, writes them to the runtime `.env`, and — if the server is running — stops it, restarts it, and waits up to 30 seconds for the health endpoint to confirm readiness. All active user sessions are invalidated immediately.

### Migrations

```bash
agent-orchestrator migrate --yes
agent-orchestrator migrate --force --yes
```

## Key options

### `setup`

Supported flags:

- `--host <host>`
- `--port <port>`
- `--db-type <sqlite|postgres>`
- `--database-url <url>`
- `--db-logging`
- `--provider <provider>` (repeatable or comma-separated; `gemini`, `anthropic`, `ollama`)
- `--gemini-key <key>`
- `--anthropic-key <key>`
- `--ollama-key <key>` (optional; leave empty for local Ollama usage)
- `--ollama-host <url>` (default: `http://127.0.0.1:11434`)
- `--admin-name <name>`
- `--admin-email <email>`
- `--admin-password <password>`
- `--skip-admin-setup`
- `--regenerate-jwt-secret`
- `-y, --yes`

### `run`

Start the orchestrator server in detached mode.

Supported flags:

- `--log-level <level>`: Set the log level (`fatal`, `error`, `warn`, `log`, `debug`, `verbose`). Defaults to `error` in production.

### `status`

Show the currently running process. Exits with code `1` when not running, making it suitable for scripting.

Supported flags:

- `--format <format>`: Output format (`text` or `json`). JSON output includes `running`, `pid`, `host`, `port`, `cwd`.

### `health`

Check whether the HTTP server is responding. Exits with code `0` when healthy, `1` otherwise. Wildcard bind addresses (`0.0.0.0`, `::`) are automatically normalized to `127.0.0.1` for the health request.

Supported flags:

- `--timeout <ms>`: Request timeout in milliseconds (default: `5000`)
- `--format <format>`: Output format (`text` or `json`)

### `logs`

```bash
agent-orchestrator logs --lines 100
```

Supported flags:

- `--lines <n>`: Number of lines to print (default: `50`)
- `--follow`: Stream new log entries; handles log rotation automatically

### `config show`

Display the current runtime configuration. Keys matching `*_SECRET`, `*_KEY`, or `DATABASE_URL` are masked by default.

Supported flags:

- `--show-secrets`: Reveal masked values
- `--format <format>`: Output format (`text` or `json`)

### `reset-password`

Reset a user's password and revoke all active refresh tokens for that user, forcing re-authentication on all devices.

Supported flags:

- `--email <email>`: User email address
- `--password <password>`: New password — prefer `SETUP_ADMIN_PASSWORD` env var to avoid exposure in shell history
- `-y, --yes`: Non-interactive mode (requires `--email` and `--password` or `SETUP_ADMIN_PASSWORD`)

Minimum password length: 8 characters.

### `rotate-secrets`

Generate new `JWT_SECRET` and `JWT_REFRESH_SECRET`, write them to the runtime `.env`, and restart the server if it is running. All active sessions are invalidated.

Supported flags:

- `-y, --yes`: Skip the confirmation prompt

### `migrate`

```bash
agent-orchestrator migrate --yes
agent-orchestrator migrate --force --yes
```

## Runtime files

Default runtime home is `${HOME}/.agent-orchestrator` unless `AGENT_ORCHESTRATOR_HOME` is set.

- Runtime directory: `${HOME}/.agent-orchestrator` by default, created with mode `0700`
- `.env`: `~/.agent-orchestrator/.env` by default, written with mode `0600`
- SQLite database: `~/.agent-orchestrator/local.sqlite` by default
- PID file: `~/.agent-orchestrator/pid` by default
- Process metadata: `~/.agent-orchestrator/process.json` by default
- Log file: `~/.agent-orchestrator/server.log` by default

## Notes

- `setup` accepts both `postgres://...` and `postgresql://...` URLs.
- `run` requires both `dist/main.js` and `dist/ui/index.html`.
- `stop` does not trust the PID file alone; it verifies the expected process shape, escalates from SIGTERM to SIGKILL if needed, and only removes runtime state once the process is confirmed dead.
- `status` exits with code `1` when not running, so it can be used in scripts: `agent-orchestrator status || agent-orchestrator run`.
- `health` normalizes wildcard bind addresses to `127.0.0.1` so it works correctly when the server binds to `0.0.0.0`.
- `reset-password` revokes all active refresh tokens for the user, immediately invalidating all existing sessions.
- `rotate-secrets` waits up to 30 seconds for the health endpoint to confirm the restarted server is ready before reporting success.
- `setup` is the preferred way to seed the initial admin user for packaged runtime installs.
- Passing API keys or passwords as CLI flags exposes them in process tables and shell history. Use `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `OLLAMA_API_KEY`, `DATABASE_URL`, or `SETUP_ADMIN_PASSWORD` environment variables instead.
- When running the dev server (`npm run dev`) alongside CLI commands, the CLI defaults to `~/.agent-orchestrator/local.sqlite` while the dev server uses `./local.sqlite`. Set `AGENT_ORCHESTRATOR_HOME=$(pwd)` to make CLI commands target the project root database.
