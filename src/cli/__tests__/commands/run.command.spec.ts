import { Command } from 'commander';
import { registerRunCommand } from '../../commands/run.command';

jest.mock('../../process-manager', () => ({
  assertBuildExists: jest.fn(),
  findManagedProcess: jest.fn(),
  getChildEnvironment: jest.fn(() => ({})),
  persistProcessMetadata: jest.fn(),
  formatProcessSummary: jest.fn(() => 'PID: 123\nPort: 15789'),
}));

jest.mock('../../env', () => ({
  readEnvFile: jest.fn(() => ({ PORT: '15789' })),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  openSync: jest.fn(() => 1),
}));

jest.mock('child_process', () => ({
  spawn: jest.fn(() => ({
    pid: 42,
    unref: jest.fn(),
  })),
}));

import * as processManager from '../../process-manager';
import { spawn } from 'child_process';

describe('run command', () => {
  let program: Command;
  let consoleSpy: jest.SpyInstance;
  let consoleErrSpy: jest.SpyInstance;

  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    program = new Command();
    program.exitOverride();
    registerRunCommand(program);
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

  it('prints already-running message and returns without spawning when process exists', async () => {
    (processManager.findManagedProcess as jest.Mock).mockReturnValue({
      pid: 99,
      source: 'metadata',
      cwd: '/app',
      mainPath: '/app/dist/main.js',
      port: '15789',
    });

    await program.parseAsync(['node', 'cli', 'run']);

    expect(spawn).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('already running'),
    );
  });

  it('logs error and calls process.exit(1) when assertBuildExists throws', async () => {
    (processManager.assertBuildExists as jest.Mock).mockImplementation(() => {
      throw new Error('Build not found');
    });
    (processManager.findManagedProcess as jest.Mock).mockReturnValue(null);

    await program.parseAsync(['node', 'cli', 'run']);

    expect(spawn).not.toHaveBeenCalled();
    expect(consoleErrSpy).toHaveBeenCalledWith(
      expect.stringContaining('Build not found'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('spawns process and persists metadata on happy path', async () => {
    (processManager.assertBuildExists as jest.Mock).mockImplementation(
      () => {},
    );
    (processManager.findManagedProcess as jest.Mock).mockReturnValue(null);

    await program.parseAsync(['node', 'cli', 'run']);

    expect(spawn).toHaveBeenCalledTimes(1);
    expect(processManager.persistProcessMetadata).toHaveBeenCalledTimes(1);
    expect(processManager.persistProcessMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ pid: 42 }),
    );
  });
});
