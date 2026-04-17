import { Command } from 'commander';
import { findManagedProcess, formatProcessSummary } from '../process-manager';
import { resolveActionOptions } from '../utils';
import type { StatusCommandOptions } from '../types';

export function registerStatusCommand(program: Command): void {
  program
    .command('status')
    .description('Show the currently running orchestrator process, if any')
    .option('--format <format>', 'Output format: text or json', 'text')
    .action((...args: unknown[]) => {
      try {
        const opts = resolveActionOptions<StatusCommandOptions>(args);
        const runningProcess = findManagedProcess();

        if (opts.format === 'json') {
          if (!runningProcess) {
            console.log(JSON.stringify({ running: false }));
          } else {
            console.log(
              JSON.stringify({
                running: true,
                pid: runningProcess.pid,
                source: runningProcess.source,
                host: runningProcess.host,
                port: runningProcess.port,
                cwd: runningProcess.cwd,
                mainPath: runningProcess.mainPath,
              }),
            );
          }
          if (!runningProcess) process.exit(1);
          return;
        }

        if (!runningProcess) {
          console.log('Orchestrator is not running.');
          process.exit(1);
          return;
        }

        console.log(
          `Orchestrator is running.\n${formatProcessSummary(runningProcess)}`,
        );
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`Failed to inspect orchestrator status: ${errorMessage}`);
      }
    });
}
