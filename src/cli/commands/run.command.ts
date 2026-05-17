import { Command } from 'commander';
import { resolveActionOptions, verifyServerStartup } from '../utils';
import type { RunCommandOptions } from '../types';
import { parsePositiveInt } from '../setup/validators';
import {
  findManagedProcess,
  formatProcessSummary,
  startServer,
} from '../process-manager';
import { checkPendingMigrations } from '../../database/migration-state';
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
    .option(
      '--log-max-size-mb <mb>',
      'One-off override: max log file size in MB before rotation',
      (v: string) => parsePositiveInt(v) ?? Number.NaN,
    )
    .option(
      '--log-max-files <count>',
      'One-off override: max number of rotated log files to keep',
      (v: string) => parsePositiveInt(v) ?? Number.NaN,
    )
    .action(async (...args: unknown[]) => {
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

        if (options.logMaxSizeMb !== undefined) {
          if (
            !Number.isInteger(options.logMaxSizeMb) ||
            options.logMaxSizeMb <= 0
          ) {
            throw new Error(
              `Invalid --log-max-size-mb "${options.logMaxSizeMb}". Must be a positive integer.`,
            );
          }
        }

        if (options.logMaxFiles !== undefined) {
          if (
            !Number.isInteger(options.logMaxFiles) ||
            options.logMaxFiles <= 0
          ) {
            throw new Error(
              `Invalid --log-max-files "${options.logMaxFiles}". Must be a positive integer.`,
            );
          }
        }

        // Check for pending migrations before starting
        const { hasPending } = await checkPendingMigrations({
          assumePendingOnError: true,
        });

        if (hasPending) {
          console.error(
            'Pending database migrations detected.\n' +
              'Run the following command before starting the server:\n\n' +
              '  agent-orchestrator migrate --yes\n\n' +
              'Then run:\n\n' +
              '  agent-orchestrator run',
          );
          process.exit(1);
        }

        const existingProcess = findManagedProcess();
        if (existingProcess) {
          console.log(
            `Orchestrator is already running.\n${formatProcessSummary(existingProcess)}`,
          );
          return;
        }

        console.log('Starting Agent Orchestrator in background...');

        const { pid, host, port } = startServer({
          logLevel: options.logLevel,
          logMaxSizeMb: options.logMaxSizeMb,
          logMaxFiles: options.logMaxFiles,
        });

        const survived = await verifyServerStartup(pid);
        if (!survived) {
          process.exit(1);
        }

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
