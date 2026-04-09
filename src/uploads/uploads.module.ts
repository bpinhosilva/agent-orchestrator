import { Module, forwardRef } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { ParseFilePathPipe } from './parse-filepath.pipe';
import { ProjectsModule } from '../projects/projects.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [ProjectsModule, forwardRef(() => TasksModule)],
  controllers: [UploadsController],
  providers: [ParseFilePathPipe],
})
export class UploadsModule {}
