import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { Task } from './entities/task.entity';
import { TaskComment } from './entities/comment.entity';
import { AgentEntity } from '../agents/entities/agent.entity';
import { User } from '../users/entities/user.entity';
import { Project } from '../projects/entities/project.entity';
import { TaskSchedulerService } from './task-scheduler.service';
import { AgentsModule } from '../agents/agents.module';
import { ProjectsModule } from '../projects/projects.module';
import { RecurrentTask } from './entities/recurrent-task.entity';
import { RecurrentTaskExec } from './entities/recurrent-task-exec.entity';
import { RecurrentTasksController } from './recurrent-tasks.controller';
import { RecurrentTasksService } from './recurrent-tasks.service';
import { RecurrentTaskSchedulerService } from './recurrent-task-scheduler.service';
import { SystemSettingsModule } from '../system-settings/system-settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Task,
      TaskComment,
      AgentEntity,
      User,
      Project,
      RecurrentTask,
      RecurrentTaskExec,
    ]),
    AgentsModule,
    ProjectsModule,
    SystemSettingsModule,
  ],
  controllers: [TasksController, CommentsController, RecurrentTasksController],
  providers: [
    TasksService,
    CommentsService,
    TaskSchedulerService,
    RecurrentTasksService,
    RecurrentTaskSchedulerService,
  ],
  exports: [TasksService],
})
export class TasksModule {}
