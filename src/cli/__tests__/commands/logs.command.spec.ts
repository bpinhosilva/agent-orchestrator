import { Command } from 'commander';
import { registerLogsCommand } from '../../commands/logs.command';

jest.mock('../../utils', () => {
  const actual =
    jest.requireActual<typeof import('../../utils')>('../../utils');
  return {
    resolveActionOptions: actual.resolveActionOptions,
    tailLogLines: jest.fn((content: string, n: number) =>
      content.split('\n').slice(-n).join('\n'),
    ),
  };
});

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  statSync: jest.fn(() => ({ size: 0 })),
  watchFile: jest.fn(),
  openSync: jest.fn(),
  readSync: jest.fn(),
  closeSync: jest.fn(),
}));

jest.mock('../../constants', () => ({
  LOG_FILE: '/fake/.agent-orchestrator/server.log',
}));

import * as fs from 'fs';
import { tailLogLines } from '../../utils';

describe('logs command', () => {
  let program: Command;
  let consoleSpy: jest.SpyInstance;
  let consoleErrSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    program = new Command();
    program.exitOverride();
    registerLogsCommand(program);
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

  it('prints not-found message when log file does not exist', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    await program.parseAsync(['node', 'cli', 'logs']);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('No log file found'),
    );
    expect(tailLogLines).not.toHaveBeenCalled();
  });

  it('calls tailLogLines with default 50 lines when no --lines option given', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue('line1\nline2\n');

    await program.parseAsync(['node', 'cli', 'logs']);

    expect(tailLogLines).toHaveBeenCalledWith(expect.any(String), 50);
  });

  it('calls tailLogLines with the provided --lines count', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue('line1\nline2\n');

    await program.parseAsync(['node', 'cli', 'logs', '--lines', '20']);

    expect(tailLogLines).toHaveBeenCalledWith(expect.any(String), 20);
  });

  it('prints non-empty log output via console.log', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue('logline\n');
    (tailLogLines as jest.Mock).mockReturnValue('logline');

    await program.parseAsync(['node', 'cli', 'logs']);

    expect(consoleSpy).toHaveBeenCalledWith('logline');
  });

  it('prints empty-file message when tailLogLines returns empty string', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue('');
    (tailLogLines as jest.Mock).mockReturnValue('');

    await program.parseAsync(['node', 'cli', 'logs']);

    expect(consoleSpy).toHaveBeenCalledWith('Log file is empty.');
  });
});
