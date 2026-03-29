# Agent Orchestrator: CLI Reference

The CLI provides a command-line interface to interact with the orchestrator directly from the terminal. It is built using [Commander.js](https://github.com/tj/commander.js).

## 1. Configuration in `package.json`
- **`name`**: `@bpinhosilva/agent-orchestrator` (The scoped package name).
- **`bin`**: Maps the command name to the entry point.
  ```json
  "bin": {
    "agent-orchestrator": "dist/cli/index.js"
  }
  ```
- **`cli:build` script**:
  ```bash
  tsc src/cli/index.ts --outDir dist --rootDir src --esModuleInterop --skipLibCheck --target es2020 --moduleResolution node --module commonjs --experimentalDecorators --emitDecoratorMetadata && chmod +x dist/cli/index.js
  ```
  *   **What it does**: Compiles the TypeScript CLI file specifically ensuring NestJS decorators are supported and makes the resulting JavaScript file executable (`chmod +x`). Using `--rootDir src` ensures the file is output to `dist/cli/index.js`, matching the project's structure.

## 2. Code Structure (`src/cli/index.ts`)
The CLI acts as a "shell" that bootstraps the NestJS `AppModule` and provides utility commands for configuration and execution:

1.  **`setup`**: An interactive configuration wizard using `enquirer`.
    *   **Port Selection**: Choose the port for the orchestrator (default: 15789).
    *   **Database Configuration**: Select between `sqlite` or `postgres`. If `postgres` is selected, it prompts for a `DATABASE_URL`.
    *   **Provider Configuration**: A multi-select prompt to configure API keys for available AI providers (`gemini`, `anthropic`).
    *   **Security (JWT)**: Automatically generates a secure 32-byte `JWT_SECRET` using `crypto`. If a secret already exists in the `.env` file, it prompts the user before overwriting.
    *   **Environment Persistence**: Automatically creates or updates the `.env` file with the gathered configuration.

2.  **`run`**: Starts the orchestrator server as a **detached background process**.
    *   Checks for an existing PID to prevent multiple instances.
    *   Spawns a new process pointing to the compiled `main.js` in the `dist` directory.
    *   Stores the PID in `~/.agent-orchestrator/pid`.
    *   Redirects all output to `~/.agent-orchestrator/server.log`.

3.  **`stop`**: Safely stops the background orchestrator server.
    *   Reads the PID from the PID file.
    *   Sends a `SIGTERM` signal to the process.
    *   Removes the PID file upon successful termination.

## 3. Command Reference & Examples

| Command | Description | Example |
| :--- | :--- | :--- |
| `setup` | Interactive configuration wizard. | `node dist/cli/index.js setup` |
| `run` | Starts the orchestrator server in background. | `node dist/cli/index.js run` |
| `stop` | Stops the background orchestrator server. | `node dist/cli/index.js stop` |
| `--help` | Display help information. | `node dist/cli/index.js --help` |
| `--version` | Display version number. | `node dist/cli/index.js --version` |

### Detailed Examples:

**Initial Setup:**
```bash
# Build the CLI first
npm run cli:build

# Run the interactive setup
node dist/cli/index.js setup
```
*Follow the on-screen prompts to configure your port, database, and AI provider keys. The command will securely generate your `JWT_SECRET` and save everything to a `.env` file.*

**Managing the Orchestrator Server:**
```bash
# Ensure the project is built
npm run build
npm run cli:build

# Start the server in background
node dist/cli/index.js run

# Check the logs
tail -f ~/.agent-orchestrator/server.log

# Stop the server
node dist/cli/index.js stop
```

## 4. Testing Commands
| Action | Command | Purpose |
| :--- | :--- | :--- |
| **Local Build** | `npm run build` | Compiles the entire backend (API + CLI) into `dist/`. |
| **Local Help** | `node dist/cli/index.js --help` | Verifies the CLI commands are mapped correctly. |
| **Local Setup** | `node dist/cli/index.js setup` | Runs the configuration wizard locally. |
| **Local Run** | `node dist/cli/index.js run` | Starts the server in background. |
| **Local Stop** | `node dist/cli/index.js stop` | Stops the background server. |
| **Global Install** | `npm install -g .` | Installs the current local folder as a global command. |

## 5. Troubleshooting & Maintenance

### "Command not found" after install
If `npm install -g` succeeds but `agent-orchestrator` isn't found in the terminal:
1.  Run `npm config get prefix`.
2.  Ensure that `[prefix]/bin` is explicitly included in the system's `$PATH`.

### Resetting the local environment
If the local `dist` folder requires a clean reset during development or testing:
```bash
rm -rf dist
npm run build
npm run cli:build
```
