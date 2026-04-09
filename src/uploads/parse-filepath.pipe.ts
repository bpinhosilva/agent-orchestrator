import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common';

/**
 * Validates a raw filepath string before any filesystem operations.
 *
 * Checks enforced here (cheap, stateless):
 *  - Path length ≤ maxLength  (DoS / OS-limit protection)
 *  - No null bytes             (can bypass downstream path checks)
 *
 * Path-traversal and symlink containment checks require I/O and are
 * performed in the handler after this pipe succeeds.
 *
 * Note: this pipe expects a pre-extracted string. In Express 5 (path-to-regexp v8),
 * wildcard params are captured as arrays. UploadsController extracts the filepath
 * from req.path directly to avoid param coercion issues.
 */
@Injectable()
export class ParseFilePathPipe implements PipeTransform<string, string> {
  private readonly maxLength: number = 1024;

  transform(value: string): string {
    if (!value || value.length > this.maxLength) {
      throw new NotFoundException('File not found');
    }

    if (value.includes('\0')) {
      throw new NotFoundException('File not found');
    }

    return value;
  }
}
