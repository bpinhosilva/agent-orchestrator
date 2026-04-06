import * as crypto from 'crypto';
import { ENV_PATH } from '../constants';
import { buildEnvContent, readEnvFile, writePrivateFile } from '../env';
import type {
  DataSourceFactory,
  FileSystem,
  Prompter,
  SetupCommandOptions,
} from '../types';
import { maybeSetupAdmin } from './admin';
import { runSetupPrompts, type SetupAnswers } from './prompts';

export async function handleSetup(
  opts: SetupCommandOptions,
  fsDep?: FileSystem,
  prompter?: Prompter,
  dsFactory?: DataSourceFactory,
): Promise<void> {
  const existingEnv = readEnvFile(ENV_PATH, fsDep);

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
      port: opts.port ?? '15789',
      dbType: opts.dbType ?? 'sqlite',
      databaseUrl: opts.databaseUrl ?? '',
      providers: [],
      schedulerEnabled: existingEnv.SCHEDULER_ENABLED !== 'false',
      jwtSecret,
      jwtRefreshSecret,
      geminiApiKey: opts.geminiKey ?? existingEnv.GEMINI_API_KEY ?? '',
      anthropicApiKey: opts.anthropicKey ?? existingEnv.ANTHROPIC_API_KEY ?? '',
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
      port: answers.port,
      dbType: answers.dbType,
      dbLogging: existingEnv.DB_LOGGING === 'true',
    },
    answers.databaseUrl,
    answers.geminiApiKey,
    answers.anthropicApiKey,
    answers.jwtSecret,
    answers.jwtRefreshSecret,
  );

  writePrivateFile(ENV_PATH, envContent, fsDep);
  console.log(`Configuration saved to ${ENV_PATH} with mode 600.`);

  if (dsFactory !== undefined) {
    await maybeSetupAdmin({ ...opts }, dsFactory);
  } else {
    await maybeSetupAdmin({ ...opts });
  }
}
