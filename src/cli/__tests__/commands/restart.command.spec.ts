import { Command } from 'commander';
import { registerRestartCommand } from '../../commands/restart.command';

jest.mock('../../process-manager', () => ({
  findManagedProcess: jest.fn(),
  formatProcessSummary: jest.fn(() => 'PID: 42\nPort: 15789'),
  removeRuntimeState: jest.fn(),
  startServer: jest.fn(() => ({ pid: 42, host: '127.0.0.1', port: '15789' })),
  stopManagedProcessById: jest.fn(),
}));

jest.mock('../../utils', () => ({
  ...jest.requireActual<typeof import('../../utils')>('../../utils'),
  verifyServerStartup: jest.fn(() => Promise.resolve(true)),
}));

import * as processManager from '../../process-manager';
import * as utils from '../../utils';

describe('restart command', () => {
  let program: Command;
  let consoleSpy: jest.SpyInstance;
  let consoleErrSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    program = new Command();
    program.exitOverride();
    registerRestartCommand(program);
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

  it('starts fresh when no process is running', async () => {
    (processManager.findManagedProcess as jest.Mock).mockReturnValue(null);

    await program.parseAsync(['node', 'cli', 'restart']);

    expect(processManager.stopManagedProcessById).not.toHaveBeenCalled();
    expect(processManager.startServer).toHaveBeenCalled();
    expect(utils.verifyServerStartup).toHaveBeenCalledWith(42);
    const allOutput = consoleSpy.mock.calls
      .map((c: string[]) => c[0])
      .join('\n');
    expect(allOutput).toContain('started in background');
  });

  it('stops existing process before restarting', async () => {
    (processManager.findManagedProcess as jest.Mock).mockReturnValue({
      pid: 5,
      source: 'metadata',
      cwd: '/app',
      mainPath: '/app/main.js',
    });
    (processManager.stopManagedProcessById as jest.Mock).mockResolvedValue(
      true,
    );

    await program.parseAsync(['node', 'cli', 'restart']);

    expect(processManager.stopManagedProcessById).toHaveBeenCalledWith(
      5,
      '/app',
      '/app/main.js',
    );
    expect(processManager.removeRuntimeState).toHaveBeenCalled();
    expect(processManager.startServer).toHaveBeenCalled();
  });

  it('exits 1 if stop fails', async () => {
    (processManager.findManagedProcess as jest.Mock).mockReturnValue({
      pid: 5,
      source: 'metadata',
      cwd: '/app',
      mainPath: '/app/main.js',
    });
    (processManager.stopManagedProcessById as jest.Mock).mockResolvedValue(
      false,
    );

    await program.parseAsync(['node', 'cli', 'restart']);

    expect(consoleErrSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to stop'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(processManager.startServer).not.toHaveBeenCalled();
  });

  it('exits 1 if server crashes immediately after restart', async () => {
    (processManager.findManagedProcess as jest.Mock).mockReturnValue(null);
    (utils.verifyServerStartup as jest.Mock).mockResolvedValue(false);

    await program.parseAsync(['node', 'cli', 'restart']);

    expect(utils.verifyServerStartup).toHaveBeenCalledWith(42);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits 1 when startServer throws', async () => {
    (processManager.findManagedProcess as jest.Mock).mockReturnValue(null);
    (processManager.startServer as jest.Mock).mockImplementation(() => {
      throw new Error('spawn failed');
    });

    await program.parseAsync(['node', 'cli', 'restart']);

    expect(consoleErrSpy).toHaveBeenCalledWith(
      expect.stringContaining('spawn failed'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
