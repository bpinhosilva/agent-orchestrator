import { Command } from 'commander';
import { registerSetupCommand } from './setup.command';
import { registerRunCommand } from './run.command';
import { registerStopCommand } from './stop.command';
import { registerStatusCommand } from './status.command';
import { registerLogsCommand } from './logs.command';
import { registerMigrateCommand } from './migrate.command';
import { registerRestartCommand } from './restart.command';

export function registerAllCommands(program: Command): void {
  registerSetupCommand(program);
  registerRunCommand(program);
  registerStopCommand(program);
  registerRestartCommand(program);
  registerStatusCommand(program);
  registerLogsCommand(program);
  registerMigrateCommand(program);
}
