jest.mock('fs');
jest.mock('child_process');

import * as fs from 'fs';
import * as childProcess from 'child_process';
import { startServer } from '../process-manager';

const FAKE_PID_DIR = '/home/user/.agent-orchestrator-start';
const FAKE_MAIN = '/app/dist/main.js';
const FAKE_ROOT = '/app';
const FAKE_LOG = '/home/user/.agent-orchestrator-start/server.log';
const FAKE_ENV = '/home/user/.agent-orchestrator-start/.env';

describe('startServer – log rotation env vars', () => {
  function getSpawnEnv(): NodeJS.ProcessEnv {
    const calls = (childProcess.spawn as jest.Mock).mock.calls as Parameters<
      typeof childProcess.spawn
    >[];
    const opts = calls[0][2] as { env: NodeJS.ProcessEnv };
    return opts.env;
  }

  beforeEach(() => {
    jest.resetAllMocks();

    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
    (fs.openSync as jest.Mock).mockReturnValue(5);
    (fs.closeSync as jest.Mock).mockReturnValue(undefined);
    (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);
    (fs.chmodSync as jest.Mock).mockReturnValue(undefined);
    // Provide a minimal .env so getConfiguredPort/Host resolves
    (fs.readFileSync as jest.Mock).mockReturnValue(
      'PORT=15789\nHOST=127.0.0.1\n',
    );

    (childProcess.spawn as jest.Mock).mockReturnValue({
      pid: 42,
      unref: jest.fn(),
    });
  });

  it('sets LOG_ROTATION_MAX_SIZE_MB in child env when logMaxSizeMb is given', () => {
    startServer(
      { logMaxSizeMb: 25 },
      FAKE_MAIN,
      FAKE_ROOT,
      FAKE_LOG,
      FAKE_PID_DIR,
      FAKE_ENV,
    );

    expect(getSpawnEnv().LOG_ROTATION_MAX_SIZE_MB).toBe('25');
  });

  it('sets LOG_ROTATION_MAX_FILES in child env when logMaxFiles is given', () => {
    startServer(
      { logMaxFiles: 8 },
      FAKE_MAIN,
      FAKE_ROOT,
      FAKE_LOG,
      FAKE_PID_DIR,
      FAKE_ENV,
    );

    expect(getSpawnEnv().LOG_ROTATION_MAX_FILES).toBe('8');
  });

  it('does not set log rotation env vars when options are absent', () => {
    startServer({}, FAKE_MAIN, FAKE_ROOT, FAKE_LOG, FAKE_PID_DIR, FAKE_ENV);

    expect(getSpawnEnv().LOG_ROTATION_MAX_SIZE_MB).toBeUndefined();
    expect(getSpawnEnv().LOG_ROTATION_MAX_FILES).toBeUndefined();
  });

  it('sets both log rotation env vars when both options are given', () => {
    startServer(
      { logMaxSizeMb: 10, logMaxFiles: 4 },
      FAKE_MAIN,
      FAKE_ROOT,
      FAKE_LOG,
      FAKE_PID_DIR,
      FAKE_ENV,
    );

    expect(getSpawnEnv().LOG_ROTATION_MAX_SIZE_MB).toBe('10');
    expect(getSpawnEnv().LOG_ROTATION_MAX_FILES).toBe('4');
  });
});
