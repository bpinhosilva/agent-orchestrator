import * as enquirer from 'enquirer';
import { createDataSource } from '../../config/typeorm';
import { DEFAULT_USER_AVATAR } from '../../users/avatar.constants';
import { User } from '../../users/entities/user.entity';
import type {
  DataSourceFactory,
  SetupAdminOptions,
  SetupCommandOptions,
} from '../types';

interface BcryptLike {
  hash(data: string, saltOrRounds: number): Promise<string>;
}

export async function setupAdminUser(
  options: SetupAdminOptions = {},
  factory: DataSourceFactory = createDataSource,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  bcryptDep: BcryptLike = require('bcrypt') as BcryptLike,
): Promise<void> {
  console.log('\n--- Admin User Setup ---');

  let response: { name: string; email: string; password: string };

  if (options.name && options.email && options.password) {
    if (options.password.length < 8) {
      throw new Error('Admin password must be at least 8 characters long.');
    }
    response = {
      name: options.name,
      email: options.email,
      password: options.password,
    };
  } else if (options.interactive === false) {
    console.log(
      'Skipping admin user creation because prompts are disabled and complete admin credentials were not provided.',
    );
    return;
  } else {
    response = await enquirer.prompt<{
      name: string;
      email: string;
      password: string;
      confirm: string;
    }>([
      {
        type: 'input',
        name: 'name',
        message: 'Admin name:',
        initial: options.name || 'admin',
      },
      {
        type: 'input',
        name: 'email',
        message: 'Admin email:',
        initial: options.email || 'admin@agent-orchestrator.local',
      },
      {
        type: 'password',
        name: 'password',
        message: 'Admin password (min 8 characters):',
        validate: (value: string) =>
          value.length >= 8 || 'Password must be at least 8 characters long',
      },
      {
        type: 'password',
        name: 'confirm',
        message: 'Confirm admin password:',
        validate: (value: string, state?: { answers: { password?: string } }) =>
          value === state?.answers?.password || 'Passwords do not match',
      },
    ]);
  }

  console.log('Creating admin user...');
  const dataSource = factory();
  let initialized = false;
  try {
    await dataSource.initialize();
    initialized = true;
    const userRepository = dataSource.getRepository(User);
    const existing = await userRepository.findOne({
      where: { email: response.email },
    });
    if (existing) {
      console.log(
        `User with email ${response.email} already exists. Skipping creation.`,
      );
    } else {
      const hashedPassword = await bcryptDep.hash(response.password, 10);
      const user = userRepository.create({
        name: response.name,
        lastName: 'User',
        email: response.email,
        password: hashedPassword,
        avatar: DEFAULT_USER_AVATAR,
      });
      await userRepository.save(user);
      console.log('Admin user created successfully!');
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`Failed to create admin user: ${errorMessage}`);
    throw err;
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

export async function maybeSetupAdmin(
  options: SetupCommandOptions,
  factory: DataSourceFactory = createDataSource,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  bcryptDep: BcryptLike = require('bcrypt') as BcryptLike,
): Promise<void> {
  if (options.skipAdminSetup) {
    console.log('Admin user setup skipped.');
    return;
  }

  try {
    await setupAdminUser(
      {
        interactive: !options.yes,
        name: options.adminName,
        email: options.adminEmail,
        password: options.adminPassword,
      },
      factory,
      bcryptDep,
    );
  } catch (err: unknown) {
    console.error(
      'Admin setup failed:',
      err instanceof Error ? err.message : err,
    );
  }
}
