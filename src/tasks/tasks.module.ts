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

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, TaskComment, AgentEntity, User, Project]),
    AgentsModule,
    ProjectsModule,
  ],
  controllers: [TasksController, CommentsController],
  providers: [TasksService, CommentsService, TaskSchedulerService],
})
export class TasksModule {}
