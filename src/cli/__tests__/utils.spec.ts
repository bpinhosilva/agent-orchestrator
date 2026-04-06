import {
  getPackageVersion,
  tailLogLines,
  resolveActionOptions,
} from '../utils';
import { Command } from 'commander';

describe('getPackageVersion', () => {
  it('returns the version from a valid package.json', () => {
    const fakeRead = () => JSON.stringify({ version: '1.2.3' });
    expect(getPackageVersion('/fake/package.json', fakeRead)).toBe('1.2.3');
  });
  it('returns 0.0.0 when version field is missing', () => {
    const fakeRead = () => JSON.stringify({});
    expect(getPackageVersion('/fake/package.json', fakeRead)).toBe('0.0.0');
  });
  it('returns 0.0.0 when file read throws', () => {
    const fakeRead = () => {
      throw new Error('not found');
    };
    expect(getPackageVersion('/fake/package.json', fakeRead)).toBe('0.0.0');
  });
  it('passes the supplied path to readFn', () => {
    const receivedPaths: string[] = [];
    const fakeRead = (p: string) => {
      receivedPaths.push(p);
      return JSON.stringify({ version: '2.0.0' });
    };
    getPackageVersion('/custom/path/package.json', fakeRead);
    expect(receivedPaths).toEqual(['/custom/path/package.json']);
  });
  it('returns 0.0.0 when JSON is malformed', () => {
    const fakeRead = () => 'not valid json {{{';
    expect(getPackageVersion('/fake/package.json', fakeRead)).toBe('0.0.0');
  });
});

describe('tailLogLines', () => {
  it('returns the last N lines', () => {
    expect(tailLogLines('line1\nline2\nline3\n', 2)).toBe('line2\nline3');
  });
  it('returns all lines when count exceeds total', () => {
    expect(tailLogLines('a\nb\n', 10)).toBe('a\nb');
  });
  it('returns empty string for an empty file', () => {
    expect(tailLogLines('', 5)).toBe('');
  });
  it('handles \\r\\n line endings', () => {
    expect(tailLogLines('line1\r\nline2\r\nline3\r\n', 2)).toBe('line2\nline3');
  });
  it('handles a single line with no trailing newline', () => {
    expect(tailLogLines('onlyone', 5)).toBe('onlyone');
  });
  it('returns empty string when lineCount is 0', () => {
    expect(tailLogLines('a\nb\nc', 0)).toBe('');
  });
});

describe('resolveActionOptions', () => {
  it('returns opts() when last arg is a Command instance', () => {
    const cmd = new Command();
    cmd.option('--port <port>');
    cmd.parse(['node', 'cli', '--port', '9000']);
    expect(resolveActionOptions([cmd])).toEqual({ port: '9000' });
  });
  it('correctly handles [positionalArg, cmdObject] — returns opts()', () => {
    const cmd = new Command();
    cmd.option('--port <port>');
    cmd.parse(['node', 'cli', '--port', '9000']);
    expect(resolveActionOptions(['someArg', cmd])).toEqual({ port: '9000' });
  });
  it('returns first arg when no Command is present', () => {
    expect(resolveActionOptions([{ port: '3000' }])).toEqual({ port: '3000' });
  });
  it('returns empty object when args is empty', () => {
    expect(resolveActionOptions([])).toEqual({});
  });
  it('returns {} when last arg is a string (not an object)', () => {
    expect(resolveActionOptions(['somestring'])).toEqual({});
  });
});
