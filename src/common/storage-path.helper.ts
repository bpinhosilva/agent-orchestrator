import { Injectable, BadRequestException } from '@nestjs/common';
import * as path from 'path';
import * as crypto from 'crypto';

export enum StorageContext {
  TASKS = 'tasks',
  AGENTS = 'agents',
  COMMENTS = 'comments',
  RECURRENT_TASKS = 'recurrent-tasks',
}

/** Returned by {@link StoragePathHelper.generate} and persisted by callers. */
export interface StorageObjectPath {
  /** UUID used as the filename stem. */
  id: string;
  /**
   * Full bucket-relative path using posix separators:
   * `YYYY/MM/DD/{context}/{contextId}/{uuid}.{ext}`
   */
  filePath: string;
  /** Original filename provided by the caller — stored as metadata. */
  originalName: string;
  /** MIME type provided by the caller. */
  mimeType: string;
}

export const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'text/plain',
  'text/csv',
  'text/markdown',
  'application/json',
]);

const MIME_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'text/markdown': 'md',
  'application/json': 'json',
};

export interface GenerateOptions {
  context: StorageContext;
  contextId: string;
  mimeType: string;
  originalName: string;
}

/**
 * Generates deterministic, conflict-free storage paths.
 *
 * Responsible for all naming decisions: UUID generation, MIME→extension
 * mapping, and date-based directory hierarchy.  The storage service only
 * receives the finished path and writes bytes — it does not produce names.
 *
 * Generated path shape: `YYYY/MM/DD/{context}/{contextId}/{uuid}.{ext}`
 */
@Injectable()
export class StoragePathHelper {
  generate(options: GenerateOptions): StorageObjectPath {
    const { contextId, mimeType, originalName } = options;

    // Normalise context: lowercase + trim so no spaces can leak into the path
    const context = String(options.context).trim().toLowerCase();

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new BadRequestException(
        `File type '${mimeType}' is not allowed. Allowed types: ${[...ALLOWED_MIME_TYPES].join(', ')}`,
      );
    }

    const id = crypto.randomUUID();
    const ext = MIME_TO_EXT[mimeType] ?? mimeType.split('/')[1] ?? 'bin';

    const now = new Date();
    const year = now.getFullYear().toString();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    // Always use posix separators — this value is URL-safe and DB-safe
    const filePath = path.posix.join(
      year,
      month,
      day,
      context,
      contextId,
      `${id}.${ext}`,
    );

    return { id, filePath, originalName, mimeType };
  }
}
