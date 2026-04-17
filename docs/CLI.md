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

## Commands

| Command | Description |
| --- | --- |
| `setup` | Create or update the runtime `.env`, configure providers, optionally run migrations, and optionally create an admin user |
| `run` | Start the orchestrator server in detached mode after verifying the packaged build exists |
| `restart` | Restart the orchestrator server (smart: stop if running, then start) |
| `status` | Show the currently running orchestrator process |
| `logs` | Print the most recent orchestrator log lines |
| `stop` | Stop the detached orchestrator process after verifying it is the expected runtime |
| `migrate` | Run pending database migrations |

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

### `logs`

```bash
agent-orchestrator logs --lines 100
```

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
- `stop` does not trust the PID file alone; it verifies the expected process shape and can recover from stale runtime state.
- `setup` is the preferred way to seed the initial admin user for packaged runtime installs.
