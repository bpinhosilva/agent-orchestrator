import {
  Injectable,
  NotFoundException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentEntity } from './entities/agent.entity';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { Agent, AgentResponse } from './interfaces/agent.interface';
import { getAgentImplementation } from './registry/agent.registry';
import { Model } from '../models/entities/model.entity';

@Injectable()
export class AgentsService implements OnModuleInit {
  private readonly logger = new Logger(AgentsService.name);
  private agentInstances: Map<string, Agent> = new Map();

  constructor(
    @InjectRepository(AgentEntity)
    private readonly agentRepository: Repository<AgentEntity>,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing Agent instances from database...');
    const agents = await this.agentRepository.find({ relations: ['model'] });
    for (const agentEntity of agents) {
      if (agentEntity.status !== 'inactive') {
        try {
          this.syncAgentInstance(agentEntity);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          this.logger.error(
            `Failed to initialize agent #${agentEntity.id}: ${errorMessage}`,
          );
        }
      }
    }
    this.logger.log(`Initialized ${this.agentInstances.size} agent instances.`);
  }

  private syncAgentInstance(agentEntity: AgentEntity) {
    if (agentEntity.status === 'inactive') {
      this.agentInstances.delete(agentEntity.id);
      return;
    }

    const provider = agentEntity.provider;
    if (!provider) {
      this.logger.warn(
        `No provider found for agent #${agentEntity.id}. Skipping instance creation.`,
      );
      return;
    }

    const AgentClass = getAgentImplementation(provider);
    if (!AgentClass) {
      this.logger.warn(
        `No implementation found for provider: ${provider}. Skipping instance creation.`,
      );
      return;
    }

    try {
      const instance = new AgentClass(agentEntity.model?.name);
      instance.updateConfig?.({
        name: agentEntity.name,
        description: agentEntity.description,
        systemInstructions: agentEntity.systemInstructions,
        role: agentEntity.role,
        provider: agentEntity.provider,
      });
      this.agentInstances.set(agentEntity.id, instance);
      this.logger.debug(`Synchronized agent instance #${agentEntity.id}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error synchronizing agent #${agentEntity.id}: ${errorMessage}`,
      );
      throw error;
    }
  }

  async create(createAgentDto: CreateAgentDto): Promise<AgentEntity> {
    const agent = this.agentRepository.create(createAgentDto);
    const savedAgent = await this.agentRepository.save(agent);

    // Reload with relations for proper synchronization
    const fullyLoadedAgent = await this.findOne(savedAgent.id);
    this.syncAgentInstance(fullyLoadedAgent);

    return fullyLoadedAgent;
  }

  async findAll(): Promise<AgentEntity[]> {
    return this.agentRepository.find({ relations: ['model'] });
  }

  async findOne(id: string): Promise<AgentEntity> {
    const agent = await this.agentRepository.findOne({
      where: { id },
      relations: ['model'],
    });
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
      updateData.model = { id: modelId } as Model;
    }

    await this.agentRepository.update(id, updateData);
    const updatedAgent = await this.agentRepository.findOne({
      where: { id },
      relations: ['model'],
    });

    if (!updatedAgent) {
      throw new NotFoundException(`Agent #${id} not found`);
    }

    this.syncAgentInstance(updatedAgent);
    return updatedAgent;
  }

  async remove(id: string): Promise<void> {
    const agent = await this.findOne(id);
    agent.status = 'inactive';
    await this.agentRepository.save(agent);
    this.agentInstances.delete(id);
  }

  async processRequest(agentId: string, input: string): Promise<AgentResponse> {
    const agent = this.agentInstances.get(agentId);
    if (!agent) {
      const agentEntity = await this.agentRepository.findOne({
        where: { id: agentId },
      });
      if (agentEntity?.status === 'inactive') {
        throw new NotFoundException(
          `Agent #${agentId} is currently inactive and cannot process requests.`,
        );
      }
      throw new NotFoundException(
        `Active instance for Agent #${agentId} not found`,
      );
    }
    this.logger.debug(
      `Processing input using agent instance: ${agent.getName()}`,
    );
    return agent.processText(input);
  }

  async probe(agentId: string, input: string): Promise<AgentResponse> {
    let agent = this.agentInstances.get(agentId);

    if (!agent) {
      this.logger.debug(
        `Agent instance #${agentId} not found in memory. Checking database...`,
      );
      const agentEntity = await this.agentRepository.findOne({
        where: { id: agentId },
        relations: ['model'],
      });

      if (!agentEntity) {
        throw new NotFoundException(`Agent #${agentId} not found`);
      }

      if (agentEntity.status === 'inactive') {
        throw new NotFoundException(
          `Agent #${agentId} is currently inactive and cannot be probed.`,
        );
      }

      this.syncAgentInstance(agentEntity);
      agent = this.agentInstances.get(agentId);

      if (!agent) {
        throw new NotFoundException(
          `Failed to initialize agent #${agentId} after database fetch`,
        );
      }
    }

    return agent.processText(input);
  }
}
