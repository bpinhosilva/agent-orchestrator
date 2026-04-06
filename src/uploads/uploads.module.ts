import { Module, forwardRef } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { ProjectsModule } from '../projects/projects.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [ProjectsModule, forwardRef(() => TasksModule)],
  controllers: [UploadsController],
})
export class UploadsModule {}
