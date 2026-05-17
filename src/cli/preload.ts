/**
 * Preload module: loaded via `node --require dist/cli/preload.js dist/main.js`
 * by the CLI process manager so that stdout/stderr are intercepted and written
 * to the rotating log file before any of main.js's imports are resolved.
 * This ensures that import-time errors and early bootstrap failures are
 * captured in server.log rather than being lost to the ignored stdio fds.
 */
import { loadRuntimeEnv } from '../config/runtime-paths';
import {
  initRuntimeLogger,
  persistRuntimeLoggerInitFailure,
} from '../config/runtime-logger';

loadRuntimeEnv();

try {
  initRuntimeLogger();
} catch (err) {
  persistRuntimeLoggerInitFailure(String(err));
  process.exit(1);
}
