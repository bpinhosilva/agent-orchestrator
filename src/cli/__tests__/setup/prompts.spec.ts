/* eslint-disable @typescript-eslint/require-await */
import {
  promptPort,
  promptDbType,
  promptDatabaseUrl,
  promptProviders,
  promptScheduler,
  promptJwtSecret,
  promptJwtRefreshSecret,
  promptGeminiKey,
  promptAnthropicKey,
  runSetupPrompts,
} from '../../setup/prompts';
import { Prompter } from '../../types';

/**
 * Builds a fake Prompter that resolves each question by name from the given
 * responses map. Works for both single-question objects and arrays.
 */
function makeFakePrompter(responses: Record<string, unknown>): Prompter {
  return {
    async prompt<T>(question: unknown): Promise<T> {
      const questions = Array.isArray(question) ? question : [question];
      const result: Record<string, unknown> = {};
      for (const q of questions as { name: string }[]) {
        result[q.name] = responses[q.name];
      }
      return result as T;
    },
  };
}

describe('promptPort', () => {
  it('returns the validated port from the prompter answer', async () => {
    const p = makeFakePrompter({ port: '4000' });
    await expect(promptPort(p)).resolves.toBe('4000');
  });

  it('uses the supplied initial value as default', async () => {
    const p = makeFakePrompter({ port: '8080' });
    await expect(promptPort(p, '8080')).resolves.toBe('8080');
  });

  it('throws when the prompter returns an invalid port', async () => {
    const p = makeFakePrompter({ port: '99999' });
    await expect(promptPort(p)).rejects.toThrow('Invalid port');
  });

  it('throws when the prompter returns a non-numeric value', async () => {
    const p = makeFakePrompter({ port: 'abc' });
    await expect(promptPort(p)).rejects.toThrow('Invalid port');
  });

  it('accepts the maximum valid port 65535', async () => {
    const p = makeFakePrompter({ port: '65535' });
    await expect(promptPort(p)).resolves.toBe('65535');
  });
});

describe('promptDbType', () => {
  it('returns sqlite', async () => {
    const p = makeFakePrompter({ dbType: 'sqlite' });
    await expect(promptDbType(p)).resolves.toBe('sqlite');
  });

  it('returns postgres', async () => {
    const p = makeFakePrompter({ dbType: 'postgres' });
    await expect(promptDbType(p)).resolves.toBe('postgres');
  });

  it('accepts an initial value parameter', async () => {
    const p = makeFakePrompter({ dbType: 'postgres' });
    await expect(promptDbType(p, 'postgres')).resolves.toBe('postgres');
  });
});

describe('promptDatabaseUrl', () => {
  it('returns the entered connection string', async () => {
    const url = 'postgres://user:pass@localhost:5432/mydb';
    const p = makeFakePrompter({ databaseUrl: url });
    await expect(promptDatabaseUrl(p)).resolves.toBe(url);
  });

  it('accepts an initial value parameter', async () => {
    const url = 'postgresql://a:b@host/db';
    const p = makeFakePrompter({ databaseUrl: url });
    await expect(promptDatabaseUrl(p, url)).resolves.toBe(url);
  });

  it('throws when the returned URL is not a valid postgres connection string', async () => {
    const p = makeFakePrompter({ databaseUrl: 'mysql://host/db' });
    await expect(promptDatabaseUrl(p)).rejects.toThrow(
      'Invalid PostgreSQL connection string',
    );
  });

  it('throws for a plain non-URL string', async () => {
    const p = makeFakePrompter({ databaseUrl: 'not-a-url' });
    await expect(promptDatabaseUrl(p)).rejects.toThrow(
      'Invalid PostgreSQL connection string',
    );
  });
});

describe('promptProviders', () => {
  it('returns normalized providers from multiselect', async () => {
    const p = makeFakePrompter({ providers: ['gemini', 'anthropic'] });
    await expect(promptProviders(p)).resolves.toEqual(['gemini', 'anthropic']);
  });

  it('returns a single provider', async () => {
    const p = makeFakePrompter({ providers: ['gemini'] });
    await expect(promptProviders(p)).resolves.toEqual(['gemini']);
  });

  it('returns empty array when nothing is selected', async () => {
    const p = makeFakePrompter({ providers: [] });
    await expect(promptProviders(p)).resolves.toEqual([]);
  });

  it('deduplicates repeated providers', async () => {
    const p = makeFakePrompter({ providers: ['gemini', 'gemini'] });
    await expect(promptProviders(p)).resolves.toEqual(['gemini']);
  });

  it('throws when an unsupported provider is in the list', async () => {
    const p = makeFakePrompter({ providers: ['openai'] });
    await expect(promptProviders(p)).rejects.toThrow(
      'is not a supported provider',
    );
  });
});

describe('promptScheduler', () => {
  it('returns true when confirmed', async () => {
    const p = makeFakePrompter({ schedulerEnabled: true });
    await expect(promptScheduler(p)).resolves.toBe(true);
  });

  it('returns false when declined', async () => {
    const p = makeFakePrompter({ schedulerEnabled: false });
    await expect(promptScheduler(p)).resolves.toBe(false);
  });

  it('passes initial=false through to the prompter', async () => {
    let capturedInitial: unknown;
    const p: Prompter = {
      async prompt<T>(question: unknown): Promise<T> {
        const q = question as { name: string; initial?: unknown };
        capturedInitial = q.initial;
        return { schedulerEnabled: false } as T;
      },
    };
    await promptScheduler(p, false);
    expect(capturedInitial).toBe(false);
  });
});

describe('promptJwtSecret', () => {
  it('returns the entered secret when it meets the 32-char minimum', async () => {
    const secret = 'a'.repeat(32);
    const p = makeFakePrompter({ jwtSecret: secret });
    await expect(promptJwtSecret(p)).resolves.toBe(secret);
  });

  it('auto-generates a 64-char hex secret when answer is blank', async () => {
    const p = makeFakePrompter({ jwtSecret: '' });
    const result = await promptJwtSecret(p);
    expect(result).toHaveLength(64);
    expect(result).toMatch(/^[0-9a-f]+$/);
  });

  it('auto-generates when answer is whitespace-only', async () => {
    const p = makeFakePrompter({ jwtSecret: '   ' });
    const result = await promptJwtSecret(p);
    expect(result).toHaveLength(64);
  });

  it('throws when the entered secret is exactly 31 characters', async () => {
    const p = makeFakePrompter({ jwtSecret: 'x'.repeat(31) });
    await expect(promptJwtSecret(p)).rejects.toThrow(
      'JWT_SECRET must be at least 32 characters',
    );
  });

  it('throws when the entered secret is shorter than 32 characters', async () => {
    const p = makeFakePrompter({ jwtSecret: 'short' });
    await expect(promptJwtSecret(p)).rejects.toThrow(
      'JWT_SECRET must be at least 32 characters',
    );
  });

  it('succeeds with exactly 32 characters', async () => {
    const secret = 'c'.repeat(32);
    const p = makeFakePrompter({ jwtSecret: secret });
    await expect(promptJwtSecret(p)).resolves.toBe(secret);
  });

  it('uses the supplied initial value', async () => {
    const secret = 'b'.repeat(40);
    const p = makeFakePrompter({ jwtSecret: secret });
    await expect(promptJwtSecret(p, secret)).resolves.toBe(secret);
  });
});

describe('promptJwtRefreshSecret', () => {
  it('returns the entered secret when it meets the 32-char minimum', async () => {
    const secret = 'z'.repeat(32);
    const p = makeFakePrompter({ jwtRefreshSecret: secret });
    await expect(promptJwtRefreshSecret(p)).resolves.toBe(secret);
  });

  it('auto-generates a 64-char hex secret when answer is blank', async () => {
    const p = makeFakePrompter({ jwtRefreshSecret: '' });
    const result = await promptJwtRefreshSecret(p);
    expect(result).toHaveLength(64);
    expect(result).toMatch(/^[0-9a-f]+$/);
  });

  it('auto-generates when answer is whitespace-only', async () => {
    const p = makeFakePrompter({ jwtRefreshSecret: '   ' });
    const result = await promptJwtRefreshSecret(p);
    expect(result).toHaveLength(64);
  });

  it('throws when the entered secret is exactly 31 characters', async () => {
    const p = makeFakePrompter({ jwtRefreshSecret: 'y'.repeat(31) });
    await expect(promptJwtRefreshSecret(p)).rejects.toThrow(
      'JWT_REFRESH_SECRET must be at least 32 characters',
    );
  });

  it('throws when the entered secret is shorter than 32 characters', async () => {
    const p = makeFakePrompter({ jwtRefreshSecret: 'tooshort' });
    await expect(promptJwtRefreshSecret(p)).rejects.toThrow(
      'JWT_REFRESH_SECRET must be at least 32 characters',
    );
  });

  it('succeeds with exactly 32 characters', async () => {
    const secret = 'w'.repeat(32);
    const p = makeFakePrompter({ jwtRefreshSecret: secret });
    await expect(promptJwtRefreshSecret(p)).resolves.toBe(secret);
  });

  it('uses the supplied initial value', async () => {
    const secret = 'v'.repeat(40);
    const p = makeFakePrompter({ jwtRefreshSecret: secret });
    await expect(promptJwtRefreshSecret(p, secret)).resolves.toBe(secret);
  });
});

describe('promptGeminiKey', () => {
  it('returns the entered API key', async () => {
    const p = makeFakePrompter({ key: 'gemini-key-abc' });
    await expect(promptGeminiKey(p)).resolves.toBe('gemini-key-abc');
  });

  it('returns an empty string when no key is entered and not required', async () => {
    const p = makeFakePrompter({ key: '' });
    await expect(promptGeminiKey(p, false)).resolves.toBe('');
  });

  it('validate callback rejects empty input when required=true', async () => {
    let capturedValidate: ((v: string) => unknown) | undefined;
    const p: Prompter = {
      async prompt<T>(question: unknown): Promise<T> {
        const q = question as {
          name: string;
          validate?: (v: string) => unknown;
        };
        capturedValidate = q.validate;
        return { key: 'my-key' } as T;
      },
    };
    await promptGeminiKey(p, true);
    expect(capturedValidate).toBeDefined();
    expect(capturedValidate!('')).toBe('Gemini API key is required');
    expect(capturedValidate!('some-key')).toBe(true);
  });

  it('forwards the initial value to the prompter question', async () => {
    let capturedInitial: unknown;
    const p: Prompter = {
      async prompt<T>(question: unknown): Promise<T> {
        const q = question as { name: string; initial?: unknown };
        capturedInitial = q.initial;
        return { key: 'existing-key' } as T;
      },
    };
    await promptGeminiKey(p, true, 'existing-key');
    expect(capturedInitial).toBe('existing-key');
  });
});

describe('promptAnthropicKey', () => {
  it('returns the entered API key', async () => {
    const p = makeFakePrompter({ key: 'sk-ant-xyz' });
    await expect(promptAnthropicKey(p)).resolves.toBe('sk-ant-xyz');
  });

  it('returns an empty string when no key is entered and not required', async () => {
    const p = makeFakePrompter({ key: '' });
    await expect(promptAnthropicKey(p, false)).resolves.toBe('');
  });

  it('validate callback rejects empty input when required=true', async () => {
    let capturedValidate: ((v: string) => unknown) | undefined;
    const p: Prompter = {
      async prompt<T>(question: unknown): Promise<T> {
        const q = question as {
          name: string;
          validate?: (v: string) => unknown;
        };
        capturedValidate = q.validate;
        return { key: 'sk-ant-key' } as T;
      },
    };
    await promptAnthropicKey(p, true);
    expect(capturedValidate).toBeDefined();
    expect(capturedValidate!('')).toBe('Anthropic API key is required');
    expect(capturedValidate!('sk-ant-abc')).toBe(true);
  });
});

describe('runSetupPrompts', () => {
  const jwtSecret = 'a'.repeat(64);
  const jwtRefreshSecret = 'b'.repeat(64);

  describe('sqlite path', () => {
    it('skips DATABASE_URL prompt and provider keys not selected', async () => {
      const called: string[] = [];
      const p: Prompter = {
        async prompt<T>(question: unknown): Promise<T> {
          const q = question as { name: string };
          called.push(q.name);
          const responses: Record<string, unknown> = {
            port: '3000',
            dbType: 'sqlite',
            providers: [],
            schedulerEnabled: true,
            jwtSecret,
            jwtRefreshSecret,
          };
          return { [q.name]: responses[q.name] } as T;
        },
      };

      const result = await runSetupPrompts({}, p);

      expect(called).not.toContain('databaseUrl');
      expect(called).not.toContain('key'); // no provider keys prompted
      expect(result).toMatchObject({
        port: '3000',
        dbType: 'sqlite',
        databaseUrl: '',
        providers: [],
        schedulerEnabled: true,
        jwtSecret,
        jwtRefreshSecret,
        geminiApiKey: '',
        anthropicApiKey: '',
      });
    });
  });

  describe('postgres path', () => {
    it('includes DATABASE_URL prompt when dbType is postgres', async () => {
      const dbUrl = 'postgres://user:pass@localhost:5432/mydb';
      const called: string[] = [];
      const p: Prompter = {
        async prompt<T>(question: unknown): Promise<T> {
          const q = question as { name: string };
          called.push(q.name);
          const responses: Record<string, unknown> = {
            port: '5000',
            dbType: 'postgres',
            databaseUrl: dbUrl,
            providers: [],
            schedulerEnabled: false,
            jwtSecret,
            jwtRefreshSecret,
          };
          return { [q.name]: responses[q.name] } as T;
        },
      };

      const result = await runSetupPrompts({}, p);

      expect(called).toContain('databaseUrl');
      expect(result.databaseUrl).toBe(dbUrl);
      expect(result.dbType).toBe('postgres');
      expect(result.schedulerEnabled).toBe(false);
    });

    it('passes existing DATABASE_URL as initial value to promptDatabaseUrl', async () => {
      const existingUrl = 'postgres://existing:pass@host/db';
      const newUrl = 'postgres://new:pass@host/db';
      let capturedInitial: unknown;
      const p: Prompter = {
        async prompt<T>(question: unknown): Promise<T> {
          const q = question as { name: string; initial?: unknown };
          if (q.name === 'databaseUrl') {
            capturedInitial = q.initial;
          }
          const responses: Record<string, unknown> = {
            port: '3000',
            dbType: 'postgres',
            databaseUrl: newUrl,
            providers: [],
            schedulerEnabled: true,
            jwtSecret,
            jwtRefreshSecret,
          };
          return { [q.name]: responses[q.name] } as T;
        },
      };

      await runSetupPrompts({ DATABASE_URL: existingUrl }, p);

      expect(capturedInitial).toBe(existingUrl);
    });
  });

  describe('provider key prompting', () => {
    it('prompts for gemini key when gemini is selected', async () => {
      const called: string[] = [];
      const p: Prompter = {
        async prompt<T>(question: unknown): Promise<T> {
          const q = question as { name: string };
          called.push(q.name);
          const responses: Record<string, unknown> = {
            port: '3000',
            dbType: 'sqlite',
            providers: ['gemini'],
            schedulerEnabled: true,
            jwtSecret,
            jwtRefreshSecret,
            key: 'my-gemini-key',
          };
          return { [q.name]: responses[q.name] } as T;
        },
      };

      const result = await runSetupPrompts({}, p);

      expect(result.geminiApiKey).toBe('my-gemini-key');
      expect(result.anthropicApiKey).toBe('');
      // key prompt was called once (for gemini)
      expect(called.filter((n) => n === 'key')).toHaveLength(1);
    });

    it('prompts for anthropic key when anthropic is selected', async () => {
      const called: string[] = [];
      const p: Prompter = {
        async prompt<T>(question: unknown): Promise<T> {
          const q = question as { name: string };
          called.push(q.name);
          const responses: Record<string, unknown> = {
            port: '3000',
            dbType: 'sqlite',
            providers: ['anthropic'],
            schedulerEnabled: true,
            jwtSecret,
            jwtRefreshSecret,
            key: 'sk-ant-abc',
          };
          return { [q.name]: responses[q.name] } as T;
        },
      };

      const result = await runSetupPrompts({}, p);

      expect(result.anthropicApiKey).toBe('sk-ant-abc');
      expect(result.geminiApiKey).toBe('');
    });

    it('prompts for both keys when both providers are selected', async () => {
      let keyCallCount = 0;
      const keys = ['gemini-key-1', 'anthropic-key-2'];
      const p: Prompter = {
        async prompt<T>(question: unknown): Promise<T> {
          const q = question as { name: string };
          const staticResponses: Record<string, unknown> = {
            port: '3000',
            dbType: 'sqlite',
            providers: ['gemini', 'anthropic'],
            schedulerEnabled: true,
            jwtSecret,
            jwtRefreshSecret,
          };
          if (q.name === 'key') {
            return { key: keys[keyCallCount++] } as T;
          }
          return { [q.name]: staticResponses[q.name] } as T;
        },
      };

      const result = await runSetupPrompts({}, p);

      expect(result.geminiApiKey).toBe('gemini-key-1');
      expect(result.anthropicApiKey).toBe('anthropic-key-2');
    });

    it('does not prompt for keys not in selected providers', async () => {
      const called: string[] = [];
      const p: Prompter = {
        async prompt<T>(question: unknown): Promise<T> {
          const q = question as { name: string };
          called.push(q.name);
          const responses: Record<string, unknown> = {
            port: '3000',
            dbType: 'sqlite',
            providers: [],
            schedulerEnabled: true,
            jwtSecret,
            jwtRefreshSecret,
          };
          return { [q.name]: responses[q.name] } as T;
        },
      };

      await runSetupPrompts({}, p);

      expect(called).not.toContain('key');
    });
  });

  describe('existing env defaults', () => {
    it('uses existing env values as defaults', async () => {
      const existingEnv = {
        PORT: '9000',
        DB_TYPE: 'sqlite',
        GEMINI_API_KEY: 'existing-gemini',
        JWT_SECRET: 'x'.repeat(64),
        JWT_REFRESH_SECRET: 'y'.repeat(64),
      };

      const p: Prompter = {
        async prompt<T>(question: unknown): Promise<T> {
          const q = question as { name: string; initial?: unknown };
          // Return the initial value to simulate user accepting the default
          const responses: Record<string, unknown> = {
            port: q.initial ?? '3000',
            dbType: 'sqlite',
            providers: [],
            schedulerEnabled: true,
            jwtSecret: existingEnv.JWT_SECRET,
            jwtRefreshSecret: existingEnv.JWT_REFRESH_SECRET,
          };
          return { [q.name]: responses[q.name] } as T;
        },
      };

      const result = await runSetupPrompts(existingEnv, p);

      expect(result.port).toBe('9000');
      // Provider key not prompted because providers=[], but existingEnv carries it
      expect(result.geminiApiKey).toBe('existing-gemini');
    });

    it('auto-generates JWT secrets when blank and no existing env', async () => {
      const p = makeFakePrompter({
        port: '3000',
        dbType: 'sqlite',
        providers: [],
        schedulerEnabled: true,
        jwtSecret: '',
        jwtRefreshSecret: '',
      });

      const result = await runSetupPrompts({}, p);

      expect(result.jwtSecret).toHaveLength(64);
      expect(result.jwtRefreshSecret).toHaveLength(64);
      expect(result.jwtSecret).toMatch(/^[0-9a-f]+$/);
      expect(result.jwtRefreshSecret).toMatch(/^[0-9a-f]+$/);
    });

    it('respects SCHEDULER_ENABLED=false from existing env', async () => {
      const called: Record<string, unknown> = {};
      const p: Prompter = {
        async prompt<T>(question: unknown): Promise<T> {
          const q = question as { name: string; initial?: unknown };
          if (q.name === 'schedulerEnabled') {
            called['initial'] = q.initial;
          }
          const responses: Record<string, unknown> = {
            port: '3000',
            dbType: 'sqlite',
            providers: [],
            schedulerEnabled: false,
            jwtSecret,
            jwtRefreshSecret,
          };
          return { [q.name]: responses[q.name] } as T;
        },
      };

      const result = await runSetupPrompts({ SCHEDULER_ENABLED: 'false' }, p);

      expect(called['initial']).toBe(false);
      expect(result.schedulerEnabled).toBe(false);
    });

    it('passes GEMINI_API_KEY from existingEnv as initial to promptGeminiKey', async () => {
      let capturedInitial: unknown;
      const p: Prompter = {
        async prompt<T>(question: unknown): Promise<T> {
          const q = question as { name: string; initial?: unknown };
          if (q.name === 'key') {
            capturedInitial = q.initial;
          }
          const responses: Record<string, unknown> = {
            port: '3000',
            dbType: 'sqlite',
            providers: ['gemini'],
            schedulerEnabled: true,
            jwtSecret,
            jwtRefreshSecret,
            key: 'existing-gemini-key',
          };
          return { [q.name]: responses[q.name] } as T;
        },
      };

      const result = await runSetupPrompts(
        { GEMINI_API_KEY: 'existing-gemini-key' },
        p,
      );

      expect(capturedInitial).toBe('existing-gemini-key');
      expect(result.geminiApiKey).toBe('existing-gemini-key');
    });

    it('passes ANTHROPIC_API_KEY from existingEnv as initial to promptAnthropicKey', async () => {
      let capturedInitial: unknown;
      const p: Prompter = {
        async prompt<T>(question: unknown): Promise<T> {
          const q = question as { name: string; initial?: unknown };
          if (q.name === 'key') {
            capturedInitial = q.initial;
          }
          const responses: Record<string, unknown> = {
            port: '3000',
            dbType: 'sqlite',
            providers: ['anthropic'],
            schedulerEnabled: true,
            jwtSecret,
            jwtRefreshSecret,
            key: 'existing-anthropic-key',
          };
          return { [q.name]: responses[q.name] } as T;
        },
      };

      const result = await runSetupPrompts(
        { ANTHROPIC_API_KEY: 'existing-anthropic-key' },
        p,
      );

      expect(capturedInitial).toBe('existing-anthropic-key');
      expect(result.anthropicApiKey).toBe('existing-anthropic-key');
    });

    it('passes DB_TYPE=postgres from existingEnv as initial to promptDbType', async () => {
      let capturedInitial: unknown;
      const dbUrl = 'postgres://u:p@host/db';
      const p: Prompter = {
        async prompt<T>(question: unknown): Promise<T> {
          const q = question as { name: string; initial?: unknown };
          if (q.name === 'dbType') {
            capturedInitial = q.initial;
          }
          const responses: Record<string, unknown> = {
            port: '3000',
            dbType: 'postgres',
            databaseUrl: dbUrl,
            providers: [],
            schedulerEnabled: true,
            jwtSecret,
            jwtRefreshSecret,
          };
          return { [q.name]: responses[q.name] } as T;
        },
      };

      await runSetupPrompts({ DB_TYPE: 'postgres' }, p);

      expect(capturedInitial).toBe('postgres');
    });

    it('ignores an invalid DB_TYPE in existingEnv and defaults to sqlite', async () => {
      let capturedInitial: unknown;
      const p: Prompter = {
        async prompt<T>(question: unknown): Promise<T> {
          const q = question as { name: string; initial?: unknown };
          if (q.name === 'dbType') {
            capturedInitial = q.initial;
          }
          const responses: Record<string, unknown> = {
            port: '3000',
            dbType: 'sqlite',
            providers: [],
            schedulerEnabled: true,
            jwtSecret,
            jwtRefreshSecret,
          };
          return { [q.name]: responses[q.name] } as T;
        },
      };

      await runSetupPrompts({ DB_TYPE: 'mysql' }, p);

      expect(capturedInitial).toBe('sqlite');
    });
  });
});
