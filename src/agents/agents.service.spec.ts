import { Test, TestingModule } from '@nestjs/testing';
import { AgentsService } from './agents.service';
import { ModuleRef } from '@nestjs/core';
import { GeminiAgent } from './implementations/gemini.agent';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AgentEntity } from './entities/agent.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

describe('AgentsService', () => {
  let service: AgentsService;
  let geminiAgent: GeminiAgent;
  let repository: Repository<AgentEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentsService,
        {
          provide: GeminiAgent,
          useValue: {
            getName: jest.fn().mockReturnValue('MockedGeminiAgent'),
            getDescription: jest.fn().mockReturnValue('Test Description'),
            getSystemInstructions: jest
              .fn()
              .mockReturnValue('Test Instructions'),
            getRole: jest.fn().mockReturnValue('Test Role'),
            getProvider: jest.fn().mockReturnValue('Google'),
            getModel: jest.fn().mockReturnValue('gemini-pro'),
            updateConfig: jest.fn(),
            processText: jest.fn(),
          },
        },
        {
          provide: ModuleRef,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(AgentEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            preload: jest.fn(),
            remove: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AgentsService>(AgentsService);
    geminiAgent = module.get<GeminiAgent>(GeminiAgent);
    repository = module.get<Repository<AgentEntity>>(
      getRepositoryToken(AgentEntity),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processRequest', () => {
    it('should delegate processText to a resolved agent instance', async () => {
      const expectedResponse = { content: 'test response' };
      const agentId = 'agent-1';

      // Mock the agent in the internal map
      (
        service as unknown as {
          agentInstances: Map<string, typeof geminiAgent>;
        }
      ).agentInstances.set(agentId, geminiAgent);

      const processTextSpy = jest.fn().mockResolvedValue(expectedResponse);
      geminiAgent.processText = processTextSpy;
      const result = await service.processRequest(agentId, 'test input');
      expect(result).toBe(expectedResponse);
      expect(processTextSpy).toHaveBeenCalled();
    });
  });

  describe('CRUD operations', () => {
    const mockAgent = {
      id: 'uuid-123',
      name: 'Agent Smith',
      description: 'Test Description',
      systemInstructions: 'Test Instructions',
      role: 'Test Role',
      model: { id: 'model-123', name: 'gpt-4' },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as AgentEntity;

    it('should create an agent', async () => {
      jest.spyOn(repository, 'create').mockReturnValue(mockAgent);
      jest.spyOn(repository, 'save').mockResolvedValue(mockAgent);
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockAgent);
      const createDto = {
        name: mockAgent.name,
        description: mockAgent.description,
        systemInstructions: 'Test Instructions',
        role: 'Test Role',
        modelId: 'model-123',
      };
      expect(await service.create(createDto)).toEqual(mockAgent);
    });

    it('should find all agents', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([mockAgent]);
      expect(await service.findAll()).toEqual([mockAgent]);
    });

    it('should find one agent', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockAgent);
      expect(await service.findOne('uuid-123')).toEqual(mockAgent);
    });

    it('should throw NotFoundException if agent not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      await expect(service.findOne('uuid-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update an agent', async () => {
      const updateResult = { affected: 1, raw: [], generatedMaps: [] };
      jest.spyOn(repository, 'update').mockResolvedValue(updateResult);
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockAgent);
      expect(await service.update('uuid-123', { name: 'Updated' })).toEqual(
        mockAgent,
      );
    });

    it('should throw NotFoundException on update if not found', async () => {
      const updateResult = { affected: 0, raw: [], generatedMaps: [] };
      jest.spyOn(repository, 'update').mockResolvedValue(updateResult);
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      await expect(
        service.update('uuid-123', { name: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should delete an agent', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockAgent);
      jest.spyOn(repository, 'remove').mockResolvedValue(mockAgent);
      expect(await service.remove('uuid-123')).toBeUndefined();
    });
  });
});
