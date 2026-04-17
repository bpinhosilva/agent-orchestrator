import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import type { FileSystem, ManagedProcess, ProcessMetadata } from './types';
import {
  PID_FILE,
  PID_DIR,
  PROCESS_FILE,
  MAIN_FILE,
  UI_INDEX_FILE,
  LOG_FILE,
  ENV_PATH,
  PACKAGE_ROOT,
} from './constants';
import { readEnvFile } from './env';
import { getDefaultPort } from '../config/port.defaults';
import { getDefaultHost } from '../config/host.defaults';

const realFs = fs as unknown as FileSystem;

const DEFAULT_PORT = String(getDefaultPort('production'));

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

import * as os from 'os';

function parseProcCmdline(pid: number, fsDep: FileSystem): string[] | null {
  if (os.platform() === 'win32') {
    // Windows: not supported, return null
    return null;
  }
  try {
    const cmdlinePath = `/proc/${pid}/cmdline`;
    if (!fsDep.existsSync(cmdlinePath)) {
      return null;
    }
    const raw = fsDep.readFileSync(cmdlinePath, 'utf8');
    return raw.split('\u0000').filter(Boolean);
  } catch {
    return null;
  }
}

function readProcCwd(pid: number, fsDep: FileSystem): string | null {
  if (os.platform() === 'win32') {
    // Windows: not supported, return null
    return null;
  }
  try {
    return path.resolve(fsDep.readlinkSync(`/proc/${pid}/cwd`));
  } catch {
    return null;
  }
}

// Removed duplicate findManagedProcess implementation

function processContainsMainPath(
  cmdline: string[],
  expectedMainPath: string,
): boolean {
  return cmdline.some((arg) => {
    try {
      return path.resolve(arg) === expectedMainPath;
    } catch {
      return false;
    }
  });
}

function readProcessMetadata(
  processFile: string,
  fsDep: FileSystem,
): ProcessMetadata | null {
  if (!fsDep.existsSync(processFile)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      fsDep.readFileSync(processFile, 'utf8'),
    ) as Partial<ProcessMetadata>;

    if (
      typeof parsed.pid !== 'number' ||
      typeof parsed.cwd !== 'string' ||
      typeof parsed.mainPath !== 'string' ||
      typeof parsed.host !== 'string' ||
      typeof parsed.port !== 'string' ||
      typeof parsed.logFile !== 'string'
    ) {
      return null;
    }

    return {
      pid: parsed.pid,
      cwd: parsed.cwd,
      mainPath: parsed.mainPath,
      host: parsed.host,
      port: parsed.port,
      logFile: parsed.logFile,
      startedAt:
        typeof parsed.startedAt === 'string'
          ? parsed.startedAt
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function readPidFile(pidFile: string, fsDep: FileSystem): number | null {
  if (!fsDep.existsSync(pidFile)) {
    return null;
  }

  try {
    const pid = parseInt(fsDep.readFileSync(pidFile, 'utf8').trim(), 10);
    return Number.isInteger(pid) && pid > 0 ? pid : null;
  } catch {
    return null;
  }
}

function scanForManagedProcesses(
  expected: Pick<ProcessMetadata, 'cwd' | 'mainPath'> & {
    port: string;
    host: string;
  },
  fsDep: FileSystem,
): ManagedProcess[] {
  if (!fsDep.existsSync('/proc')) {
    return [];
  }

  return fsDep
    .readdirSync('/proc')
    .filter((entry) => /^\d+$/.test(entry))
    .map((entry) => parseInt(entry, 10))
    .filter((pid) => isManagedProcess(pid, expected, fsDep))
    .map((pid) => ({
      pid,
      source: 'scan' as const,
      cwd: expected.cwd,
      mainPath: expected.mainPath,
      host: expected.host,
      port: expected.port,
    }));
}

export function getConfiguredPort(
  envPath: string,
  fsDep: FileSystem = realFs,
): string {
  return readEnvFile(envPath, fsDep).PORT || DEFAULT_PORT;
}

export function getConfiguredHost(
  envPath: string,
  fsDep: FileSystem = realFs,
): string {
  return readEnvFile(envPath, fsDep).HOST || getDefaultHost('production');
}

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

function safeUnlink(fsDep: FileSystem, filePath: string): void {
  try {
    fsDep.unlinkSync(filePath);
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code !== 'ENOENT') throw e;
  }
}

// Removed duplicate findManagedProcess implementation

export function formatProcessSummary(
  processInfo: ManagedProcess,
  logFile = LOG_FILE,
): string {
  return [
    `PID: ${processInfo.pid}`,
    `Source: ${processInfo.source}`,
    `Host: ${processInfo.host}`,
    `Port: ${processInfo.port}`,
    `Working directory: ${processInfo.cwd}`,
    `Entry point: ${processInfo.mainPath}`,
    `Log file: ${logFile}`,
  ].join('\n');
}

export function removeRuntimeState(
  pidFile = PID_FILE,
  processFile = PROCESS_FILE,
  fsDep: FileSystem = realFs,
): void {
  if (fsDep.existsSync(pidFile)) {
    safeUnlink(fsDep, pidFile);
  }
  if (fsDep.existsSync(processFile)) {
    safeUnlink(fsDep, processFile);
  }
}

export function persistProcessMetadata(
  metadata: ProcessMetadata,
  pidFile = PID_FILE,
  processFile = PROCESS_FILE,
  fsDep: FileSystem = realFs,
): void {
  fsDep.writeFileSync(pidFile, `${metadata.pid}\n`, { mode: 0o600 });
  fsDep.chmodSync(pidFile, 0o600);
  fsDep.writeFileSync(processFile, `${JSON.stringify(metadata, null, 2)}\n`, {
    mode: 0o600,
  });
  fsDep.chmodSync(processFile, 0o600);
}

export function getChildEnvironment(pidDir = PID_DIR): NodeJS.ProcessEnv {
  const childEnv: NodeJS.ProcessEnv = {
    AGENT_ORCHESTRATOR_HOME: pidDir,
    NODE_ENV: 'production',
  };

  const passthroughVars = [
    'PATH',
    'HOME',
    'USER',
    'LOGNAME',
    'SHELL',
    'TMPDIR',
    'TMP',
    'TEMP',
    'SystemRoot',
    'ComSpec',
    'LOG_LEVEL',
  ];

  for (const envName of passthroughVars) {
    if (process.env[envName]) {
      childEnv[envName] = process.env[envName];
    }
  }

  return childEnv;
}

export function assertBuildExists(
  mainFile = MAIN_FILE,
  uiIndexFile = UI_INDEX_FILE,
  fsDep: FileSystem = realFs,
): void {
  if (!fsDep.existsSync(mainFile)) {
    throw new Error(
      `Missing backend build at ${mainFile}. Run "npm run build:all" before using the CLI runtime.`,
    );
  }

  if (!fsDep.existsSync(uiIndexFile)) {
    throw new Error(
      `Missing UI build at ${uiIndexFile}. Run "npm run build:all" so the packaged CLI starts the full application.`,
    );
  }
}

export function isManagedProcess(
  pid: number,
  expected: Pick<ProcessMetadata, 'cwd' | 'mainPath'>,
  fsDep: FileSystem = realFs,
): boolean {
  if (os.platform() === 'win32') {
    // On Windows, just check process exists and cwd matches meta
    try {
      process.kill(pid, 0);
    } catch {
      return false;
    }
    // No reliable way to check cwd/mainPath, so trust PID file
    return true;
  }
  try {
    process.kill(pid, 0);
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === 'ESRCH') return false; // no such process
    if (e.code !== 'EPERM') return false; // unexpected error
    // EPERM: process exists but we lack permission — continue probing /proc
  }

  const cmdline = parseProcCmdline(pid, fsDep);
  const cwd = readProcCwd(pid, fsDep);

  if (!cmdline || !cwd) {
    return false;
  }

  return (
    cwd === path.resolve(expected.cwd) &&
    processContainsMainPath(cmdline, path.resolve(expected.mainPath))
  );
}

export function findManagedProcess(
  pidFile = PID_FILE,
  processFile = PROCESS_FILE,
  mainFile = MAIN_FILE,
  packageRoot = PACKAGE_ROOT,
  logFile = LOG_FILE,
  envPath = ENV_PATH,
  fsDep: FileSystem = realFs,
): ManagedProcess | null {
  const port = getConfiguredPort(envPath, fsDep);
  const host = getConfiguredHost(envPath, fsDep);
  const defaultExpected = {
    cwd: path.resolve(packageRoot),
    mainPath: path.resolve(mainFile),
    port,
    host,
    logFile,
  };

  const metadata = readProcessMetadata(processFile, fsDep);

  if (
    metadata &&
    isManagedProcess(
      metadata.pid,
      { cwd: metadata.cwd, mainPath: metadata.mainPath },
      fsDep,
    )
  ) {
    return { ...metadata, source: 'metadata' };
  }

  const pid = readPidFile(pidFile, fsDep);
  if (
    pid &&
    isManagedProcess(
      pid,
      { cwd: defaultExpected.cwd, mainPath: defaultExpected.mainPath },
      fsDep,
    )
  ) {
    return { ...defaultExpected, pid, source: 'pid-file' };
  }

  const matches = scanForManagedProcesses(defaultExpected, fsDep);

  if (matches.length === 1) {
    return matches[0];
  }

  if (matches.length === 0) {
    removeRuntimeState(pidFile, processFile, fsDep);
    return null;
  }

  throw new Error(
    `Multiple orchestrator processes matched ${defaultExpected.mainPath} in ${defaultExpected.cwd}: ${matches
      .map((match) => match.pid)
      .join(', ')}`,
  );
}

export function checkIfRunning(fsDep: FileSystem = realFs): number | null {
  const managedProcess = findManagedProcess(
    PID_FILE,
    PROCESS_FILE,
    MAIN_FILE,
    PACKAGE_ROOT,
    LOG_FILE,
    ENV_PATH,
    fsDep,
  );
  return managedProcess?.pid ?? null;
}

// ---------------------------------------------------------------------------
// Async process lifecycle helpers
// ---------------------------------------------------------------------------

/**
 * Polls until the given PID is no longer a managed process or the timeout
 * expires. Returns true if the process died, false if it survived.
 */
export async function waitForProcessDeath(
  pid: number,
  cwd: string,
  mainPath: string,
  fsDep: FileSystem = realFs,
  timeoutMs = 10000,
  pollIntervalMs = 500,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!isManagedProcess(pid, { cwd, mainPath }, fsDep)) {
      return true;
    }
    await new Promise<void>((r) => setTimeout(r, pollIntervalMs));
  }
  return !isManagedProcess(pid, { cwd, mainPath }, fsDep);
}

/**
 * Sends SIGTERM to the process and waits up to 10 s for it to exit.
 * If still alive, escalates to SIGKILL and waits up to 5 s more.
 * Returns true if the process is confirmed dead, false otherwise.
 */
export async function stopManagedProcessById(
  pid: number,
  cwd: string,
  mainPath: string,
  fsDep: FileSystem = realFs,
): Promise<boolean> {
  try {
    process.kill(pid, 'SIGTERM');
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === 'ESRCH') return true; // already gone
    throw err;
  }

  const diedOnTerm = await waitForProcessDeath(
    pid,
    cwd,
    mainPath,
    fsDep,
    10000,
  );
  if (diedOnTerm) return true;

  // Escalate
  try {
    process.kill(pid, 'SIGKILL');
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === 'ESRCH') return true;
    throw err;
  }

  return waitForProcessDeath(pid, cwd, mainPath, fsDep, 5000);
}

/**
 * Spawns the server process in detached mode, persists metadata, and
 * returns the new process details. Caller must verify build exists and
 * that no instance is already running before calling this.
 */
export function startServer(
  options: { logLevel?: string } = {},
  mainFile = MAIN_FILE,
  packageRoot = PACKAGE_ROOT,
  logFile = LOG_FILE,
  pidDir = PID_DIR,
  envPath = ENV_PATH,
): { pid: number; host: string; port: string } {
  assertBuildExists(mainFile, UI_INDEX_FILE);

  if (!fs.existsSync(pidDir)) {
    fs.mkdirSync(pidDir, { recursive: true, mode: 0o700 });
  }

  const env = getChildEnvironment(pidDir);
  if (options.logLevel) {
    env.LOG_LEVEL = options.logLevel;
  }

  const logFd = fs.openSync(logFile, 'a');
  try {
    const child = spawn('node', [mainFile], {
      detached: true,
      stdio: ['ignore', logFd, logFd],
      cwd: packageRoot,
      env,
    });

    const pid = child.pid;
    if (!pid) throw new Error('Failed to determine spawned process PID.');

    const port = getConfiguredPort(envPath);
    const host = getConfiguredHost(envPath);

    persistProcessMetadata({
      pid,
      cwd: packageRoot,
      mainPath: mainFile,
      host,
      port,
      logFile,
      startedAt: new Date().toISOString(),
    });

    child.unref();
    return { pid, host, port };
  } finally {
    fs.closeSync(logFd);
  }
}
