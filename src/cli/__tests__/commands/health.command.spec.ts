import { Command } from 'commander';
import { registerHealthCommand } from '../../commands/health.command';

jest.mock('../../process-manager', () => ({
  findManagedProcess: jest.fn(),
  getConfiguredHost: jest.fn(() => '127.0.0.1'),
  getConfiguredPort: jest.fn(() => '15789'),
}));

jest.mock('../../health', () => ({
  httpHealthCheck: jest.fn(),
}));

import * as processManager from '../../process-manager';
import * as healthModule from '../../health';

describe('health command', () => {
  let program: Command;
  let consoleSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    program = new Command();
    program.exitOverride();
    registerHealthCommand(program);
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    exitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('exits 0 and prints healthy message when server responds 200', async () => {
    (processManager.findManagedProcess as jest.Mock).mockReturnValue({
      pid: 1,
      source: 'metadata',
      cwd: '/app',
      mainPath: '/app/main.js',
      host: '127.0.0.1',
      port: '15789',
    });
    (healthModule.httpHealthCheck as jest.Mock).mockResolvedValue({
      healthy: true,
      status: 200,
    });

    await program.parseAsync(['node', 'cli', 'health']);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('healthy'));
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('exits 1 when health check fails', async () => {
    (processManager.findManagedProcess as jest.Mock).mockReturnValue(null);
    (healthModule.httpHealthCheck as jest.Mock).mockResolvedValue({
      healthy: false,
      error: 'ECONNREFUSED',
    });

    await program.parseAsync(['node', 'cli', 'health']);

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('outputs JSON when --format json is given', async () => {
    (processManager.findManagedProcess as jest.Mock).mockReturnValue(null);
    (healthModule.httpHealthCheck as jest.Mock).mockResolvedValue({
      healthy: false,
      error: 'ECONNREFUSED',
    });

    await program.parseAsync(['node', 'cli', 'health', '--format', 'json']);

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
    const parsed = JSON.parse(String(jsonCall![0])) as Record<string, unknown>;
    expect(parsed).toHaveProperty('healthy', false);
  });
});
