import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { AgentEntity } from './entities/agent.entity';
import { GeminiAgent } from './implementations/gemini.agent';

@Module({
  imports: [TypeOrmModule.forFeature([AgentEntity])],
  controllers: [AgentsController],
  providers: [AgentsService, GeminiAgent],
  exports: [AgentsService],
})
export class AgentsModule {}
