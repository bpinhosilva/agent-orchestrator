import * as fs from 'fs';
import { ENV_PATH } from './constants';
import type { BasicConfig, FileSystem } from './types';

const realFs = fs as unknown as FileSystem;

export function parseEnvContent(content: string): Record<string, string> {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .reduce<Record<string, string>>((acc, line) => {
      const separatorIndex = line.indexOf('=');
      if (separatorIndex === -1) {
        return acc;
      }
      const key = line.slice(0, separatorIndex).trim();
      if (!key || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) return acc;
      const value = line.slice(separatorIndex + 1).trim();
      acc[key] = value;
      return acc;
    }, {});
}

export function readEnvFile(
  envPath = ENV_PATH,
  fsDep: FileSystem = realFs,
): Record<string, string> {
  if (!fsDep.existsSync(envPath)) {
    return {};
  }

  try {
    return parseEnvContent(fsDep.readFileSync(envPath, 'utf8'));
  } catch {
    return {};
  }
}

export function writePrivateFile(
  filePath: string,
  content: string,
  fsDep: FileSystem = realFs,
): void {
  fsDep.writeFileSync(filePath, content, { mode: 0o600 });
  fsDep.chmodSync(filePath, 0o600);
}

export function buildEnvContent(
  currentEnv: Record<string, string>,
  basicConfig: BasicConfig,
  databaseUrl: string,
  geminiKey: string,
  anthropicKey: string,
  jwtSecret: string,
  jwtRefreshSecret: string,
): string {
  const envValues: Record<string, string> = {
    ...currentEnv,
    NODE_ENV: 'production',
    PORT: basicConfig.port,
    DB_TYPE: basicConfig.dbType,
    DB_LOGGING: `${basicConfig.dbLogging}`,
    CHECK_PENDING_MIGRATIONS_ON_STARTUP:
      currentEnv.CHECK_PENDING_MIGRATIONS_ON_STARTUP || 'true',
    JWT_SECRET: jwtSecret,
    JWT_REFRESH_SECRET: jwtRefreshSecret,
  };

  if (databaseUrl.trim()) {
    envValues.DATABASE_URL = databaseUrl;
  } else {
    delete envValues.DATABASE_URL;
  }

  if (geminiKey) {
    envValues.GEMINI_API_KEY = geminiKey;
  }

  if (anthropicKey) {
    envValues.ANTHROPIC_API_KEY = anthropicKey;
  }

  const orderedKeys = [
    'NODE_ENV',
    'PORT',
    'DB_TYPE',
    'DB_LOGGING',
    'CHECK_PENDING_MIGRATIONS_ON_STARTUP',
    'DATABASE_URL',
    'GEMINI_API_KEY',
    'ANTHROPIC_API_KEY',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
  ];

  const remainingKeys = Object.keys(envValues)
    .filter((key) => !orderedKeys.includes(key))
    .sort();

  return [...orderedKeys, ...remainingKeys]
    .filter((key) => envValues[key] !== undefined && envValues[key] !== '')
    .map((key) => `${key}=${envValues[key]}`)
    .join('\n')
    .concat('\n');
}
