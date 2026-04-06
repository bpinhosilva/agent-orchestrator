import { Command } from 'commander';
import { registerSetupCommand } from '../../commands/setup.command';
import { handleSetup } from '../../setup/index';

jest.mock('../../setup/index', () => ({ handleSetup: jest.fn() }));

const mockHandleSetup = handleSetup as jest.Mock;

describe('setup command', () => {
  let program: Command;
  let exitSpy: jest.SpyInstance;
  let consoleErrSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    program = new Command();
    program.exitOverride();
    registerSetupCommand(program);
    exitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);
    consoleErrSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    exitSpy.mockRestore();
    consoleErrSpy.mockRestore();
  });

  it('calls handleSetup with default options when invoked bare', async () => {
    mockHandleSetup.mockResolvedValue(undefined);
    await program.parseAsync(['node', 'cli', 'setup']);
    expect(mockHandleSetup).toHaveBeenCalledTimes(1);

    const opts = (mockHandleSetup.mock.calls as unknown[][])[0][0] as Record<
      string,
      unknown
    >;
    expect(opts.yes).toBeUndefined();
    expect(opts.skipAdminSetup).toBeUndefined();
  });

  it('passes yes=true when --yes flag is used', async () => {
    mockHandleSetup.mockResolvedValue(undefined);
    await program.parseAsync(['node', 'cli', 'setup', '--yes']);
    expect(mockHandleSetup).toHaveBeenCalledWith(
      expect.objectContaining({ yes: true }),
    );
  });

  it('passes skipAdminSetup=true when --skip-admin-setup flag is used', async () => {
    mockHandleSetup.mockResolvedValue(undefined);
    await program.parseAsync(['node', 'cli', 'setup', '--skip-admin-setup']);
    expect(mockHandleSetup).toHaveBeenCalledWith(
      expect.objectContaining({ skipAdminSetup: true }),
    );
  });

  it('logs error and calls process.exit(1) when handleSetup throws', async () => {
    mockHandleSetup.mockRejectedValue(new Error('boom'));
    await program.parseAsync(['node', 'cli', 'setup']);
    expect(consoleErrSpy).toHaveBeenCalledWith(
      expect.stringContaining('Setup failed: boom'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
