import * as enquirer from 'enquirer';
import { setupAdminUser, maybeSetupAdmin } from '../../setup/admin';
import type { DataSourceFactory } from '../../types';

jest.mock('enquirer', () => ({ prompt: jest.fn() }));

/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

interface MakeDataSourceOptions {
  initRejects?: boolean;
  saveRejects?: boolean;
  destroyRejects?: boolean;
}

function makeDataSource(
  existingUser: boolean,
  opts: MakeDataSourceOptions = {},
) {
  const save = jest.fn();
  if (opts.saveRejects) {
    save.mockRejectedValue(new Error('save failed'));
  } else {
    save.mockResolvedValue({});
  }
  const create = jest.fn().mockReturnValue({ name: 'Admin' });
  const findOne = jest
    .fn()
    .mockResolvedValue(existingUser ? { email: 'a@b.com' } : null);
  const getRepository = jest.fn().mockReturnValue({ findOne, create, save });
  const initialize = jest.fn();
  if (opts.initRejects) {
    initialize.mockRejectedValue(new Error('init failed'));
  } else {
    initialize.mockResolvedValue(undefined);
  }
  const destroy = jest.fn();
  if (opts.destroyRejects) {
    destroy.mockRejectedValue(new Error('destroy failed'));
  } else {
    destroy.mockResolvedValue(undefined);
  }
  return {
    initialize,
    destroy,
    getRepository,
  };
}

const fakeBcrypt = { hash: jest.fn().mockResolvedValue('hashed') };

beforeEach(() => {
  jest.clearAllMocks();
  fakeBcrypt.hash.mockResolvedValue('hashed');
  jest.spyOn(console, 'log').mockImplementation();
  jest.spyOn(console, 'error').mockImplementation();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('setupAdminUser', () => {
  it('creates admin user with provided credentials', async () => {
    const ds = makeDataSource(false);
    const factory: DataSourceFactory = () => ds as any;
    await setupAdminUser(
      { name: 'Admin', email: 'admin@test.com', password: 'password123' },
      factory,
      fakeBcrypt,
    );
    const repo = ds.getRepository(null);
    expect(repo.save).toHaveBeenCalled();
  });

  it('skips creation when user already exists', async () => {
    const ds = makeDataSource(true);
    const factory: DataSourceFactory = () => ds as any;
    await setupAdminUser(
      { name: 'Admin', email: 'admin@test.com', password: 'password123' },
      factory,
      fakeBcrypt,
    );
    const repo = ds.getRepository(null);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('throws when password is too short', async () => {
    const ds = makeDataSource(false);
    const factory: DataSourceFactory = () => ds as any;
    await expect(
      setupAdminUser(
        { name: 'Admin', email: 'a@b.com', password: 'short' },
        factory,
        fakeBcrypt,
      ),
    ).rejects.toThrow('at least 8 characters');
  });

  it('skips in non-interactive mode when credentials are incomplete', async () => {
    const ds = makeDataSource(false);
    const factory: DataSourceFactory = () => ds as any;
    await setupAdminUser({ interactive: false }, factory, fakeBcrypt);
    expect(ds.initialize).not.toHaveBeenCalled();
  });

  it('calls bcrypt.hash with the password and 10 rounds on success', async () => {
    const ds = makeDataSource(false);
    const factory: DataSourceFactory = () => ds as any;
    await setupAdminUser(
      { name: 'Admin', email: 'a@b.com', password: 'password123' },
      factory,
      fakeBcrypt,
    );
    expect(fakeBcrypt.hash).toHaveBeenCalledWith('password123', 10);
  });

  it('calls dataSource.destroy after successful user creation', async () => {
    const ds = makeDataSource(false);
    const factory: DataSourceFactory = () => ds as any;
    await setupAdminUser(
      { name: 'Admin', email: 'a@b.com', password: 'password123' },
      factory,
      fakeBcrypt,
    );
    expect(ds.destroy).toHaveBeenCalled();
  });

  it('calls dataSource.destroy when user already exists', async () => {
    const ds = makeDataSource(true);
    const factory: DataSourceFactory = () => ds as any;
    await setupAdminUser(
      { name: 'Admin', email: 'a@b.com', password: 'password123' },
      factory,
      fakeBcrypt,
    );
    expect(ds.destroy).toHaveBeenCalled();
  });

  it('re-throws and skips destroy when dataSource.initialize rejects', async () => {
    const ds = makeDataSource(false, { initRejects: true });
    const factory: DataSourceFactory = () => ds as any;
    await expect(
      setupAdminUser(
        { name: 'Admin', email: 'a@b.com', password: 'password123' },
        factory,
        fakeBcrypt,
      ),
    ).rejects.toThrow('init failed');
    expect(ds.destroy).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });

  it('calls destroy and re-throws when save rejects', async () => {
    const ds = makeDataSource(false, { saveRejects: true });
    const factory: DataSourceFactory = () => ds as any;
    await expect(
      setupAdminUser(
        { name: 'Admin', email: 'a@b.com', password: 'password123' },
        factory,
        fakeBcrypt,
      ),
    ).rejects.toThrow('save failed');
    expect(ds.destroy).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });

  it('skips when partial credentials (name+email only) and interactive is false', async () => {
    const ds = makeDataSource(false);
    const factory: DataSourceFactory = () => ds as any;
    await setupAdminUser(
      { name: 'Admin', email: 'a@b.com', interactive: false },
      factory,
      fakeBcrypt,
    );
    expect(ds.initialize).not.toHaveBeenCalled();
  });

  it('accepts a password of exactly 8 characters (boundary)', async () => {
    const ds = makeDataSource(false);
    const factory: DataSourceFactory = () => ds as any;
    await setupAdminUser(
      { name: 'Admin', email: 'a@b.com', password: '12345678' },
      factory,
      fakeBcrypt,
    );
    expect(ds.initialize).toHaveBeenCalled();
    const repo = ds.getRepository(null);
    expect(repo.save).toHaveBeenCalled();
  });

  it('swallows destroy error and re-throws the original error', async () => {
    const ds = makeDataSource(false, {
      saveRejects: true,
      destroyRejects: true,
    });
    const factory: DataSourceFactory = () => ds as any;
    await expect(
      setupAdminUser(
        { name: 'Admin', email: 'a@b.com', password: 'password123' },
        factory,
        fakeBcrypt,
      ),
    ).rejects.toThrow('save failed');
  });
});

describe('maybeSetupAdmin', () => {
  it('skips entirely when skipAdminSetup is true', async () => {
    const ds = makeDataSource(false);
    const factory: DataSourceFactory = () => ds as any;
    await maybeSetupAdmin({ skipAdminSetup: true }, factory, fakeBcrypt);
    expect(ds.initialize).not.toHaveBeenCalled();
  });

  it('calls setupAdminUser with interactive: false when yes is true', async () => {
    const ds = makeDataSource(false);
    const factory: DataSourceFactory = () => ds as any;
    // yes:true → interactive:false; no credentials → skips without touching dataSource
    await maybeSetupAdmin({ yes: true }, factory, fakeBcrypt);
    expect(ds.initialize).not.toHaveBeenCalled();
  });

  it('calls setupAdminUser with interactive: true when yes is false, with full credentials', async () => {
    const ds = makeDataSource(false);
    const factory: DataSourceFactory = () => ds as any;
    await maybeSetupAdmin(
      {
        yes: false,
        adminName: 'Admin',
        adminEmail: 'a@b.com',
        adminPassword: 'password123',
      },
      factory,
      fakeBcrypt,
    );
    expect(ds.initialize).toHaveBeenCalled();
  });

  it('re-throws when setupAdminUser encounters an error', async () => {
    const ds = makeDataSource(false, { initRejects: true });
    const factory: DataSourceFactory = () => ds as any;
    await expect(
      maybeSetupAdmin(
        {
          adminName: 'Admin',
          adminEmail: 'a@b.com',
          adminPassword: 'password123',
        },
        factory,
        fakeBcrypt,
      ),
    ).rejects.toThrow();
    expect(console.error).toHaveBeenCalled();
  });

  it('re-throws short-password validation error from setupAdminUser', async () => {
    const ds = makeDataSource(false);
    const factory: DataSourceFactory = () => ds as any;
    await expect(
      maybeSetupAdmin(
        { adminName: 'Admin', adminEmail: 'a@b.com', adminPassword: 'short' },
        factory,
        fakeBcrypt,
      ),
    ).rejects.toThrow();
    expect(console.error).toHaveBeenCalled();
    expect(ds.initialize).not.toHaveBeenCalled();
  });

  it('re-throws prompt cancellation error', async () => {
    const ds = makeDataSource(false);
    const factory: DataSourceFactory = () => ds as any;
    jest.mocked(enquirer.prompt).mockRejectedValue(new Error('User cancelled'));
    await expect(
      maybeSetupAdmin({ yes: false }, factory, fakeBcrypt),
    ).rejects.toThrow('User cancelled');
    expect(console.error).toHaveBeenCalled();
  });

  it('re-throws error when destroy fails during setupAdminUser', async () => {
    const ds = makeDataSource(false, {
      saveRejects: true,
      destroyRejects: true,
    });
    const factory: DataSourceFactory = () => ds as any;
    await expect(
      maybeSetupAdmin(
        {
          adminName: 'Admin',
          adminEmail: 'a@b.com',
          adminPassword: 'password123',
        },
        factory,
        fakeBcrypt,
      ),
    ).rejects.toThrow();
  });
});
