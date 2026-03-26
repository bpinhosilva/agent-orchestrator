import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { AgentEntity } from './entities/agent.entity';
// Side-effect imports: @RegisterAgent decorators fire at class-definition time
// and self-register each implementation in AGENT_REGISTRY. No DI instantiation needed.
import './implementations/gemini.agent';
import './implementations/claude.agent';

@Module({
  imports: [TypeOrmModule.forFeature([AgentEntity])],
  controllers: [AgentsController],
  providers: [AgentsService],
  exports: [AgentsService],
})
export class AgentsModule {}
