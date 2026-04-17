import { Command } from 'commander';
import * as fs from 'fs';
import { spawn } from 'child_process';
import { resolveActionOptions } from '../utils';
import type { RunCommandOptions } from '../types';
import {
  assertBuildExists,
  findManagedProcess,
  getChildEnvironment,
  persistProcessMetadata,
  formatProcessSummary,
  getConfiguredHost,
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
    .option(
      '--log-level <level>',
      'Set the log level (fatal, error, warn, log, debug, verbose)',
    )
    .action((...args: unknown[]) => {
      try {
        const options = resolveActionOptions<RunCommandOptions>(args);
        assertBuildExists();
        const existingProcess = findManagedProcess(); // TODO: pass default args if needed
        if (existingProcess) {
          console.log(
            `Orchestrator is already running.\n${formatProcessSummary(existingProcess)}`,
          );
          return;
        }

        if (options.logLevel) {
          process.env.LOG_LEVEL = options.logLevel;
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
        const host = getConfiguredHost(ENV_PATH);
        persistProcessMetadata({
          pid,
          cwd: PACKAGE_ROOT,
          mainPath: MAIN_FILE,
          host,
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
            host,
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
