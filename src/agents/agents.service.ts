import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { AgentResponse, Agent as IAgent } from './interfaces/agent.interface';
import { getAgentImplementation } from './registry/agent.registry';
import { AgentEntity } from './entities/agent.entity';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);
  private defaultAgent: IAgent;
  private readonly agentInstances = new Map<string, IAgent>();

  constructor(
    private readonly moduleRef: ModuleRef,
    @InjectRepository(AgentEntity)
    private readonly agentRepository: Repository<AgentEntity>,
  ) {
    this.logger.log(
      'Initialized AgentsService with dynamic agent resolution enabled.',
    );
  }

  async onModuleInit() {
    this.logger.log('Synchronizing agents with database...');
    const dbAgents = await this.agentRepository.find();
    for (const agentEntity of dbAgents) {
      await this.syncAgentInstance(agentEntity);
    }
    this.logger.log(
      `Synchronized ${this.agentInstances.size} agent instances from persistence.`,
    );
  }

  private async syncAgentInstance(agentEntity: AgentEntity) {
    const provider = agentEntity.provider;
    const implementation = provider
      ? getAgentImplementation(provider)
      : undefined;

    if (!implementation) {
      this.logger.warn(
        `No implementation found for provider: ${provider}. Skipping instance creation.`,
      );
      return;
    }

    try {
      // Create a fresh instance for this specific agent to avoid shared state (e.g. system instructions)
      const instance = await this.moduleRef.create(implementation);

      // Configure the instance with agent-specific data
      if (instance.updateConfig) {
        instance.updateConfig({
          name: agentEntity.name,
          description: agentEntity.description,
          systemInstructions: agentEntity.systemInstructions,
          role: agentEntity.role,
          provider: provider,
          model: agentEntity.model?.name || 'Unknown',
        });
      }

      this.agentInstances.set(agentEntity.id, instance);
      this.logger.debug(
        `Synced unique instance for agent ${agentEntity.name} (Provider: ${provider})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to instantiate agent for ${agentEntity.name}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  getInstances(): Map<string, IAgent> {
    return this.agentInstances;
  }

  async processRequest(agentId: string, input: string): Promise<AgentResponse> {
    const agent = this.agentInstances.get(agentId);
    if (!agent) {
      throw new NotFoundException(
        `Active instance for Agent #${agentId} not found`,
      );
    }
    this.logger.debug(
      `Processing input using agent instance: ${agent.getName()}`,
    );
    return agent.processText(input);
  }

  async create(createAgentDto: CreateAgentDto): Promise<AgentEntity> {
    const { modelId, ...rest } = createAgentDto;

    // Check if modelId is a valid UUID before trying to link
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        modelId,
      );

    const agentData: any = { ...rest };
    if (isUuid) {
      (agentData as { model: any }).model = { id: modelId };
    } else {
      // If not a UUID, we might want to store it as a generic model name string if we had a column for it
      // For now, let's just use it as part of the description or something, or assume it's a named model
      // But status/provider are already being passed in 'rest' now
    }

    const agent = this.agentRepository.create(
      agentData as DeepPartial<AgentEntity>,
    );
    const savedAgent = await this.agentRepository.save(agent);
    await this.syncAgentInstance(savedAgent);
    return savedAgent;
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
    const updatedAgent = await this.agentRepository.save(agent);
    await this.syncAgentInstance(updatedAgent);
    return updatedAgent;
  }

  async remove(id: string): Promise<void> {
    const agent = await this.findOne(id);
    await this.agentRepository.remove(agent);
    this.agentInstances.delete(id);
    this.logger.debug(`Removed instance for agent ID ${id} from global map.`);
  }
}
