import { Command } from 'commander';
import { verifyServerStartup } from '../utils';
import {
  findManagedProcess,
  formatProcessSummary,
  removeRuntimeState,
  startServer,
  stopManagedProcessById,
} from '../process-manager';
import { MAIN_FILE, PACKAGE_ROOT } from '../constants';

export function registerRestartCommand(program: Command): void {
  program
    .command('restart')
    .description(
      'Restart the orchestrator server (smart: stop if running, then start)',
    )
    .action(async () => {
      try {
        const running = findManagedProcess();
        if (running) {
          console.log(`Stopping Orchestrator (PID: ${running.pid})...`);
          const died = await stopManagedProcessById(
            running.pid,
            running.cwd,
            running.mainPath,
          );
          if (!died) {
            console.error(
              'Failed to stop orchestrator. Aborting restart to avoid duplicate instances.',
            );
            process.exit(1);
            return;
          }
          removeRuntimeState();
          console.log('Orchestrator stopped.');
        }

        console.log('Starting Agent Orchestrator in background...');
        const { pid, host, port } = startServer();

        const survived = await verifyServerStartup(pid);
        if (!survived) {
          process.exit(1);
          return;
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
        console.error(`Failed to restart orchestrator: ${errorMessage}`);
        process.exit(1);
      }
    });
}
