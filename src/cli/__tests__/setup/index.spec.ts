import { handleSetup } from '../../setup/index';
import { maybeSetupAdmin } from '../../setup/admin';
import { runSetupPrompts, SetupAnswers } from '../../setup/prompts';
import { ENV_PATH } from '../../constants';
import type { FileSystem } from '../../types';

jest.mock('../../setup/prompts');
jest.mock('../../setup/admin');

const mockRunSetupPrompts = runSetupPrompts as jest.MockedFunction<
  typeof runSetupPrompts
>;
const mockMaybeSetupAdmin = maybeSetupAdmin as jest.MockedFunction<
  typeof maybeSetupAdmin
>;

const fakeAnswers: SetupAnswers = {
  host: '127.0.0.1',
  port: '3001',
  dbType: 'sqlite',
  databaseUrl: '',
  providers: [],
  schedulerEnabled: true,
  jwtSecret: 'a'.repeat(32),
  jwtRefreshSecret: 'b'.repeat(32),
  geminiApiKey: '',
  anthropicApiKey: '',
};

function makeFakeFs(existingContent: string | null): {
  fs: FileSystem;
  writtenPath: () => string;
  writtenContent: () => string;
} {
  let path = '';
  let content = '';
  const fs: FileSystem = {
    existsSync: () => existingContent !== null,
    readFileSync: () => existingContent ?? '',
    writeFileSync: (p, c) => {
      path = p;
      content = c;
    },
    chmodSync: jest.fn(),
    unlinkSync: jest.fn(),
    mkdirSync: jest.fn(),
    openSync: jest.fn().mockReturnValue(0) as unknown as FileSystem['openSync'],
    readdirSync: jest
      .fn()
      .mockReturnValue([]) as unknown as FileSystem['readdirSync'],
    readlinkSync: jest
      .fn()
      .mockReturnValue('') as unknown as FileSystem['readlinkSync'],
  };
  return { fs, writtenPath: () => path, writtenContent: () => content };
}

describe('handleSetup', () => {
  beforeEach(() => {
    mockRunSetupPrompts.mockResolvedValue(fakeAnswers);
    mockMaybeSetupAdmin.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('happy path: writes correct env content and calls maybeSetupAdmin', async () => {
    const { fs, writtenContent } = makeFakeFs('PORT=3000\nDB_TYPE=sqlite\n');

    await handleSetup({}, fs);

    const content = writtenContent();
    expect(content).toContain('HOST=127.0.0.1');
    expect(content).toContain('PORT=3001');
    expect(content).toContain('DB_TYPE=sqlite');
    expect(content).toContain('SCHEDULER_ENABLED=true');
    expect(content).toContain(`JWT_SECRET=${'a'.repeat(32)}`);
    expect(content).toContain(`JWT_REFRESH_SECRET=${'b'.repeat(32)}`);
    expect(mockMaybeSetupAdmin).toHaveBeenCalledTimes(1);
    expect(mockMaybeSetupAdmin).toHaveBeenCalledWith({
      yes: undefined,
      skipAdminSetup: undefined,
    });
  });

  it('works when .env file is missing (existingEnv is empty)', async () => {
    const { fs, writtenContent } = makeFakeFs(null);

    await handleSetup({}, fs);

    const content = writtenContent();
    expect(content).toContain('PORT=3001');
    expect(mockRunSetupPrompts).toHaveBeenCalledWith({}, undefined);
    expect(mockMaybeSetupAdmin).toHaveBeenCalledTimes(1);
  });

  it('forwards yes: true to maybeSetupAdmin', async () => {
    const { fs } = makeFakeFs(null);

    await handleSetup({ yes: true }, fs);

    expect(mockMaybeSetupAdmin).toHaveBeenCalledWith(
      expect.objectContaining({ yes: true }),
    );
  });

  it('forwards skipAdminSetup: true to maybeSetupAdmin', async () => {
    const { fs } = makeFakeFs(null);

    await handleSetup({ skipAdminSetup: true }, fs);

    expect(mockMaybeSetupAdmin).toHaveBeenCalledWith(
      expect.objectContaining({ skipAdminSetup: true }),
    );
  });

  it('passes dsFactory to maybeSetupAdmin when provided', async () => {
    const { fs } = makeFakeFs(null);
    const fakeFactory = jest.fn();

    await handleSetup({}, fs, undefined, fakeFactory as never);

    expect(mockMaybeSetupAdmin).toHaveBeenCalledWith(
      expect.objectContaining({}),
      fakeFactory,
    );
  });

  it('writes env file with SCHEDULER_ENABLED=false when schedulerEnabled is false', async () => {
    mockRunSetupPrompts.mockResolvedValueOnce({
      ...fakeAnswers,
      schedulerEnabled: false,
    });
    const { fs, writtenContent } = makeFakeFs(null);

    await handleSetup({}, fs);

    expect(writtenContent()).toContain('SCHEDULER_ENABLED=false');
  });

  // A: runSetupPrompts rejects → error propagates; write and admin NOT called
  it('propagates error when runSetupPrompts rejects and skips write and admin', async () => {
    mockRunSetupPrompts.mockRejectedValueOnce(new Error('user cancelled'));
    const { fs, writtenContent } = makeFakeFs(null);

    await expect(handleSetup({}, fs)).rejects.toThrow('user cancelled');
    expect(writtenContent()).toBe('');
    expect(mockMaybeSetupAdmin).not.toHaveBeenCalled();
  });

  // B: non-empty databaseUrl → DATABASE_URL present in written content
  it('writes DATABASE_URL when databaseUrl is non-empty', async () => {
    const url = 'postgresql://user:pass@localhost:5432/mydb';
    mockRunSetupPrompts.mockResolvedValueOnce({
      ...fakeAnswers,
      dbType: 'postgres',
      databaseUrl: url,
    });
    const { fs, writtenContent } = makeFakeFs(null);

    await handleSetup({}, fs);

    expect(writtenContent()).toContain(`DATABASE_URL=${url}`);
  });

  // C: empty databaseUrl → DATABASE_URL absent from written content
  it('does NOT write DATABASE_URL when databaseUrl is empty', async () => {
    mockRunSetupPrompts.mockResolvedValueOnce({
      ...fakeAnswers,
      databaseUrl: '',
    });
    const { fs, writtenContent } = makeFakeFs(null);

    await handleSetup({}, fs);

    expect(writtenContent()).not.toContain('DATABASE_URL');
  });

  // D: non-empty geminiApiKey → GEMINI_API_KEY present in written content
  it('writes GEMINI_API_KEY when geminiApiKey is non-empty', async () => {
    const key = 'gemini-key-abc123';
    mockRunSetupPrompts.mockResolvedValueOnce({
      ...fakeAnswers,
      providers: ['gemini'],
      geminiApiKey: key,
    });
    const { fs, writtenContent } = makeFakeFs(null);

    await handleSetup({}, fs);

    expect(writtenContent()).toContain(`GEMINI_API_KEY=${key}`);
  });

  // E: existing file has DB_LOGGING=true → written content contains DB_LOGGING=true
  it('preserves DB_LOGGING=true from existing env', async () => {
    const { fs, writtenContent } = makeFakeFs('DB_LOGGING=true\n');

    await handleSetup({}, fs);

    expect(writtenContent()).toContain('DB_LOGGING=true');
  });

  // F: written file path equals ENV_PATH
  it('writes to ENV_PATH', async () => {
    const { fs, writtenPath } = makeFakeFs(null);

    await handleSetup({}, fs);

    expect(writtenPath()).toBe(ENV_PATH);
  });

  // G: unknown existing var passthrough
  it('passes through unknown variables from existing env', async () => {
    const { fs, writtenContent } = makeFakeFs('CUSTOM_VAR=xyz\n');

    await handleSetup({}, fs);

    expect(writtenContent()).toContain('CUSTOM_VAR=xyz');
  });

  // H: CHECK_PENDING_MIGRATIONS_ON_STARTUP preserved from existing env
  it('preserves CHECK_PENDING_MIGRATIONS_ON_STARTUP from existing env', async () => {
    const { fs, writtenContent } = makeFakeFs(
      'CHECK_PENDING_MIGRATIONS_ON_STARTUP=true\n',
    );

    await handleSetup({}, fs);

    expect(writtenContent()).toContain(
      'CHECK_PENDING_MIGRATIONS_ON_STARTUP=true',
    );
  });

  // I: NODE_ENV forced to 'production' even when existing file has NODE_ENV=development
  it('forces NODE_ENV=production regardless of existing env value', async () => {
    const { fs, writtenContent } = makeFakeFs('NODE_ENV=development\n');

    await handleSetup({}, fs);

    expect(writtenContent()).toContain('NODE_ENV=production');
    expect(writtenContent()).not.toContain('NODE_ENV=development');
  });

  // J: runSetupPrompts called with parsed existing env
  it('calls runSetupPrompts with parsed existing env', async () => {
    const { fs } = makeFakeFs('PORT=3000\nDB_TYPE=sqlite\n');

    await handleSetup({}, fs);

    expect(mockRunSetupPrompts).toHaveBeenCalledWith(
      expect.objectContaining({ PORT: '3000', DB_TYPE: 'sqlite' }),
      undefined,
    );
  });

  // K: custom prompter forwarded to runSetupPrompts
  it('forwards custom prompter to runSetupPrompts', async () => {
    const { fs } = makeFakeFs(null);
    const fakePrompter = { prompt: jest.fn() };

    await handleSetup({}, fs, fakePrompter);

    expect(mockRunSetupPrompts).toHaveBeenCalledWith(
      expect.anything(),
      fakePrompter,
    );
  });

  // L: yes: true + skipAdminSetup: true both forwarded together
  it('forwards both yes and skipAdminSetup when both are true', async () => {
    const { fs } = makeFakeFs(null);

    await handleSetup({ yes: true, skipAdminSetup: true }, fs);

    expect(mockMaybeSetupAdmin).toHaveBeenCalledWith(
      expect.objectContaining({ yes: true, skipAdminSetup: true }),
    );
  });

  // M: fs.writeFileSync throws → error propagates; maybeSetupAdmin not called
  it('propagates error when writeFileSync throws and does not call maybeSetupAdmin', async () => {
    const { fs } = makeFakeFs(null);
    const throwingFs: FileSystem = {
      ...fs,
      writeFileSync: () => {
        throw new Error('disk full');
      },
    };

    await expect(handleSetup({}, throwingFs)).rejects.toThrow('disk full');
    expect(mockMaybeSetupAdmin).not.toHaveBeenCalled();
  });
});
