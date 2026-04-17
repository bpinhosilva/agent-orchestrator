import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { writeFile, unlink } from 'fs/promises';
import { StorageService } from './storage.service';
import { ALLOWED_MIME_TYPES } from './storage-path.helper';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Filesystem-backed storage implementation.
 *
 * Files are stored under:
 *   `{baseDir}/{bucket}/{filePath}`
 *
 * where `filePath` is the full bucket-relative path produced by
 * {@link StoragePathHelper} (e.g. `YYYY/MM/DD/{context}/{contextId}/{uuid}.ext`).
 *
 * **Backward-compatibility note**: records created before the hierarchical
 * refactor stored `uploads/artifacts/{uuid}.{ext}` as `filePath`.  The
 * {@link delete} method transparently normalises that legacy format so
 * existing rows continue to work without a DB migration.
 */
@Injectable()
export class FileSystemStorageService extends StorageService {
  private readonly logger = new Logger(FileSystemStorageService.name);
  private readonly baseDir: string;
  private readonly defaultBucket = 'artifacts';

  constructor() {
    super();
    this.baseDir =
      process.env.AGENT_ORCHESTRATOR_HOME ||
      path.join(process.cwd(), '.agent-orchestrator');
    this.ensureDir(this.baseDir);
    this.ensureDir(path.join(this.baseDir, this.defaultBucket));
  }

  // ---------------------------------------------------------------------------
  // StorageService interface
  // ---------------------------------------------------------------------------

  getBucketPath(bucket: string): string {
    return path.join(this.baseDir, bucket);
  }

  getFullPath(relativePath: string, bucket = this.defaultBucket): string {
    return path.join(this.getBucketPath(bucket), relativePath);
  }

  async saveBase64(
    base64: string,
    mimeType: string,
    filePath: string,
    bucket?: string,
  ): Promise<void> {
    this.validateMimeType(mimeType);
    const buffer = Buffer.from(base64, 'base64');
    return this.save(buffer, mimeType, filePath, bucket);
  }

  async save(
    buffer: Buffer,
    mimeType: string,
    filePath: string,
    bucket = this.defaultBucket,
  ): Promise<void> {
    this.validateMimeType(mimeType);
    this.validateFileSize(buffer.length);
    this.assertSafePath(filePath);

    // OS-native path for filesystem operations
    const fullDir = path.join(
      this.getBucketPath(bucket),
      path.dirname(filePath),
    );
    const filename = path.basename(filePath);
    this.ensureDir(fullDir);

    await writeFile(path.join(fullDir, filename), buffer);
    this.logger.debug(`Saved artifact: bucket=${bucket} path=${filePath}`);
  }

  async delete(
    relativePath: string,
    bucket = this.defaultBucket,
  ): Promise<void> {
    const normalized = this.normalizeLegacyPath(relativePath);
    this.assertSafePath(normalized);

    const fullPath = this.getFullPath(normalized, bucket);
    if (fs.existsSync(fullPath)) {
      await unlink(fullPath);
      this.logger.debug(`Deleted artifact file: ${fullPath}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      this.logger.log(`Created directory: ${dir}`);
    }
  }

  /**
   * Normalise paths that were stored before the hierarchical refactor.
   * Old format:  `uploads/artifacts/{uuid}.{ext}`  →  `{uuid}.{ext}`
   */
  private normalizeLegacyPath(relativePath: string): string {
    const legacyPrefix = `uploads/${this.defaultBucket}/`;
    if (relativePath.startsWith(legacyPrefix)) {
      return path.basename(relativePath);
    }
    return relativePath;
  }

  /**
   * Reject absolute paths and any `..` segment to prevent path traversal.
   * Called for caller-supplied values (`filePath`, `relativePath`).
   */
  private assertSafePath(inputPath: string): void {
    const normalized = path.normalize(inputPath);
    if (
      path.isAbsolute(normalized) ||
      normalized.split(path.sep).includes('..')
    ) {
      throw new BadRequestException(`Invalid path: ${inputPath}`);
    }
  }

  private validateMimeType(mimeType: string): void {
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new BadRequestException(
        `File type '${mimeType}' is not allowed. Allowed types: ${[...ALLOWED_MIME_TYPES].join(', ')}`,
      );
    }
  }

  private validateFileSize(sizeInBytes: number): void {
    if (sizeInBytes > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        `File size (${Math.round(sizeInBytes / 1024 / 1024)}MB) exceeds the maximum allowed size of ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`,
      );
    }
  }
}
