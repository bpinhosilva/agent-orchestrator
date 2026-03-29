import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

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
    const buffer = Buffer.from(base64, 'base64');
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
}
