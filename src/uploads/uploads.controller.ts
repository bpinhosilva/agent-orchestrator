import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  StreamableFile,
  ForbiddenException,
} from '@nestjs/common';
import type { Response } from 'express';
import { StorageService } from '../common/storage.service';
import { ParseFilePathPipe } from './parse-filepath.pipe';
import * as fs from 'fs';
import * as path from 'path';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { ProjectsService } from '../projects/projects.service';
import { TasksService } from '../tasks/tasks.service';

@Controller('uploads/artifacts')
export class UploadsController {
  constructor(
    private readonly storageService: StorageService,
    private readonly projectsService: ProjectsService,
    private readonly tasksService: TasksService,
  ) {}

  @Get('*filepath')
  async getFile(
    @Param('filepath', ParseFilePathPipe) rawPath: string,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user: User,
  ): Promise<StreamableFile> {
    const bucketPath = this.storageService.getBucketPath('artifacts');
    const resolvedBucketPath = path.resolve(bucketPath);

    // Step 1 – nominal containment check (handles `..` and absolute paths)
    const nominalPath = path.resolve(bucketPath, rawPath);
    if (!nominalPath.startsWith(resolvedBucketPath + path.sep)) {
      throw new NotFoundException(`File not found`);
    }

    // Step 2 - Authorization check based on path structure
    // Path: YYYY/MM/DD/tasks/{taskId}/{uuid}.{ext}
    const segments = rawPath.split(/[/\\]/);
    if (user.role !== UserRole.ADMIN && segments.length >= 5) {
      const context = segments[3];
      const contextId = segments[4];

      if (context === 'tasks') {
        try {
          const task = await this.tasksService.findOne(contextId);
          const projectId = task.project?.id || task.projectId;
          if (projectId) {
            await this.projectsService.findOne(projectId, user);
          }
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw new NotFoundException(`File not found`);
          }
          throw new ForbiddenException(`Access denied to artifact`);
        }
      }
    }

    if (!fs.existsSync(nominalPath)) {
      throw new NotFoundException(`File not found`);
    }

    // Step 3 – symlink containment check: resolve the real path on disk
    let realPath: string;
    try {
      realPath = fs.realpathSync(nominalPath);
    } catch {
      throw new NotFoundException(`File not found`);
    }

    if (!realPath.startsWith(resolvedBucketPath + path.sep)) {
      throw new NotFoundException(`File not found`);
    }

    const mimeTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
      '.md': 'text/markdown',
      '.json': 'application/json',
    };

    const ext = path.extname(rawPath).toLowerCase();
    const contentType = mimeTypes[ext] ?? 'application/octet-stream';

    // nosniff prevents browsers from second-guessing the declared content-type
    res.set({
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff',
    });

    return new StreamableFile(fs.createReadStream(realPath));
  }
}
