# CLI

The package exposes the `agent-orchestrator` CLI (`dist/cli/index.js`) built with Commander and Enquirer.

## Build

```bash
npm run cli:build
```

## Commands

| Command | Description |
| --- | --- |
| `setup` | Interactive config (`PORT`, DB mode, provider keys), writes `${AGENT_ORCHESTRATOR_HOME}/.env`, checks/runs migrations, and guides admin user creation |
| `run` | Starts backend in detached mode and writes PID/log files |
| `stop` | Stops the detached process using PID file |
| `migrate` | Runs pending migrations; supports destructive `--force` path |

## Runtime files

Default home is `${HOME}/.agent-orchestrator` (or `AGENT_ORCHESTRATOR_HOME` if set):

- `~/.agent-orchestrator/.env`
- `~/.agent-orchestrator/pid`
- `~/.agent-orchestrator/server.log`

## Typical flow

```bash
npm run build
npm run cli:build
agent-orchestrator setup
agent-orchestrator run
agent-orchestrator stop
```

## Notes

- `run` points to `dist/main.js`, so backend build must exist first.
- `setup` can initialize an empty database and run admin setup.
- `migrate --force` drops existing data after explicit confirmation.
