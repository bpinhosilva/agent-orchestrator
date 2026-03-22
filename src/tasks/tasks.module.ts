import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from './entities/task.entity';
import { AgentEntity } from '../agents/entities/agent.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, AgentEntity])],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
