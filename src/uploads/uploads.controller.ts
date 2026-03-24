import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { StorageService } from '../common/storage.service';
import * as fs from 'fs';
import * as path from 'path';

@Controller('uploads/artifacts')
export class UploadsController {
  constructor(private readonly storageService: StorageService) {}

  @Get(':filename')
  getFile(@Param('filename') filename: string, @Res() res: Response) {
    const fullPath = path.join(
      this.storageService.getArtifactsPath(),
      filename,
    );

    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException(`File ${filename} not found`);
    }

    res.sendFile(fullPath);
  }
}
