import { Injectable, Logger } from '@nestjs/common';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly baseDir: string;

  constructor() {
    this.baseDir = path.join(os.homedir(), '.agent-orchestrator');
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
    // relativePath is like /uploads/artifacts/<uuid>.extension
    // We only care about the filename part if the prefix is fixed
    const filename = path.basename(relativePath);
    return path.join(this.getArtifactsPath(), filename);
  }
}
