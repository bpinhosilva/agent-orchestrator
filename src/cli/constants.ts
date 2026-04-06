import * as os from 'os';
import * as path from 'path';

export { SUPPORTED_PROVIDERS } from './types';

export const PACKAGE_ROOT = path.resolve(__dirname, '..', '..');

export const PACKAGE_JSON_PATH = path.join(PACKAGE_ROOT, 'package.json');
export const MAIN_FILE = path.join(PACKAGE_ROOT, 'dist/main.js');
export const UI_INDEX_FILE = path.join(PACKAGE_ROOT, 'dist/ui/index.html');

// These are set at process start before any imports, so the env var is always present
export const PID_DIR =
  process.env.AGENT_ORCHESTRATOR_HOME ??
  path.join(os.homedir(), '.agent-orchestrator');
export const PID_FILE = path.join(PID_DIR, 'pid');
export const LOG_FILE = path.join(PID_DIR, 'server.log');
export const ENV_PATH = path.join(PID_DIR, '.env');
export const PROCESS_FILE = path.join(PID_DIR, 'process.json');
