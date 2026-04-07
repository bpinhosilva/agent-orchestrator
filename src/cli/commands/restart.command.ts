import { Command } from 'commander';
import { findManagedProcess } from '../process-manager';
import { registerRunCommand } from './run.command';
import { registerStopCommand } from './stop.command';

export function registerRestartCommand(program: Command): void {
  program
    .command('restart')
    .description(
      'Restart the orchestrator server (smart: stop if running, then start)',
    )
    .action(async () => {
      const running = findManagedProcess(); // TODO: pass default args if needed
      if (running) {
        // Stop if running
        await new Promise<void>((resolve) => {
          const stopProgram = new Command();
          registerStopCommand(stopProgram);
          stopProgram.exitOverride();
          stopProgram.parse(['node', 'cli', 'stop'], { from: 'user' });
          setTimeout(resolve, 2000); // Wait for stop
        });
      }
      // Start
      const runProgram = new Command();
      registerRunCommand(runProgram);
      runProgram.exitOverride();
      runProgram.parse(['node', 'cli', 'run'], { from: 'user' });
    });
}
