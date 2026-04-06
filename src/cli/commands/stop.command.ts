import { Command } from 'commander';
import { findManagedProcess, removeRuntimeState } from '../process-manager';

export function registerStopCommand(program: Command): void {
  program
    .command('stop')
    .description(
      'Stop the orchestrator server after verifying the running process identity',
    )
    .action(() => {
      try {
        const runningProcess = findManagedProcess();
        if (!runningProcess) {
          console.log('Orchestrator is not running.');
          return;
        }

        console.log(
          `Stopping Orchestrator after verifying the exact process in ${runningProcess.cwd} (PID: ${runningProcess.pid})...`,
        );
        process.kill(runningProcess.pid, 'SIGTERM');
        removeRuntimeState();
        console.log('Orchestrator stop signal sent.');
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`Failed to stop orchestrator: ${errorMessage}`);
        process.exit(1);
      }
    });
}
