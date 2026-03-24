import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { Task } from './entities/task.entity';
import { TaskComment } from './entities/comment.entity';
import { AgentEntity } from '../agents/entities/agent.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, TaskComment, AgentEntity])],
  controllers: [TasksController, CommentsController],
  providers: [TasksService, CommentsService],
})
export class TasksModule {}
