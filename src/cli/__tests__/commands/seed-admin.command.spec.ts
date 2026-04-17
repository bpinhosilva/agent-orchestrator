import { Command } from 'commander';
import { registerSeedAdminCommand } from '../../commands/seed-admin.command';

jest.mock('../../setup/admin', () => ({
  setupAdminUser: jest.fn(),
}));

import * as adminModule from '../../setup/admin';

describe('seed-admin command', () => {
  let program: Command;
  let consoleSpy: jest.SpyInstance;
  let consoleErrSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;

  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    program = new Command();
    program.exitOverride();
    registerSeedAdminCommand(program);
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
    process.env = originalEnv;
  });

  it('calls setupAdminUser with env vars on happy path', async () => {
    process.env.ADMIN_NAME = 'Test Admin';
    process.env.ADMIN_EMAIL = 'admin@test.com';
    process.env.ADMIN_PASSWORD = 'secret123';

    await program.parseAsync(['node', 'cli', 'seed-admin']);

    expect(adminModule.setupAdminUser).toHaveBeenCalledWith({
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'secret123',
      interactive: false,
    });
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('defaults name to "Admin" when ADMIN_NAME is not set', async () => {
    process.env.ADMIN_EMAIL = 'admin@test.com';
    process.env.ADMIN_PASSWORD = 'secret123';
    delete process.env.ADMIN_NAME;

    await program.parseAsync(['node', 'cli', 'seed-admin']);

    expect(adminModule.setupAdminUser).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Admin' }),
    );
  });

  it('exits 1 when ADMIN_EMAIL is missing', async () => {
    process.env.ADMIN_PASSWORD = 'secret123';
    delete process.env.ADMIN_EMAIL;

    await program.parseAsync(['node', 'cli', 'seed-admin']);

    expect(consoleErrSpy).toHaveBeenCalledWith(
      expect.stringContaining('ADMIN_EMAIL'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits 1 when ADMIN_PASSWORD is missing', async () => {
    process.env.ADMIN_EMAIL = 'admin@test.com';
    delete process.env.ADMIN_PASSWORD;

    await program.parseAsync(['node', 'cli', 'seed-admin']);

    expect(consoleErrSpy).toHaveBeenCalledWith(
      expect.stringContaining('ADMIN_PASSWORD'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits 1 when setupAdminUser throws', async () => {
    process.env.ADMIN_EMAIL = 'admin@test.com';
    process.env.ADMIN_PASSWORD = 'secret123';
    (adminModule.setupAdminUser as jest.Mock).mockRejectedValue(
      new Error('DB connection failed'),
    );

    await program.parseAsync(['node', 'cli', 'seed-admin']);

    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
