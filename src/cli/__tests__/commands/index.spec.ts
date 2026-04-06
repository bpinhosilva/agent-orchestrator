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

import { registerSetupCommand } from '../../commands/setup.command';
import { registerRunCommand } from '../../commands/run.command';
import { registerStopCommand } from '../../commands/stop.command';
import { registerStatusCommand } from '../../commands/status.command';
import { registerLogsCommand } from '../../commands/logs.command';
import { registerMigrateCommand } from '../../commands/migrate.command';

describe('registerAllCommands', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers all 6 commands on the program', () => {
    const program = new Command();
    registerAllCommands(program);

    expect(registerSetupCommand).toHaveBeenCalledWith(program);
    expect(registerRunCommand).toHaveBeenCalledWith(program);
    expect(registerStopCommand).toHaveBeenCalledWith(program);
    expect(registerStatusCommand).toHaveBeenCalledWith(program);
    expect(registerLogsCommand).toHaveBeenCalledWith(program);
    expect(registerMigrateCommand).toHaveBeenCalledWith(program);
  });

  it('calls each register function exactly once', () => {
    const program = new Command();
    registerAllCommands(program);

    [
      registerSetupCommand,
      registerRunCommand,
      registerStopCommand,
      registerStatusCommand,
      registerLogsCommand,
      registerMigrateCommand,
    ].forEach((fn) => {
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});
