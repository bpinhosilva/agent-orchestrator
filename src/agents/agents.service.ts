import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GeminiAgent } from './implementations/gemini.agent';
import { AgentResponse, Agent } from './interfaces/agent.interface';
import { AgentRequestDto } from './dto/agent-request.dto';
import { Agent as AgentEntity } from './entities/agent.entity';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);
  private defaultAgent: Agent;

  constructor(
    private readonly geminiAgent: GeminiAgent,
    @InjectRepository(AgentEntity)
    private readonly agentRepository: Repository<AgentEntity>,
  ) {
    this.defaultAgent = geminiAgent;
    this.logger.log(
      `Initialized AgentsService with default agent: ${this.defaultAgent.getName()}`,
    );
  }

  async processRequest(requestDto: AgentRequestDto): Promise<AgentResponse> {
    this.logger.debug(`Processing input using default agent`);
    return this.defaultAgent.processText(requestDto.input);
  }

  async create(createAgentDto: CreateAgentDto): Promise<AgentEntity> {
    const { modelId, ...rest } = createAgentDto;
    const agent = this.agentRepository.create({
      ...rest,
      model: { id: modelId },
    });
    return this.agentRepository.save(agent);
  }

  async findAll(): Promise<AgentEntity[]> {
    return this.agentRepository.find();
  }

  async findOne(id: string): Promise<AgentEntity> {
    const agent = await this.agentRepository.findOne({ where: { id } });
    if (!agent) {
      throw new NotFoundException(`Agent #${id} not found`);
    }
    return agent;
  }

  async update(
    id: string,
    updateAgentDto: UpdateAgentDto,
  ): Promise<AgentEntity> {
    const { modelId, ...rest } = updateAgentDto;
    const updateData: import('typeorm').DeepPartial<AgentEntity> = { ...rest };
    if (modelId) {
      updateData.model = { id: modelId };
    }
    const agent = await this.agentRepository.preload({
      id,
      ...updateData,
    });
    if (!agent) {
      throw new NotFoundException(`Agent #${id} not found`);
    }
    return this.agentRepository.save(agent);
  }

  async remove(id: string): Promise<void> {
    const agent = await this.findOne(id);
    await this.agentRepository.remove(agent);
  }
}
