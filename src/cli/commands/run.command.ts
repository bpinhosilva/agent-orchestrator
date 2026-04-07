import { Command } from 'commander';
import * as fs from 'fs';
import { spawn } from 'child_process';
import {
  assertBuildExists,
  findManagedProcess,
  getChildEnvironment,
  persistProcessMetadata,
  formatProcessSummary,
} from '../process-manager';
import { readEnvFile } from '../env';
import {
  LOG_FILE,
  MAIN_FILE,
  PACKAGE_ROOT,
  PID_DIR,
  ENV_PATH,
} from '../constants';

function getConfiguredPort(): string {
  const env = readEnvFile(ENV_PATH);
  return env.PORT || '15789';
}

export function registerRunCommand(program: Command): void {
  program
    .command('run')
    .description('Start the orchestrator server in detached mode')
    .action(() => {
      try {
        assertBuildExists();
        const existingProcess = findManagedProcess(); // TODO: pass default args if needed
        if (existingProcess) {
          console.log(
            `Orchestrator is already running.\n${formatProcessSummary(existingProcess)}`,
          );
          return;
        }

        console.log('Starting Agent Orchestrator in background...');

        if (!fs.existsSync(PID_DIR)) {
          fs.mkdirSync(PID_DIR, { recursive: true, mode: 0o700 });
        }

        const logStream = fs.openSync(LOG_FILE, 'a');
        const child = spawn('node', [MAIN_FILE], {
          detached: true,
          stdio: ['ignore', logStream, logStream],
          cwd: PACKAGE_ROOT,
          env: getChildEnvironment(),
        });

        const pid = child.pid;
        if (!pid) {
          throw new Error('Failed to determine spawned process PID.');
        }

        const port = getConfiguredPort();
        persistProcessMetadata({
          pid,
          cwd: PACKAGE_ROOT,
          mainPath: MAIN_FILE,
          port,
          logFile: LOG_FILE,
          startedAt: new Date().toISOString(),
        });

        child.unref();

        console.log(
          `Orchestrator started in background.\n${formatProcessSummary({
            pid,
            source: 'metadata',
            cwd: PACKAGE_ROOT,
            mainPath: MAIN_FILE,
            port,
          })}`,
        );
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`Failed to start orchestrator: ${errorMessage}`);
        process.exit(1);
      }
    });
}
