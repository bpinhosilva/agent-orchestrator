import { Command } from 'commander';
import { registerMigrateCommand } from '../../commands/migrate.command';

jest.mock('../../../database/migration-state', () => ({
  checkPendingMigrations: jest.fn(),
  runMigrations: jest.fn(),
}));

jest.mock('enquirer', () => ({
  prompt: jest.fn(),
}));

jest.mock('../../utils', () => {
  const actual =
    jest.requireActual<typeof import('../../utils')>('../../utils');
  return { resolveActionOptions: actual.resolveActionOptions };
});

import * as migrationState from '../../../database/migration-state';

const mockEnquirer = jest.requireMock<{ prompt: jest.Mock }>('enquirer');

describe('migrate command', () => {
  let program: Command;
  let consoleSpy: jest.SpyInstance;
  let consoleErrSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    program = new Command();
    program.exitOverride();
    registerMigrateCommand(program);
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    exitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);
    (migrationState.runMigrations as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrSpy.mockRestore();
    exitSpy.mockRestore();
  });

  describe('--force --yes (non-interactive force)', () => {
    it('runs migrations with force=true without prompting', async () => {
      await program.parseAsync(['node', 'cli', 'migrate', '--force', '--yes']);

      expect(mockEnquirer.prompt).not.toHaveBeenCalled();
      expect(migrationState.runMigrations).toHaveBeenCalledWith(true);
    });
  });

  describe('no --force flag', () => {
    it('prints up-to-date message when no pending migrations exist', async () => {
      (migrationState.checkPendingMigrations as jest.Mock).mockResolvedValue({
        hasPending: false,
        isEmpty: false,
      });

      await program.parseAsync(['node', 'cli', 'migrate', '--yes']);

      expect(migrationState.runMigrations).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('up to date'),
      );
    });

    it('initializes when database is empty', async () => {
      (migrationState.checkPendingMigrations as jest.Mock).mockResolvedValue({
        hasPending: true,
        isEmpty: true,
      });

      await program.parseAsync(['node', 'cli', 'migrate', '--yes']);

      expect(migrationState.runMigrations).toHaveBeenCalledWith();
    });

    it('runs migrations when user confirms via --yes (no prompt)', async () => {
      (migrationState.checkPendingMigrations as jest.Mock).mockResolvedValue({
        hasPending: true,
        isEmpty: false,
      });

      await program.parseAsync(['node', 'cli', 'migrate', '--yes']);

      expect(mockEnquirer.prompt).not.toHaveBeenCalled();
      expect(migrationState.runMigrations).toHaveBeenCalledTimes(1);
    });

    it('runs migrations when user confirms interactively', async () => {
      (migrationState.checkPendingMigrations as jest.Mock).mockResolvedValue({
        hasPending: true,
        isEmpty: false,
      });
      mockEnquirer.prompt.mockResolvedValue({ confirmed: true });

      await program.parseAsync(['node', 'cli', 'migrate']);

      expect(migrationState.runMigrations).toHaveBeenCalledTimes(1);
    });

    it('cancels migrations when user declines interactively', async () => {
      (migrationState.checkPendingMigrations as jest.Mock).mockResolvedValue({
        hasPending: true,
        isEmpty: false,
      });
      mockEnquirer.prompt.mockResolvedValue({ confirmed: false });

      await program.parseAsync(['node', 'cli', 'migrate']);

      expect(migrationState.runMigrations).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('cancelled'),
      );
    });
  });

  it('logs error and calls process.exit(1) when runMigrations throws', async () => {
    (migrationState.checkPendingMigrations as jest.Mock).mockResolvedValue({
      hasPending: true,
      isEmpty: false,
    });
    (migrationState.runMigrations as jest.Mock).mockRejectedValue(
      new Error('DB error'),
    );

    await program.parseAsync(['node', 'cli', 'migrate', '--yes']);

    expect(consoleErrSpy).toHaveBeenCalledWith(
      expect.stringContaining('DB error'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
