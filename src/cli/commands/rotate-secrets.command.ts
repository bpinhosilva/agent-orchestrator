import * as crypto from 'crypto';
import { Command } from 'commander';
import { resolveActionOptions, verifyServerStartup } from '../utils';
import { readEnvFile, buildEnvContent, writePrivateFile } from '../env';
import {
  findManagedProcess,
  formatProcessSummary,
  removeRuntimeState,
  startServer,
  stopManagedProcessById,
} from '../process-manager';
import { waitForHealth } from '../health';
import { ENV_PATH } from '../constants';
import { MAIN_FILE, PACKAGE_ROOT } from '../constants';
import type { RotateSecretsCommandOptions } from '../types';

export function registerRotateSecretsCommand(program: Command): void {
  program
    .command('rotate-secrets')
    .description(
      'Generate new JWT_SECRET and JWT_REFRESH_SECRET and restart the server',
    )
    .option('-y, --yes', 'Skip confirmation prompt')
    .action(async (...args: unknown[]) => {
      const opts = resolveActionOptions<RotateSecretsCommandOptions>(args);

      if (!opts.yes) {
        const { default: enquirer } = await import('enquirer');
        const { confirmed } = await enquirer.prompt<{ confirmed: boolean }>({
          type: 'confirm',
          name: 'confirmed',
          message:
            'Rotating JWT secrets will immediately invalidate ALL active user sessions. Continue?',
          initial: false,
        });
        if (!confirmed) {
          console.log('Secret rotation cancelled.');
          return;
        }
      } else {
        console.warn(
          'Warning: Rotating JWT secrets will immediately invalidate ALL active user sessions.',
        );
      }

      try {
        const existingEnv = readEnvFile(ENV_PATH);

        const newJwtSecret = crypto.randomBytes(32).toString('hex');
        const newJwtRefreshSecret = crypto.randomBytes(32).toString('hex');

        const envContent = buildEnvContent(
          existingEnv,
          {
            host: existingEnv.HOST || '127.0.0.1',
            port: existingEnv.PORT || '15789',
            dbType: (existingEnv.DB_TYPE as 'sqlite' | 'postgres') || 'sqlite',
            dbLogging: existingEnv.DB_LOGGING === 'true',
          },
          existingEnv.DATABASE_URL || '',
          existingEnv.GEMINI_API_KEY || '',
          existingEnv.ANTHROPIC_API_KEY || '',
          newJwtSecret,
          newJwtRefreshSecret,
          existingEnv.OLLAMA_API_KEY || '',
          existingEnv.OLLAMA_HOST || '',
        );

        writePrivateFile(ENV_PATH, envContent);
        console.log('New JWT secrets written to configuration.');

        // If server is running, restart it so new secrets take effect
        const running = findManagedProcess();
        if (running) {
          console.log(`Stopping Orchestrator (PID: ${running.pid})...`);
          const died = await stopManagedProcessById(
            running.pid,
            running.cwd,
            running.mainPath,
          );
          if (!died) {
            console.error(
              'Failed to stop orchestrator. New secrets are on disk but the running ' +
                'server still uses the old ones. Stop and restart manually.',
            );
            process.exit(1);
            return;
          }
          removeRuntimeState();
          console.log('Orchestrator stopped. Restarting...');

          const { pid, host, port } = startServer();

          const survived = await verifyServerStartup(pid);
          if (!survived) {
            process.exit(1);
            return;
          }

          console.log(
            `Orchestrator started.\n${formatProcessSummary({
              pid,
              source: 'metadata',
              cwd: PACKAGE_ROOT,
              mainPath: MAIN_FILE,
              host,
              port,
            })}`,
          );

          console.log('Waiting for server to become healthy...');
          const healthy = await waitForHealth(host, port, 30000);
          if (healthy) {
            console.log('Server is healthy. Secret rotation complete.');
          } else {
            console.error(
              'Server did not become healthy within 30 s. Check logs with "agent-orchestrator logs".',
            );
            process.exit(1);
          }
        } else {
          console.log(
            'Server is not running. New secrets will take effect on the next start.',
          );
        }
      } catch (err: unknown) {
        console.error(
          `Secret rotation failed: ${err instanceof Error ? err.message : String(err)}`,
        );
        process.exit(1);
      }
    });
}
