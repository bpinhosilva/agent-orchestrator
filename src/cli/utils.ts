import * as fs from 'fs';
import { Command } from 'commander';
import { PACKAGE_JSON_PATH } from './constants';

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
