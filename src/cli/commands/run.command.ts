import * as fs from 'fs';
import { Command } from 'commander';
import { resolveActionOptions } from '../utils';
import type { RunCommandOptions } from '../types';
import {
  findManagedProcess,
  formatProcessSummary,
  isManagedProcess,
  removeRuntimeState,
  startServer,
} from '../process-manager';
import { LOG_FILE, MAIN_FILE, PACKAGE_ROOT } from '../constants';

const VALID_LOG_LEVELS = [
  'fatal',
  'error',
  'warn',
  'log',
  'debug',
  'verbose',
] as const;

const EARLY_CRASH_WAIT_MS = 3000;
const LOG_TAIL_LINES = 20;

function tailLogFile(logFile: string, lines: number): string {
  try {
    const content = fs.readFileSync(logFile, 'utf8');
    const allLines = content.split('\n');
    return allLines.slice(-lines).join('\n').trim();
  } catch {
    return '';
  }
}

export function registerRunCommand(program: Command): void {
  program
    .command('run')
    .description('Start the orchestrator server in detached mode')
    .option(
      '--log-level <level>',
      'Set the log level (fatal, error, warn, log, debug, verbose)',
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

        const existingProcess = findManagedProcess();
        if (existingProcess) {
          console.log(
            `Orchestrator is already running.\n${formatProcessSummary(existingProcess)}`,
          );
          return;
        }

        console.log('Starting Agent Orchestrator in background...');

        const { pid, host, port } = startServer({ logLevel: options.logLevel });

        // Wait briefly and verify the process survived startup
        await new Promise<void>((r) => setTimeout(r, EARLY_CRASH_WAIT_MS));

        const survived = isManagedProcess(pid, {
          cwd: PACKAGE_ROOT,
          mainPath: MAIN_FILE,
        });

        if (!survived) {
          removeRuntimeState();
          const tail = tailLogFile(LOG_FILE, LOG_TAIL_LINES);
          console.error(
            'Server process exited immediately after starting.' +
              (tail
                ? `\n\nLast log output:\n${tail}`
                : `\nCheck the log file for details: ${LOG_FILE}`),
          );
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
