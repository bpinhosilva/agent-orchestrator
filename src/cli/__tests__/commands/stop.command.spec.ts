import { Command } from 'commander';
import { registerStopCommand } from '../../commands/stop.command';

jest.mock('../../process-manager', () => ({
  findManagedProcess: jest.fn(),
  removeRuntimeState: jest.fn(),
  stopManagedProcessById: jest.fn(),
}));

import * as processManager from '../../process-manager';

describe('stop command', () => {
  let program: Command;
  let consoleSpy: jest.SpyInstance;
  let consoleErrSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    program = new Command();
    program.exitOverride();
    registerStopCommand(program);
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

  it('prints not-running message and skips kill when no managed process', async () => {
    (processManager.findManagedProcess as jest.Mock).mockReturnValue(null);

    await program.parseAsync(['node', 'cli', 'stop']);

    expect(processManager.stopManagedProcessById).not.toHaveBeenCalled();
    expect(processManager.removeRuntimeState).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('not running'),
    );
  });

  it('calls stopManagedProcessById and removes runtime state when process is found', async () => {
    const mockProcess = {
      pid: 123,
      source: 'metadata' as const,
      cwd: '/app',
      mainPath: '/app/dist/main.js',
      port: '15789',
    };
    (processManager.findManagedProcess as jest.Mock).mockReturnValue(
      mockProcess,
    );
    (processManager.stopManagedProcessById as jest.Mock).mockResolvedValue(
      true,
    );

    await program.parseAsync(['node', 'cli', 'stop']);

    expect(processManager.stopManagedProcessById).toHaveBeenCalledWith(
      123,
      '/app',
      '/app/dist/main.js',
    );
    expect(processManager.removeRuntimeState).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('stopped successfully'),
    );
  });

  it('logs error and exits with 1 when process does not die', async () => {
    (processManager.findManagedProcess as jest.Mock).mockReturnValue({
      pid: 123,
      source: 'metadata' as const,
      cwd: '/app',
      mainPath: '/app/dist/main.js',
      port: '15789',
    });
    (processManager.stopManagedProcessById as jest.Mock).mockResolvedValue(
      false,
    );

    await program.parseAsync(['node', 'cli', 'stop']);

    expect(consoleErrSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to stop'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(processManager.removeRuntimeState).not.toHaveBeenCalled();
  });

  it('logs error and calls process.exit(1) when stopManagedProcessById throws', async () => {
    (processManager.findManagedProcess as jest.Mock).mockReturnValue({
      pid: 123,
      source: 'metadata' as const,
      cwd: '/app',
      mainPath: '/app/dist/main.js',
      port: '15789',
    });
    (processManager.stopManagedProcessById as jest.Mock).mockRejectedValue(
      new Error('ESRCH'),
    );

    await program.parseAsync(['node', 'cli', 'stop']);

    expect(consoleErrSpy).toHaveBeenCalledWith(
      expect.stringContaining('ESRCH'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(processManager.removeRuntimeState).not.toHaveBeenCalled();
  });
});
