import { Test, TestingModule } from '@nestjs/testing';
import { AgentsService } from './agents.service';
import { ModuleRef } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AgentEntity } from './entities/agent.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { Agent, AgentResponse } from './interfaces/agent.interface';

jest.mock('./registry/agent.registry', () => ({
  getAgentImplementation: jest.fn(),
}));

import { getAgentImplementation } from './registry/agent.registry';

describe('AgentsService (Probe)', () => {
  let service: AgentsService;
  let repository: Repository<AgentEntity>;

  const mockAgentInstance: jest.Mocked<Agent> = {
    getName: jest.fn().mockReturnValue('Mock Agent'),
    processText: jest.fn(),
  };

  const mockAgentEntity = {
    id: 'agent-123',
    name: 'Test Agent',
    provider: 'test-provider',
    model: { name: 'test-model' },
  } as unknown as AgentEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentsService,
        {
          provide: ModuleRef,
          useValue: {
            create: jest.fn().mockResolvedValue(mockAgentInstance),
          },
        },
        {
          provide: getRepositoryToken(AgentEntity),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AgentsService>(AgentsService);
    repository = module.get<Repository<AgentEntity>>(
      getRepositoryToken(AgentEntity),
    );
  });

  describe('probe', () => {
    it('should return response from memory if agent instance exists', async () => {
      const agentId = 'agent-123';
      const input = 'hello';
      const expectedResponse: AgentResponse = { content: 'hi there' };

      // Inject into private map
      (
        service as unknown as {
          agentInstances: Map<string, typeof mockAgentInstance>;
        }
      ).agentInstances.set(agentId, mockAgentInstance);
      mockAgentInstance.processText.mockResolvedValue(expectedResponse);

      const result = await service.probe(agentId, input);

      expect(result).toEqual({ content: 'hi there' });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockAgentInstance.processText).toHaveBeenCalledWith(input);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(repository.findOne).toHaveBeenCalledTimes(0);
    });

    it('should fetch from DB and sync if not in memory', async () => {
      const agentId = 'agent-456';
      const input = 'hello db';
      const expectedResponse: AgentResponse = { content: 'hi from db' };

      const testAgentEntity = { ...mockAgentEntity, id: agentId };
      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(testAgentEntity as AgentEntity);
      (getAgentImplementation as jest.Mock).mockReturnValue(
        class MockAgent {
          getName = jest.fn().mockReturnValue('Mock Agent');
          processText = jest.fn().mockResolvedValue(expectedResponse);
          updateConfig = jest.fn();
        },
      );
      mockAgentInstance.processText.mockResolvedValue(expectedResponse);

      // Ensure it's not in memory
      (
        service as unknown as { agentInstances: Map<string, Agent> }
      ).agentInstances.delete(agentId);

      const result = await service.probe(agentId, input);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(jest.mocked(repository.findOne)).toHaveBeenCalledWith({
        where: { id: agentId },
        relations: ['model'],
      });
      expect(result).toEqual({ content: 'hi from db' });
      expect(
        (
          service as unknown as { agentInstances: Map<string, Agent> }
        ).agentInstances.has(agentId),
      ).toBe(true);
    });

    it('should throw NotFoundException if not in memory and not in DB', async () => {
      const agentId = 'non-existent';
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.probe(agentId, 'input')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if failed to initialize after DB fetch', async () => {
      const agentId = 'agent-789';
      const testAgentEntity = { ...mockAgentEntity, id: agentId };
      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(testAgentEntity as AgentEntity);

      // Mock syncAgentInstance to NOT add to map (simulating failure)
      const syncSpy = jest.fn();
      (
        service as unknown as { syncAgentInstance: jest.Mock }
      ).syncAgentInstance = syncSpy;

      await expect(service.probe(agentId, 'input')).rejects.toThrow(
        `Failed to initialize agent #${agentId} after database fetch`,
      );
    });
  });
});
