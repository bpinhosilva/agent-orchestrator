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

  it('persists process metadata with the stable active server.log path', () => {
    startServer(
      { logMaxSizeMb: 10, logMaxFiles: 4 },
      FAKE_MAIN,
      FAKE_ROOT,
      FAKE_LOG,
      FAKE_PID_DIR,
      FAKE_ENV,
    );

    const writeFileCalls = (fs.writeFileSync as jest.Mock).mock.calls as Array<
      [string, string]
    >;
    const processMetadataWrite = writeFileCalls.find(([, content]) =>
      content.includes(`"logFile": "${FAKE_LOG}"`),
    );
    expect(processMetadataWrite).toBeDefined();
    expect(processMetadataWrite?.[1]).toContain(`"logFile": "${FAKE_LOG}"`);
  });
});

describe('startServer – stdio / file-redirect removal', () => {
  function getSpawnCall(): Parameters<typeof childProcess.spawn> {
    const calls = (childProcess.spawn as jest.Mock).mock.calls as Parameters<
      typeof childProcess.spawn
    >[];
    return calls[0];
  }

  beforeEach(() => {
    jest.resetAllMocks();

    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
    (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);
    (fs.chmodSync as jest.Mock).mockReturnValue(undefined);
    (fs.readFileSync as jest.Mock).mockReturnValue(
      'PORT=15789\nHOST=127.0.0.1\n',
    );

    (childProcess.spawn as jest.Mock).mockReturnValue({
      pid: 42,
      unref: jest.fn(),
    });
  });

  it('does NOT open a log-file fd via fs.openSync', () => {
    startServer({}, FAKE_MAIN, FAKE_ROOT, FAKE_LOG, FAKE_PID_DIR, FAKE_ENV);
    expect(fs.openSync).not.toHaveBeenCalled();
  });

  it('does NOT close a log-file fd via fs.closeSync', () => {
    startServer({}, FAKE_MAIN, FAKE_ROOT, FAKE_LOG, FAKE_PID_DIR, FAKE_ENV);
    expect(fs.closeSync).not.toHaveBeenCalled();
  });

  it('spawns with ignore stdio so child manages its own logging', () => {
    startServer({}, FAKE_MAIN, FAKE_ROOT, FAKE_LOG, FAKE_PID_DIR, FAKE_ENV);
    const [, , opts] = getSpawnCall();
    expect((opts as { stdio: unknown }).stdio).toEqual([
      'ignore',
      'ignore',
      'ignore',
    ]);
  });

  // Fix 3: preload module is required so pre-bootstrap crashes reach server.log
  it('spawns node with --require pointing to the preload module', () => {
    startServer({}, FAKE_MAIN, FAKE_ROOT, FAKE_LOG, FAKE_PID_DIR, FAKE_ENV);
    const [cmd, args] = getSpawnCall();
    expect(cmd).toBe('node');
    expect(args[0]).toBe('--require');
    // preload lives alongside main, in dist/cli/preload.js relative to packageRoot
    expect(args[1]).toBe(`${FAKE_ROOT}/dist/cli/preload.js`);
    expect(args[2]).toBe(FAKE_MAIN);
  });
});
