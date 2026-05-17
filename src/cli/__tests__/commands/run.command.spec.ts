import { Command } from 'commander';
import { registerRunCommand } from '../../commands/run.command';

jest.mock('../../process-manager', () => ({
  assertBuildExists: jest.fn(),
  findManagedProcess: jest.fn(),
  formatProcessSummary: jest.fn(() => 'PID: 42\nPort: 15789'),
  startServer: jest.fn(() => ({ pid: 42, host: '127.0.0.1', port: '15789' })),
}));

jest.mock('../../utils', () => ({
  ...jest.requireActual<typeof import('../../utils')>('../../utils'),
  verifyServerStartup: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('../../../database/migration-state', () => ({
  checkPendingMigrations: jest.fn(),
}));

import * as processManager from '../../process-manager';
import * as utils from '../../utils';
import * as migrationState from '../../../database/migration-state';

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
    // Default: no pending migrations
    (migrationState.checkPendingMigrations as jest.Mock).mockResolvedValue({
      hasPending: false,
      isEmpty: false,
    });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrSpy.mockRestore();
    exitSpy.mockRestore();
    delete process.env.LOG_LEVEL;
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

    expect(processManager.startServer).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('already running'),
    );
  });

  it('logs error and calls process.exit(1) when startServer throws', async () => {
    (processManager.findManagedProcess as jest.Mock).mockReturnValue(null);
    (processManager.startServer as jest.Mock).mockImplementation(() => {
      throw new Error('Build not found');
    });

    await program.parseAsync(['node', 'cli', 'run']);

    expect(consoleErrSpy).toHaveBeenCalledWith(
      expect.stringContaining('Build not found'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('calls startServer and logs summary on happy path', async () => {
    (processManager.findManagedProcess as jest.Mock).mockReturnValue(null);
    (processManager.startServer as jest.Mock).mockReturnValue({
      pid: 42,
      host: '127.0.0.1',
      port: '15789',
    });

    await program.parseAsync(['node', 'cli', 'run']);

    expect(processManager.startServer).toHaveBeenCalledTimes(1);
    const allOutput = consoleSpy.mock.calls
      .map((c: string[]) => c[0])
      .join('\n');
    expect(allOutput).toContain('started in background');
  });

  it('passes log level to startServer when --log-level is given', async () => {
    (processManager.findManagedProcess as jest.Mock).mockReturnValue(null);
    (processManager.startServer as jest.Mock).mockReturnValue({
      pid: 42,
      host: '127.0.0.1',
      port: '15789',
    });

    await program.parseAsync(['node', 'cli', 'run', '--log-level', 'debug']);

    expect(processManager.startServer).toHaveBeenCalledWith(
      expect.objectContaining({ logLevel: 'debug' }),
    );
  });

  it('exits with error for invalid --log-level values', async () => {
    (processManager.findManagedProcess as jest.Mock).mockReturnValue(null);

    await program.parseAsync(['node', 'cli', 'run', '--log-level', 'invalid']);

    expect(consoleErrSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid log level'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('detects early crash and exits 1 when verifyServerStartup returns false', async () => {
    (processManager.findManagedProcess as jest.Mock).mockReturnValue(null);
    (processManager.startServer as jest.Mock).mockReturnValue({
      pid: 42,
      host: '127.0.0.1',
      port: '15789',
    });
    (utils.verifyServerStartup as jest.Mock).mockResolvedValue(false);

    await program.parseAsync(['node', 'cli', 'run']);

    expect(utils.verifyServerStartup).toHaveBeenCalledWith(42);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('detects pending migrations and exits with helpful message', async () => {
    (migrationState.checkPendingMigrations as jest.Mock).mockResolvedValue({
      hasPending: true,
      isEmpty: false,
    });

    await program.parseAsync(['node', 'cli', 'run']);

    expect(consoleErrSpy).toHaveBeenCalledWith(
      expect.stringContaining('Pending database migrations detected'),
    );
    expect(consoleErrSpy).toHaveBeenCalledWith(
      expect.stringContaining('agent-orchestrator migrate --yes'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('proceeds normally when no migrations are pending', async () => {
    (processManager.findManagedProcess as jest.Mock).mockReturnValue(null);
    (processManager.startServer as jest.Mock).mockReturnValue({
      pid: 42,
      host: '127.0.0.1',
      port: '15789',
    });

    await program.parseAsync(['node', 'cli', 'run']);

    expect(migrationState.checkPendingMigrations).toHaveBeenCalled();
    expect(processManager.startServer).toHaveBeenCalled();
  });

  it('passes logMaxSizeMb to startServer when --log-max-size-mb is given', async () => {
    (processManager.findManagedProcess as jest.Mock).mockReturnValue(null);
    (processManager.startServer as jest.Mock).mockReturnValue({
      pid: 42,
      host: '127.0.0.1',
      port: '15789',
    });

    await program.parseAsync(['node', 'cli', 'run', '--log-max-size-mb', '25']);

    expect(processManager.startServer).toHaveBeenCalledWith(
      expect.objectContaining({ logMaxSizeMb: 25 }),
    );
  });

  it('passes logMaxFiles to startServer when --log-max-files is given', async () => {
    (processManager.findManagedProcess as jest.Mock).mockReturnValue(null);
    (processManager.startServer as jest.Mock).mockReturnValue({
      pid: 42,
      host: '127.0.0.1',
      port: '15789',
    });

    await program.parseAsync(['node', 'cli', 'run', '--log-max-files', '8']);

    expect(processManager.startServer).toHaveBeenCalledWith(
      expect.objectContaining({ logMaxFiles: 8 }),
    );
  });

  it('exits with error for invalid (non-positive) --log-max-size-mb', async () => {
    (processManager.findManagedProcess as jest.Mock).mockReturnValue(null);

    await program.parseAsync(['node', 'cli', 'run', '--log-max-size-mb', '0']);

    expect(consoleErrSpy).toHaveBeenCalledWith(
      expect.stringContaining('log-max-size-mb'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits with error for invalid (non-positive) --log-max-files', async () => {
    (processManager.findManagedProcess as jest.Mock).mockReturnValue(null);

    await program.parseAsync(['node', 'cli', 'run', '--log-max-files', '-1']);

    expect(consoleErrSpy).toHaveBeenCalledWith(
      expect.stringContaining('log-max-files'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits with error for decimal --log-max-size-mb (e.g. 1.5)', async () => {
    (processManager.findManagedProcess as jest.Mock).mockReturnValue(null);

    await program.parseAsync([
      'node',
      'cli',
      'run',
      '--log-max-size-mb',
      '1.5',
    ]);

    expect(consoleErrSpy).toHaveBeenCalledWith(
      expect.stringContaining('log-max-size-mb'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits with error for malformed --log-max-size-mb (e.g. 10foo)', async () => {
    (processManager.findManagedProcess as jest.Mock).mockReturnValue(null);

    await program.parseAsync([
      'node',
      'cli',
      'run',
      '--log-max-size-mb',
      '10foo',
    ]);

    expect(consoleErrSpy).toHaveBeenCalledWith(
      expect.stringContaining('log-max-size-mb'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits with error for scientific notation --log-max-size-mb (e.g. 1e2)', async () => {
    (processManager.findManagedProcess as jest.Mock).mockReturnValue(null);

    await program.parseAsync([
      'node',
      'cli',
      'run',
      '--log-max-size-mb',
      '1e2',
    ]);

    expect(consoleErrSpy).toHaveBeenCalledWith(
      expect.stringContaining('log-max-size-mb'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits with error for decimal --log-max-files (e.g. 2.5)', async () => {
    (processManager.findManagedProcess as jest.Mock).mockReturnValue(null);

    await program.parseAsync(['node', 'cli', 'run', '--log-max-files', '2.5']);

    expect(consoleErrSpy).toHaveBeenCalledWith(
      expect.stringContaining('log-max-files'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
