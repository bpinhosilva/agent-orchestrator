import {
  parseEnvContent,
  readEnvFile,
  buildEnvContent,
  writePrivateFile,
} from '../env';
import type { FileSystem } from '../types';
import type { BasicConfig } from '../types';

const fakeFs = (content: string | null): FileSystem => ({
  existsSync: () => content !== null,
  readFileSync: () => content ?? '',
  writeFileSync: jest.fn(),
  chmodSync: jest.fn(),
  unlinkSync: jest.fn(),
  mkdirSync: jest.fn(),
  openSync: jest.fn().mockReturnValue(1),
  readdirSync: jest.fn().mockReturnValue([]),
  readlinkSync: jest.fn(),
});

describe('parseEnvContent', () => {
  it('parses KEY=VALUE pairs', () => {
    expect(parseEnvContent('PORT=3000\nDB_TYPE=sqlite\n')).toEqual({
      PORT: '3000',
      DB_TYPE: 'sqlite',
    });
  });
  it('ignores comment lines', () => {
    expect(parseEnvContent('# comment\nPORT=3000\n')).toEqual({ PORT: '3000' });
  });
  it('handles values containing =', () => {
    expect(parseEnvContent('URL=postgres://u:p@h/db?ssl=true\n')).toEqual({
      URL: 'postgres://u:p@h/db?ssl=true',
    });
  });
  it('returns empty object for empty content', () => {
    expect(parseEnvContent('')).toEqual({});
  });
  it('handles CRLF line endings', () => {
    expect(parseEnvContent('PORT=3000\r\nDB_TYPE=sqlite\r\n')).toEqual({
      PORT: '3000',
      DB_TYPE: 'sqlite',
    });
  });
  it('ignores lines with empty key', () => {
    expect(parseEnvContent('=value\nPORT=3000\n')).toEqual({ PORT: '3000' });
  });
  it('ignores lines with key containing spaces', () => {
    expect(parseEnvContent('BAD KEY=value\nPORT=3000\n')).toEqual({
      PORT: '3000',
    });
  });
});

describe('readEnvFile', () => {
  it('returns parsed env when file exists', () => {
    const result = readEnvFile('/fake/.env', fakeFs('PORT=9000\n'));
    expect(result).toEqual({ PORT: '9000' });
  });
  it('returns empty object when file does not exist', () => {
    const result = readEnvFile('/fake/.env', fakeFs(null));
    expect(result).toEqual({});
  });
});

describe('buildEnvContent', () => {
  const basicConfig: BasicConfig = {
    port: '3000',
    dbType: 'sqlite',
    dbLogging: false,
  };

  it('includes required keys in the canonical order', () => {
    const content = buildEnvContent(
      {},
      basicConfig,
      '',
      '',
      '',
      'jwt-s',
      'jwt-r',
    );
    const lines = content.split('\n').filter(Boolean);
    expect(lines[0]).toBe('NODE_ENV=production');
    expect(lines[1]).toBe('PORT=3000');
    expect(content).toContain('JWT_SECRET=jwt-s');
    expect(content).toContain('JWT_REFRESH_SECRET=jwt-r');
  });
  it('includes DATABASE_URL only when non-empty', () => {
    const withDb = buildEnvContent(
      {},
      basicConfig,
      'postgres://host/db',
      '',
      '',
      's',
      'r',
    );
    expect(withDb).toContain('DATABASE_URL=postgres://host/db');
    const withoutDb = buildEnvContent({}, basicConfig, '', '', '', 's', 'r');
    expect(withoutDb).not.toContain('DATABASE_URL');
  });
  it('omits DATABASE_URL when whitespace-only', () => {
    const content = buildEnvContent({}, basicConfig, '   ', '', '', 's', 'r');
    expect(content).not.toContain('DATABASE_URL');
  });
  it('includes provider keys only when non-empty', () => {
    const content = buildEnvContent(
      {},
      basicConfig,
      '',
      'g-key',
      'a-key',
      's',
      'r',
    );
    expect(content).toContain('GEMINI_API_KEY=g-key');
    expect(content).toContain('ANTHROPIC_API_KEY=a-key');
  });
  it('ends with a newline', () => {
    const content = buildEnvContent({}, basicConfig, '', '', '', 's', 'r');
    expect(content.endsWith('\n')).toBe(true);
  });
  it('preserves existing env values not explicitly overridden', () => {
    const content = buildEnvContent(
      { CUSTOM_KEY: 'custom-value' },
      basicConfig,
      '',
      '',
      '',
      's',
      'r',
    );
    expect(content).toContain('CUSTOM_KEY=custom-value');
  });
});

describe('writePrivateFile', () => {
  it('calls writeFileSync with mode 0o600 and chmodSync with 0o600', () => {
    const mockFs = fakeFs(null);
    writePrivateFile('/fake/file', 'content', mockFs);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockFs.writeFileSync).toHaveBeenCalledWith('/fake/file', 'content', {
      mode: 0o600,
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockFs.chmodSync).toHaveBeenCalledWith('/fake/file', 0o600);
  });
});
