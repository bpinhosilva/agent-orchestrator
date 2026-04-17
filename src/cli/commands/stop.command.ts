import { Command } from 'commander';
import {
  findManagedProcess,
  removeRuntimeState,
  stopManagedProcessById,
} from '../process-manager';

export function registerStopCommand(program: Command): void {
  program
    .command('stop')
    .description(
      'Stop the orchestrator server after verifying the running process identity',
    )
    .action(async () => {
      try {
        const runningProcess = findManagedProcess();
        if (!runningProcess) {
          console.log('Orchestrator is not running.');
          return;
        }

        console.log(
          `Stopping Orchestrator (PID: ${runningProcess.pid}) in ${runningProcess.cwd}...`,
        );

        const died = await stopManagedProcessById(
          runningProcess.pid,
          runningProcess.cwd,
          runningProcess.mainPath,
        );

        if (died) {
          removeRuntimeState();
          console.log('Orchestrator stopped successfully.');
        } else {
          console.error(
            'Failed to stop orchestrator: process did not exit after SIGKILL. Runtime state preserved.',
          );
          process.exit(1);
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`Failed to stop orchestrator: ${errorMessage}`);
        process.exit(1);
      }
    });
}
