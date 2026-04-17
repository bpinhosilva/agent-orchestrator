import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AgentsService } from './agents.service';
import { AgentRequestDto } from './dto/agent-request.dto';
import { AgentResponse } from './interfaces/agent.interface';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() createAgentDto: CreateAgentDto) {
    return this.agentsService.create(createAgentDto);
  }

  @Get()
  findAll() {
    return this.agentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.agentsService.findOne(id);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAgentDto: UpdateAgentDto) {
    return this.agentsService.update(id, updateAgentDto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.agentsService.remove(id);
  }

  @Roles(UserRole.ADMIN)
  @Post('process')
  @HttpCode(HttpStatus.OK)
  async processText(
    @Body() requestDto: AgentRequestDto,
  ): Promise<AgentResponse> {
    return this.agentsService.processRequest(
      requestDto.agentId,
      requestDto.input,
    );
  }

  @Roles(UserRole.ADMIN)
  @Post('probe')
  @HttpCode(HttpStatus.OK)
  async probe(@Body() requestDto: AgentRequestDto): Promise<AgentResponse> {
    return this.agentsService.probe(requestDto.agentId, requestDto.input);
  }
}
