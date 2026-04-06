import {
  validatePort,
  isValidPostgresConnectionString,
  collectProviders,
  normalizeProviders,
} from '../../setup/validators';

describe('validatePort', () => {
  it('accepts valid ports', () => {
    expect(validatePort('3000')).toBe('3000');
    expect(validatePort('65535')).toBe('65535');
    expect(validatePort('1')).toBe('1');
  });
  it('rejects out-of-range ports', () => {
    expect(() => validatePort('0')).toThrow('Invalid port');
    expect(() => validatePort('65536')).toThrow('Invalid port');
  });
  it('rejects non-integer values', () => {
    expect(() => validatePort('abc')).toThrow('Invalid port');
    expect(() => validatePort('3.14')).toThrow('Invalid port');
  });
});

describe('isValidPostgresConnectionString', () => {
  it('accepts postgres:// and postgresql:// schemes', () => {
    expect(isValidPostgresConnectionString('postgres://u:p@h/db')).toBe(true);
    expect(isValidPostgresConnectionString('postgresql://u:p@h/db')).toBe(true);
    expect(isValidPostgresConnectionString('postgres://host/dbname')).toBe(
      true,
    );
  });
  it('rejects invalid strings', () => {
    expect(isValidPostgresConnectionString('mysql://host/db')).toBe(false);
    expect(isValidPostgresConnectionString('')).toBe(false);
  });
  it('rejects scheme-only or missing host/db', () => {
    expect(isValidPostgresConnectionString('postgres://')).toBe(false);
    expect(isValidPostgresConnectionString('postgres://host')).toBe(false);
  });
});

describe('collectProviders', () => {
  it('accumulates providers across calls', () => {
    const first = collectProviders('gemini');
    const second = collectProviders('anthropic', first);
    expect(second).toEqual(['gemini', 'anthropic']);
  });
  it('splits comma-separated values', () => {
    expect(collectProviders('gemini,anthropic')).toEqual([
      'gemini',
      'anthropic',
    ]);
  });
  it('returns empty array for empty string', () => {
    expect(collectProviders('')).toEqual([]);
  });
  it('returns empty array for whitespace-only string', () => {
    expect(collectProviders('   ')).toEqual([]);
  });
  it('ignores blank segments in comma-separated values', () => {
    expect(collectProviders('gemini,   , anthropic')).toEqual([
      'gemini',
      'anthropic',
    ]);
  });
});

describe('normalizeProviders', () => {
  it('deduplicates and lowercases', () => {
    expect(normalizeProviders(['gemini', 'gemini'])).toEqual(['gemini']);
  });
  it('throws on unsupported provider', () => {
    expect(() => normalizeProviders(['openai'])).toThrow(
      'is not a supported provider',
    );
  });
  it('returns empty array for undefined input', () => {
    expect(normalizeProviders()).toEqual([]);
  });
  it('lowercases mixed-case input', () => {
    expect(normalizeProviders(['Gemini'])).toEqual(['gemini']);
  });
  it('lowercases and deduplicates mixed-case input', () => {
    expect(normalizeProviders(['Gemini', 'gemini'])).toEqual(['gemini']);
  });
});
