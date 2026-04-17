import { Command } from 'commander';
import { resolveActionOptions } from '../utils';
import type { MigrateCommandOptions } from '../types';
import {
  checkPendingMigrations,
  runMigrations,
} from '../../database/migration-state';

async function confirmAction(
  message: string,
  autoConfirm = false,
): Promise<boolean> {
  if (autoConfirm) {
    return true;
  }

  const { default: enquirer } = await import('enquirer');
  const { confirmed } = await enquirer.prompt<{ confirmed: boolean }>({
    type: 'confirm',
    name: 'confirmed',
    message,
    initial: false,
  });

  return confirmed;
}

async function promptForEnter(
  message: string,
  autoConfirm = false,
): Promise<void> {
  if (autoConfirm) {
    return;
  }

  const { default: enquirer } = await import('enquirer');
  await enquirer.prompt({
    type: 'input',
    name: 'continue',
    message,
  });
}

export function registerMigrateCommand(program: Command): void {
  program
    .command('migrate')
    .description('Run pending database migrations')
    .option('-f, --force', 'Force re-initialization (DROP ALL DATA)')
    .option('-y, --yes', 'Disable confirmation prompts')
    .action(async (...args: unknown[]) => {
      const opts = resolveActionOptions<MigrateCommandOptions>(args);
      try {
        if (opts.force) {
          const confirmForce = await confirmAction(
            'Are you absolutely sure you want to DROP ALL DATA and re-initialize?',
            opts.yes,
          );
          if (confirmForce) {
            await promptForEnter(
              'Press Enter to confirm and start the destructive initialization...',
              opts.yes,
            );
            await runMigrations(true);
          } else {
            console.log('Force migration cancelled.');
          }
          return;
        }

        const { hasPending, isEmpty } = await checkPendingMigrations({
          assumePendingOnError: true,
        });

        if (isEmpty) {
          console.log('Database is empty. Initializing...');
          await runMigrations();
          return;
        }

        if (!hasPending) {
          console.log('Database is already up to date.');
          return;
        }

        const confirmMigration = await confirmAction(
          'Pending migrations detected. Do you want to run them?',
          opts.yes,
        );

        if (confirmMigration) {
          await runMigrations();
        } else {
          console.log('Migration cancelled.');
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`Migration failed: ${errorMessage}`);
        process.exit(1);
      }
    });
}
