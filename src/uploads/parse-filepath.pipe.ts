import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common';

/** Maximum allowed length for a filepath coming from the URL. */
export const MAX_PATH_LENGTH = 1024;

/**
 * Validates a raw filepath extracted from the URL before any filesystem
 * operations are performed.
 *
 * Checks enforced here (cheap, stateless):
 *  - Path length ≤ MAX_PATH_LENGTH  (DoS / OS-limit protection)
 *  - No null bytes                  (can bypass downstream path checks)
 *
 * Path-traversal and symlink containment checks require I/O and are
 * performed in the handler after this pipe succeeds.
 */
@Injectable()
export class ParseFilePathPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (value.length > MAX_PATH_LENGTH) {
      throw new NotFoundException('File not found');
    }

    if (value.includes('\0')) {
      throw new NotFoundException('File not found');
    }

    return value;
  }
}
