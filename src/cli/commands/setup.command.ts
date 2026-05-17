import { Command } from 'commander';
import { resolveActionOptions } from '../utils';
import type { SetupCommandOptions } from '../types';
import { handleSetup } from '../setup/index';
import { parsePositiveInt } from '../setup/validators';
import {
  checkPendingMigrations,
  runMigrations,
} from '../../database/migration-state';

export function registerSetupCommand(program: Command): void {
  program
    .command('setup')
    .description('Create or update the local CLI runtime configuration')
    .option('--host <host>', 'Server host for the orchestrator runtime')
    .option('--port <port>', 'Server port for the orchestrator runtime')
    .option('--db-type <type>', 'Database type: sqlite or postgres')
    .option('--database-url <url>', 'PostgreSQL connection string')
    .option('--db-logging', 'Enable database query logging')
    .option(
      '--provider <provider>',
      'Configure a provider (gemini, anthropic, ollama)',
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
    .option(
      '--ollama-key <key>',
      'Ollama API key (leave blank for local installations)',
    )
    .option(
      '--ollama-host <host>',
      'Ollama host URL (default: http://127.0.0.1:11434)',
    )
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
    .option(
      '--log-max-size-mb <mb>',
      'Max log file size in MB before rotation (default: 10)',
      (v: string) => parsePositiveInt(v) ?? Number.NaN,
    )
    .option(
      '--log-max-files <count>',
      'Max number of rotated log files to keep (default: 4)',
      (v: string) => parsePositiveInt(v) ?? Number.NaN,
    )
    .action(async (...args: unknown[]) => {
      const opts = resolveActionOptions<SetupCommandOptions>(args);
      console.log('Starting setup...');
      try {
        if (opts.logMaxSizeMb !== undefined) {
          if (!Number.isInteger(opts.logMaxSizeMb) || opts.logMaxSizeMb <= 0) {
            throw new Error(
              `Invalid --log-max-size-mb "${opts.logMaxSizeMb}". Must be a positive integer.`,
            );
          }
        }
        if (opts.logMaxFiles !== undefined) {
          if (!Number.isInteger(opts.logMaxFiles) || opts.logMaxFiles <= 0) {
            throw new Error(
              `Invalid --log-max-files "${opts.logMaxFiles}". Must be a positive integer.`,
            );
          }
        }

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
