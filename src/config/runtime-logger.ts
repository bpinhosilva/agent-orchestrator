import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export const LOG_FILENAME = 'server.log';
export const DEFAULT_MAX_SIZE_MB = 10;
export const DEFAULT_MAX_FILES = 4;

const ARCHIVE_PREFIX = 'server-';

export interface LoggerFs {
  existsSync(p: string): boolean;
  mkdirSync(p: string, opts?: { recursive?: boolean; mode?: number }): void;
  statSync(p: string): { size: number };
  appendFileSync(p: string, data: string | Uint8Array): void;
  renameSync(oldPath: string, newPath: string): void;
  readdirSync(p: string): string[];
  unlinkSync(p: string): void;
}

export interface RuntimeLoggerOptions {
  logDir: string;
  maxSizeMb: number;
  maxFiles: number;
  fsDep?: LoggerFs;
  getNow?: () => Date;
}

/**
 * Parses a string that must represent a strict positive integer (no decimals,
 * no scientific notation, no surrounding whitespace, no sign prefix).
 * Returns the parsed number or throws with a descriptive message.
 */
function parseStrictPositiveInt(value: string, envName: string): number {
  if (!/^[1-9]\d*$/.test(value)) {
    throw new Error(
      `Invalid ${envName}: "${value}". Must be a plain positive integer (e.g. 10).`,
    );
  }
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(
      `Invalid ${envName}: "${value}". Must be a positive integer >= 1.`,
    );
  }
  return n;
}

export function shouldEnableFileLogging(): boolean {
  if (process.env.AGENT_ORCHESTRATOR_HOME) return true;
  if (
    process.env.LOG_ROTATION_MAX_SIZE_MB !== undefined ||
    process.env.LOG_ROTATION_MAX_FILES !== undefined
  )
    return true;
  return false;
}

export function getLogRotationOptions(): RuntimeLoggerOptions | null {
  if (!shouldEnableFileLogging()) return null;

  // CLI runtime: use the managed home directory.
  // Docker opt-in (no home set): use os.tmpdir() — always writable, avoids
  // potential read-only /app working directory inside containers.
  const logDir = process.env.AGENT_ORCHESTRATOR_HOME || os.tmpdir();

  const maxSizeMb =
    process.env.LOG_ROTATION_MAX_SIZE_MB !== undefined
      ? parseStrictPositiveInt(
          process.env.LOG_ROTATION_MAX_SIZE_MB,
          'LOG_ROTATION_MAX_SIZE_MB',
        )
      : DEFAULT_MAX_SIZE_MB;
  const maxFiles =
    process.env.LOG_ROTATION_MAX_FILES !== undefined
      ? parseStrictPositiveInt(
          process.env.LOG_ROTATION_MAX_FILES,
          'LOG_ROTATION_MAX_FILES',
        )
      : DEFAULT_MAX_FILES;

  return { logDir, maxSizeMb, maxFiles };
}

export function persistRuntimeLoggerInitFailure(
  message: string,
  fsDep: Pick<LoggerFs, 'mkdirSync' | 'appendFileSync'> = fs,
): string | null {
  if (!shouldEnableFileLogging()) {
    return null;
  }

  const logDir = process.env.AGENT_ORCHESTRATOR_HOME || os.tmpdir();
  fsDep.mkdirSync(logDir, { recursive: true, mode: 0o700 });

  const logFilePath = path.join(logDir, LOG_FILENAME);
  fsDep.appendFileSync(
    logFilePath,
    `[preload] Runtime logger initialization failed: ${message}\n`,
  );

  return logFilePath;
}

export class RotatingFileLogger {
  private readonly logFile: string;
  private readonly maxSizeBytes: number;
  private readonly maxFiles: number;
  private readonly fsDep: LoggerFs;
  private readonly getNow: () => Date;

  private originalStdoutWrite: typeof process.stdout.write | null = null;
  private originalStderrWrite: typeof process.stderr.write | null = null;
  private active = false;

  constructor(options: RuntimeLoggerOptions) {
    this.logFile = path.join(options.logDir, LOG_FILENAME);
    this.maxSizeBytes = options.maxSizeMb * 1024 * 1024;
    this.maxFiles = options.maxFiles;
    this.fsDep = options.fsDep ?? (fs as unknown as LoggerFs);
    this.getNow = options.getNow ?? (() => new Date());
  }

  get logFilePath(): string {
    return this.logFile;
  }

  init(): void {
    if (this.active) return;

    const dir = path.dirname(this.logFile);
    if (!this.fsDep.existsSync(dir)) {
      this.fsDep.mkdirSync(dir, { recursive: true, mode: 0o700 });
    }

    // eslint-disable-next-line @typescript-eslint/unbound-method
    this.originalStdoutWrite = process.stdout.write;
    // eslint-disable-next-line @typescript-eslint/unbound-method
    this.originalStderrWrite = process.stderr.write;

    process.stdout.write = makeTeePatch(this.originalStdoutWrite, (chunk) =>
      this.writeToFile(chunk),
    );
    process.stderr.write = makeTeePatch(this.originalStderrWrite, (chunk) =>
      this.writeToFile(chunk),
    );

    this.active = true;
  }

  writeToFile(chunk: string | Uint8Array): void {
    try {
      const incomingBytes =
        typeof chunk === 'string' ? Buffer.byteLength(chunk) : chunk.byteLength;
      this.rotateIfNeeded(incomingBytes);
      this.fsDep.appendFileSync(this.logFile, chunk as string);
    } catch {
      // Never crash the app due to a logging failure
    }
  }

  rotateIfNeeded(incomingBytes = 0): void {
    try {
      if (!this.fsDep.existsSync(this.logFile)) return;
      const stat = this.fsDep.statSync(this.logFile);
      if (stat.size + incomingBytes < this.maxSizeBytes) return;
    } catch {
      return;
    }

    const ts = this.getNow().toISOString().replace(/[:.]/g, '-');
    const dir = path.dirname(this.logFile);
    const rotated = path.join(dir, `${ARCHIVE_PREFIX}${ts}.log`);
    try {
      this.fsDep.renameSync(this.logFile, rotated);
    } catch {
      return;
    }

    this.pruneOldArchives();
  }

  pruneOldArchives(): void {
    const dir = path.dirname(this.logFile);
    let archives: string[];
    try {
      archives = this.fsDep
        .readdirSync(dir)
        .filter(
          (f) =>
            f.startsWith(ARCHIVE_PREFIX) &&
            f.endsWith('.log') &&
            f !== LOG_FILENAME,
        )
        .sort();
    } catch {
      return;
    }

    while (archives.length > this.maxFiles) {
      const oldest = archives.shift()!;
      try {
        this.fsDep.unlinkSync(path.join(dir, oldest));
      } catch {
        // ignore individual deletion failures
      }
    }
  }

  teardown(): void {
    if (!this.active) return;
    if (this.originalStdoutWrite) {
      process.stdout.write = this.originalStdoutWrite;
    }
    if (this.originalStderrWrite) {
      process.stderr.write = this.originalStderrWrite;
    }
    this.active = false;
  }
}

function makeTeePatch(
  original: typeof process.stdout.write,
  writeToFile: (chunk: string | Uint8Array) => void,
): typeof process.stdout.write {
  type FlexWrite = (
    this: NodeJS.WriteStream,
    chunk: string | Uint8Array,
    encodingOrCb?: BufferEncoding | ((err?: Error | null) => void),
    cb?: (err?: Error | null) => void,
  ) => boolean;
  const orig = original as unknown as FlexWrite;
  return function (
    this: NodeJS.WriteStream,
    chunk: string | Uint8Array,
    encodingOrCb?: BufferEncoding | ((err?: Error | null) => void),
    cb?: (err?: Error | null) => void,
  ): boolean {
    writeToFile(chunk);
    if (typeof encodingOrCb === 'function') {
      return orig.call(this, chunk, encodingOrCb) as boolean;
    }
    return orig.call(this, chunk, encodingOrCb, cb) as boolean;
  } as typeof process.stdout.write;
}

let activeLogger: RotatingFileLogger | null = null;

export function initRuntimeLogger(): RotatingFileLogger | null {
  if (activeLogger) return activeLogger;
  const opts = getLogRotationOptions();
  if (!opts) return null;

  activeLogger = new RotatingFileLogger(opts);
  activeLogger.init();
  return activeLogger;
}

export function teardownRuntimeLogger(): void {
  if (activeLogger) {
    activeLogger.teardown();
    activeLogger = null;
  }
}
