import { Command } from 'commander';
import { resolveActionOptions } from '../utils';
import type { SetupCommandOptions } from '../types';
import { handleSetup } from '../setup/index';
import {
  checkPendingMigrations,
  runMigrations,
} from '../../database/migration-state';

export function registerSetupCommand(program: Command): void {
  program
    .command('setup')
    .description('Create or update the local CLI runtime configuration')
    .option('--port <port>', 'Server port for the orchestrator runtime')
    .option('--db-type <type>', 'Database type: sqlite or postgres')
    .option('--database-url <url>', 'PostgreSQL connection string')
    .option('--db-logging', 'Enable database query logging')
    .option(
      '--provider <provider>',
      'Configure a provider (gemini, anthropic)',
      (value: string, previous: string[] = []) =>
        previous.concat(
          value
            .split(',')
            .map((item) => item.trim().toLowerCase())
            .filter(Boolean),
        ),
      [] as string[],
    )
    .option('--gemini-key <key>', 'Google Gemini API key')
    .option('--anthropic-key <key>', 'Anthropic Claude API key')
    .option('-y, --yes', 'Disable prompts and use supplied flags/defaults')
    .option('--skip-admin-setup', 'Skip creating or updating the admin user')
    .option('--admin-name <name>', 'Admin user name for non-interactive setup')
    .option(
      '--admin-email <email>',
      'Admin user email for non-interactive setup',
    )
    .option(
      '--admin-password <password>',
      'Admin user password for non-interactive setup',
    )
    .option(
      '--regenerate-jwt-secret',
      'Generate a new JWT secret instead of preserving the existing one',
    )
    .action(async (...args: unknown[]) => {
      const opts = resolveActionOptions<SetupCommandOptions>(args);
      console.log('Starting setup...');
      try {
        await handleSetup(opts);

        if (opts.yes) {
          const { hasPending, isEmpty } = await checkPendingMigrations({
            assumePendingOnError: true,
          });
          if (isEmpty) {
            console.log('Database is empty. Initializing...');
            await runMigrations();
          } else if (hasPending) {
            await runMigrations();
          } else {
            console.log('Database is already up to date.');
          }
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`Setup failed: ${errorMessage}`);
        process.exit(1);
      }
    });
}
