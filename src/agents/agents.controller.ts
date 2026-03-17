import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { AgentRequestDto } from './dto/agent-request.dto';
import { AgentResponse } from './interfaces/agent.interface';

@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post('process')
  @HttpCode(HttpStatus.OK)
  async processText(@Body() requestDto: AgentRequestDto): Promise<AgentResponse> {
    return this.agentsService.processRequest(requestDto);
  }
}
