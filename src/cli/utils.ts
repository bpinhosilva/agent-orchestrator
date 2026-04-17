import * as fs from 'fs';
import { Command } from 'commander';
import {
  PACKAGE_JSON_PATH,
  LOG_FILE,
  MAIN_FILE,
  PACKAGE_ROOT,
} from './constants';
import { isManagedProcess, removeRuntimeState } from './process-manager';

export function getPackageVersion(
  packageJsonPath = PACKAGE_JSON_PATH,
  readFn: (p: string) => string = (p) => fs.readFileSync(p, 'utf8'),
): string {
  try {
    const packageJson = JSON.parse(readFn(packageJsonPath)) as {
      version?: string;
    };
    return typeof packageJson.version === 'string'
      ? packageJson.version
      : '0.0.0';
  } catch {
    return '0.0.0';
  }
}

export function tailLogLines(content: string, lineCount: number): string {
  if (lineCount <= 0) return '';
  const lines = content.split(/\r?\n/);
  if (lines[lines.length - 1] === '') {
    lines.pop();
  }
  return lines.slice(-lineCount).join('\n');
}

export function resolveActionOptions<T extends object>(args: unknown[]): T {
  const last = args[args.length - 1];
  if (last instanceof Command) {
    return last.opts<T>();
  }
  if (last !== null && typeof last === 'object' && !Array.isArray(last)) {
    return last as T;
  }
  return {} as T;
}

const EARLY_CRASH_WAIT_MS = 3000;
const LOG_TAIL_LINES = 20;

function tailLogFile(logFile: string, lines: number): string {
  try {
    const content = fs.readFileSync(logFile, 'utf8');
    const allLines = content.split('\n');
    return allLines.slice(-lines).join('\n').trim();
  } catch {
    return '';
  }
}

/**
 * Waits briefly after server spawn and verifies the process survived startup.
 * If the process died, cleans up runtime state and prints the log tail.
 * Returns true if the process is still alive, false if it crashed.
 */
export async function verifyServerStartup(
  pid: number,
  logFile = LOG_FILE,
  mainFile = MAIN_FILE,
  packageRoot = PACKAGE_ROOT,
): Promise<boolean> {
  await new Promise<void>((r) => setTimeout(r, EARLY_CRASH_WAIT_MS));

  const survived = isManagedProcess(pid, {
    cwd: packageRoot,
    mainPath: mainFile,
  });

  if (!survived) {
    removeRuntimeState();
    const tail = tailLogFile(logFile, LOG_TAIL_LINES);
    console.error(
      'Server process exited immediately after starting.' +
        (tail
          ? `\n\nLast log output:\n${tail}`
          : `\nCheck the log file for details: ${logFile}`),
    );
  }

  return survived;
}
