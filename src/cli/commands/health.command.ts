import { Command } from 'commander';
import { resolveActionOptions } from '../utils';
import {
  findManagedProcess,
  getConfiguredHost,
  getConfiguredPort,
} from '../process-manager';
import { ENV_PATH } from '../constants';
import { httpHealthCheck } from '../health';
import type { HealthCommandOptions } from '../types';

export function registerHealthCommand(program: Command): void {
  program
    .command('health')
    .description('Check whether the orchestrator HTTP server is responding')
    .option('--timeout <ms>', 'Request timeout in milliseconds', '5000')
    .option('--format <format>', 'Output format: text or json', 'text')
    .action(async (...args: unknown[]) => {
      const opts = resolveActionOptions<HealthCommandOptions>(args);
      const timeoutMs = Math.max(1, Number(opts.timeout ?? '5000') || 5000);

      // Prefer metadata from the running process; fall back to .env config
      const proc = findManagedProcess();
      const host = proc?.host ?? getConfiguredHost(ENV_PATH);
      const port = proc?.port ?? getConfiguredPort(ENV_PATH);

      const isRunning = proc !== null;
      const result = await httpHealthCheck(host, port, timeoutMs);

      if (opts.format === 'json') {
        console.log(
          JSON.stringify({
            running: isRunning,
            healthy: result.healthy,
            status: result.status ?? null,
            host,
            port,
            error: result.error ?? null,
          }),
        );
      } else {
        if (!isRunning) {
          console.log('Orchestrator process is not running.');
        } else if (result.healthy) {
          console.log(
            `Orchestrator is healthy (HTTP ${result.status}) at ${host}:${port}`,
          );
        } else if (result.error) {
          console.log(`Orchestrator is unreachable: ${result.error}`);
        } else {
          console.log(
            `Orchestrator returned HTTP ${result.status ?? 'unknown'} at ${host}:${port}`,
          );
        }
      }

      if (!result.healthy) process.exit(1);
    });
}
