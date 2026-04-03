import { config } from 'dotenv';
import { join, resolve } from 'path';

let runtimeEnvLoaded = false;

export const getRuntimeHome = (): string | undefined =>
  process.env.AGENT_ORCHESTRATOR_HOME;

export const getPackageRoot = (): string => resolve(__dirname, '..', '..');

export const getRuntimeEnvPath = (): string => {
  const runtimeHome = getRuntimeHome();
  return runtimeHome ? join(runtimeHome, '.env') : '.env';
};

export const getSqlitePath = (): string => {
  const runtimeHome = getRuntimeHome();
  return runtimeHome
    ? join(runtimeHome, 'local.sqlite')
    : join(getPackageRoot(), 'local.sqlite');
};

export const loadRuntimeEnv = (): void => {
  if (runtimeEnvLoaded) {
    return;
  }

  config({ path: getRuntimeEnvPath(), override: false });
  runtimeEnvLoaded = true;
};

export const isEnvEnabled = (key: string, defaultValue = false): boolean => {
  const value = process.env[key];

  if (value === undefined) {
    return defaultValue;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};
