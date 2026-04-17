import { Command } from 'commander';
import { registerSetupCommand } from './setup.command';
import { registerRunCommand } from './run.command';
import { registerStopCommand } from './stop.command';
import { registerStatusCommand } from './status.command';
import { registerLogsCommand } from './logs.command';
import { registerMigrateCommand } from './migrate.command';
import { registerRestartCommand } from './restart.command';
import { registerHealthCommand } from './health.command';
import { registerConfigCommand } from './config.command';
import { registerResetPasswordCommand } from './reset-password.command';
import { registerRotateSecretsCommand } from './rotate-secrets.command';
import { registerSeedAdminCommand } from './seed-admin.command';

export function registerAllCommands(program: Command): void {
  registerSetupCommand(program);
  registerRunCommand(program);
  registerStopCommand(program);
  registerRestartCommand(program);
  registerStatusCommand(program);
  registerLogsCommand(program);
  registerMigrateCommand(program);
  registerHealthCommand(program);
  registerConfigCommand(program);
  registerResetPasswordCommand(program);
  registerRotateSecretsCommand(program);
  registerSeedAdminCommand(program);
}
