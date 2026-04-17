import { Command } from 'commander';
import { resolveActionOptions } from '../utils';
import type { RunCommandOptions } from '../types';
import {
  findManagedProcess,
  formatProcessSummary,
  startServer,
} from '../process-manager';
import { MAIN_FILE, PACKAGE_ROOT } from '../constants';

const VALID_LOG_LEVELS = [
  'fatal',
  'error',
  'warn',
  'log',
  'debug',
  'verbose',
] as const;

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

        if (options.logLevel) {
          if (
            !(VALID_LOG_LEVELS as readonly string[]).includes(options.logLevel)
          ) {
            throw new Error(
              `Invalid log level "${options.logLevel}". Valid values: ${VALID_LOG_LEVELS.join(', ')}`,
            );
          }
        }

        const existingProcess = findManagedProcess();
        if (existingProcess) {
          console.log(
            `Orchestrator is already running.\n${formatProcessSummary(existingProcess)}`,
          );
          return;
        }

        console.log('Starting Agent Orchestrator in background...');

        const { pid, host, port } = startServer({ logLevel: options.logLevel });

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
