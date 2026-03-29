import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { runCli, PID_DIR, PID_FILE, PACKAGE_ROOT } from './index';
import { spawn } from 'child_process';
import * as enquirer from 'enquirer';

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

const mockDataSource = {
  initialize: jest.fn(),
  destroy: jest.fn(),
  showMigrations: jest.fn().mockResolvedValue(false),
  query: jest.fn().mockResolvedValue([]),
  runMigrations: jest.fn().mockResolvedValue([]),
  dropDatabase: jest.fn(),
  options: { type: 'sqlite' },
  isInitialized: false,
};

jest.mock('../config/typeorm', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  createDataSource: jest.fn(() => mockDataSource as any),
}));

describe('CLI Commands', () => {
  const originalEnv = process.env;
  const originalArgv = process.argv;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    (os.homedir as jest.Mock).mockReturnValue('/home/testuser');
    mockDataSource.isInitialized = false;
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
    it('should start the orchestrator in background', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false); // PID_FILE doesn't exist
      (fs.openSync as jest.Mock).mockReturnValue(1); // LOG_FILE handle

      await runCli(['node', 'index.js', 'run']);

      expect(spawn).toHaveBeenCalledWith(
        'node',
        [path.join(PACKAGE_ROOT, 'dist/main.js')],
        expect.objectContaining({
          detached: true,
          cwd: PACKAGE_ROOT,
        }),
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(PID_FILE, '1234');
    });

    it('should not start if already running', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('5678');
      const killSpy = jest
        .spyOn(process, 'kill')
        .mockImplementation(() => true);

      await runCli(['node', 'index.js', 'run']);

      expect(spawn).not.toHaveBeenCalled();
      killSpy.mockRestore();
    });
  });

  describe('stop command', () => {
    it('should stop the running orchestrator', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('1234');
      const killSpy = jest
        .spyOn(process, 'kill')
        .mockImplementation(() => true);

      await runCli(['node', 'index.js', 'stop']);

      expect(killSpy).toHaveBeenCalledWith(1234, 'SIGTERM');
      expect(fs.unlinkSync).toHaveBeenCalledWith(PID_FILE);
      killSpy.mockRestore();
    });
  });

  describe('migrate command', () => {
    it('should run migrations if database is empty', async () => {
      mockDataSource.showMigrations.mockResolvedValue(true);
      mockDataSource.query.mockResolvedValue([]); // No tables = empty

      await runCli(['node', 'index.js', 'migrate']);

      expect(mockDataSource.initialize).toHaveBeenCalled();
      expect(mockDataSource.runMigrations).toHaveBeenCalled();
    });

    it('should run migrations if pending are found', async () => {
      mockDataSource.showMigrations.mockResolvedValue(true);
      mockDataSource.query.mockResolvedValue([{ name: 'users' }]); // Tables exist

      (enquirer.prompt as jest.Mock).mockResolvedValue({
        confirmMigration: true,
      });

      await runCli(['node', 'index.js', 'migrate']);

      expect(mockDataSource.runMigrations).toHaveBeenCalled();
    });

    it('should force re-initialization when requested', async () => {
      (enquirer.prompt as jest.Mock)
        .mockResolvedValueOnce({ confirmForce: true }) // First prompt
        .mockResolvedValueOnce({ continue: '' }); // Press Enter prompt

      await runCli(['node', 'index.js', 'migrate', '--force']);

      expect(mockDataSource.dropDatabase).toHaveBeenCalled();
      expect(mockDataSource.runMigrations).toHaveBeenCalled();
    });
  });
});
