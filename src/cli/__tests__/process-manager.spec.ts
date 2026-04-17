/* eslint-disable @typescript-eslint/unbound-method */
import {
  findManagedProcess,
  persistProcessMetadata,
  removeRuntimeState,
  isManagedProcess,
  checkIfRunning,
  getChildEnvironment,
  formatProcessSummary,
  assertBuildExists,
} from '../process-manager';
import { LOG_FILE, PROCESS_FILE, MAIN_FILE, PACKAGE_ROOT } from '../constants';
import type { FileSystem, ManagedProcess } from '../types';

const FAKE_ROOT = '/app';
const FAKE_MAIN = '/app/dist/main.js';
const FAKE_PID_DIR = '/home/user/.agent-orchestrator';
const FAKE_PID_FILE = `${FAKE_PID_DIR}/pid`;
const FAKE_PROCESS_FILE = `${FAKE_PID_DIR}/process.json`;
const FAKE_LOG_FILE = `${FAKE_PID_DIR}/server.log`;
const FAKE_ENV_PATH = `${FAKE_PID_DIR}/.env`;
const FAKE_UI_FILE = '/app/dist/ui/index.html';

function buildFakeFs(overrides: Partial<FileSystem> = {}): FileSystem {
  return {
    existsSync: jest.fn().mockReturnValue(false),
    readFileSync: jest.fn().mockReturnValue(''),
    writeFileSync: jest.fn(),
    chmodSync: jest.fn(),
    unlinkSync: jest.fn(),
    mkdirSync: jest.fn(),
    openSync: jest.fn().mockReturnValue(1),
    readdirSync: jest.fn().mockReturnValue([]),
    readlinkSync: jest.fn().mockReturnValue(''),
    ...overrides,
  };
}

let originalEnv: NodeJS.ProcessEnv;
beforeEach(() => {
  originalEnv = { ...process.env };
});
afterEach(() => {
  process.env = originalEnv;
  jest.restoreAllMocks();
});

describe('removeRuntimeState', () => {
  it('removes PID and process files when they exist', () => {
    const fakeFs = buildFakeFs({ existsSync: jest.fn().mockReturnValue(true) });
    removeRuntimeState(FAKE_PID_FILE, FAKE_PROCESS_FILE, fakeFs);
    expect(fakeFs.unlinkSync).toHaveBeenCalledWith(FAKE_PID_FILE);
    expect(fakeFs.unlinkSync).toHaveBeenCalledWith(FAKE_PROCESS_FILE);
  });
  it('does nothing when files do not exist', () => {
    const fakeFs = buildFakeFs({
      existsSync: jest.fn().mockReturnValue(false),
    });
    removeRuntimeState(FAKE_PID_FILE, FAKE_PROCESS_FILE, fakeFs);
    expect(fakeFs.unlinkSync).not.toHaveBeenCalled();
  });
  it('unlinks only pid file when only pid file exists', () => {
    const fakeFs = buildFakeFs({
      existsSync: jest
        .fn()
        .mockImplementation((p: string) => p === FAKE_PID_FILE),
    });
    removeRuntimeState(FAKE_PID_FILE, FAKE_PROCESS_FILE, fakeFs);
    expect(fakeFs.unlinkSync).toHaveBeenCalledWith(FAKE_PID_FILE);
    expect(fakeFs.unlinkSync).not.toHaveBeenCalledWith(FAKE_PROCESS_FILE);
  });
  it('unlinks only process file when only process file exists', () => {
    const fakeFs = buildFakeFs({
      existsSync: jest
        .fn()
        .mockImplementation((p: string) => p === FAKE_PROCESS_FILE),
    });
    removeRuntimeState(FAKE_PID_FILE, FAKE_PROCESS_FILE, fakeFs);
    expect(fakeFs.unlinkSync).not.toHaveBeenCalledWith(FAKE_PID_FILE);
    expect(fakeFs.unlinkSync).toHaveBeenCalledWith(FAKE_PROCESS_FILE);
  });
  it('tolerates ENOENT if file disappears between existsSync and unlinkSync', () => {
    const enoent = Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    const fakeFs = buildFakeFs({
      existsSync: jest.fn().mockReturnValue(true),
      unlinkSync: jest.fn().mockImplementation(() => {
        throw enoent;
      }),
    });
    expect(() =>
      removeRuntimeState(FAKE_PID_FILE, FAKE_PROCESS_FILE, fakeFs),
    ).not.toThrow();
  });
  it('re-throws non-ENOENT errors from unlinkSync', () => {
    const eperm = Object.assign(new Error('EPERM'), { code: 'EPERM' });
    const fakeFs = buildFakeFs({
      existsSync: jest.fn().mockReturnValue(true),
      unlinkSync: jest.fn().mockImplementation(() => {
        throw eperm;
      }),
    });
    expect(() =>
      removeRuntimeState(FAKE_PID_FILE, FAKE_PROCESS_FILE, fakeFs),
    ).toThrow('EPERM');
  });
});

describe('persistProcessMetadata', () => {
  it('writes PID file and process.json with mode 600', () => {
    const fakeFs = buildFakeFs();
    const meta = {
      pid: 1234,
      cwd: FAKE_ROOT,
      mainPath: FAKE_MAIN,
      host: '127.0.0.1',
      port: '3000',
      logFile: FAKE_LOG_FILE,
      startedAt: '2026-01-01T00:00:00.000Z',
    };
    persistProcessMetadata(meta, FAKE_PID_FILE, FAKE_PROCESS_FILE, fakeFs);
    expect(fakeFs.writeFileSync).toHaveBeenCalledWith(FAKE_PID_FILE, '1234\n', {
      mode: 0o600,
    });
    expect(fakeFs.writeFileSync).toHaveBeenCalledWith(
      FAKE_PROCESS_FILE,
      expect.stringContaining('"pid": 1234'),
      { mode: 0o600 },
    );
    expect(fakeFs.chmodSync).toHaveBeenCalledWith(FAKE_PID_FILE, 0o600);
    expect(fakeFs.chmodSync).toHaveBeenCalledWith(FAKE_PROCESS_FILE, 0o600);
  });
});

describe('formatProcessSummary', () => {
  it('includes pid, host, port, cwd, mainPath in output', () => {
    const proc: ManagedProcess = {
      pid: 42,
      source: 'metadata',
      cwd: FAKE_ROOT,
      mainPath: FAKE_MAIN,
      host: '127.0.0.1',
      port: '8080',
    };
    const summary = formatProcessSummary(proc, FAKE_LOG_FILE);
    expect(summary).toContain('PID: 42');
    expect(summary).toContain('Host: 127.0.0.1');
    expect(summary).toContain('Port: 8080');
    expect(summary).toContain(FAKE_ROOT);
  });
  it('uses default LOG_FILE constant when no logFile argument passed', () => {
    const proc: ManagedProcess = {
      pid: 1,
      source: 'scan',
      cwd: FAKE_ROOT,
      mainPath: FAKE_MAIN,
      host: '0.0.0.0',
      port: '15789',
    };
    const summary = formatProcessSummary(proc);
    expect(summary).toContain(`Log file: ${LOG_FILE}`);
  });
});

describe('getChildEnvironment', () => {
  it('always includes AGENT_ORCHESTRATOR_HOME and NODE_ENV', () => {
    const env = getChildEnvironment(FAKE_PID_DIR);
    expect(env.AGENT_ORCHESTRATOR_HOME).toBe(FAKE_PID_DIR);
    expect(env.NODE_ENV).toBe('production');
  });
  it('does not leak arbitrary env vars', () => {
    process.env.SUPER_SECRET = 'leaked';
    const env = getChildEnvironment(FAKE_PID_DIR);
    expect(env.SUPER_SECRET).toBeUndefined();
    delete process.env.SUPER_SECRET;
  });
  it('forwards allowed vars (PATH, HOME) when set in process.env', () => {
    const origPath = process.env.PATH;
    const origHome = process.env.HOME;
    process.env.PATH = '/usr/bin:/bin';
    process.env.HOME = '/home/testuser';
    const env = getChildEnvironment(FAKE_PID_DIR);
    expect(env.PATH).toBe('/usr/bin:/bin');
    expect(env.HOME).toBe('/home/testuser');
    process.env.PATH = origPath;
    process.env.HOME = origHome;
  });
  it('does not include DATABASE_URL even when set in process.env', () => {
    process.env.DATABASE_URL = 'postgres://localhost/db';
    const env = getChildEnvironment(FAKE_PID_DIR);
    expect(env.DATABASE_URL).toBeUndefined();
    delete process.env.DATABASE_URL;
  });
});

describe('getConfiguredPort', () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock('../../config/port.defaults');
  });

  it('uses the shared runtime default port when the env file is missing', () => {
    const fakeFs = buildFakeFs({
      existsSync: jest.fn().mockReturnValue(false),
    });

    jest.isolateModules(() => {
      jest.doMock('../../config/port.defaults', () => ({
        getDefaultPort: jest.fn().mockReturnValue(4242),
      }));

      const { getConfiguredPort } =
        jest.requireActual<typeof import('../process-manager')>(
          '../process-manager',
        );

      expect(getConfiguredPort(FAKE_ENV_PATH, fakeFs)).toBe('4242');
    });
  });
});

describe('assertBuildExists', () => {
  it('throws when main file is missing', () => {
    const fakeFs = buildFakeFs({
      existsSync: jest
        .fn()
        .mockImplementation((p: string) => p === FAKE_UI_FILE),
    });
    expect(() => assertBuildExists(FAKE_MAIN, FAKE_UI_FILE, fakeFs)).toThrow(
      'Missing backend build',
    );
  });
  it('throws when UI file is missing', () => {
    const fakeFs = buildFakeFs({
      existsSync: jest.fn().mockImplementation((p: string) => p === FAKE_MAIN),
    });
    expect(() => assertBuildExists(FAKE_MAIN, FAKE_UI_FILE, fakeFs)).toThrow(
      'Missing UI build',
    );
  });
  it('does not throw when both exist', () => {
    const fakeFs = buildFakeFs({ existsSync: jest.fn().mockReturnValue(true) });
    expect(() =>
      assertBuildExists(FAKE_MAIN, FAKE_UI_FILE, fakeFs),
    ).not.toThrow();
  });
});

describe('isManagedProcess', () => {
  it('returns false when process.kill throws with code ESRCH (no such process)', () => {
    const fakeFs = buildFakeFs();
    const esrch = Object.assign(new Error('ESRCH'), { code: 'ESRCH' });
    const killSpy = jest.spyOn(process, 'kill').mockImplementation(() => {
      throw esrch;
    });
    const result = isManagedProcess(
      9999,
      { cwd: FAKE_ROOT, mainPath: FAKE_MAIN },
      fakeFs,
    );
    expect(result).toBe(false);
    killSpy.mockRestore();
  });

  it('continues probing when process.kill throws EPERM and returns true on match', () => {
    const eperm = Object.assign(new Error('EPERM'), { code: 'EPERM' });
    const fakeFs = buildFakeFs({
      existsSync: jest.fn().mockReturnValue(true),
      readFileSync: jest.fn().mockImplementation((p: string) => {
        if (p === '/proc/100/cmdline') return `node\u0000${FAKE_MAIN}\u0000`;
        return '';
      }),
      readlinkSync: jest.fn().mockReturnValue(FAKE_ROOT),
    });
    const killSpy = jest.spyOn(process, 'kill').mockImplementation(() => {
      throw eperm;
    });
    const result = isManagedProcess(
      100,
      { cwd: FAKE_ROOT, mainPath: FAKE_MAIN },
      fakeFs,
    );
    expect(result).toBe(true);
    killSpy.mockRestore();
  });

  it('continues probing when process.kill throws EPERM and returns false on mismatch', () => {
    const eperm = Object.assign(new Error('EPERM'), { code: 'EPERM' });
    const fakeFs = buildFakeFs({
      existsSync: jest.fn().mockReturnValue(true),
      readFileSync: jest.fn().mockImplementation((p: string) => {
        if (p === '/proc/100/cmdline') return `node\u0000/other/path.js\u0000`;
        return '';
      }),
      readlinkSync: jest.fn().mockReturnValue(FAKE_ROOT),
    });
    const killSpy = jest.spyOn(process, 'kill').mockImplementation(() => {
      throw eperm;
    });
    const result = isManagedProcess(
      100,
      { cwd: FAKE_ROOT, mainPath: FAKE_MAIN },
      fakeFs,
    );
    expect(result).toBe(false);
    killSpy.mockRestore();
  });

  it('returns false when process.kill throws (process not running)', () => {
    const fakeFs = buildFakeFs();
    const killSpy = jest.spyOn(process, 'kill').mockImplementation(() => {
      throw new Error('ESRCH');
    });
    const result = isManagedProcess(
      9999,
      { cwd: FAKE_ROOT, mainPath: FAKE_MAIN },
      fakeFs,
    );
    expect(result).toBe(false);
    killSpy.mockRestore();
  });

  it('returns false when cmdline does not contain mainPath', () => {
    const fakeFs = buildFakeFs({
      existsSync: jest.fn().mockReturnValue(true),
      readFileSync: jest.fn().mockImplementation((p: string) => {
        if (p === '/proc/100/cmdline') return `node\u0000/other/path.js\u0000`;
        return '';
      }),
      readlinkSync: jest.fn().mockReturnValue(FAKE_ROOT),
    });
    const killSpy = jest.spyOn(process, 'kill').mockImplementation(() => true);
    const result = isManagedProcess(
      100,
      { cwd: FAKE_ROOT, mainPath: FAKE_MAIN },
      fakeFs,
    );
    expect(result).toBe(false);
    killSpy.mockRestore();
  });

  it('returns false when /proc/<pid>/cwd resolves to a different directory', () => {
    const fakeFs = buildFakeFs({
      existsSync: jest.fn().mockReturnValue(true),
      readFileSync: jest.fn().mockImplementation((p: string) => {
        if (p === '/proc/100/cmdline') return `node\u0000${FAKE_MAIN}\u0000`;
        return '';
      }),
      readlinkSync: jest.fn().mockReturnValue('/different/dir'),
    });
    const killSpy = jest.spyOn(process, 'kill').mockImplementation(() => true);
    const result = isManagedProcess(
      100,
      { cwd: FAKE_ROOT, mainPath: FAKE_MAIN },
      fakeFs,
    );
    expect(result).toBe(false);
    killSpy.mockRestore();
  });

  it('returns true when cmdline and cwd both match', () => {
    const fakeFs = buildFakeFs({
      existsSync: jest.fn().mockReturnValue(true),
      readFileSync: jest.fn().mockImplementation((p: string) => {
        if (p === '/proc/100/cmdline') return `node\u0000${FAKE_MAIN}\u0000`;
        return '';
      }),
      readlinkSync: jest.fn().mockReturnValue(FAKE_ROOT),
    });
    const killSpy = jest.spyOn(process, 'kill').mockImplementation(() => true);
    const result = isManagedProcess(
      100,
      { cwd: FAKE_ROOT, mainPath: FAKE_MAIN },
      fakeFs,
    );
    expect(result).toBe(true);
    killSpy.mockRestore();
  });
});

describe('findManagedProcess', () => {
  it('returns null and cleans state when no process found', () => {
    const fakeFs = buildFakeFs({
      existsSync: jest.fn().mockReturnValue(false),
      readdirSync: jest.fn().mockReturnValue([]),
    });
    const killSpy = jest.spyOn(process, 'kill').mockImplementation(() => {
      throw new Error('no process');
    });
    const result = findManagedProcess(
      FAKE_PID_FILE,
      FAKE_PROCESS_FILE,
      FAKE_MAIN,
      FAKE_ROOT,
      FAKE_LOG_FILE,
      FAKE_ENV_PATH,
      fakeFs,
    );
    expect(result).toBeNull();
    killSpy.mockRestore();
  });

  it('returns process from metadata when valid', () => {
    const meta = {
      pid: 999,
      cwd: FAKE_ROOT,
      mainPath: FAKE_MAIN,
      host: '127.0.0.1',
      port: '3000',
      logFile: FAKE_LOG_FILE,
      startedAt: '2026-01-01T00:00:00.000Z',
    };
    const fakeFs = buildFakeFs({
      existsSync: jest
        .fn()
        .mockImplementation(
          (p: string) =>
            p === FAKE_PROCESS_FILE ||
            p === `/proc/999/cmdline` ||
            p === `/proc/999/cwd`,
        ),
      readFileSync: jest.fn().mockImplementation((p: string) => {
        if (p === FAKE_PROCESS_FILE) return JSON.stringify(meta);
        if (p === `/proc/999/cmdline`) return `node\u0000${FAKE_MAIN}\u0000`;
        return '';
      }),
      readlinkSync: jest.fn().mockReturnValue(FAKE_ROOT),
    });
    const killSpy = jest.spyOn(process, 'kill').mockImplementation(() => true);
    const result = findManagedProcess(
      FAKE_PID_FILE,
      FAKE_PROCESS_FILE,
      FAKE_MAIN,
      FAKE_ROOT,
      FAKE_LOG_FILE,
      FAKE_ENV_PATH,
      fakeFs,
    );
    expect(result).not.toBeNull();
    expect(result?.pid).toBe(999);
    expect(result?.source).toBe('metadata');
    killSpy.mockRestore();
  });

  it('falls back to source: pid-file when metadata process is dead', () => {
    const meta = {
      pid: 999,
      cwd: FAKE_ROOT,
      mainPath: FAKE_MAIN,
      host: '127.0.0.1',
      port: '3000',
      logFile: FAKE_LOG_FILE,
      startedAt: '2026-01-01T00:00:00.000Z',
    };
    const PID_FILE_PID = 888;
    const fakeFs = buildFakeFs({
      existsSync: jest
        .fn()
        .mockImplementation(
          (p: string) =>
            p === FAKE_PROCESS_FILE ||
            p === FAKE_PID_FILE ||
            p === `/proc/${PID_FILE_PID}/cmdline`,
        ),
      readFileSync: jest.fn().mockImplementation((p: string) => {
        if (p === FAKE_PROCESS_FILE) return JSON.stringify(meta);
        if (p === FAKE_PID_FILE) return `${PID_FILE_PID}\n`;
        if (p === `/proc/${PID_FILE_PID}/cmdline`)
          return `node\u0000${FAKE_MAIN}\u0000`;
        return '';
      }),
      readlinkSync: jest.fn().mockReturnValue(FAKE_ROOT),
    });
    const killSpy = jest
      .spyOn(process, 'kill')
      .mockImplementation((pid: number) => {
        if (pid === 999) throw new Error('ESRCH');
        return true;
      });
    const result = findManagedProcess(
      FAKE_PID_FILE,
      FAKE_PROCESS_FILE,
      FAKE_MAIN,
      FAKE_ROOT,
      FAKE_LOG_FILE,
      FAKE_ENV_PATH,
      fakeFs,
    );
    expect(result?.source).toBe('pid-file');
    expect(result?.pid).toBe(PID_FILE_PID);
    killSpy.mockRestore();
  });

  it('falls back to source: scan when metadata and pid-file are both dead', () => {
    const SCAN_PID = 777;
    const meta = {
      pid: 999,
      cwd: FAKE_ROOT,
      mainPath: FAKE_MAIN,
      host: '127.0.0.1',
      port: '3000',
      logFile: FAKE_LOG_FILE,
      startedAt: '2026-01-01T00:00:00.000Z',
    };
    const fakeFs = buildFakeFs({
      existsSync: jest
        .fn()
        .mockImplementation(
          (p: string) =>
            p === FAKE_PROCESS_FILE ||
            p === FAKE_PID_FILE ||
            p === '/proc' ||
            p === `/proc/${SCAN_PID}/cmdline`,
        ),
      readFileSync: jest.fn().mockImplementation((p: string) => {
        if (p === FAKE_PROCESS_FILE) return JSON.stringify(meta);
        if (p === FAKE_PID_FILE) return `888\n`;
        if (p === `/proc/${SCAN_PID}/cmdline`)
          return `node\u0000${FAKE_MAIN}\u0000`;
        return '';
      }),
      readdirSync: jest.fn().mockImplementation((p: string) => {
        if (p === '/proc') return [`${SCAN_PID}`, 'other'];
        return [];
      }),
      readlinkSync: jest.fn().mockReturnValue(FAKE_ROOT),
    });
    const killSpy = jest
      .spyOn(process, 'kill')
      .mockImplementation((pid: number) => {
        if (pid === 999 || pid === 888) throw new Error('ESRCH');
        return true;
      });
    const result = findManagedProcess(
      FAKE_PID_FILE,
      FAKE_PROCESS_FILE,
      FAKE_MAIN,
      FAKE_ROOT,
      FAKE_LOG_FILE,
      FAKE_ENV_PATH,
      fakeFs,
    );
    expect(result?.source).toBe('scan');
    expect(result?.pid).toBe(SCAN_PID);
    killSpy.mockRestore();
  });

  it('throws when scan finds multiple matching processes', () => {
    const meta = {
      pid: 999,
      cwd: FAKE_ROOT,
      mainPath: FAKE_MAIN,
      host: '127.0.0.1',
      port: '3000',
      logFile: FAKE_LOG_FILE,
      startedAt: '2026-01-01T00:00:00.000Z',
    };
    const fakeFs = buildFakeFs({
      existsSync: jest
        .fn()
        .mockImplementation(
          (p: string) =>
            p === FAKE_PROCESS_FILE ||
            p === '/proc' ||
            p === '/proc/100/cmdline' ||
            p === '/proc/200/cmdline',
        ),
      readFileSync: jest.fn().mockImplementation((p: string) => {
        if (p === FAKE_PROCESS_FILE) return JSON.stringify(meta);
        if (p === '/proc/100/cmdline' || p === '/proc/200/cmdline')
          return `node\u0000${FAKE_MAIN}\u0000`;
        return '';
      }),
      readdirSync: jest.fn().mockImplementation((p: string) => {
        if (p === '/proc') return ['100', '200', 'other'];
        return [];
      }),
      readlinkSync: jest.fn().mockReturnValue(FAKE_ROOT),
    });
    const killSpy = jest
      .spyOn(process, 'kill')
      .mockImplementation((pid: number) => {
        if (pid === 999) throw new Error('ESRCH');
        return true;
      });
    expect(() =>
      findManagedProcess(
        FAKE_PID_FILE,
        FAKE_PROCESS_FILE,
        FAKE_MAIN,
        FAKE_ROOT,
        FAKE_LOG_FILE,
        FAKE_ENV_PATH,
        fakeFs,
      ),
    ).toThrow('Multiple orchestrator processes');
    killSpy.mockRestore();
  });

  it('reads PORT from env file and includes it in returned process info', () => {
    const PID_FILE_PID = 888;
    const fakeFs = buildFakeFs({
      existsSync: jest
        .fn()
        .mockImplementation(
          (p: string) =>
            p === FAKE_PID_FILE ||
            p === FAKE_ENV_PATH ||
            p === `/proc/${PID_FILE_PID}/cmdline`,
        ),
      readFileSync: jest.fn().mockImplementation((p: string) => {
        if (p === FAKE_PID_FILE) return `${PID_FILE_PID}\n`;
        if (p === FAKE_ENV_PATH) return 'PORT=9999\n';
        if (p === `/proc/${PID_FILE_PID}/cmdline`)
          return `node\u0000${FAKE_MAIN}\u0000`;
        return '';
      }),
      readlinkSync: jest.fn().mockReturnValue(FAKE_ROOT),
    });
    const killSpy = jest.spyOn(process, 'kill').mockImplementation(() => true);
    const result = findManagedProcess(
      FAKE_PID_FILE,
      FAKE_PROCESS_FILE,
      FAKE_MAIN,
      FAKE_ROOT,
      FAKE_LOG_FILE,
      FAKE_ENV_PATH,
      fakeFs,
    );
    expect(result?.source).toBe('pid-file');
    expect(result?.port).toBe('9999');
    killSpy.mockRestore();
  });

  it('treats malformed/partial process.json as missing and falls through to pid-file', () => {
    const PID_FILE_PID = 888;
    const fakeFs = buildFakeFs({
      existsSync: jest
        .fn()
        .mockImplementation(
          (p: string) =>
            p === FAKE_PROCESS_FILE ||
            p === FAKE_PID_FILE ||
            p === `/proc/${PID_FILE_PID}/cmdline`,
        ),
      readFileSync: jest.fn().mockImplementation((p: string) => {
        if (p === FAKE_PROCESS_FILE) return '{"pid": "not-a-number"}';
        if (p === FAKE_PID_FILE) return `${PID_FILE_PID}\n`;
        if (p === `/proc/${PID_FILE_PID}/cmdline`)
          return `node\u0000${FAKE_MAIN}\u0000`;
        return '';
      }),
      readlinkSync: jest.fn().mockReturnValue(FAKE_ROOT),
    });
    const killSpy = jest.spyOn(process, 'kill').mockImplementation(() => true);
    const result = findManagedProcess(
      FAKE_PID_FILE,
      FAKE_PROCESS_FILE,
      FAKE_MAIN,
      FAKE_ROOT,
      FAKE_LOG_FILE,
      FAKE_ENV_PATH,
      fakeFs,
    );
    expect(result?.source).toBe('pid-file');
    expect(result?.pid).toBe(PID_FILE_PID);
    killSpy.mockRestore();
  });
});

describe('checkIfRunning', () => {
  it('returns pid when a managed process is found', () => {
    const pid = 12345;
    const meta = {
      pid,
      cwd: PACKAGE_ROOT,
      mainPath: MAIN_FILE,
      host: '127.0.0.1',
      port: '15789',
      logFile: LOG_FILE,
      startedAt: '2026-01-01T00:00:00.000Z',
    };
    const fakeFs = buildFakeFs({
      existsSync: jest
        .fn()
        .mockImplementation(
          (p: string) => p === PROCESS_FILE || p === `/proc/${pid}/cmdline`,
        ),
      readFileSync: jest.fn().mockImplementation((p: string) => {
        if (p === PROCESS_FILE) return JSON.stringify(meta);
        if (p === `/proc/${pid}/cmdline`) return `node\u0000${MAIN_FILE}\u0000`;
        return '';
      }),
      readlinkSync: jest.fn().mockReturnValue(PACKAGE_ROOT),
    });
    const killSpy = jest.spyOn(process, 'kill').mockImplementation(() => true);
    const result = checkIfRunning(fakeFs);
    expect(result).toBe(pid);
    killSpy.mockRestore();
  });

  it('returns null when no managed process is found', () => {
    const fakeFs = buildFakeFs({
      existsSync: jest.fn().mockReturnValue(false),
      readdirSync: jest.fn().mockReturnValue([]),
    });
    const killSpy = jest.spyOn(process, 'kill').mockImplementation(() => {
      throw new Error('ESRCH');
    });
    const result = checkIfRunning(fakeFs);
    expect(result).toBeNull();
    killSpy.mockRestore();
  });
});
