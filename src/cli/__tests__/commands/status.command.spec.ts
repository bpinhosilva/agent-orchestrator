import { Command } from 'commander';
import { registerStatusCommand } from '../../commands/status.command';

jest.mock('../../process-manager', () => ({
  findManagedProcess: jest.fn(),
  formatProcessSummary: jest.fn(() => 'PID: 42\nPort: 15789'),
}));

import * as processManager from '../../process-manager';

describe('status command', () => {
  let program: Command;
  let consoleSpy: jest.SpyInstance;
  let consoleErrSpy: jest.SpyInstance;

  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    program = new Command();
    program.exitOverride();
    registerStatusCommand(program);
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    exitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('prints not-running message when no managed process exists', async () => {
    (processManager.findManagedProcess as jest.Mock).mockReturnValue(null);

    await program.parseAsync(['node', 'cli', 'status']);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('not running'),
    );
    expect(processManager.formatProcessSummary).not.toHaveBeenCalled();
  });

  it('prints running message with process summary when a process is found', async () => {
    const mockProcess = {
      pid: 42,
      source: 'metadata' as const,
      cwd: '/app',
      mainPath: '/app/dist/main.js',
      port: '15789',
    };
    (processManager.findManagedProcess as jest.Mock).mockReturnValue(
      mockProcess,
    );

    await program.parseAsync(['node', 'cli', 'status']);

    expect(processManager.formatProcessSummary).toHaveBeenCalledWith(
      mockProcess,
    );
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('PID: 42'));
  });
});
