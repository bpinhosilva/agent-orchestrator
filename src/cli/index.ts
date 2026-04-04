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
import { RUNTIME_DEFAULT_PORT } from '../config/port.defaults';
import {
  checkPendingMigrations,
  runMigrations,
} from '../database/migration-state';
import { DEFAULT_USER_AVATAR } from '../users/avatar.constants';
import { User } from '../users/entities/user.entity';

let program = new Command();

const DEFAULT_PORT = `${RUNTIME_DEFAULT_PORT}`;
const PACKAGE_JSON_PATH = path.join(
  path.resolve(__dirname, '..', '..'),
  'package.json',
);
const MAIN_FILE = path.join(
  path.resolve(__dirname, '..', '..'),
  'dist/main.js',
);
const UI_INDEX_FILE = path.join(
  path.resolve(__dirname, '..', '..'),
  'dist/ui/index.html',
);
const SUPPORTED_PROVIDERS = ['gemini', 'anthropic'] as const;

type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[number];

export const PID_DIR = process.env.AGENT_ORCHESTRATOR_HOME;
export const PID_FILE = path.join(PID_DIR, 'pid');
export const LOG_FILE = path.join(PID_DIR, 'server.log');
export const ENV_PATH = path.join(PID_DIR, '.env');
export const PROCESS_FILE = path.join(PID_DIR, 'process.json');

// Determine the package root directory (where package.json is)
// When running from dist/cli/index.js, it's two levels up.
export const PACKAGE_ROOT = path.resolve(__dirname, '..', '..');

// Ensure PID_DIR exists
if (!fs.existsSync(PID_DIR)) {
  fs.mkdirSync(PID_DIR, { recursive: true, mode: 0o700 });
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
  providers: SupportedProvider[];
}

interface KeyConfig {
  key: string;
}

interface SetupAdminOptions {
  interactive?: boolean;
  name?: string;
  email?: string;
  password?: string;
}

interface SetupCommandOptions {
  port?: string;
  dbType?: 'postgres' | 'sqlite';
  databaseUrl?: string;
  dbLogging?: boolean;
  provider?: string[];
  geminiKey?: string;
  anthropicKey?: string;
  yes?: boolean;
  skipAdminSetup?: boolean;
  adminName?: string;
  adminEmail?: string;
  adminPassword?: string;
  regenerateJwtSecret?: boolean;
}

type BasicPromptConfig =
  | {
      type: 'input';
      name: 'port';
      message: string;
      initial: string;
      validate: (value: string) => true | string;
    }
  | {
      type: 'select';
      name: 'dbType';
      message: string;
      choices: BasicConfig['dbType'][];
      initial: 'sqlite';
    }
  | {
      type: 'confirm';
      name: 'dbLogging';
      message: string;
      initial: boolean;
    };

interface MigrateCommandOptions {
  force?: boolean;
  yes?: boolean;
}

interface LogsCommandOptions {
  lines?: string;
}

interface ProcessMetadata {
  pid: number;
  cwd: string;
  mainPath: string;
  port: string;
  logFile: string;
  startedAt: string;
}

interface ManagedProcess {
  pid: number;
  source: 'metadata' | 'pid-file' | 'scan';
  cwd: string;
  mainPath: string;
  port: string;
}

function getPackageVersion(): string {
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'),
    ) as { version?: string };
    return packageJson.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function parseEnvContent(content: string): Record<string, string> {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .reduce<Record<string, string>>((acc, line) => {
      const separatorIndex = line.indexOf('=');
      if (separatorIndex === -1) {
        return acc;
      }
      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      acc[key] = value;
      return acc;
    }, {});
}

function readEnvFile(): Record<string, string> {
  if (!fs.existsSync(ENV_PATH)) {
    return {};
  }

  try {
    return parseEnvContent(fs.readFileSync(ENV_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function writePrivateFile(filePath: string, content: string): void {
  fs.writeFileSync(filePath, content, { mode: 0o600 });
  fs.chmodSync(filePath, 0o600);
}

function readProcessMetadata(): ProcessMetadata | null {
  if (!fs.existsSync(PROCESS_FILE)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      fs.readFileSync(PROCESS_FILE, 'utf8'),
    ) as Partial<ProcessMetadata>;
    if (
      typeof parsed.pid !== 'number' ||
      typeof parsed.cwd !== 'string' ||
      typeof parsed.mainPath !== 'string' ||
      typeof parsed.port !== 'string' ||
      typeof parsed.logFile !== 'string'
    ) {
      return null;
    }

    return {
      pid: parsed.pid,
      cwd: parsed.cwd,
      mainPath: parsed.mainPath,
      port: parsed.port,
      logFile: parsed.logFile,
      startedAt:
        typeof parsed.startedAt === 'string'
          ? parsed.startedAt
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function readPidFile(): number | null {
  if (!fs.existsSync(PID_FILE)) {
    return null;
  }

  try {
    const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim(), 10);
    return Number.isInteger(pid) && pid > 0 ? pid : null;
  } catch {
    return null;
  }
}

function removeRuntimeState(): void {
  if (fs.existsSync(PID_FILE)) {
    fs.unlinkSync(PID_FILE);
  }
  if (fs.existsSync(PROCESS_FILE)) {
    fs.unlinkSync(PROCESS_FILE);
  }
}

function getExpectedMainPath(): string {
  return path.resolve(MAIN_FILE);
}

function getExpectedCwd(): string {
  return path.resolve(PACKAGE_ROOT);
}

function getConfiguredPort(): string {
  const env = readEnvFile();
  return env.PORT || DEFAULT_PORT;
}

function getExpectedProcessShape(): Omit<ProcessMetadata, 'pid' | 'startedAt'> {
  return {
    cwd: getExpectedCwd(),
    mainPath: getExpectedMainPath(),
    port: getConfiguredPort(),
    logFile: LOG_FILE,
  };
}

function parseProcCmdline(pid: number): string[] | null {
  try {
    const cmdlinePath = `/proc/${pid}/cmdline`;
    if (!fs.existsSync(cmdlinePath)) {
      return null;
    }

    const raw = fs.readFileSync(cmdlinePath, 'utf8');
    return raw.split('\u0000').filter(Boolean);
  } catch {
    return null;
  }
}

function readProcCwd(pid: number): string | null {
  try {
    return path.resolve(fs.readlinkSync(`/proc/${pid}/cwd`));
  } catch {
    return null;
  }
}

function processContainsMainPath(
  cmdline: string[],
  expectedMainPath: string,
): boolean {
  return cmdline.some((arg) => {
    try {
      return path.resolve(arg) === expectedMainPath;
    } catch {
      return false;
    }
  });
}

function isManagedProcess(
  pid: number,
  expected: Pick<ProcessMetadata, 'cwd' | 'mainPath'>,
): boolean {
  try {
    process.kill(pid, 0);
  } catch {
    return false;
  }

  const cmdline = parseProcCmdline(pid);
  const cwd = readProcCwd(pid);

  if (!cmdline || !cwd) {
    return false;
  }

  return (
    cwd === path.resolve(expected.cwd) &&
    processContainsMainPath(cmdline, path.resolve(expected.mainPath))
  );
}

function scanForManagedProcesses(
  expected: Pick<ProcessMetadata, 'cwd' | 'mainPath' | 'port'>,
): ManagedProcess[] {
  if (!fs.existsSync('/proc')) {
    return [];
  }

  return fs
    .readdirSync('/proc')
    .filter((entry) => /^\d+$/.test(entry))
    .map((entry) => parseInt(entry, 10))
    .filter((pid) => isManagedProcess(pid, expected))
    .map((pid) => ({
      pid,
      source: 'scan' as const,
      cwd: expected.cwd,
      mainPath: expected.mainPath,
      port: expected.port,
    }));
}

export function findManagedProcess(): ManagedProcess | null {
  const defaultExpected = getExpectedProcessShape();
  const metadata = readProcessMetadata();

  if (
    metadata &&
    isManagedProcess(metadata.pid, {
      cwd: metadata.cwd,
      mainPath: metadata.mainPath,
    })
  ) {
    return { ...metadata, source: 'metadata' };
  }

  const pid = readPidFile();
  if (
    pid &&
    isManagedProcess(pid, {
      cwd: defaultExpected.cwd,
      mainPath: defaultExpected.mainPath,
    })
  ) {
    return { ...defaultExpected, pid, source: 'pid-file' };
  }

  const matches = scanForManagedProcesses(defaultExpected);
  if (matches.length === 1) {
    return matches[0];
  }

  if (matches.length === 0) {
    removeRuntimeState();
    return null;
  }

  throw new Error(
    `Multiple orchestrator processes matched ${defaultExpected.mainPath} in ${defaultExpected.cwd}: ${matches
      .map((match) => match.pid)
      .join(', ')}`,
  );
}

export function checkIfRunning(): number | null {
  const managedProcess = findManagedProcess();
  return managedProcess?.pid ?? null;
}

function assertBuildExists(): void {
  if (!fs.existsSync(MAIN_FILE)) {
    throw new Error(
      `Missing backend build at ${MAIN_FILE}. Run "npm run build:all" before using the CLI runtime.`,
    );
  }

  if (!fs.existsSync(UI_INDEX_FILE)) {
    throw new Error(
      `Missing UI build at ${UI_INDEX_FILE}. Run "npm run build:all" so the packaged CLI starts the full application.`,
    );
  }
}

function persistProcessMetadata(metadata: ProcessMetadata): void {
  writePrivateFile(PID_FILE, `${metadata.pid}\n`);
  writePrivateFile(PROCESS_FILE, `${JSON.stringify(metadata, null, 2)}\n`);
}

function getChildEnvironment(): NodeJS.ProcessEnv {
  const childEnv: NodeJS.ProcessEnv = {
    AGENT_ORCHESTRATOR_HOME: PID_DIR,
    NODE_ENV: 'production',
  };

  const passthroughVars = [
    'PATH',
    'HOME',
    'USER',
    'LOGNAME',
    'SHELL',
    'TMPDIR',
    'TMP',
    'TEMP',
    'SystemRoot',
    'ComSpec',
  ];

  for (const envName of passthroughVars) {
    if (process.env[envName]) {
      childEnv[envName] = process.env[envName];
    }
  }

  return childEnv;
}

function collectProviders(value: string, previous: string[] = []): string[] {
  return previous.concat(
    value
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
}

function normalizeProviders(values: string[] = []): SupportedProvider[] {
  const invalidProviders = values.filter(
    (value) =>
      !SUPPORTED_PROVIDERS.includes(value.toLowerCase() as SupportedProvider),
  );

  if (invalidProviders.length > 0) {
    throw new Error(
      `Unsupported provider(s): ${invalidProviders.join(', ')}. Supported providers: ${SUPPORTED_PROVIDERS.join(', ')}`,
    );
  }

  return [...new Set(values.map((value) => value as SupportedProvider))];
}

function validatePort(port: string): string {
  const parsedPort = Number(port);
  if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
    throw new Error(
      `Invalid port "${port}". Expected an integer between 1 and 65535.`,
    );
  }
  return `${parsedPort}`;
}

function isValidPostgresConnectionString(value: string): boolean {
  return /^postgres(ql)?:\/\//i.test(value);
}

async function confirmAction(
  message: string,
  autoConfirm = false,
): Promise<boolean> {
  if (autoConfirm) {
    return true;
  }

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

  await enquirer.prompt({
    type: 'input',
    name: 'continue',
    message,
  });
}

async function promptBasicConfig(
  options: SetupCommandOptions,
  interactive: boolean,
): Promise<BasicConfig> {
  const promptConfig: BasicPromptConfig[] = [];

  if (interactive && !options.port) {
    promptConfig.push({
      type: 'input',
      name: 'port',
      message: 'What port should the orchestrator run on?',
      initial: DEFAULT_PORT,
      validate: (value: string) => {
        try {
          validatePort(value);
          return true;
        } catch (error: unknown) {
          return error instanceof Error ? error.message : 'Invalid port';
        }
      },
    });
  }

  if (interactive && !options.dbType) {
    promptConfig.push({
      type: 'select',
      name: 'dbType',
      message: 'Which database type do you want to use?',
      choices: ['sqlite', 'postgres'],
      initial: 'sqlite',
    });
  }

  if (interactive && options.dbLogging === undefined) {
    promptConfig.push({
      type: 'confirm',
      name: 'dbLogging',
      message: 'Enable database query logging?',
      initial: false,
    });
  }

  let prompted: Partial<BasicConfig> = {};
  if (promptConfig.length > 0) {
    prompted = await enquirer.prompt(promptConfig);
  }

  const dbType = options.dbType || prompted.dbType || 'sqlite';

  return {
    port: validatePort(options.port || prompted.port || DEFAULT_PORT),
    dbType,
    dbLogging: options.dbLogging ?? prompted.dbLogging ?? false,
  };
}

async function resolveDatabaseUrl(
  dbType: BasicConfig['dbType'],
  options: SetupCommandOptions,
  interactive: boolean,
): Promise<string> {
  if (dbType !== 'postgres') {
    return '';
  }

  if (options.databaseUrl) {
    if (!isValidPostgresConnectionString(options.databaseUrl)) {
      throw new Error('Invalid PostgreSQL URL.');
    }
    return options.databaseUrl;
  }

  if (!interactive) {
    throw new Error(
      'PostgreSQL mode requires --database-url when prompts are disabled.',
    );
  }

  const response = await enquirer.prompt<DatabaseConfig>([
    {
      type: 'input',
      name: 'databaseUrl',
      message:
        'Enter your PostgreSQL connection string (e.g., postgresql://user:password@localhost:5432/dbname):',
      validate: (value: string) =>
        isValidPostgresConnectionString(value) || 'Invalid PostgreSQL URL',
    },
  ]);

  return response.databaseUrl;
}

async function resolveProviders(
  options: SetupCommandOptions,
  interactive: boolean,
): Promise<SupportedProvider[]> {
  if (options.provider && options.provider.length > 0) {
    return normalizeProviders(options.provider);
  }

  if (!interactive) {
    return [];
  }

  const providerResponse = await enquirer.prompt<ProviderConfig>([
    {
      type: 'multiselect',
      name: 'providers',
      message:
        'Which AI providers do you want to configure? (Space to select, Enter to confirm)',
      choices: [...SUPPORTED_PROVIDERS],
    },
  ]);

  return providerResponse.providers;
}

async function resolveProviderKey(
  provider: SupportedProvider,
  providedKey: string | undefined,
  interactive: boolean,
): Promise<string> {
  if (providedKey) {
    return providedKey;
  }

  if (!interactive) {
    throw new Error(
      `Provider "${provider}" requires its API key when prompts are disabled.`,
    );
  }

  const promptMessage =
    provider === 'gemini'
      ? 'Enter your Google Gemini API Key:'
      : 'Enter your Anthropic Claude API Key:';
  const keyResponse = await enquirer.prompt<KeyConfig>([
    {
      type: 'password',
      name: 'key',
      message: promptMessage,
    },
  ]);

  return keyResponse.key;
}

function buildEnvContent(
  currentEnv: Record<string, string>,
  basicConfig: BasicConfig,
  databaseUrl: string,
  geminiKey: string,
  anthropicKey: string,
  jwtSecret: string,
): string {
  const envValues: Record<string, string> = {
    ...currentEnv,
    NODE_ENV: 'production',
    PORT: basicConfig.port,
    DB_TYPE: basicConfig.dbType,
    DB_LOGGING: `${basicConfig.dbLogging}`,
    JWT_SECRET: jwtSecret,
  };

  if (databaseUrl) {
    envValues.DATABASE_URL = databaseUrl;
  } else {
    delete envValues.DATABASE_URL;
  }

  if (geminiKey) {
    envValues.GEMINI_API_KEY = geminiKey;
  }

  if (anthropicKey) {
    envValues.ANTHROPIC_API_KEY = anthropicKey;
  }

  const orderedKeys = [
    'NODE_ENV',
    'PORT',
    'DB_TYPE',
    'DB_LOGGING',
    'DATABASE_URL',
    'GEMINI_API_KEY',
    'ANTHROPIC_API_KEY',
    'JWT_SECRET',
  ];

  const remainingKeys = Object.keys(envValues)
    .filter((key) => !orderedKeys.includes(key))
    .sort();

  return [...orderedKeys, ...remainingKeys]
    .filter((key) => envValues[key] !== undefined && envValues[key] !== '')
    .map((key) => `${key}=${envValues[key]}`)
    .join('\n')
    .concat('\n');
}

export async function setupAdminUser(
  options: SetupAdminOptions = {},
): Promise<void> {
  console.log('\n--- Admin User Setup ---');

  let response: {
    name: string;
    email: string;
    password: string;
    confirm?: string;
  };

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
        last_name: 'User',
        email: response.email,
        password: hashedPassword,
        avatar: DEFAULT_USER_AVATAR,
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

async function maybeSetupAdmin(
  options: SetupCommandOptions,
  interactive: boolean,
): Promise<void> {
  if (options.skipAdminSetup) {
    console.log('Admin user setup skipped.');
    return;
  }

  await setupAdminUser({
    interactive,
    name: options.adminName,
    email: options.adminEmail,
    password: options.adminPassword,
  });
}

async function handleSetup(options: SetupCommandOptions): Promise<void> {
  const interactive = !options.yes;
  const currentEnv = readEnvFile();
  const basicConfig = await promptBasicConfig(options, interactive);
  const databaseUrl = await resolveDatabaseUrl(
    basicConfig.dbType,
    options,
    interactive,
  );
  const selectedProviders = await resolveProviders(options, interactive);

  let geminiKey = currentEnv.GEMINI_API_KEY || '';
  let anthropicKey = currentEnv.ANTHROPIC_API_KEY || '';

  if (selectedProviders.includes('gemini')) {
    geminiKey = await resolveProviderKey(
      'gemini',
      options.geminiKey,
      interactive,
    );
  }

  if (selectedProviders.includes('anthropic')) {
    anthropicKey = await resolveProviderKey(
      'anthropic',
      options.anthropicKey,
      interactive,
    );
  }

  const jwtSecret =
    options.regenerateJwtSecret || !currentEnv.JWT_SECRET
      ? crypto.randomBytes(32).toString('hex')
      : currentEnv.JWT_SECRET;

  console.log('Generating configuration...');
  const envContent = buildEnvContent(
    currentEnv,
    basicConfig,
    databaseUrl,
    geminiKey,
    anthropicKey,
    jwtSecret,
  );
  writePrivateFile(ENV_PATH, envContent);
  console.log(`Configuration saved to ${ENV_PATH} with mode 600.`);

  const { hasPending, isEmpty, requiresBaselineBootstrap } =
    await checkPendingMigrations({
      assumePendingOnError: true,
    });
  if (isEmpty) {
    console.log('Database is empty. Initializing...');
    await runMigrations();
    await maybeSetupAdmin(options, interactive);
    return;
  }

  if (requiresBaselineBootstrap) {
    console.log(
      'Existing database detected without recorded baseline migration. Recording the baseline migration metadata...',
    );
    await runMigrations();
    await maybeSetupAdmin(options, interactive);
    return;
  }

  if (hasPending) {
    const confirmMigration = await confirmAction(
      'Pending migrations detected on an existing database. Do you want to run them?',
      options.yes,
    );

    if (confirmMigration) {
      await runMigrations();
      await maybeSetupAdmin(options, interactive);
    } else {
      console.log('Database migration skipped.');
    }
    return;
  }

  console.log('Database is already up to date.');
  const forceMigration = await confirmAction(
    'Do you want to force migration anyway? (This will DROP ALL DATA and re-initialize the database)',
    false,
  );

  if (forceMigration) {
    await promptForEnter(
      'Press Enter to confirm and start the destructive initialization...',
      false,
    );
    await runMigrations(true);
    await maybeSetupAdmin(options, interactive);
    return;
  }

  await maybeSetupAdmin(options, interactive);
}

function formatProcessSummary(processInfo: ManagedProcess): string {
  return [
    `PID: ${processInfo.pid}`,
    `Source: ${processInfo.source}`,
    `Port: ${processInfo.port}`,
    `Working directory: ${processInfo.cwd}`,
    `Entry point: ${processInfo.mainPath}`,
    `Log file: ${LOG_FILE}`,
  ].join('\n');
}

function tailLogLines(filePath: string, lineCount: number): string {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  if (lines[lines.length - 1] === '') {
    lines.pop();
  }
  return lines.slice(-lineCount).join('\n').trim();
}

function resolveActionOptions<T extends object>(args: unknown[]): T {
  const lastArg = args.at(-1);
  if (lastArg instanceof Command) {
    return lastArg.opts<T>();
  }

  const firstArg = args[0];
  return (firstArg || {}) as T;
}

export function defineCommands() {
  program
    .name('agent-orchestrator')
    .description('Run and manage the Agent Orchestrator application')
    .version(getPackageVersion());

  program
    .command('setup')
    .description('Create or update the local CLI runtime configuration')
    .option('--port <port>', 'Server port for the orchestrator runtime')
    .option('--db-type <type>', 'Database type: sqlite or postgres')
    .option('--database-url <url>', 'PostgreSQL connection string')
    .option('--db-logging', 'Enable database query logging')
    .option(
      '--provider <provider>',
      `Configure a provider (${SUPPORTED_PROVIDERS.join(', ')})`,
      collectProviders,
      [],
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
      const options = resolveActionOptions<SetupCommandOptions>(args);
      console.log('Starting setup...');
      try {
        await handleSetup(options);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`Setup failed: ${errorMessage}`);
      }
    });

  program
    .command('run')
    .description('Start the orchestrator server in detached mode')
    .action(() => {
      try {
        assertBuildExists();
        const existingProcess = findManagedProcess();
        if (existingProcess) {
          console.log(
            `Orchestrator is already running.\n${formatProcessSummary(existingProcess)}`,
          );
          return;
        }

        console.log('Starting Agent Orchestrator in background...');

        if (!fs.existsSync(PID_DIR)) {
          fs.mkdirSync(PID_DIR, { recursive: true, mode: 0o700 });
        }

        const logStream = fs.openSync(LOG_FILE, 'a');
        const child = spawn('node', [MAIN_FILE], {
          detached: true,
          stdio: ['ignore', logStream, logStream],
          cwd: PACKAGE_ROOT,
          env: getChildEnvironment(),
        });

        const pid = child.pid;
        if (!pid) {
          throw new Error('Failed to determine spawned process PID.');
        }

        persistProcessMetadata({
          pid,
          cwd: PACKAGE_ROOT,
          mainPath: MAIN_FILE,
          port: getConfiguredPort(),
          logFile: LOG_FILE,
          startedAt: new Date().toISOString(),
        });

        child.unref();

        console.log(
          `Orchestrator started in background.\n${formatProcessSummary({
            pid,
            source: 'metadata',
            cwd: PACKAGE_ROOT,
            mainPath: MAIN_FILE,
            port: getConfiguredPort(),
          })}`,
        );
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`Failed to start orchestrator: ${errorMessage}`);
      }
    });

  program
    .command('status')
    .description('Show the currently running orchestrator process, if any')
    .action(() => {
      try {
        const runningProcess = findManagedProcess();
        if (!runningProcess) {
          console.log('Orchestrator is not running.');
          return;
        }

        console.log(
          `Orchestrator is running.\n${formatProcessSummary(runningProcess)}`,
        );
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`Failed to inspect orchestrator status: ${errorMessage}`);
      }
    });

  program
    .command('stop')
    .description(
      'Stop the orchestrator server after verifying the running process identity',
    )
    .action(() => {
      try {
        const runningProcess = findManagedProcess();
        if (!runningProcess) {
          console.log('Orchestrator is not running.');
          return;
        }

        console.log(
          `Stopping Orchestrator after verifying the exact process in ${runningProcess.cwd} (PID: ${runningProcess.pid})...`,
        );
        process.kill(runningProcess.pid, 'SIGTERM');
        removeRuntimeState();
        console.log('Orchestrator stop signal sent.');
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`Failed to stop orchestrator: ${errorMessage}`);
      }
    });

  program
    .command('logs')
    .description('Print the most recent orchestrator log lines')
    .option('-n, --lines <count>', 'Number of log lines to print', '50')
    .action((...args: unknown[]) => {
      const options = resolveActionOptions<LogsCommandOptions>(args);
      try {
        if (!fs.existsSync(LOG_FILE)) {
          console.log(`No log file found at ${LOG_FILE}.`);
          return;
        }

        const lineCount = Number(options.lines || '50');
        if (!Number.isInteger(lineCount) || lineCount < 1) {
          throw new Error('The --lines option must be a positive integer.');
        }

        const output = tailLogLines(LOG_FILE, lineCount);
        console.log(output || 'Log file is empty.');
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`Failed to read logs: ${errorMessage}`);
      }
    });

  program
    .command('migrate')
    .description('Run pending database migrations')
    .option('-f, --force', 'Force re-initialization (DROP ALL DATA)')
    .option('-y, --yes', 'Disable confirmation prompts')
    .action(async (...args: unknown[]) => {
      const options = resolveActionOptions<MigrateCommandOptions>(args);
      try {
        if (options.force) {
          const confirmForce = await confirmAction(
            'Are you absolutely sure you want to DROP ALL DATA and re-initialize?',
            options.yes,
          );
          if (confirmForce) {
            await promptForEnter(
              'Press Enter to confirm and start the destructive initialization...',
              options.yes,
            );
            await runMigrations(true);
          } else {
            console.log('Force migration cancelled.');
          }
          return;
        }

        const { hasPending, isEmpty, requiresBaselineBootstrap } =
          await checkPendingMigrations({
            assumePendingOnError: true,
          });

        if (isEmpty) {
          console.log('Database is empty. Initializing...');
          await runMigrations();
          return;
        }

        if (requiresBaselineBootstrap) {
          console.log(
            'Existing database detected without recorded baseline migration. Recording the baseline migration metadata...',
          );
          await runMigrations();
          return;
        }

        if (!hasPending) {
          console.log('Database is already up to date.');
          return;
        }

        const confirmMigration = await confirmAction(
          'Pending migrations detected. Do you want to run them?',
          options.yes,
        );

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
