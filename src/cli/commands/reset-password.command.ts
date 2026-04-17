import { Command } from 'commander';
import { IsNull } from 'typeorm';
import { resolveActionOptions } from '../utils';
import { createDataSource } from '../../config/typeorm';
import { User } from '../../users/entities/user.entity';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import type { DataSourceFactory, ResetPasswordCommandOptions } from '../types';

interface BcryptLike {
  hash(data: string, saltOrRounds: number): Promise<string>;
}

export async function resetUserPassword(
  email: string,
  newPassword: string,
  factory: DataSourceFactory = createDataSource,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  bcryptDep: BcryptLike = require('bcrypt') as BcryptLike,
): Promise<void> {
  const dataSource = factory();
  let initialized = false;
  try {
    await dataSource.initialize();
    initialized = true;

    const userRepository = dataSource.getRepository(User);
    const tokenRepository = dataSource.getRepository(RefreshToken);

    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
      throw new Error(`User with email "${email}" not found.`);
    }

    const hashedPassword = await bcryptDep.hash(newPassword, 10);
    await userRepository.update(user.id, { password: hashedPassword });

    // Revoke all active (non-expired, non-revoked) refresh tokens so existing
    // sessions cannot continue after a password reset.
    await tokenRepository.update(
      { userId: user.id, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );

    console.log(
      `Password updated for ${email}. All active sessions have been invalidated.`,
    );
  } finally {
    if (initialized) {
      try {
        await dataSource.destroy();
      } catch {
        // ignore cleanup errors
      }
    }
  }
}

export function registerResetPasswordCommand(
  program: Command,
  resetFn: (
    email: string,
    password: string,
  ) => Promise<void> = resetUserPassword,
): void {
  program
    .command('reset-password')
    .description("Reset a user's password and revoke all their active sessions")
    .option('--email <email>', 'Email address of the user')
    .option(
      '--password <password>',
      'New password (min 8 characters) — prefer SETUP_ADMIN_PASSWORD env var',
    )
    .option(
      '-y, --yes',
      'Non-interactive mode (requires --email and --password or env var)',
    )
    .action(async (...args: unknown[]) => {
      const opts = resolveActionOptions<ResetPasswordCommandOptions>(args);

      if (opts.password) {
        console.warn(
          'Warning: Passing passwords as CLI flags exposes them in process tables and shell history. ' +
            'Use the SETUP_ADMIN_PASSWORD environment variable instead.',
        );
      }

      let email: string;
      let password: string;

      const resolvedPassword =
        opts.password ?? process.env.SETUP_ADMIN_PASSWORD;

      if (opts.yes) {
        if (!opts.email || !resolvedPassword) {
          console.error(
            '--email and --password (or SETUP_ADMIN_PASSWORD env var) are required in non-interactive mode (--yes).',
          );
          process.exit(1);
          return;
        }
        email = opts.email;
        password = resolvedPassword;
      } else {
        const { default: enquirer } = await import('enquirer');
        const response = await enquirer.prompt<{
          email: string;
          password: string;
          confirm: string;
        }>([
          {
            type: 'input',
            name: 'email',
            message: 'User email:',
            initial: opts.email ?? '',
          },
          {
            type: 'password',
            name: 'password',
            message: 'New password (min 8 characters):',
            validate: (v: string) =>
              v.length >= 8 || 'Password must be at least 8 characters',
          },
          {
            type: 'password',
            name: 'confirm',
            message: 'Confirm new password:',
            validate: (v: string, state?: { answers: { password?: string } }) =>
              v === state?.answers?.password || 'Passwords do not match',
          },
        ]);
        email = response.email;
        password = response.password;
      }

      if (password.length < 8) {
        console.error('Password must be at least 8 characters long.');
        process.exit(1);
        return;
      }

      try {
        await resetFn(email, password);
      } catch (err: unknown) {
        console.error(
          `Failed to reset password: ${err instanceof Error ? err.message : String(err)}`,
        );
        process.exit(1);
      }
    });
}
