import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { GeminiAgent } from './implementations/gemini.agent';
import { Agent } from './entities/agent.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Agent])],
  controllers: [AgentsController],
  providers: [AgentsService, GeminiAgent],
  exports: [AgentsService],
})
export class AgentsModule {}
