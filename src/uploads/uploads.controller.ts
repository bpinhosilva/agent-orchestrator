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

import { Public } from '../auth/decorators/public.decorator';

@Public()
@Controller('uploads/artifacts')
export class UploadsController {
  constructor(private readonly storageService: StorageService) {}

  @Get(':filename')
  getFile(
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: Response,
  ): StreamableFile {
    const fullPath = path.join(
      this.storageService.getArtifactsPath(),
      filename,
    );

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
