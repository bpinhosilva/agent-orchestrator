import { Command } from 'commander';
import { registerAllCommands } from '../../commands/index';

jest.mock('../../commands/setup.command', () => ({
  registerSetupCommand: jest.fn(),
}));
jest.mock('../../commands/run.command', () => ({
  registerRunCommand: jest.fn(),
}));
jest.mock('../../commands/stop.command', () => ({
  registerStopCommand: jest.fn(),
}));
jest.mock('../../commands/status.command', () => ({
  registerStatusCommand: jest.fn(),
}));
jest.mock('../../commands/logs.command', () => ({
  registerLogsCommand: jest.fn(),
}));
jest.mock('../../commands/migrate.command', () => ({
  registerMigrateCommand: jest.fn(),
}));
jest.mock('../../commands/restart.command', () => ({
  registerRestartCommand: jest.fn(),
}));
jest.mock('../../commands/health.command', () => ({
  registerHealthCommand: jest.fn(),
}));
jest.mock('../../commands/config.command', () => ({
  registerConfigCommand: jest.fn(),
}));
jest.mock('../../commands/reset-password.command', () => ({
  registerResetPasswordCommand: jest.fn(),
}));
jest.mock('../../commands/rotate-secrets.command', () => ({
  registerRotateSecretsCommand: jest.fn(),
}));

import { registerSetupCommand } from '../../commands/setup.command';
import { registerRunCommand } from '../../commands/run.command';
import { registerStopCommand } from '../../commands/stop.command';
import { registerStatusCommand } from '../../commands/status.command';
import { registerLogsCommand } from '../../commands/logs.command';
import { registerMigrateCommand } from '../../commands/migrate.command';
import { registerRestartCommand } from '../../commands/restart.command';
import { registerHealthCommand } from '../../commands/health.command';
import { registerConfigCommand } from '../../commands/config.command';
import { registerResetPasswordCommand } from '../../commands/reset-password.command';
import { registerRotateSecretsCommand } from '../../commands/rotate-secrets.command';

const ALL_REGISTER_FNS = [
  registerSetupCommand,
  registerRunCommand,
  registerStopCommand,
  registerRestartCommand,
  registerStatusCommand,
  registerLogsCommand,
  registerMigrateCommand,
  registerHealthCommand,
  registerConfigCommand,
  registerResetPasswordCommand,
  registerRotateSecretsCommand,
];

describe('registerAllCommands', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers all 11 commands on the program', () => {
    const program = new Command();
    registerAllCommands(program);

    ALL_REGISTER_FNS.forEach((fn) => {
      expect(fn).toHaveBeenCalledWith(program);
    });
  });

  it('calls each register function exactly once', () => {
    const program = new Command();
    registerAllCommands(program);

    ALL_REGISTER_FNS.forEach((fn) => {
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});
