import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { AgentEntity } from './entities/agent.entity';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { Agent, AgentResponse } from './interfaces/agent.interface';
import { getAgentImplementation } from './registry/agent.registry';
import { Model } from '../models/entities/model.entity';
import { Provider } from '../providers/entities/provider.entity';
import { ModuleRef } from '@nestjs/core';

const AGENT_RELATIONS = ['model', 'provider'];

@Injectable()
export class AgentsService implements OnModuleInit {
  private readonly logger = new Logger(AgentsService.name);
  private agentInstances: Map<string, Agent> = new Map();

  constructor(
    @InjectRepository(AgentEntity)
    private readonly agentRepository: Repository<AgentEntity>,
    private readonly moduleRef: ModuleRef,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing Agent instances from database...');
    const agents = await this.agentRepository.find({
      relations: AGENT_RELATIONS,
    });
    for (const agentEntity of agents) {
      if (agentEntity.status !== 'inactive') {
        try {
          await this.syncAgentInstance(agentEntity);
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

  private async syncAgentInstance(agentEntity: AgentEntity) {
    if (agentEntity.status === 'inactive') {
      this.agentInstances.delete(agentEntity.id);
      return;
    }

    const providerName = agentEntity.provider?.name?.toLowerCase();
    if (!providerName) {
      this.logger.warn(
        `No provider found for agent #${agentEntity.id}. Skipping instance creation.`,
      );
      return;
    }

    const AgentClass = getAgentImplementation(providerName);
    if (!AgentClass) {
      this.logger.warn(
        `No implementation found for provider: ${providerName}. Skipping instance creation.`,
      );
      return;
    }

    try {
      // Use resolve for TRANSIENT scoped providers. This ensures we get a fresh instance
      // which we then configure and store in our Map (making it a singleton for this ID).
      const instance = await this.moduleRef.resolve<Agent>(AgentClass);

      instance.updateConfig?.({
        name: agentEntity.name,
        description: agentEntity.description,
        systemInstructions: agentEntity.systemInstructions,
        role: agentEntity.role,
        provider: providerName,
        model: agentEntity.model?.name,
      });

      this.agentInstances.set(agentEntity.id, instance);
      this.logger.debug(`Synchronized agent instance #${agentEntity.id}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error synchronizing agent #${agentEntity.id}: ${errorMessage}`,
      );
      throw new BadRequestException(
        `Failed to initialize agent instance: ${errorMessage}`,
      );
    }
  }

  async create(createAgentDto: CreateAgentDto): Promise<AgentEntity> {
    const { modelId, providerId, ...rest } = createAgentDto;
    const agentData: DeepPartial<AgentEntity> = { ...rest };

    if (modelId) {
      agentData.model = { id: modelId } as Model;
    }
    if (providerId) {
      agentData.provider = { id: providerId } as Provider;
    }

    return await this.agentRepository.manager.transaction(async (manager) => {
      const agent = manager.create(AgentEntity, agentData);
      const savedAgent = await manager.save(agent);

      // Reload with full relations for proper synchronization
      const fullyLoadedAgent = await manager.findOne(AgentEntity, {
        where: { id: savedAgent.id },
        relations: AGENT_RELATIONS,
      });

      if (!fullyLoadedAgent) {
        throw new Error(
          `Agent #${savedAgent.id} not found immediately after save`,
        );
      }

      // This will throw BadRequestException if instantiation fails, rolling back the transaction
      await this.syncAgentInstance(fullyLoadedAgent);

      return fullyLoadedAgent;
    });
  }

  async findAll(): Promise<AgentEntity[]> {
    return this.agentRepository.find({ relations: AGENT_RELATIONS });
  }

  async findOne(id: string): Promise<AgentEntity> {
    const agent = await this.agentRepository.findOne({
      where: { id },
      relations: AGENT_RELATIONS,
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
    const { modelId, providerId, ...rest } = updateAgentDto;
    const updateData: DeepPartial<AgentEntity> = { ...rest };

    if (modelId) {
      updateData.model = { id: modelId } as Model;
    }
    if (providerId) {
      updateData.provider = { id: providerId } as Provider;
    }

    return await this.agentRepository.manager.transaction(async (manager) => {
      await manager.update(AgentEntity, id, updateData);
      const updatedAgent = await manager.findOne(AgentEntity, {
        where: { id },
        relations: AGENT_RELATIONS,
      });

      if (!updatedAgent) {
        throw new NotFoundException(`Agent #${id} not found`);
      }

      // This will throw BadRequestException if instantiation fails, rolling back the transaction
      await this.syncAgentInstance(updatedAgent);

      return updatedAgent;
    });
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
        relations: AGENT_RELATIONS,
      });

      if (!agentEntity) {
        throw new NotFoundException(`Agent #${agentId} not found`);
      }

      if (agentEntity.status === 'inactive') {
        throw new NotFoundException(
          `Agent #${agentId} is currently inactive and cannot be probed.`,
        );
      }

      await this.syncAgentInstance(agentEntity);
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
