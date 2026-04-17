import { Command } from 'commander';
import { registerConfigCommand } from '../../commands/config.command';

jest.mock('../../env', () => ({
  readEnvFile: jest.fn(),
}));

import * as envModule from '../../env';

describe('config show command', () => {
  let program: Command;
  let consoleSpy: jest.SpyInstance;

  const sampleEnv = {
    PORT: '15789',
    HOST: '127.0.0.1',
    JWT_SECRET: 'supersecret',
    JWT_REFRESH_SECRET: 'refreshsecret',
    DATABASE_URL: 'sqlite:local.sqlite',
    GEMINI_API_KEY: 'gemini-key',
    SOME_OTHER: 'plain-value',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    program = new Command();
    program.exitOverride();
    registerConfigCommand(program);
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    (envModule.readEnvFile as jest.Mock).mockReturnValue(sampleEnv);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('masks _SECRET, _KEY, and DATABASE_URL by default', async () => {
    await program.parseAsync(['node', 'cli', 'config', 'show']);

    const allOutput = consoleSpy.mock.calls
      .map((c: unknown[]) => String(c[0]))
      .join('\n');
    expect(allOutput).toContain('JWT_SECRET=***');
    expect(allOutput).toContain('GEMINI_API_KEY=***');
    expect(allOutput).toContain('DATABASE_URL=***');
    expect(allOutput).not.toContain('supersecret');
    expect(allOutput).not.toContain('gemini-key');
    expect(allOutput).not.toContain('sqlite:local.sqlite');
  });

  it('reveals secrets with --show-secrets', async () => {
    await program.parseAsync([
      'node',
      'cli',
      'config',
      'show',
      '--show-secrets',
    ]);

    const allOutput = consoleSpy.mock.calls
      .map((c: unknown[]) => String(c[0]))
      .join('\n');
    expect(allOutput).toContain('supersecret');
    expect(allOutput).toContain('gemini-key');
    expect(allOutput).toContain('sqlite:local.sqlite');
  });

  it('outputs valid JSON with --format json', async () => {
    await program.parseAsync([
      'node',
      'cli',
      'config',
      'show',
      '--format',
      'json',
    ]);

    const allCalls = consoleSpy.mock.calls as unknown[][];
    const jsonCall = allCalls.find((c) => {
      try {
        JSON.parse(String(c[0]));
        return true;
      } catch {
        return false;
      }
    });
    expect(jsonCall).toBeDefined();
    const parsed = JSON.parse(String(jsonCall![0])) as Record<string, string>;
    expect(parsed.JWT_SECRET).toBe('***');
    expect(parsed.PORT).toBe('15789');
  });

  it('prints not-configured message when env is empty', async () => {
    (envModule.readEnvFile as jest.Mock).mockReturnValue({});
    await program.parseAsync(['node', 'cli', 'config', 'show']);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('setup'));
  });
});
