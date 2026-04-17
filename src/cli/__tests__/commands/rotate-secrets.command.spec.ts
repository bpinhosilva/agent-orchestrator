import { Command } from 'commander';
import { registerRotateSecretsCommand } from '../../commands/rotate-secrets.command';

jest.mock('../../env', () => ({
  readEnvFile: jest.fn(() => ({
    HOST: '127.0.0.1',
    PORT: '15789',
    DB_TYPE: 'sqlite',
    JWT_SECRET: 'oldsecret',
    JWT_REFRESH_SECRET: 'oldrefresh',
  })),
  buildEnvContent: jest.fn(() => 'NEW_ENV_CONTENT'),
  writePrivateFile: jest.fn(),
}));

jest.mock('../../process-manager', () => ({
  findManagedProcess: jest.fn(),
  formatProcessSummary: jest.fn(() => ''),
  removeRuntimeState: jest.fn(),
  startServer: jest.fn(() => ({ pid: 9, host: '127.0.0.1', port: '15789' })),
  stopManagedProcessById: jest.fn(),
}));

jest.mock('../../health', () => ({
  waitForHealth: jest.fn(),
}));

jest.mock('enquirer', () => ({
  __esModule: true,
  default: { prompt: jest.fn() },
}));

const mockEnquirer = jest.requireMock<{ default: { prompt: jest.Mock } }>(
  'enquirer',
).default;

import * as envModule from '../../env';
import * as processManager from '../../process-manager';
import * as healthModule from '../../health';

describe('rotate-secrets command', () => {
  let program: Command;
  let consoleSpy: jest.SpyInstance;
  let consoleErrSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    program = new Command();
    program.exitOverride();
    registerRotateSecretsCommand(program);
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    exitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('writes new secrets when server is not running (--yes)', async () => {
    (processManager.findManagedProcess as jest.Mock).mockReturnValue(null);

    await program.parseAsync(['node', 'cli', 'rotate-secrets', '--yes']);

    expect(envModule.buildEnvContent).toHaveBeenCalled();
    expect(envModule.writePrivateFile).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('next start'),
    );
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('stops, restarts and waits for health when server is running (--yes)', async () => {
    (processManager.findManagedProcess as jest.Mock).mockReturnValue({
      pid: 5,
      source: 'metadata',
      cwd: '/app',
      mainPath: '/app/main.js',
      host: '127.0.0.1',
      port: '15789',
    });
    (processManager.stopManagedProcessById as jest.Mock).mockResolvedValue(
      true,
    );
    (healthModule.waitForHealth as jest.Mock).mockResolvedValue(true);

    await program.parseAsync(['node', 'cli', 'rotate-secrets', '--yes']);

    expect(processManager.stopManagedProcessById).toHaveBeenCalledWith(
      5,
      '/app',
      '/app/main.js',
    );
    expect(processManager.removeRuntimeState).toHaveBeenCalled();
    expect(processManager.startServer).toHaveBeenCalled();
    expect(healthModule.waitForHealth).toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('exits 1 if stop fails (--yes)', async () => {
    (processManager.findManagedProcess as jest.Mock).mockReturnValue({
      pid: 5,
      source: 'metadata',
      cwd: '/app',
      mainPath: '/app/main.js',
      host: '127.0.0.1',
      port: '15789',
    });
    (processManager.stopManagedProcessById as jest.Mock).mockResolvedValue(
      false,
    );

    await program.parseAsync(['node', 'cli', 'rotate-secrets', '--yes']);

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(processManager.startServer).not.toHaveBeenCalled();
  });

  it('exits 1 if server does not become healthy after restart (--yes)', async () => {
    (processManager.findManagedProcess as jest.Mock).mockReturnValue({
      pid: 5,
      source: 'metadata',
      cwd: '/app',
      mainPath: '/app/main.js',
      host: '127.0.0.1',
      port: '15789',
    });
    (processManager.stopManagedProcessById as jest.Mock).mockResolvedValue(
      true,
    );
    (healthModule.waitForHealth as jest.Mock).mockResolvedValue(false);

    await program.parseAsync(['node', 'cli', 'rotate-secrets', '--yes']);

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(consoleErrSpy).toHaveBeenCalledWith(
      expect.stringContaining('healthy'),
    );
  });

  describe('interactive (no --yes)', () => {
    it('proceeds when user confirms the prompt', async () => {
      (processManager.findManagedProcess as jest.Mock).mockReturnValue(null);
      mockEnquirer.prompt.mockResolvedValue({ confirmed: true });

      await program.parseAsync(['node', 'cli', 'rotate-secrets']);

      expect(mockEnquirer.prompt).toHaveBeenCalled();
      expect(envModule.writePrivateFile).toHaveBeenCalled();
      expect(exitSpy).not.toHaveBeenCalled();
    });

    it('cancels without writing secrets when user declines', async () => {
      mockEnquirer.prompt.mockResolvedValue({ confirmed: false });

      await program.parseAsync(['node', 'cli', 'rotate-secrets']);

      expect(mockEnquirer.prompt).toHaveBeenCalled();
      expect(envModule.writePrivateFile).not.toHaveBeenCalled();
      expect(exitSpy).not.toHaveBeenCalled();
    });
  });
});
