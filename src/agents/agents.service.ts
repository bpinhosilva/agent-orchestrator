import { Injectable, Logger } from '@nestjs/common';
import { GeminiAgent } from './implementations/gemini.agent';
import { AgentResponse, Agent } from './interfaces/agent.interface';
import { AgentRequestDto } from './dto/agent-request.dto';

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);
  private defaultAgent: Agent;

  constructor(private readonly geminiAgent: GeminiAgent) {
    this.defaultAgent = geminiAgent;
    this.logger.log(
      `Initialized AgentsService with default agent: ${this.defaultAgent.getName()}`,
    );
  }

  async processRequest(requestDto: AgentRequestDto): Promise<AgentResponse> {
    this.logger.debug(`Processing input using default agent`);
    // Eventually, logic to select agent based on user request/task could go here.
    return this.defaultAgent.processText(requestDto.input);
  }
}
