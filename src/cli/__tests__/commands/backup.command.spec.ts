import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { gzipSync } from 'zlib';
import type { DataSource } from 'typeorm';
import { registerBackupCommand } from '../../commands/backup.command';
import { PID_DIR } from '../../constants';

jest.mock('fs', () => {
  const actualFs = jest.requireActual<typeof import('fs')>('fs');
  return {
    ...actualFs,
    mkdirSync: jest.fn(),
    writeFileSync: jest.fn(),
  };
});

jest.mock('zlib', () => ({
  gzipSync: jest.fn(() => Buffer.from('compressed')),
}));

jest.mock('../../../config/typeorm', () => ({
  createDataSource: jest.fn(),
  isSqliteDriver: jest.fn(
    (type: string) => type === 'sqlite' || type === 'better-sqlite3',
  ),
}));

jest.mock('../../utils', () => {
  const actual =
    jest.requireActual<typeof import('../../utils')>('../../utils');
  return { resolveActionOptions: actual.resolveActionOptions };
});

import { createDataSource } from '../../../config/typeorm';

interface MockDataSource {
  options: { type: 'postgres' | 'better-sqlite3' };
  isInitialized: boolean;
  initialize: jest.Mock<Promise<DataSource>, []>;
  destroy: jest.Mock<Promise<void>, []>;
  query: jest.Mock<Promise<unknown>, [string]>;
}

function makeDataSource(type: 'postgres' | 'better-sqlite3'): MockDataSource {
  const ds: MockDataSource = {
    options: { type },
    isInitialized: false,
    initialize: jest.fn(() => {
      ds.isInitialized = true;
      return Promise.resolve(ds as unknown as DataSource);
    }),
    destroy: jest.fn(() => {
      ds.isInitialized = false;
      return Promise.resolve();
    }),
    query: jest.fn<Promise<unknown>, [string]>(),
  };
  return ds;
}

describe('backup command', () => {
  let program: Command;
  let consoleSpy: jest.SpyInstance;
  let consoleErrSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-01T12:34:56.789Z'));
    program = new Command();
    program.exitOverride();
    registerBackupCommand(program);
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    exitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    jest.useRealTimers();
    consoleSpy.mockRestore();
    consoleErrSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('creates a sqlite backup in the default destination with timestamped filename', async () => {
    const ds = makeDataSource('better-sqlite3');
    ds.query
      .mockResolvedValueOnce([{ name: 'users' }])
      .mockResolvedValueOnce([{ id: 1, email: 'a@example.com' }]);
    jest
      .mocked(createDataSource)
      .mockReturnValue(ds as unknown as ReturnType<typeof createDataSource>);

    await program.parseAsync(['node', 'cli', 'backup', 'db']);

    expect(fs.mkdirSync).toHaveBeenCalledWith(path.join(PID_DIR, 'backups'), {
      recursive: true,
    });
    const writeFileSyncMock = jest.mocked(fs.writeFileSync);
    expect(writeFileSyncMock).toHaveBeenCalledTimes(1);
    const writtenPath = writeFileSyncMock.mock.calls[0][0];
    expect(writtenPath).toMatch(
      /agent-orchestrator-backup-db-20260601-\d{6}-789\.json\.gz$/,
    );
    const gzipSyncMock = jest.mocked(gzipSync);
    expect(gzipSyncMock).toHaveBeenCalledTimes(1);
    const payloadRaw: unknown = JSON.parse(
      (gzipSyncMock.mock.calls[0][0] as Buffer).toString('utf8'),
    );
    const payload = payloadRaw as {
      dbType: string;
      tables: Array<{ name: string; rows: unknown[] }>;
    };
    expect(payload.dbType).toBe('sqlite');
    expect(payload.tables).toEqual([
      {
        name: 'users',
        rows: [{ id: 1, email: 'a@example.com' }],
      },
    ]);
    expect(ds.destroy).toHaveBeenCalledTimes(1);
  });

  it('uses custom destination when provided', async () => {
    const ds = makeDataSource('better-sqlite3');
    ds.query.mockResolvedValueOnce([]);
    jest
      .mocked(createDataSource)
      .mockReturnValue(ds as unknown as ReturnType<typeof createDataSource>);

    await program.parseAsync([
      'node',
      'cli',
      'backup',
      'db',
      '--destination',
      '/tmp/custom-backups',
    ]);

    expect(fs.mkdirSync).toHaveBeenCalledWith('/tmp/custom-backups', {
      recursive: true,
    });
    expect(jest.mocked(fs.writeFileSync).mock.calls[0][0]).toContain(
      '/tmp/custom-backups',
    );
  });

  it('supports postgres by exporting tables from non-system schemas', async () => {
    const ds = makeDataSource('postgres');
    ds.query
      .mockResolvedValueOnce([{ table_schema: 'public', table_name: 'users' }])
      .mockResolvedValueOnce([{ id: 7 }]);
    jest
      .mocked(createDataSource)
      .mockReturnValue(ds as unknown as ReturnType<typeof createDataSource>);

    await program.parseAsync(['node', 'cli', 'backup', 'db']);

    expect(ds.query).toHaveBeenCalledWith(
      expect.stringContaining('information_schema.tables'),
    );
    expect(ds.query).toHaveBeenCalledWith('SELECT * FROM "public"."users"');
  });

  it('fails clearly for unsupported targets', async () => {
    await program.parseAsync(['node', 'cli', 'backup', 'assets']);

    expect(consoleErrSpy).toHaveBeenCalledWith(
      'Unsupported backup target "assets". Only "db" is currently supported.',
    );
    expect(createDataSource).not.toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
