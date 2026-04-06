import { Command } from 'commander';
import { registerStopCommand } from '../../commands/stop.command';

jest.mock('../../process-manager', () => ({
  findManagedProcess: jest.fn(),
  removeRuntimeState: jest.fn(),
}));

import * as processManager from '../../process-manager';

describe('stop command', () => {
  let program: Command;
  let consoleSpy: jest.SpyInstance;
  let consoleErrSpy: jest.SpyInstance;
  let killSpy: jest.SpyInstance;

  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    program = new Command();
    program.exitOverride();
    registerStopCommand(program);
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    killSpy = jest.spyOn(process, 'kill').mockImplementation(() => true);
    exitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrSpy.mockRestore();
    killSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('prints not-running message and skips kill when no managed process', async () => {
    (processManager.findManagedProcess as jest.Mock).mockReturnValue(null);

    await program.parseAsync(['node', 'cli', 'stop']);

    expect(killSpy).not.toHaveBeenCalled();
    expect(processManager.removeRuntimeState).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('not running'),
    );
  });

  it('sends SIGTERM and removes runtime state when process is found', async () => {
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

    await program.parseAsync(['node', 'cli', 'stop']);

    expect(killSpy).toHaveBeenCalledWith(123, 'SIGTERM');
    expect(processManager.removeRuntimeState).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('stop signal sent'),
    );
  });

  it('logs error and calls process.exit(1) when process.kill throws', async () => {
    (processManager.findManagedProcess as jest.Mock).mockReturnValue({
      pid: 123,
      source: 'metadata' as const,
      cwd: '/app',
      mainPath: '/app/dist/main.js',
      port: '15789',
    });
    killSpy.mockImplementation(() => {
      throw new Error('ESRCH');
    });

    await program.parseAsync(['node', 'cli', 'stop']);

    expect(consoleErrSpy).toHaveBeenCalledWith(
      expect.stringContaining('ESRCH'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(processManager.removeRuntimeState).not.toHaveBeenCalled();
  });
});
