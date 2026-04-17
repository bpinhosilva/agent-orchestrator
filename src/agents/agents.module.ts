import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { AgentEntity } from './entities/agent.entity';
import { GeminiAgent } from './implementations/gemini.agent';
import { ClaudeAgent } from './implementations/claude.agent';
import { OllamaAgent } from './implementations/ollama.agent';

@Module({
  imports: [TypeOrmModule.forFeature([AgentEntity])],
  controllers: [AgentsController],
  providers: [AgentsService, GeminiAgent, ClaudeAgent, OllamaAgent],
  exports: [AgentsService],
})
export class AgentsModule {}
