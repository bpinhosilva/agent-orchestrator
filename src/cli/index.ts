#!/usr/bin/env node
import { Command } from 'commander';
import * as enquirer from 'enquirer';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { spawn } from 'child_process';
import * as os from 'os';

const program = new Command();

const PID_DIR = path.join(os.homedir(), '.agent-orchestrator');
const PID_FILE = path.join(PID_DIR, 'pid');
const LOG_FILE = path.join(PID_DIR, 'server.log');

interface BasicConfig {
  port: string;
  dbType: 'postgres' | 'sqlite';
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

function checkIfRunning(): number | null {
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
      const envPath = path.join(process.cwd(), '.env');

      if (fs.existsSync(envPath)) {
        const existingEnv = fs.readFileSync(envPath, 'utf8');
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
      let envContent = `PORT=${basicResponse.port}\nDB_TYPE=${basicResponse.dbType}\n`;
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

      fs.writeFileSync(envPath, envContent);
      console.log('Configuration saved to .env file successfully!');
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
    const child = spawn('node', [path.join(__dirname, '../main.js')], {
      detached: true,
      stdio: ['ignore', logStream, logStream],
      cwd: process.cwd(),
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

program.parse(process.argv);
