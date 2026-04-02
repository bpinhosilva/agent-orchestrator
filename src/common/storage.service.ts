import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

const ALLOWED_MIME_TYPES = new Set([
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

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly baseDir: string;

  constructor() {
    this.baseDir =
      process.env.AGENT_ORCHESTRATOR_HOME ||
      path.join(process.cwd(), '.agent-orchestrator');
    this.ensureDir(this.baseDir);
    this.ensureDir(path.join(this.baseDir, 'artifacts'));
  }

  private ensureDir(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      this.logger.log(`Created directory: ${dir}`);
    }
  }

  getArtifactsPath(): string {
    return path.join(this.baseDir, 'artifacts');
  }

  getFullPath(relativePath: string): string {
    const filename = path.basename(relativePath);
    return path.join(this.getArtifactsPath(), filename);
  }

  async saveBase64(
    base64: string,
    mimeType: string,
    originalName: string,
  ): Promise<{
    id: string;
    originalName: string;
    mimeType: string;
    filePath: string;
  }> {
    this.validateMimeType(mimeType);
    const buffer = Buffer.from(base64, 'base64');
    this.validateFileSize(buffer.length);
    return this.saveBuffer(buffer, mimeType, originalName);
  }

  async saveBuffer(
    buffer: Buffer,
    mimeType: string,
    originalName: string,
  ): Promise<{
    id: string;
    originalName: string;
    mimeType: string;
    filePath: string;
  }> {
    this.validateMimeType(mimeType);
    this.validateFileSize(buffer.length);

    const id = crypto.randomUUID();
    const extension = mimeType.split('/')[1] || 'bin';
    const filename = `${id}.${extension}`;
    const filePath = path.join(this.getArtifactsPath(), filename);

    await fs.promises.writeFile(filePath, buffer);
    this.logger.debug(`Saved artifact to: ${filePath}`);

    return {
      id,
      originalName,
      mimeType,
      filePath: `uploads/artifacts/${filename}`, // Publicly accessible path via UploadsController
    };
  }

  async delete(relativePath: string): Promise<void> {
    const fullPath = this.getFullPath(relativePath);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
      this.logger.debug(`Deleted artifact file: ${fullPath}`);
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
