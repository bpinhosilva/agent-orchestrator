import { Command } from 'commander';
import * as fs from 'fs';
import { resolveActionOptions, tailLogLines } from '../utils';
import { LOG_FILE } from '../constants';
import type { LogsCommandOptions } from '../types';

export function registerLogsCommand(program: Command): void {
  program
    .command('logs')
    .description('Print the most recent orchestrator log lines')
    .option('-n, --lines <count>', 'Number of log lines to print', '50')
    .option('-f, --follow', 'Follow log output (like tail -f)', false)
    .action((...args: unknown[]) => {
      const opts = resolveActionOptions<LogsCommandOptions>(args);
      try {
        if (!fs.existsSync(LOG_FILE)) {
          console.log(`No log file found at ${LOG_FILE}.`);
          return;
        }

        const lineCount = Number(opts.lines || '50');
        if (!Number.isInteger(lineCount) || lineCount < 1) {
          throw new Error('The --lines option must be a positive integer.');
        }

        const content = fs.readFileSync(LOG_FILE, 'utf8');
        const output = tailLogLines(content, lineCount);
        if (output) {
          console.log(output);
        } else if (!opts.follow) {
          console.log('Log file is empty.');
        }

        if (opts.follow) {
          let position = fs.statSync(LOG_FILE).size;
          fs.watchFile(LOG_FILE, { interval: 200 }, () => {
            try {
              const stat = fs.statSync(LOG_FILE);
              if (stat.size > position) {
                const length = stat.size - position;
                const buffer = Buffer.alloc(length);
                const fd = fs.openSync(LOG_FILE, 'r');
                fs.readSync(fd, buffer, 0, length, position);
                fs.closeSync(fd);
                position = stat.size;
                process.stdout.write(buffer.toString('utf8'));
              }
            } catch {
              // log file may have been rotated; ignore
            }
          });
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`Failed to read logs: ${errorMessage}`);
        process.exit(1);
      }
    });
}
