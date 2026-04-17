import { Command } from 'commander';
import {
  registerResetPasswordCommand,
  resetUserPassword,
} from '../../commands/reset-password.command';

jest.mock('../../../config/typeorm', () => ({ createDataSource: jest.fn() }));
jest.mock('enquirer', () => ({
  __esModule: true,
  default: { prompt: jest.fn() },
}));

const mockEnquirer = jest.requireMock<{ default: { prompt: jest.Mock } }>(
  'enquirer',
).default;

// ─── registerResetPasswordCommand (command handler) ─────────────────────────

describe('reset-password command', () => {
  let program: Command;
  let consoleSpy: jest.SpyInstance;
  let consoleErrSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;
  let mockResetFn: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockResetFn = jest.fn().mockResolvedValue(undefined);

    program = new Command();
    program.exitOverride();
    registerResetPasswordCommand(program, mockResetFn);

    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    exitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    exitSpy.mockRestore();
    delete process.env.SETUP_ADMIN_PASSWORD;
  });

  describe('--yes (non-interactive)', () => {
    it('resets the password with --email and --password flags', async () => {
      await program.parseAsync([
        'node',
        'cli',
        'reset-password',
        '--email',
        'a@b.com',
        '--password',
        'newpass123',
        '--yes',
      ]);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('process tables'),
      );
      expect(mockResetFn).toHaveBeenCalledWith('a@b.com', 'newpass123');
      expect(exitSpy).not.toHaveBeenCalled();
    });

    it('uses SETUP_ADMIN_PASSWORD env var instead of --password flag', async () => {
      process.env.SETUP_ADMIN_PASSWORD = 'envpassword';

      await program.parseAsync([
        'node',
        'cli',
        'reset-password',
        '--email',
        'a@b.com',
        '--yes',
      ]);

      expect(mockResetFn).toHaveBeenCalledWith('a@b.com', 'envpassword');
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(exitSpy).not.toHaveBeenCalled();
    });

    it('exits 1 when --email is missing', async () => {
      await program.parseAsync([
        'node',
        'cli',
        'reset-password',
        '--password',
        'somepass',
        '--yes',
      ]);

      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(mockResetFn).not.toHaveBeenCalled();
    });

    it('exits 1 when both --password and SETUP_ADMIN_PASSWORD are absent', async () => {
      await program.parseAsync([
        'node',
        'cli',
        'reset-password',
        '--email',
        'a@b.com',
        '--yes',
      ]);

      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(mockResetFn).not.toHaveBeenCalled();
    });

    it('exits 1 when password is shorter than 8 characters', async () => {
      await program.parseAsync([
        'node',
        'cli',
        'reset-password',
        '--email',
        'a@b.com',
        '--password',
        'short',
        '--yes',
      ]);

      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrSpy).toHaveBeenCalledWith(
        expect.stringContaining('8 characters'),
      );
      expect(mockResetFn).not.toHaveBeenCalled();
    });

    it('exits 1 and prints error when resetUserPassword throws', async () => {
      mockResetFn.mockRejectedValue(new Error('user not found'));

      await program.parseAsync([
        'node',
        'cli',
        'reset-password',
        '--email',
        'nobody@example.com',
        '--password',
        'validpass1',
        '--yes',
      ]);

      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrSpy).toHaveBeenCalledWith(
        expect.stringContaining('user not found'),
      );
    });
  });

  describe('interactive (no --yes)', () => {
    it('prompts for email and password then resets', async () => {
      mockEnquirer.prompt.mockResolvedValue({
        email: 'a@b.com',
        password: 'newpass123',
        confirm: 'newpass123',
      });

      await program.parseAsync(['node', 'cli', 'reset-password']);

      expect(mockEnquirer.prompt).toHaveBeenCalled();
      expect(mockResetFn).toHaveBeenCalledWith('a@b.com', 'newpass123');
      expect(exitSpy).not.toHaveBeenCalled();
    });

    it('exits 1 when prompted password is too short', async () => {
      mockEnquirer.prompt.mockResolvedValue({
        email: 'a@b.com',
        password: 'short',
        confirm: 'short',
      });

      await program.parseAsync(['node', 'cli', 'reset-password']);

      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrSpy).toHaveBeenCalledWith(
        expect.stringContaining('8 characters'),
      );
      expect(mockResetFn).not.toHaveBeenCalled();
    });

    it('pre-fills email from --email flag in the prompt', async () => {
      mockEnquirer.prompt.mockResolvedValue({
        email: 'prefilled@b.com',
        password: 'newpass123',
        confirm: 'newpass123',
      });

      await program.parseAsync([
        'node',
        'cli',
        'reset-password',
        '--email',
        'prefilled@b.com',
      ]);

      const promptArg = (
        mockEnquirer.prompt.mock.calls[0] as unknown[][]
      )[0] as Array<{
        name: string;
        initial?: string;
      }>;
      const emailQuestion = promptArg.find((q) => q.name === 'email');
      expect(emailQuestion?.initial).toBe('prefilled@b.com');
    });
  });
});

// ─── resetUserPassword (pure function) ──────────────────────────────────────

describe('resetUserPassword', () => {
  const mockUpdate = jest.fn().mockResolvedValue({ affected: 1 });
  const mockFindOne = jest.fn();
  const mockGetRepository = jest.fn();
  const mockInitialize = jest.fn().mockResolvedValue(undefined);
  const mockDestroy = jest.fn().mockResolvedValue(undefined);

  const mockDataSource = {
    initialize: mockInitialize,
    destroy: mockDestroy,
    getRepository: mockGetRepository,
  };

  const mockFactory = jest.fn(() => mockDataSource as never);

  const mockBcrypt = {
    hash: jest.fn().mockResolvedValue('hashed-pw'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetRepository.mockReturnValue({
      findOne: mockFindOne,
      update: mockUpdate,
    });
  });

  it('updates the password and revokes refresh tokens for a known user', async () => {
    mockFindOne.mockResolvedValue({ id: 'user-1', email: 'a@b.com' });

    await resetUserPassword('a@b.com', 'newpassword', mockFactory, mockBcrypt);

    expect(mockBcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
    // First update call: password
    expect(mockUpdate).toHaveBeenCalledWith('user-1', {
      password: 'hashed-pw',
    });
    // Second update call: token revocation
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1' }),
      expect.objectContaining({ revokedAt: expect.any(Date) as unknown }),
    );
    expect(mockDestroy).toHaveBeenCalled();
  });

  it('throws if user is not found', async () => {
    mockFindOne.mockResolvedValue(null);

    await expect(
      resetUserPassword('missing@test.com', 'pw', mockFactory, mockBcrypt),
    ).rejects.toThrow('not found');

    expect(mockDestroy).toHaveBeenCalled();
  });
});
