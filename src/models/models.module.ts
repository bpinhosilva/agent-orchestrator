import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModelsService } from './models.service';
import { ModelsController } from './models.controller';
import { Model } from './entities/model.entity';
import { AgentEntity } from '../agents/entities/agent.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Model, AgentEntity])],
  controllers: [ModelsController],
  providers: [ModelsService],
  exports: [TypeOrmModule],
})
export class ModelsModule {}
