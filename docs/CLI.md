# CLI

The package exposes the `agent-orchestrator` binary (`dist/cli/index.js`) built with Commander and Enquirer.

## Installation paths

### From a published package

```bash
npm install -g @bpinhosilva/agent-orchestrator
agent-orchestrator --help
```

### From a source checkout

```bash
npm install
npm rebuild
npm run build:all
agent-orchestrator --help
```

`prepack` now builds the runtime assets, and the npm package includes the UI bundle required by `agent-orchestrator run`.

## Commands

| Command | Description |
| --- | --- |
| `setup` | Create/update `${AGENT_ORCHESTRATOR_HOME}/.env`, optionally non-interactively, run migrations, and optionally create an admin user |
| `run` | Start the full application in detached mode after verifying the packaged build exists |
| `status` | Show the currently running orchestrator process |
| `logs` | Print recent log lines from the detached runtime |
| `stop` | Stop the detached process after verifying the exact entrypoint and working directory |
| `migrate` | Run pending migrations; supports `--force` and `--yes` |

## Key options

### `setup`

```bash
agent-orchestrator setup \
  --yes \
  --db-type postgres \
  --database-url postgresql://user:password@localhost:5432/dbname \
  --provider gemini \
  --gemini-key YOUR_KEY \
  --skip-admin-setup
```

Supported flags:

- `--port <port>`
- `--db-type <sqlite|postgres>`
- `--database-url <url>`
- `--db-logging`
- `--provider <provider>` (repeatable or comma-separated; `gemini`, `anthropic`)
- `--gemini-key <key>`
- `--anthropic-key <key>`
- `--admin-name <name>`
- `--admin-email <email>`
- `--admin-password <password>`
- `--skip-admin-setup`
- `--regenerate-jwt-secret`
- `-y, --yes`

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

Default home is `${HOME}/.agent-orchestrator` (or `AGENT_ORCHESTRATOR_HOME` if set):

- `~/.agent-orchestrator/.env` (written with mode `0600`)
- `~/.agent-orchestrator/pid`
- `~/.agent-orchestrator/process.json`
- `~/.agent-orchestrator/server.log`

## Typical flow

```bash
agent-orchestrator setup
agent-orchestrator run
agent-orchestrator status
agent-orchestrator logs --lines 50
agent-orchestrator stop
```

## Notes

- `setup` accepts both `postgres://...` and `postgresql://...` URLs.
- `run` requires both `dist/main.js` and `dist/ui/index.html`.
- `stop` does not trust the PID file alone; it verifies the exact `dist/main.js` process running from the package directory and can recover from stale PID files by scanning the live process table.
