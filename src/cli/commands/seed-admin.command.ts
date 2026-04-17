import { Command } from 'commander';
import { setupAdminUser } from '../setup/admin';

export function registerSeedAdminCommand(program: Command): void {
  program
    .command('seed-admin')
    .description(
      'Create an admin user from environment variables (ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD). ' +
        'Intended for non-interactive Docker/CI environments.',
    )
    .action(async () => {
      const name = process.env.ADMIN_NAME ?? 'Admin';
      const email = process.env.ADMIN_EMAIL;
      const password = process.env.ADMIN_PASSWORD;

      if (!email || !password) {
        console.error(
          'Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.',
        );
        process.exit(1);
      }

      try {
        await setupAdminUser({ name, email, password, interactive: false });
      } catch {
        process.exit(1);
      }
    });
}
