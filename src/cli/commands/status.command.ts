import { Command } from 'commander';
import { findManagedProcess, formatProcessSummary } from '../process-manager';

export function registerStatusCommand(program: Command): void {
  program
    .command('status')
    .description('Show the currently running orchestrator process, if any')
    .action(() => {
      try {
        const runningProcess = findManagedProcess();
        if (!runningProcess) {
          console.log('Orchestrator is not running.');
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
