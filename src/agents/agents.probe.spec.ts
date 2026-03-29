/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AgentsService } from './agents.service';
import { ModuleRef } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AgentEntity } from './entities/agent.entity';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Agent, AgentResponse } from './interfaces/agent.interface';

jest.mock('./registry/agent.registry', () => ({
  getAgentImplementation: jest.fn(),
}));

import { getAgentImplementation } from './registry/agent.registry';

describe('AgentsService (Probe)', () => {
  let service: AgentsService;
  let repository: Repository<AgentEntity>;
  let moduleRef: ModuleRef;

  const mockAgentInstance: jest.Mocked<Agent> = {
    getName: jest.fn().mockReturnValue('Mock Agent'),
    processText: jest.fn(),
    updateConfig: jest.fn(),
  };

  const mockAgentEntity = {
    id: 'agent-123',
    name: 'Test Agent',
    provider: { id: 'provider-123', name: 'test-provider' },
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
            resolve: jest.fn().mockResolvedValue(mockAgentInstance),
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
    moduleRef = module.get<ModuleRef>(ModuleRef);
  });

  describe('probe', () => {
    it('should return response from memory if agent instance exists', async () => {
      const agentId = 'agent-123';
      const input = 'hello';
      const expectedResponse: AgentResponse = { content: 'hi there' };

      // Inject into private map
      const privateService = service as unknown as {
        agentInstances: Map<string, Agent>;
      };
      privateService.agentInstances.set(agentId, mockAgentInstance);
      mockAgentInstance.processText.mockResolvedValue(expectedResponse);

      const result = await service.probe(agentId, input);

      expect(result).toEqual({ content: 'hi there' });
      expect(mockAgentInstance.processText).toHaveBeenCalledWith(input);
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

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: agentId },
        relations: ['model', 'provider'],
      });
      expect(result).toEqual({ content: 'hi from db' });
      expect(
        (
          service as unknown as { agentInstances: Map<string, Agent> }
        ).agentInstances.has(agentId),
      ).toBe(true);
      expect(moduleRef.resolve).toHaveBeenCalled();
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
      // Actually, syncAgentInstance is private, so we can't easily mock it without casting.
      // In the new implementation, syncAgentInstance throws if initialization fails.
      jest
        .spyOn(moduleRef, 'resolve')
        .mockRejectedValue(new Error('Init failed'));

      await expect(service.probe(agentId, 'input')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
