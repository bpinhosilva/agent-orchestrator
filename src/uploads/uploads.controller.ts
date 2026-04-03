import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { StorageService } from '../common/storage.service';
import * as fs from 'fs';
import * as path from 'path';

@Controller('uploads/artifacts')
export class UploadsController {
  constructor(private readonly storageService: StorageService) {}

  @Get(':filename')
  getFile(
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: Response,
  ): StreamableFile {
    // Sanitize filename to prevent path traversal attacks
    const safeFilename = path.basename(filename);
    const fullPath = path.join(
      this.storageService.getArtifactsPath(),
      safeFilename,
    );

    // Verify the resolved path is within the artifacts directory
    const artifactsPath = this.storageService.getArtifactsPath();
    const resolvedPath = path.resolve(fullPath);
    const resolvedArtifactsPath = path.resolve(artifactsPath);

    if (
      !resolvedPath.startsWith(resolvedArtifactsPath + path.sep) &&
      resolvedPath !== resolvedArtifactsPath
    ) {
      throw new NotFoundException(`File ${filename} not found`);
    }

    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException(`File ${filename} not found`);
    }

    const file = fs.createReadStream(fullPath);

    // Optional: set content type
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
    };

    if (mimeTypes[ext]) {
      res.set({
        'Content-Type': mimeTypes[ext],
      });
    }

    return new StreamableFile(file);
  }
}
