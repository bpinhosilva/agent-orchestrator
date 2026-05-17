/* eslint-disable @typescript-eslint/unbound-method */
import * as os from 'os';
import * as path from 'path';
import {
  shouldEnableFileLogging,
  getLogRotationOptions,
  RotatingFileLogger,
  DEFAULT_MAX_SIZE_MB,
  DEFAULT_MAX_FILES,
  LOG_FILENAME,
  persistRuntimeLoggerInitFailure,
  type LoggerFs,
} from './runtime-logger';

const FAKE_HOME = '/home/user/.agent-orchestrator';

function buildFakeFs(overrides: Partial<LoggerFs> = {}): jest.Mocked<LoggerFs> {
  return {
    existsSync: jest.fn().mockReturnValue(false),
    mkdirSync: jest.fn(),
    statSync: jest.fn().mockReturnValue({ size: 0 }),
    appendFileSync: jest.fn(),
    renameSync: jest.fn(),
    readdirSync: jest.fn().mockReturnValue([]),
    unlinkSync: jest.fn(),
    ...overrides,
  } as jest.Mocked<LoggerFs>;
}

let savedEnv: NodeJS.ProcessEnv;

beforeEach(() => {
  savedEnv = { ...process.env };
  delete process.env.AGENT_ORCHESTRATOR_HOME;
  delete process.env.LOG_ROTATION_MAX_SIZE_MB;
  delete process.env.LOG_ROTATION_MAX_FILES;
});

afterEach(() => {
  process.env = savedEnv;
});

// ---------------------------------------------------------------------------
// shouldEnableFileLogging
// ---------------------------------------------------------------------------

describe('shouldEnableFileLogging', () => {
  it('returns false when no relevant env vars are set', () => {
    expect(shouldEnableFileLogging()).toBe(false);
  });

  it('returns true when AGENT_ORCHESTRATOR_HOME is set', () => {
    process.env.AGENT_ORCHESTRATOR_HOME = FAKE_HOME;
    expect(shouldEnableFileLogging()).toBe(true);
  });

  it('returns true when LOG_ROTATION_MAX_SIZE_MB is set (Docker opt-in)', () => {
    process.env.LOG_ROTATION_MAX_SIZE_MB = '20';
    expect(shouldEnableFileLogging()).toBe(true);
  });

  it('returns true when LOG_ROTATION_MAX_FILES is set (Docker opt-in)', () => {
    process.env.LOG_ROTATION_MAX_FILES = '6';
    expect(shouldEnableFileLogging()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getLogRotationOptions
// ---------------------------------------------------------------------------

describe('getLogRotationOptions', () => {
  it('returns null when file logging is disabled', () => {
    expect(getLogRotationOptions()).toBeNull();
  });

  it('uses defaults when AGENT_ORCHESTRATOR_HOME is set without size/files overrides', () => {
    process.env.AGENT_ORCHESTRATOR_HOME = FAKE_HOME;
    const opts = getLogRotationOptions();
    expect(opts).not.toBeNull();
    expect(opts!.logDir).toBe(FAKE_HOME);
    expect(opts!.maxSizeMb).toBe(DEFAULT_MAX_SIZE_MB);
    expect(opts!.maxFiles).toBe(DEFAULT_MAX_FILES);
  });

  it('respects LOG_ROTATION_MAX_SIZE_MB override', () => {
    process.env.AGENT_ORCHESTRATOR_HOME = FAKE_HOME;
    process.env.LOG_ROTATION_MAX_SIZE_MB = '50';
    const opts = getLogRotationOptions();
    expect(opts!.maxSizeMb).toBe(50);
  });

  it('respects LOG_ROTATION_MAX_FILES override', () => {
    process.env.AGENT_ORCHESTRATOR_HOME = FAKE_HOME;
    process.env.LOG_ROTATION_MAX_FILES = '8';
    const opts = getLogRotationOptions();
    expect(opts!.maxFiles).toBe(8);
  });

  // Fix 4: Docker opt-in must use os.tmpdir(), not process.cwd()
  it('uses os.tmpdir() as logDir when rotation opt-in env vars are set without AGENT_ORCHESTRATOR_HOME', () => {
    process.env.LOG_ROTATION_MAX_SIZE_MB = '5';
    const opts = getLogRotationOptions();
    expect(opts!.logDir).toBe(os.tmpdir());
  });
});

// ---------------------------------------------------------------------------
// getLogRotationOptions – strict env parsing (Fix 2)
// ---------------------------------------------------------------------------

describe('getLogRotationOptions – strict integer parsing', () => {
  const badValues = ['1.5', '1e2', '10foo', '-1', '0', '01', ' 10', '10 ', ''];

  describe('LOG_ROTATION_MAX_SIZE_MB', () => {
    for (const bad of badValues) {
      it(`throws on malformed value "${bad}"`, () => {
        process.env.AGENT_ORCHESTRATOR_HOME = FAKE_HOME;
        process.env.LOG_ROTATION_MAX_SIZE_MB = bad;
        expect(() => getLogRotationOptions()).toThrow(
          /LOG_ROTATION_MAX_SIZE_MB/,
        );
      });
    }

    it('accepts a plain positive integer string', () => {
      process.env.AGENT_ORCHESTRATOR_HOME = FAKE_HOME;
      process.env.LOG_ROTATION_MAX_SIZE_MB = '25';
      expect(() => getLogRotationOptions()).not.toThrow();
      expect(getLogRotationOptions()!.maxSizeMb).toBe(25);
    });
  });

  describe('LOG_ROTATION_MAX_FILES', () => {
    for (const bad of badValues) {
      it(`throws on malformed value "${bad}"`, () => {
        process.env.AGENT_ORCHESTRATOR_HOME = FAKE_HOME;
        process.env.LOG_ROTATION_MAX_FILES = bad;
        expect(() => getLogRotationOptions()).toThrow(/LOG_ROTATION_MAX_FILES/);
      });
    }

    it('accepts a plain positive integer string', () => {
      process.env.AGENT_ORCHESTRATOR_HOME = FAKE_HOME;
      process.env.LOG_ROTATION_MAX_FILES = '6';
      expect(() => getLogRotationOptions()).not.toThrow();
      expect(getLogRotationOptions()!.maxFiles).toBe(6);
    });
  });
});

describe('persistRuntimeLoggerInitFailure', () => {
  it('writes preload failures to the packaged runtime server.log path', () => {
    process.env.AGENT_ORCHESTRATOR_HOME = FAKE_HOME;
    const fsDep = buildFakeFs();

    const writtenPath = persistRuntimeLoggerInitFailure('boom', fsDep);

    expect(writtenPath).toBe(path.join(FAKE_HOME, LOG_FILENAME));
    expect(fsDep.mkdirSync).toHaveBeenCalledWith(FAKE_HOME, {
      recursive: true,
      mode: 0o700,
    });
    expect(fsDep.appendFileSync).toHaveBeenCalledWith(
      path.join(FAKE_HOME, LOG_FILENAME),
      expect.stringContaining('boom'),
    );
  });

  it('writes preload failures to the Docker opt-in log path when no runtime home is set', () => {
    process.env.LOG_ROTATION_MAX_SIZE_MB = '5';
    const fsDep = buildFakeFs();

    const writtenPath = persistRuntimeLoggerInitFailure('docker boom', fsDep);

    expect(writtenPath).toBe(path.join(os.tmpdir(), LOG_FILENAME));
    expect(fsDep.appendFileSync).toHaveBeenCalledWith(
      path.join(os.tmpdir(), LOG_FILENAME),
      expect.stringContaining('docker boom'),
    );
  });
});

// ---------------------------------------------------------------------------
// RotatingFileLogger – init / teardown
// ---------------------------------------------------------------------------

describe('RotatingFileLogger – init and teardown', () => {
  let logger: RotatingFileLogger;
  const originalStdoutWrite = process.stdout.write;
  const originalStderrWrite = process.stderr.write;

  afterEach(() => {
    logger?.teardown();
    // Safety-restore in case teardown wasn't called
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
  });

  it('creates logDir if it does not exist', () => {
    const fsDep = buildFakeFs({ existsSync: jest.fn().mockReturnValue(false) });
    logger = new RotatingFileLogger({
      logDir: FAKE_HOME,
      maxSizeMb: 10,
      maxFiles: 4,
      fsDep,
    });
    logger.init();
    expect(fsDep.mkdirSync).toHaveBeenCalledWith(FAKE_HOME, {
      recursive: true,
      mode: 0o700,
    });
  });

  it('does not call mkdirSync when logDir already exists', () => {
    const fsDep = buildFakeFs({ existsSync: jest.fn().mockReturnValue(true) });
    logger = new RotatingFileLogger({
      logDir: FAKE_HOME,
      maxSizeMb: 10,
      maxFiles: 4,
      fsDep,
    });
    logger.init();
    expect(fsDep.mkdirSync).not.toHaveBeenCalled();
  });

  it('patches process.stdout.write after init', () => {
    const fsDep = buildFakeFs();
    logger = new RotatingFileLogger({
      logDir: FAKE_HOME,
      maxSizeMb: 10,
      maxFiles: 4,
      fsDep,
    });
    logger.init();
    expect(process.stdout.write).not.toBe(originalStdoutWrite);
  });

  it('patches process.stderr.write after init', () => {
    const fsDep = buildFakeFs();
    logger = new RotatingFileLogger({
      logDir: FAKE_HOME,
      maxSizeMb: 10,
      maxFiles: 4,
      fsDep,
    });
    logger.init();
    expect(process.stderr.write).not.toBe(originalStderrWrite);
  });

  it('restores process.stdout.write after teardown', () => {
    const fsDep = buildFakeFs();
    logger = new RotatingFileLogger({
      logDir: FAKE_HOME,
      maxSizeMb: 10,
      maxFiles: 4,
      fsDep,
    });
    logger.init();
    logger.teardown();
    expect(process.stdout.write).toBe(originalStdoutWrite);
  });

  it('restores process.stderr.write after teardown', () => {
    const fsDep = buildFakeFs();
    logger = new RotatingFileLogger({
      logDir: FAKE_HOME,
      maxSizeMb: 10,
      maxFiles: 4,
      fsDep,
    });
    logger.init();
    logger.teardown();
    expect(process.stderr.write).toBe(originalStderrWrite);
  });

  it('is idempotent: calling init twice does not double-patch', () => {
    const fsDep = buildFakeFs();
    logger = new RotatingFileLogger({
      logDir: FAKE_HOME,
      maxSizeMb: 10,
      maxFiles: 4,
      fsDep,
    });
    logger.init();
    const patchedWrite = process.stdout.write;
    logger.init();
    expect(process.stdout.write).toBe(patchedWrite);
  });

  it('exposes the stable logFilePath', () => {
    const fsDep = buildFakeFs();
    logger = new RotatingFileLogger({
      logDir: FAKE_HOME,
      maxSizeMb: 10,
      maxFiles: 4,
      fsDep,
    });
    expect(logger.logFilePath).toBe(path.join(FAKE_HOME, LOG_FILENAME));
  });
});

// ---------------------------------------------------------------------------
// RotatingFileLogger – tee behaviour
// ---------------------------------------------------------------------------

describe('RotatingFileLogger – tee behaviour', () => {
  let logger: RotatingFileLogger;
  let fsDep: jest.Mocked<LoggerFs>;
  const capturedStdoutWrites: string[] = [];
  let originalStdoutWrite: typeof process.stdout.write;
  let originalStderrWrite: typeof process.stderr.write;

  beforeEach(() => {
    capturedStdoutWrites.length = 0;
    originalStdoutWrite = process.stdout.write;
    originalStderrWrite = process.stderr.write;

    // Intercept original write so tests don't spam Jest output
    jest
      .spyOn(process.stdout, 'write')
      .mockImplementation((chunk: string | Uint8Array) => {
        capturedStdoutWrites.push(String(chunk));
        return true;
      });

    fsDep = buildFakeFs({ existsSync: jest.fn().mockReturnValue(true) });
    logger = new RotatingFileLogger({
      logDir: FAKE_HOME,
      maxSizeMb: 10,
      maxFiles: 4,
      fsDep,
    });
    logger.init();
  });

  afterEach(() => {
    logger.teardown();
    jest.restoreAllMocks();
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
  });

  it('writes chunk to the log file when stdout is written', () => {
    process.stdout.write('hello log\n');
    expect(fsDep.appendFileSync).toHaveBeenCalledWith(
      path.join(FAKE_HOME, LOG_FILENAME),
      'hello log\n',
    );
  });

  it('still calls original stdout.write (tee)', () => {
    process.stdout.write('tee test\n');
    expect(capturedStdoutWrites).toContain('tee test\n');
  });

  it('writes chunk to the log file when stderr is written', () => {
    process.stderr.write('error line\n');
    expect(fsDep.appendFileSync).toHaveBeenCalledWith(
      path.join(FAKE_HOME, LOG_FILENAME),
      'error line\n',
    );
  });
});

// ---------------------------------------------------------------------------
// RotatingFileLogger – rotation logic
// ---------------------------------------------------------------------------

describe('RotatingFileLogger – rotation', () => {
  let logger: RotatingFileLogger;
  const FIXED_NOW = new Date('2024-06-15T12:30:00.000Z');
  const EXPECTED_TS = '2024-06-15T12-30-00-000Z';
  const ROTATED_NAME = `server-${EXPECTED_TS}.log`;

  afterEach(() => {
    logger?.teardown();
  });

  it('does NOT rotate when file is under the size threshold', () => {
    const fsDep = buildFakeFs({
      existsSync: jest.fn().mockReturnValue(true),
      statSync: jest.fn().mockReturnValue({ size: 1024 }), // 1 KB, way under 10 MB
    });
    logger = new RotatingFileLogger({
      logDir: FAKE_HOME,
      maxSizeMb: 10,
      maxFiles: 4,
      fsDep,
      getNow: () => FIXED_NOW,
    });
    logger.rotateIfNeeded();
    expect(fsDep.renameSync).not.toHaveBeenCalled();
  });

  it('rotates when file meets or exceeds size threshold', () => {
    const fsDep = buildFakeFs({
      existsSync: jest.fn().mockReturnValue(true),
      statSync: jest.fn().mockReturnValue({ size: 10 * 1024 * 1024 }), // exactly 10 MB
    });
    logger = new RotatingFileLogger({
      logDir: FAKE_HOME,
      maxSizeMb: 10,
      maxFiles: 4,
      fsDep,
      getNow: () => FIXED_NOW,
    });
    logger.rotateIfNeeded();
    expect(fsDep.renameSync).toHaveBeenCalledWith(
      path.join(FAKE_HOME, LOG_FILENAME),
      path.join(FAKE_HOME, ROTATED_NAME),
    );
  });

  it('uses a UTC-timestamp-based name for rotated archive', () => {
    const fsDep = buildFakeFs({
      existsSync: jest.fn().mockReturnValue(true),
      statSync: jest.fn().mockReturnValue({ size: 20 * 1024 * 1024 }),
    });
    logger = new RotatingFileLogger({
      logDir: FAKE_HOME,
      maxSizeMb: 10,
      maxFiles: 4,
      fsDep,
      getNow: () => FIXED_NOW,
    });
    logger.rotateIfNeeded();
    const [, dest] = (fsDep.renameSync as jest.Mock).mock.calls[0] as [
      string,
      string,
    ];
    expect(path.basename(dest)).toBe(ROTATED_NAME);
  });

  it('does not rotate when log file does not exist yet', () => {
    const fsDep = buildFakeFs({
      existsSync: jest.fn().mockReturnValue(false),
    });
    logger = new RotatingFileLogger({
      logDir: FAKE_HOME,
      maxSizeMb: 10,
      maxFiles: 4,
      fsDep,
    });
    logger.rotateIfNeeded();
    expect(fsDep.renameSync).not.toHaveBeenCalled();
  });

  // Fix 1: rotation threshold uses projected (current + incoming) size
  it('rotates when file is below threshold but the incoming chunk would push it over', () => {
    // File is 9.9 MB; incoming chunk is 200 KB → projected = 10.1 MB > 10 MB
    const fileSizeBytes = Math.floor(9.9 * 1024 * 1024);
    const incomingBytes = Math.ceil(0.2 * 1024 * 1024);
    const fsDep = buildFakeFs({
      existsSync: jest.fn().mockReturnValue(true),
      statSync: jest.fn().mockReturnValue({ size: fileSizeBytes }),
    });
    logger = new RotatingFileLogger({
      logDir: FAKE_HOME,
      maxSizeMb: 10,
      maxFiles: 4,
      fsDep,
      getNow: () => FIXED_NOW,
    });
    logger.rotateIfNeeded(incomingBytes);
    expect(fsDep.renameSync).toHaveBeenCalled();
  });

  it('does NOT rotate when file is below threshold and chunk keeps it below', () => {
    // File is 9 MB; incoming chunk is 900 KB → projected = 9.9 MB < 10 MB
    const fileSizeBytes = 9 * 1024 * 1024;
    const incomingBytes = Math.floor(0.9 * 1024 * 1024);
    const fsDep = buildFakeFs({
      existsSync: jest.fn().mockReturnValue(true),
      statSync: jest.fn().mockReturnValue({ size: fileSizeBytes }),
    });
    logger = new RotatingFileLogger({
      logDir: FAKE_HOME,
      maxSizeMb: 10,
      maxFiles: 4,
      fsDep,
      getNow: () => FIXED_NOW,
    });
    logger.rotateIfNeeded(incomingBytes);
    expect(fsDep.renameSync).not.toHaveBeenCalled();
  });

  it('writeToFile triggers rotation based on projected size', () => {
    // File is 9.9 MB; write a 200 KB string → rotation must happen before append
    const fileSizeBytes = Math.floor(9.9 * 1024 * 1024);
    const chunk = 'x'.repeat(Math.ceil(0.2 * 1024 * 1024));
    const fsDep = buildFakeFs({
      existsSync: jest.fn().mockReturnValue(true),
      statSync: jest.fn().mockReturnValue({ size: fileSizeBytes }),
    });
    logger = new RotatingFileLogger({
      logDir: FAKE_HOME,
      maxSizeMb: 10,
      maxFiles: 4,
      fsDep,
      getNow: () => FIXED_NOW,
    });
    logger.writeToFile(chunk);
    // renameSync (rotation) must have been called before appendFileSync
    const renameCalls = (fsDep.renameSync as jest.Mock).mock
      .invocationCallOrder[0];
    const appendCalls = (fsDep.appendFileSync as jest.Mock).mock
      .invocationCallOrder[0];
    expect(renameCalls).toBeLessThan(appendCalls);
  });
});

// ---------------------------------------------------------------------------
// RotatingFileLogger – archive pruning
// ---------------------------------------------------------------------------

describe('RotatingFileLogger – archive pruning', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  function makeArchiveList(count: number): string[] {
    return Array.from({ length: count }, (_, i) => {
      const d = new Date(Date.UTC(2024, 0, i + 1, 0, 0, 0));
      const ts = d.toISOString().replace(/[:.]/g, '-');
      return `server-${ts}.log`;
    });
  }

  it('does not delete archives when count is within limit', () => {
    const archives = makeArchiveList(3);
    const fsDep = buildFakeFs({
      readdirSync: jest.fn().mockReturnValue(archives),
    });
    const logger = new RotatingFileLogger({
      logDir: FAKE_HOME,
      maxSizeMb: 10,
      maxFiles: 4,
      fsDep,
    });
    logger.pruneOldArchives();
    expect(fsDep.unlinkSync).not.toHaveBeenCalled();
  });

  it('deletes oldest archive when count exceeds limit by one', () => {
    const archives = makeArchiveList(5); // maxFiles = 4
    const fsDep = buildFakeFs({
      readdirSync: jest.fn().mockReturnValue([...archives]),
    });
    const logger = new RotatingFileLogger({
      logDir: FAKE_HOME,
      maxSizeMb: 10,
      maxFiles: 4,
      fsDep,
    });
    logger.pruneOldArchives();
    expect(fsDep.unlinkSync).toHaveBeenCalledTimes(1);
    expect(fsDep.unlinkSync).toHaveBeenCalledWith(
      path.join(FAKE_HOME, archives[0]),
    );
  });

  it('deletes multiple oldest archives when well over limit', () => {
    const archives = makeArchiveList(7); // maxFiles = 4, so delete 3
    const fsDep = buildFakeFs({
      readdirSync: jest.fn().mockReturnValue([...archives]),
    });
    const logger = new RotatingFileLogger({
      logDir: FAKE_HOME,
      maxSizeMb: 10,
      maxFiles: 4,
      fsDep,
    });
    logger.pruneOldArchives();
    expect(fsDep.unlinkSync).toHaveBeenCalledTimes(3);
    expect(fsDep.unlinkSync).toHaveBeenNthCalledWith(
      1,
      path.join(FAKE_HOME, archives[0]),
    );
    expect(fsDep.unlinkSync).toHaveBeenNthCalledWith(
      2,
      path.join(FAKE_HOME, archives[1]),
    );
    expect(fsDep.unlinkSync).toHaveBeenNthCalledWith(
      3,
      path.join(FAKE_HOME, archives[2]),
    );
  });

  it('does not treat server.log itself as an archive', () => {
    const archives = makeArchiveList(5);
    const fsDep = buildFakeFs({
      readdirSync: jest
        .fn()
        .mockReturnValue([...archives, LOG_FILENAME, 'unrelated.txt']),
    });
    const logger = new RotatingFileLogger({
      logDir: FAKE_HOME,
      maxSizeMb: 10,
      maxFiles: 4,
      fsDep,
    });
    logger.pruneOldArchives();
    // Only 5 archives, maxFiles=4 → delete 1 oldest
    expect(fsDep.unlinkSync).toHaveBeenCalledTimes(1);
    expect(fsDep.unlinkSync).not.toHaveBeenCalledWith(
      path.join(FAKE_HOME, LOG_FILENAME),
    );
  });
});
