import { Command } from 'commander';
import { resolveActionOptions } from '../utils';
import { readEnvFile } from '../env';
import { ENV_PATH } from '../constants';
import type { ConfigCommandOptions } from '../types';

/** Keys matching these patterns are masked unless --show-secrets is passed. */
const MASKED_KEY_PATTERN = /(_SECRET|_KEY)$/i;
const ALWAYS_MASKED_KEYS = new Set(['DATABASE_URL']);

function maskValue(key: string, value: string, showSecrets: boolean): string {
  if (showSecrets) return value;
  if (MASKED_KEY_PATTERN.test(key) || ALWAYS_MASKED_KEYS.has(key)) return '***';
  return value;
}

export function registerConfigCommand(program: Command): void {
  const config = program
    .command('config')
    .description('Manage CLI runtime configuration');

  config
    .command('show')
    .description('Display the current runtime configuration')
    .option(
      '--show-secrets',
      'Reveal masked secret values (keys, tokens, URLs)',
    )
    .option('--format <format>', 'Output format: text or json', 'text')
    .action((...args: unknown[]) => {
      const opts = resolveActionOptions<ConfigCommandOptions>(args);
      const env = readEnvFile(ENV_PATH);

      if (Object.keys(env).length === 0) {
        console.log(
          `No configuration found at ${ENV_PATH}. Run "agent-orchestrator setup" first.`,
        );
        return;
      }

      const masked = Object.fromEntries(
        Object.entries(env).map(([k, v]) => [
          k,
          maskValue(k, v, opts.showSecrets ?? false),
        ]),
      );

      if (opts.format === 'json') {
        console.log(JSON.stringify(masked, null, 2));
      } else {
        console.log(`Configuration from ${ENV_PATH}:\n`);
        for (const [key, value] of Object.entries(masked)) {
          console.log(`  ${key}=${value}`);
        }
      }
    });
}
