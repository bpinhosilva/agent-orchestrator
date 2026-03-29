#!/usr/bin/env node
import * as os from 'os';
import * as path from 'path';

process.env.NODE_ENV = 'production';
process.env.DOTENV_CONFIG_QUIET = 'true';
process.env.AGENT_ORCHESTRATOR_HOME =
  process.env.AGENT_ORCHESTRATOR_HOME ||
  path.join(os.homedir(), '.agent-orchestrator');

import { Command } from 'commander';
import * as enquirer from 'enquirer';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { spawn } from 'child_process';
import * as bcrypt from 'bcrypt';
import { createDataSource } from '../config/typeorm';
import { User } from '../users/entities/user.entity';

let program = new Command();

export const PID_DIR = process.env.AGENT_ORCHESTRATOR_HOME;
export const PID_FILE = path.join(PID_DIR, 'pid');
export const LOG_FILE = path.join(PID_DIR, 'server.log');
export const ENV_PATH = path.join(PID_DIR, '.env');

// Determine the package root directory (where package.json is)
// When running from dist/cli/index.js, it's two levels up.
export const PACKAGE_ROOT = path.resolve(__dirname, '..', '..');

// Ensure PID_DIR exists
if (!fs.existsSync(PID_DIR)) {
  fs.mkdirSync(PID_DIR, { recursive: true });
}

interface BasicConfig {
  port: string;
  dbType: 'postgres' | 'sqlite';
  dbLogging: boolean;
}

interface DatabaseConfig {
  databaseUrl: string;
}

interface ProviderConfig {
  providers: string[];
}

interface KeyConfig {
  key: string;
}

export function checkIfRunning(): number | null {
  if (fs.existsSync(PID_FILE)) {
    const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim(), 10);
    try {
      process.kill(pid, 0);
      return pid;
    } catch {
      // Process doesn't exist, cleanup stale pid file
      fs.unlinkSync(PID_FILE);
    }
  }
  return null;
}

export async function checkPendingMigrations(): Promise<{
  hasPending: boolean;
  isEmpty: boolean;
}> {
  const dataSource = createDataSource();
  try {
    await dataSource.initialize();
    const hasPending = await dataSource.showMigrations();

    // Check if any tables exist (other than the migrations table itself)
    const tables: any[] = await dataSource.query(
      dataSource.options.type === 'sqlite'
        ? "SELECT name FROM sqlite_master WHERE type='table' AND name NOT IN ('migrations', 'sqlite_sequence')"
        : "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name != 'migrations'",
    );

    const isEmpty = tables.length === 0;

    await dataSource.destroy();
    return { hasPending, isEmpty };
  } catch {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    // If it fails, assume it's new/empty and needs migrations
    return { hasPending: true, isEmpty: true };
  }
}

export async function runMigrations(force = false): Promise<void> {
  const dataSource = createDataSource();
  try {
    await dataSource.initialize();

    if (force) {
      console.log('Dropping database schema...');
      await dataSource.dropDatabase();
      console.log('Schema dropped successfully.');
    }

    console.log('Running database migrations...');
    const result = await dataSource.runMigrations();

    if (result.length > 0) {
      console.log(`Successfully executed ${result.length} migrations.`);
    } else {
      console.log('No pending migrations found.');
    }

    await dataSource.destroy();
  } catch (err: unknown) {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    const errorMessage = err instanceof Error ? err.message : String(err);
    throw new Error(`Migration execution failed: ${errorMessage}`);
  }
}

export async function setupAdminUser(): Promise<void> {
  console.log('\n--- Admin User Setup ---');

  const response = await enquirer.prompt<{
    name: string;
    email: string;
    password: string;
    confirm: string;
  }>([
    {
      type: 'input',
      name: 'name',
      message: 'Admin name:',
      initial: 'admin',
    },
    {
      type: 'input',
      name: 'email',
      message: 'Admin email:',
      initial: 'admin@agent-orchestrator.local',
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

  console.log('Creating admin user...');
  const dataSource = createDataSource();
  try {
    await dataSource.initialize();

    const userRepository = dataSource.getRepository(User);

    const existing = await userRepository.findOne({
      where: { email: response.email },
    });
    if (existing) {
      console.log(
        `User with email ${response.email} already exists. Skipping creation.`,
      );
    } else {
      const hashedPassword = await bcrypt.hash(response.password, 10);
      const user = userRepository.create({
        name: response.name,
        email: response.email,
        password: hashedPassword,
      });
      await userRepository.save(user);
      console.log('Admin user created successfully!');
    }

    await dataSource.destroy();
  } catch (err: unknown) {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`Failed to create admin user: ${errorMessage}`);
  }
}

export function defineCommands() {
  program
    .name('agent-orchestrator')
    .description('An open-source AI agent orchestrator platform')
    .version('0.0.1');

  program
    .command('setup')
    .description('Run the interactive setup configuration')
    .action(async () => {
      console.log('Starting interactive setup...');
      try {
        const basicResponse = await enquirer.prompt<BasicConfig>([
          {
            type: 'input',
            name: 'port',
            message: 'What port should the orchestrator run on?',
            initial: '15789',
          },
          {
            type: 'select',
            name: 'dbType',
            message: 'Which database type do you want to use?',
            choices: ['postgres', 'sqlite'],
          },
          {
            type: 'confirm',
            name: 'dbLogging',
            message: 'Enable database query logging?',
            initial: false,
          },
        ]);

        let databaseUrl = '';
        if (basicResponse.dbType === 'postgres') {
          const dbResponse = await enquirer.prompt<DatabaseConfig>([
            {
              type: 'input',
              name: 'databaseUrl',
              message:
                'Enter your PostgreSQL connection string (e.g., postgres://user:password@localhost:5432/dbname):',
              validate: (value: string) =>
                value.startsWith('postgres://') || 'Invalid PostgreSQL URL',
            },
          ]);
          databaseUrl = dbResponse.databaseUrl;
        }

        const providerResponse = await enquirer.prompt<ProviderConfig>([
          {
            type: 'multiselect',
            name: 'providers',
            message:
              'Which AI providers do you want to configure? (Space to select, Enter to confirm)',
            choices: ['gemini', 'anthropic'],
          },
        ]);

        let geminiKey = '';
        let anthropicKey = '';
        const selectedProviders = providerResponse.providers;

        if (selectedProviders.includes('gemini')) {
          const keyRes = await enquirer.prompt<KeyConfig>([
            {
              type: 'input',
              name: 'key',
              message: 'Enter your Google Gemini API Key:',
            },
          ]);
          geminiKey = keyRes.key;
        }

        if (selectedProviders.includes('anthropic')) {
          const keyRes = await enquirer.prompt<KeyConfig>([
            {
              type: 'input',
              name: 'key',
              message: 'Enter your Anthropic Claude API Key:',
            },
          ]);
          anthropicKey = keyRes.key;
        }

        let jwtSecret = '';

        if (fs.existsSync(ENV_PATH)) {
          const existingEnv = fs.readFileSync(ENV_PATH, 'utf8');
          const jwtMatch = existingEnv.match(/^JWT_SECRET=(.*)$/m);

          if (jwtMatch) {
            const { overwriteJwt } = await enquirer.prompt<{
              overwriteJwt: boolean;
            }>({
              type: 'confirm',
              name: 'overwriteJwt',
              message:
                'A JWT_SECRET already exists. Do you want to generate a new one?',
              initial: false,
            });

            if (overwriteJwt) {
              jwtSecret = crypto.randomBytes(32).toString('hex');
            } else {
              jwtSecret = jwtMatch[1];
            }
          } else {
            jwtSecret = crypto.randomBytes(32).toString('hex');
          }
        } else {
          jwtSecret = crypto.randomBytes(32).toString('hex');
        }

        console.log('Generating configuration...');
        let envContent = `NODE_ENV=production\nPORT=${basicResponse.port}\nDB_TYPE=${basicResponse.dbType}\nDB_LOGGING=${basicResponse.dbLogging}\n`;
        if (databaseUrl) {
          envContent += `DATABASE_URL=${databaseUrl}\n`;
        }
        if (geminiKey) {
          envContent += `GEMINI_API_KEY=${geminiKey}\n`;
        }
        if (anthropicKey) {
          envContent += `ANTHROPIC_API_KEY=${anthropicKey}\n`;
        }
        if (jwtSecret) {
          envContent += `JWT_SECRET=${jwtSecret}\n`;
        }

        fs.writeFileSync(ENV_PATH, envContent);
        console.log('Configuration saved to .env file successfully!');

        const { hasPending, isEmpty } = await checkPendingMigrations();
        if (isEmpty) {
          console.log('Database is empty. Initializing...');
          try {
            await runMigrations();
            await setupAdminUser();
          } catch (err: unknown) {
            const errorMessage =
              err instanceof Error ? err.message : String(err);
            console.error(`Initialization failed: ${errorMessage}`);
          }
        } else if (hasPending) {
          const { confirmMigration } = await enquirer.prompt<{
            confirmMigration: boolean;
          }>({
            type: 'confirm',
            name: 'confirmMigration',
            message:
              'Pending migrations detected on an existing database. Do you want to run them?',
            initial: false,
          });

          if (confirmMigration) {
            try {
              await runMigrations();
              await setupAdminUser();
            } catch (err: unknown) {
              const errorMessage =
                err instanceof Error ? err.message : String(err);
              console.error(`Migration failed: ${errorMessage}`);
            }
          } else {
            console.log('Database migration skipped.');
          }
        } else {
          console.log('Database is already up to date.');
          const { forceMigration } = await enquirer.prompt<{
            forceMigration: boolean;
          }>({
            type: 'confirm',
            name: 'forceMigration',
            message:
              'Do you want to force migration anyway? (This will DROP ALL DATA and re-initialize the database)',
            initial: false,
          });

          if (forceMigration) {
            try {
              await enquirer.prompt({
                type: 'input',
                name: 'continue',
                message:
                  'Press Enter to confirm and start the destructive initialization...',
              });
              await runMigrations(true);
              await setupAdminUser();
            } catch (err: unknown) {
              const errorMessage =
                err instanceof Error ? err.message : String(err);
              console.error(`Migration failed: ${errorMessage}`);
            }
          } else {
            // Check if we should still offer admin setup if not forcing migration
            await setupAdminUser();
          }
        }
      } catch {
        console.error('Setup cancelled or failed.');
      }
    });

  program
    .command('run')
    .description('Start the orchestrator server (detached)')
    .action(() => {
      const existingPid = checkIfRunning();
      if (existingPid) {
        console.log(`Orchestrator is already running with PID: ${existingPid}`);
        return;
      }

      console.log('Starting Agent Orchestrator in background...');

      if (!fs.existsSync(PID_DIR)) {
        fs.mkdirSync(PID_DIR, { recursive: true });
      }

      const logStream = fs.openSync(LOG_FILE, 'a');

      // We point to the main.js entry point in dist
      const mainPath = path.join(PACKAGE_ROOT, 'dist/main.js');

      const child = spawn('node', [mainPath], {
        detached: true,
        stdio: ['ignore', logStream, logStream],
        cwd: PACKAGE_ROOT,
        env: process.env,
      });

      fs.writeFileSync(PID_FILE, child.pid?.toString() || '');
      child.unref();

      console.log(`Orchestrator started in background with PID: ${child.pid}`);
      console.log(`Logs are available at: ${LOG_FILE}`);
    });

  program
    .command('stop')
    .description('Stop the orchestrator server')
    .action(() => {
      const pid = checkIfRunning();
      if (!pid) {
        console.log('Orchestrator is not running.');
        return;
      }

      console.log(`Stopping Orchestrator (PID: ${pid})...`);
      try {
        process.kill(pid, 'SIGTERM');
        console.log('Orchestrator stopped.');
      } catch (e) {
        console.error(`Failed to stop process ${pid}:`, e);
      }

      if (fs.existsSync(PID_FILE)) {
        fs.unlinkSync(PID_FILE);
      }
    });

  program
    .command('migrate')
    .description('Run pending database migrations')
    .option('-f, --force', 'Force re-initialization (DROP ALL DATA)')
    .action(async (options: { force?: boolean }) => {
      try {
        if (options.force) {
          const { confirmForce } = await enquirer.prompt<{
            confirmForce: boolean;
          }>({
            type: 'confirm',
            name: 'confirmForce',
            message:
              'Are you absolutely sure you want to DROP ALL DATA and re-initialize?',
            initial: false,
          });
          if (confirmForce) {
            await enquirer.prompt({
              type: 'input',
              name: 'continue',
              message:
                'Press Enter to confirm and start the destructive initialization...',
            });
            await runMigrations(true);
          } else {
            console.log('Force migration cancelled.');
          }
          return;
        }

        const { hasPending, isEmpty } = await checkPendingMigrations();

        if (isEmpty) {
          console.log('Database is empty. Initializing...');
          await runMigrations();
          return;
        }

        if (!hasPending) {
          console.log('Database is already up to date.');
          return;
        }

        const { confirmMigration } = await enquirer.prompt<{
          confirmMigration: boolean;
        }>({
          type: 'confirm',
          name: 'confirmMigration',
          message: 'Pending migrations detected. Do you want to run them?',
          initial: false,
        });

        if (confirmMigration) {
          await runMigrations();
        } else {
          console.log('Migration cancelled.');
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`Migration failed: ${errorMessage}`);
      }
    });
}

export async function runCli(argv = process.argv) {
  program = new Command();
  defineCommands();
  await program.parseAsync(argv);
}

if (require.main === module) {
  runCli().catch((err) => {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`CLI execution failed: ${errorMessage}`);
    process.exit(1);
  });
}
