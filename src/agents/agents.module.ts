import { Module } from '@nestjs/common';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { GeminiAgent } from './implementations/gemini.agent';

@Module({
  controllers: [AgentsController],
  providers: [AgentsService, GeminiAgent],
  exports: [AgentsService],
})
export class AgentsModule {}
