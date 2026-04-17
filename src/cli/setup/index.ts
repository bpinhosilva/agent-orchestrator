import * as crypto from 'crypto';
import { ENV_PATH } from '../constants';
import { buildEnvContent, readEnvFile, writePrivateFile } from '../env';
import { getDefaultHost } from '../../config/host.defaults';
import type {
  DataSourceFactory,
  FileSystem,
  Prompter,
  SetupCommandOptions,
} from '../types';
import { maybeSetupAdmin } from './admin';
import { runSetupPrompts, type SetupAnswers } from './prompts';

const SENSITIVE_FLAG_ENV_VARS: [keyof SetupCommandOptions, string, string][] = [
  ['geminiKey', 'GEMINI_API_KEY', '--gemini-key'],
  ['anthropicKey', 'ANTHROPIC_API_KEY', '--anthropic-key'],
  ['ollamaKey', 'OLLAMA_API_KEY', '--ollama-key'],
  ['databaseUrl', 'DATABASE_URL', '--database-url'],
  ['adminPassword', 'SETUP_ADMIN_PASSWORD', '--admin-password'],
];

export async function handleSetup(
  opts: SetupCommandOptions,
  fsDep?: FileSystem,
  prompter?: Prompter,
  dsFactory?: DataSourceFactory,
): Promise<void> {
  // Warn when sensitive values are supplied as CLI flags
  for (const [optKey, , flagName] of SENSITIVE_FLAG_ENV_VARS) {
    if (opts[optKey] !== undefined) {
      console.warn(
        `Warning: Passing secrets as CLI flags (${flagName}) exposes them in process ` +
          `tables and shell history. Use environment variables instead.`,
      );
    }
  }

  const existingEnv = readEnvFile(ENV_PATH, fsDep);

  // Resolve a sensitive value: CLI flag > process env var > existing .env value
  const resolveSecret = (
    flagValue: string | undefined,
    envVar: string,
    existingKey: string,
  ): string =>
    flagValue ?? process.env[envVar] ?? existingEnv[existingKey] ?? '';

  let answers: SetupAnswers;
  if (opts.yes) {
    const jwtSecret =
      opts.regenerateJwtSecret || !existingEnv.JWT_SECRET
        ? crypto.randomBytes(32).toString('hex')
        : existingEnv.JWT_SECRET;
    const jwtRefreshSecret =
      opts.regenerateJwtSecret || !existingEnv.JWT_REFRESH_SECRET
        ? crypto.randomBytes(32).toString('hex')
        : existingEnv.JWT_REFRESH_SECRET;
    answers = {
      host: opts.host ?? existingEnv.HOST ?? getDefaultHost('production'),
      port: opts.port ?? '15789',
      dbType: opts.dbType ?? 'sqlite',
      databaseUrl: resolveSecret(
        opts.databaseUrl,
        'DATABASE_URL',
        'DATABASE_URL',
      ),
      providers: [],
      schedulerEnabled: existingEnv.SCHEDULER_ENABLED !== 'false',
      jwtSecret,
      jwtRefreshSecret,
      geminiApiKey: resolveSecret(
        opts.geminiKey,
        'GEMINI_API_KEY',
        'GEMINI_API_KEY',
      ),
      anthropicApiKey: resolveSecret(
        opts.anthropicKey,
        'ANTHROPIC_API_KEY',
        'ANTHROPIC_API_KEY',
      ),
      ollamaApiKey: resolveSecret(
        opts.ollamaKey,
        'OLLAMA_API_KEY',
        'OLLAMA_API_KEY',
      ),
      ollamaHost: opts.ollamaHost ?? existingEnv.OLLAMA_HOST ?? '',
    };
  } else {
    answers = await runSetupPrompts(existingEnv, prompter);
  }

  const envContent = buildEnvContent(
    {
      ...existingEnv,
      SCHEDULER_ENABLED: answers.schedulerEnabled ? 'true' : 'false',
    },
    {
      host: answers.host,
      port: answers.port,
      dbType: answers.dbType,
      dbLogging: existingEnv.DB_LOGGING === 'true',
    },
    answers.databaseUrl,
    answers.geminiApiKey,
    answers.anthropicApiKey,
    answers.jwtSecret,
    answers.jwtRefreshSecret,
    answers.ollamaApiKey,
    answers.ollamaHost,
  );

  writePrivateFile(ENV_PATH, envContent, fsDep);
  console.log(`Configuration saved to ${ENV_PATH} with mode 600.`);

  // Resolve admin password via env var fallback before passing to admin setup
  const resolvedAdminPassword =
    opts.adminPassword ?? process.env.SETUP_ADMIN_PASSWORD;

  const resolvedOpts = { ...opts, adminPassword: resolvedAdminPassword };

  if (dsFactory !== undefined) {
    await maybeSetupAdmin(resolvedOpts, dsFactory);
  } else {
    await maybeSetupAdmin(resolvedOpts);
  }
}
