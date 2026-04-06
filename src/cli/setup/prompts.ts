import * as crypto from 'crypto';
import { Prompter, SupportedProvider } from '../types';
import { SUPPORTED_PROVIDERS } from '../constants';
import {
  validatePort,
  isValidPostgresConnectionString,
  collectProviders,
  normalizeProviders,
} from './validators';

export interface SetupAnswers {
  port: string;
  dbType: 'sqlite' | 'postgres';
  databaseUrl: string;
  providers: SupportedProvider[];
  schedulerEnabled: boolean;
  jwtSecret: string;
  jwtRefreshSecret: string;
  geminiApiKey: string;
  anthropicApiKey: string;
}

/**
 * Lazy-loads Enquirer via dynamic import so the heavy dependency is only
 * resolved when the setup wizard actually runs, not at module load time.
 */
async function createDefaultPrompter(): Promise<Prompter> {
  const { default: Enquirer } = await import('enquirer');
  const enquirer = new (Enquirer as new () => {
    prompt<T>(q: unknown): Promise<T>;
  })();
  return {
    prompt<T>(questions: unknown): Promise<T> {
      return enquirer.prompt<T>(questions);
    },
  };
}

export async function promptPort(
  prompter: Prompter,
  initial = '3000',
): Promise<string> {
  const answer = await prompter.prompt<{ port: string }>({
    type: 'input',
    name: 'port',
    message: 'What port should the orchestrator run on?',
    initial,
    validate: (value: string) => {
      try {
        validatePort(value);
        return true;
      } catch (error: unknown) {
        return error instanceof Error ? error.message : 'Invalid port';
      }
    },
  });
  return validatePort(answer.port);
}

export async function promptDbType(
  prompter: Prompter,
  initial: 'sqlite' | 'postgres' = 'sqlite',
): Promise<'sqlite' | 'postgres'> {
  const answer = await prompter.prompt<{ dbType: 'sqlite' | 'postgres' }>({
    type: 'select',
    name: 'dbType',
    message: 'Which database type do you want to use?',
    choices: ['sqlite', 'postgres'],
    initial,
  });
  return answer.dbType;
}

export async function promptDatabaseUrl(
  prompter: Prompter,
  initial = '',
): Promise<string> {
  const answer = await prompter.prompt<{ databaseUrl: string }>({
    type: 'input',
    name: 'databaseUrl',
    message:
      'Enter your PostgreSQL connection string (e.g., postgresql://user:password@localhost:5432/dbname):',
    initial,
    validate: (value: string) =>
      isValidPostgresConnectionString(value) || 'Invalid PostgreSQL URL',
  });
  if (!isValidPostgresConnectionString(answer.databaseUrl)) {
    throw new Error(
      `Invalid PostgreSQL connection string: "${answer.databaseUrl}"`,
    );
  }
  return answer.databaseUrl;
}

export async function promptProviders(
  prompter: Prompter,
): Promise<SupportedProvider[]> {
  const answer = await prompter.prompt<{ providers: string[] }>({
    type: 'multiselect',
    name: 'providers',
    message:
      'Which AI providers do you want to configure? (Space to select, Enter to confirm)',
    choices: [...SUPPORTED_PROVIDERS],
  });
  const raw = collectProviders(answer.providers.join(','));
  return normalizeProviders(raw);
}

export async function promptScheduler(
  prompter: Prompter,
  initial = true,
): Promise<boolean> {
  const answer = await prompter.prompt<{ schedulerEnabled: boolean }>({
    type: 'confirm',
    name: 'schedulerEnabled',
    message: 'Enable the task scheduler?',
    initial,
  });
  return answer.schedulerEnabled;
}

export async function promptJwtSecret(
  prompter: Prompter,
  initial = '',
): Promise<string> {
  const answer = await prompter.prompt<{ jwtSecret: string }>({
    type: 'password',
    name: 'jwtSecret',
    message: 'Enter JWT_SECRET (min 32 chars, leave blank to auto-generate):',
    initial,
  });
  const value = (answer.jwtSecret ?? '').trim();
  if (!value) {
    return crypto.randomBytes(32).toString('hex');
  }
  if (value.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
  return value;
}

export async function promptJwtRefreshSecret(
  prompter: Prompter,
  initial = '',
): Promise<string> {
  const answer = await prompter.prompt<{ jwtRefreshSecret: string }>({
    type: 'password',
    name: 'jwtRefreshSecret',
    message:
      'Enter JWT_REFRESH_SECRET (min 32 chars, leave blank to auto-generate):',
    initial,
  });
  const value = (answer.jwtRefreshSecret ?? '').trim();
  if (!value) {
    return crypto.randomBytes(32).toString('hex');
  }
  if (value.length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be at least 32 characters');
  }
  return value;
}

export async function promptGeminiKey(
  prompter: Prompter,
  required = false,
  initial?: string,
): Promise<string> {
  const answer = await prompter.prompt<{ key: string }>({
    type: 'password',
    name: 'key',
    message: 'Enter your Google Gemini API Key:',
    initial: initial ?? '',
    validate: required
      ? (value: string) =>
          value.trim().length > 0 || 'Gemini API key is required'
      : undefined,
  });
  return answer.key ?? '';
}

export async function promptAnthropicKey(
  prompter: Prompter,
  required = false,
  initial?: string,
): Promise<string> {
  const answer = await prompter.prompt<{ key: string }>({
    type: 'password',
    name: 'key',
    message: 'Enter your Anthropic Claude API Key:',
    initial: initial ?? '',
    validate: required
      ? (value: string) =>
          value.trim().length > 0 || 'Anthropic API key is required'
      : undefined,
  });
  return answer.key ?? '';
}

/**
 * Orchestrates all interactive setup prompts and returns a `SetupAnswers`
 * object ready for env-file generation.
 *
 * @param existingEnv - Current env values used as prompt defaults.
 * @param prompter - Optional injected prompter; defaults to a lazy-loaded
 *   Enquirer instance so the dependency is not resolved unless needed.
 */
export async function runSetupPrompts(
  existingEnv: Record<string, string> = {},
  prompter?: Prompter,
): Promise<SetupAnswers> {
  const p = prompter ?? (await createDefaultPrompter());

  const existingDbType = ['sqlite', 'postgres'].includes(
    existingEnv.DB_TYPE ?? '',
  )
    ? (existingEnv.DB_TYPE as 'sqlite' | 'postgres')
    : 'sqlite';
  const port = await promptPort(p, existingEnv.PORT || '3000');
  const dbType = await promptDbType(p, existingDbType);

  let databaseUrl = '';
  if (dbType === 'postgres') {
    databaseUrl = await promptDatabaseUrl(p, existingEnv.DATABASE_URL || '');
  }

  const providers = await promptProviders(p);
  const schedulerEnabled = await promptScheduler(
    p,
    existingEnv.SCHEDULER_ENABLED !== 'false',
  );

  const jwtSecret = await promptJwtSecret(p, existingEnv.JWT_SECRET || '');
  const jwtRefreshSecret = await promptJwtRefreshSecret(
    p,
    existingEnv.JWT_REFRESH_SECRET || '',
  );

  const geminiApiKey = providers.includes('gemini')
    ? await promptGeminiKey(p, true, existingEnv.GEMINI_API_KEY)
    : (existingEnv.GEMINI_API_KEY ?? '');

  const anthropicApiKey = providers.includes('anthropic')
    ? await promptAnthropicKey(p, true, existingEnv.ANTHROPIC_API_KEY)
    : (existingEnv.ANTHROPIC_API_KEY ?? '');

  return {
    port,
    dbType,
    databaseUrl,
    providers,
    schedulerEnabled,
    jwtSecret,
    jwtRefreshSecret,
    geminiApiKey,
    anthropicApiKey,
  };
}
