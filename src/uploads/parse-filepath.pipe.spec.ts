import { NotFoundException } from '@nestjs/common';
import { ParseFilePathPipe } from './parse-filepath.pipe';

const MAX_PATH_LENGTH = 1024;

describe('ParseFilePathPipe', () => {
  let pipe: ParseFilePathPipe;

  beforeEach(() => {
    pipe = new ParseFilePathPipe();
  });

  it('should pass through a valid flat filename', () => {
    expect(pipe.transform('valid-file.txt')).toBe('valid-file.txt');
  });

  it('should pass through a valid hierarchical path', () => {
    const p = '2024/01/15/tasks/task-abc/uuid.png';
    expect(pipe.transform(p)).toBe(p);
  });

  it('should pass through a path exactly at the max length', () => {
    const p = 'a'.repeat(MAX_PATH_LENGTH);
    expect(pipe.transform(p)).toBe(p);
  });

  it('should throw NotFoundException for a path exceeding the max length', () => {
    const p = 'a'.repeat(MAX_PATH_LENGTH + 1);
    expect(() => pipe.transform(p)).toThrow(NotFoundException);
  });

  it('should throw NotFoundException for a path containing a null byte', () => {
    expect(() => pipe.transform('file\0.txt')).toThrow(NotFoundException);
  });

  it('should throw NotFoundException for an empty string', () => {
    expect(() => pipe.transform('')).toThrow(NotFoundException);
  });
});
