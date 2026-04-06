#!/usr/bin/env node
import * as os from 'os';
import * as path from 'path';

process.env.NODE_ENV = 'production';
process.env.DOTENV_CONFIG_QUIET = 'true';
process.env.AGENT_ORCHESTRATOR_HOME =
  process.env.AGENT_ORCHESTRATOR_HOME ||
  path.join(os.homedir(), '.agent-orchestrator');

import { Command } from 'commander';
import { getPackageVersion } from './utils';
import { registerAllCommands } from './commands/index';

export {
  PID_DIR,
  PID_FILE,
  LOG_FILE,
  ENV_PATH,
  PROCESS_FILE,
  PACKAGE_ROOT,
} from './constants';

export function createCli(): Command {
  const program = new Command();
  const version = getPackageVersion();

  program
    .name('agent-orchestrator')
    .description('AI Agent Orchestrator CLI')
    .version(version);

  registerAllCommands(program);

  return program;
}

export async function runCli(argv = process.argv): Promise<void> {
  const program = createCli();
  await program.parseAsync(argv);
}

if (require.main === module) {
  runCli().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
