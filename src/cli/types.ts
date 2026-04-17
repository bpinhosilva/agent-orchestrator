export const SUPPORTED_PROVIDERS = ['gemini', 'anthropic'] as const;
export type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[number];

export interface BasicConfig {
  host: string;
  port: string;
  dbType: 'postgres' | 'sqlite';
  dbLogging: boolean;
}

export interface DatabaseConfig {
  databaseUrl: string;
}

export interface ProviderConfig {
  providers: SupportedProvider[];
}

export interface KeyConfig {
  key: string;
}

export interface SetupAdminOptions {
  interactive?: boolean;
  name?: string;
  email?: string;
  password?: string;
}

export interface SetupCommandOptions {
  host?: string;
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

export type BasicPromptConfig =
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

export interface MigrateCommandOptions {
  force?: boolean;
  yes?: boolean;
}

export interface LogsCommandOptions {
  lines?: string;
  follow?: boolean;
}

export interface RunCommandOptions {
  logLevel?: string;
}

export interface ProcessMetadata {
  pid: number;
  cwd: string;
  mainPath: string;
  host: string;
  port: string;
  logFile: string;
  startedAt: string;
}

export interface ManagedProcess {
  pid: number;
  source: 'metadata' | 'pid-file' | 'scan';
  cwd: string;
  mainPath: string;
  host: string;
  port: string;
}

export interface FileSystem {
  existsSync(path: string): boolean;
  readFileSync(path: string, encoding: BufferEncoding): string;
  writeFileSync(
    path: string,
    content: string,
    options?: { mode?: number },
  ): void;
  chmodSync(path: string, mode: number): void;
  unlinkSync(path: string): void;
  mkdirSync(
    path: string,
    options?: { recursive?: boolean; mode?: number },
  ): void;
  openSync(path: string, flags: string): number;
  readdirSync(path: string): string[];
  readlinkSync(path: string): string;
}

export interface Prompter {
  prompt<T>(questions: unknown): Promise<T>;
}

export type DataSourceFactory = () => import('typeorm').DataSource;
