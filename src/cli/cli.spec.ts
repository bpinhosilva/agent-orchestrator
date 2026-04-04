import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import * as enquirer from 'enquirer';
import {
  runCli,
  PID_DIR,
  PID_FILE,
  PROCESS_FILE,
  LOG_FILE,
  PACKAGE_ROOT,
} from './index';
import { spawn } from 'child_process';

jest.mock('fs');
// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('os', () => ({
  ...jest.requireActual('os'),
  homedir: jest.fn().mockReturnValue('/home/testuser'),
}));
jest.mock('enquirer', () => ({
  prompt: jest.fn(),
}));
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));
jest.mock('child_process', () => ({
  spawn: jest.fn().mockReturnValue({
    pid: 1234,
    unref: jest.fn(),
  }),
}));

const MAIN_FILE = path.join(PACKAGE_ROOT, 'dist/main.js');
const UI_INDEX_FILE = path.join(PACKAGE_ROOT, 'dist/ui/index.html');

const mockDataSource = {
  initialize: jest.fn(),
  destroy: jest.fn(),
  showMigrations: jest.fn().mockResolvedValue(false),
  query: jest.fn().mockResolvedValue([]),
  runMigrations: jest.fn().mockResolvedValue([]),
  dropDatabase: jest.fn(),
  migrations: [
    { name: 'BaselineSchema1775260737095' },
    { name: 'AddUsersLastName1775266000000' },
  ],
  options: { type: 'sqlite' },
  isInitialized: false,
};

jest.mock('../config/typeorm', () => ({
  createDataSource: jest.fn(() => mockDataSource),
  isSqliteDriver: jest.fn((type: string) => type === 'sqlite'),
}));

describe('CLI Commands', () => {
  const originalEnv = process.env;
  const originalArgv = process.argv;
  const realFs = jest.requireActual<typeof import('fs')>('fs');
  let existingPaths: Set<string>;
  let fileContents: Map<string, string>;
  let symlinks: Map<string, string>;

  function stringifyWrittenData(data: string | NodeJS.ArrayBufferView): string {
    if (typeof data === 'string') {
      return data;
    }

    return Buffer.from(data.buffer, data.byteOffset, data.byteLength).toString(
      'utf8',
    );
  }

  function addManagedProcess(pid = 1234) {
    existingPaths.add(PID_FILE);
    existingPaths.add(PROCESS_FILE);
    existingPaths.add(`/proc/${pid}`);
    existingPaths.add(`/proc/${pid}/cmdline`);
    existingPaths.add(`/proc/${pid}/cwd`);
    fileContents.set(PID_FILE, `${pid}\n`);
    fileContents.set(
      PROCESS_FILE,
      JSON.stringify(
        {
          pid,
          cwd: PACKAGE_ROOT,
          mainPath: MAIN_FILE,
          port: '15789',
          logFile: LOG_FILE,
          startedAt: '2026-01-01T00:00:00.000Z',
        },
        null,
        2,
      ),
    );
    fileContents.set(`/proc/${pid}/cmdline`, `node\u0000${MAIN_FILE}\u0000`);
    symlinks.set(`/proc/${pid}/cwd`, PACKAGE_ROOT);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    (os.homedir as jest.Mock).mockReturnValue('/home/testuser');
    mockDataSource.isInitialized = false;

    existingPaths = new Set([
      '/proc',
      PID_DIR,
      PACKAGE_ROOT,
      MAIN_FILE,
      UI_INDEX_FILE,
    ]);
    fileContents = new Map([
      [
        path.join(PACKAGE_ROOT, 'package.json'),
        JSON.stringify({ version: '1.0.0-alpha.23' }),
      ],
    ]);
    symlinks = new Map();

    (fs.existsSync as jest.Mock).mockImplementation((target: fs.PathLike) =>
      existingPaths.has(String(target)),
    );
    (fs.readFileSync as jest.Mock).mockImplementation(
      (target: fs.PathLike, encoding?: BufferEncoding) => {
        const filePath = String(target);
        if (fileContents.has(filePath)) {
          return fileContents.get(filePath);
        }
        if (filePath.endsWith('package.json')) {
          return realFs.readFileSync(filePath, encoding || 'utf8');
        }
        throw new Error(
          `ENOENT: no such file or directory, open '${filePath}'`,
        );
      },
    );
    (fs.writeFileSync as jest.Mock).mockImplementation(
      (target: fs.PathLike, data: string | NodeJS.ArrayBufferView) => {
        const filePath = String(target);
        existingPaths.add(filePath);
        fileContents.set(filePath, stringifyWrittenData(data));
      },
    );
    (fs.chmodSync as jest.Mock).mockImplementation(() => undefined);
    (fs.unlinkSync as jest.Mock).mockImplementation((target: fs.PathLike) => {
      const filePath = String(target);
      existingPaths.delete(filePath);
      fileContents.delete(filePath);
    });
    (fs.openSync as jest.Mock).mockReturnValue(1);
    (fs.mkdirSync as jest.Mock).mockImplementation((target: fs.PathLike) => {
      existingPaths.add(String(target));
    });
    (fs.readlinkSync as jest.Mock).mockImplementation((target: fs.PathLike) => {
      const linkPath = String(target);
      const resolved = symlinks.get(linkPath);
      if (!resolved) {
        throw new Error(
          `ENOENT: no such file or directory, readlink '${linkPath}'`,
        );
      }
      return resolved;
    });
    (fs.readdirSync as jest.Mock).mockImplementation((target: fs.PathLike) => {
      if (String(target) === '/proc') {
        return [...existingPaths]
          .filter((value) => /^\/proc\/\d+$/.test(value))
          .map((value) => value.replace('/proc/', ''));
      }
      return [];
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    process.argv = originalArgv;
  });

  describe('Basics', () => {
    it('should resolve default AGENT_ORCHESTRATOR_HOME correctly', () => {
      expect(PID_DIR).toBe(path.join('/home/testuser', '.agent-orchestrator'));
    });

    it('should resolve PACKAGE_ROOT correctly', () => {
      const expected = path.resolve(__dirname, '..', '..');
      expect(PACKAGE_ROOT).toBe(expected);
    });
  });

  describe('run command', () => {
    it('should start the orchestrator in background and persist private runtime files', async () => {
      await runCli(['node', 'index.js', 'run']);

      const spawnMock = jest.mocked(spawn);
      const spawnCall = spawnMock.mock.calls[0];

      expect(spawnCall?.[0]).toBe('node');
      expect(spawnCall?.[1]).toEqual([MAIN_FILE]);
      expect(spawnCall?.[2]).toMatchObject({
        detached: true,
        cwd: PACKAGE_ROOT,
      });
      expect(spawnCall?.[2]?.env).toMatchObject({
        AGENT_ORCHESTRATOR_HOME: PID_DIR,
        NODE_ENV: 'production',
      });
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        PID_FILE,
        '1234\n',
        expect.objectContaining({ mode: 0o600 }),
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        PROCESS_FILE,
        expect.stringContaining('"pid": 1234'),
        expect.objectContaining({ mode: 0o600 }),
      );
      expect(fs.chmodSync).toHaveBeenCalledWith(PID_FILE, 0o600);
      expect(fs.chmodSync).toHaveBeenCalledWith(PROCESS_FILE, 0o600);
    });

    it('should not start if the managed process is already running', async () => {
      addManagedProcess(5678);
      const killSpy = jest
        .spyOn(process, 'kill')
        .mockImplementation(() => true);

      await runCli(['node', 'index.js', 'run']);

      expect(spawn).not.toHaveBeenCalled();
      killSpy.mockRestore();
    });
  });

  describe('stop command', () => {
    it('should stop the verified orchestrator process', async () => {
      addManagedProcess(1234);
      const killSpy = jest
        .spyOn(process, 'kill')
        .mockImplementation(() => true);

      await runCli(['node', 'index.js', 'stop']);

      expect(killSpy).toHaveBeenCalledWith(1234, 'SIGTERM');
      expect(fs.unlinkSync).toHaveBeenCalledWith(PID_FILE);
      expect(fs.unlinkSync).toHaveBeenCalledWith(PROCESS_FILE);
      killSpy.mockRestore();
    });

    it('should find the process by scanning /proc when pid files are stale', async () => {
      existingPaths.add(`/proc/4321`);
      existingPaths.add(`/proc/4321/cmdline`);
      existingPaths.add(`/proc/4321/cwd`);
      existingPaths.add(PID_FILE);
      fileContents.set(PID_FILE, '9999\n');
      fileContents.set(`/proc/4321/cmdline`, `node\u0000${MAIN_FILE}\u0000`);
      symlinks.set(`/proc/4321/cwd`, PACKAGE_ROOT);

      const killSpy = jest
        .spyOn(process, 'kill')
        .mockImplementation(() => true);

      await runCli(['node', 'index.js', 'stop']);

      expect(killSpy).toHaveBeenCalledWith(4321, 'SIGTERM');
      killSpy.mockRestore();
    });
  });

  describe('status and logs commands', () => {
    it('should report the running orchestrator status', async () => {
      addManagedProcess(1234);
      const killSpy = jest
        .spyOn(process, 'kill')
        .mockImplementation(() => true);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await runCli(['node', 'index.js', 'status']);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Orchestrator is running.'),
      );
      consoleSpy.mockRestore();
      killSpy.mockRestore();
    });

    it('should print recent log lines', async () => {
      existingPaths.add(LOG_FILE);
      fileContents.set(LOG_FILE, 'line1\nline2\nline3\n');
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await runCli(['node', 'index.js', 'logs', '--lines', '2']);

      expect(consoleSpy).toHaveBeenCalledWith('line2\nline3');
      consoleSpy.mockRestore();
    });
  });

  describe('setup command', () => {
    it('should write the env file with mode 600 in non-interactive mode', async () => {
      mockDataSource.showMigrations.mockResolvedValue(false);
      mockDataSource.query.mockResolvedValue([]);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await runCli([
        'node',
        'index.js',
        'setup',
        '--yes',
        '--db-type',
        'sqlite',
        '--port',
        '15789',
        '--skip-admin-setup',
      ]);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        path.join(PID_DIR, '.env'),
        expect.stringContaining('CHECK_PENDING_MIGRATIONS_ON_STARTUP=true'),
        expect.objectContaining({ mode: 0o600 }),
      );
      expect(fs.chmodSync).toHaveBeenCalledWith(
        path.join(PID_DIR, '.env'),
        0o600,
      );
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should accept postgresql URLs in non-interactive setup', async () => {
      mockDataSource.showMigrations.mockResolvedValue(false);
      mockDataSource.query.mockResolvedValue([]);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await runCli([
        'node',
        'index.js',
        'setup',
        '--yes',
        '--db-type',
        'postgres',
        '--database-url',
        'postgresql://user:password@localhost:5432/dbname',
        '--skip-admin-setup',
      ]);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        path.join(PID_DIR, '.env'),
        expect.stringContaining(
          'DATABASE_URL=postgresql://user:password@localhost:5432/dbname',
        ),
        expect.objectContaining({ mode: 0o600 }),
      );
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should default setup port to 15789 for runtime installs', async () => {
      mockDataSource.showMigrations.mockResolvedValue(false);
      mockDataSource.query.mockResolvedValue([]);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await runCli([
        'node',
        'index.js',
        'setup',
        '--yes',
        '--db-type',
        'sqlite',
        '--skip-admin-setup',
      ]);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        path.join(PID_DIR, '.env'),
        expect.stringContaining('PORT=15789'),
        expect.objectContaining({ mode: 0o600 }),
      );
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should run pending migrations during non-interactive setup when --yes is provided', async () => {
      mockDataSource.showMigrations.mockResolvedValue(true);
      mockDataSource.query.mockResolvedValue([{ name: 'users' }]);
      const promptSpy = jest.mocked(enquirer.prompt);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await runCli([
        'node',
        'index.js',
        'setup',
        '--yes',
        '--db-type',
        'sqlite',
        '--skip-admin-setup',
      ]);

      expect(promptSpy).not.toHaveBeenCalled();
      expect(mockDataSource.runMigrations).toHaveBeenCalledWith();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('migrate command', () => {
    it('should run migrations if database is empty', async () => {
      mockDataSource.showMigrations.mockResolvedValue(true);
      mockDataSource.query.mockResolvedValue([]);

      await runCli(['node', 'index.js', 'migrate']);

      expect(mockDataSource.initialize).toHaveBeenCalled();
      expect(mockDataSource.runMigrations).toHaveBeenCalled();
    });

    it('should run force migrations without prompts when --yes is provided', async () => {
      await runCli(['node', 'index.js', 'migrate', '--force', '--yes']);

      expect(enquirer.prompt).not.toHaveBeenCalled();
      expect(mockDataSource.dropDatabase).toHaveBeenCalled();
      expect(mockDataSource.runMigrations).toHaveBeenCalled();
    });
  });
});
