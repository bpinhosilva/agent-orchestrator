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
            manager: {
              transaction: jest.fn(),
              create: jest.fn(),
              save: jest.fn(),
              update: jest.fn(),
              findOne: jest.fn(),
            },
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
      provider: { id: 'provider-123', name: 'google' },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as AgentEntity;

    const mockManager = {
      create: jest.fn().mockReturnValue(mockAgent),
      save: jest.fn().mockResolvedValue(mockAgent),
      findOne: jest.fn().mockResolvedValue(mockAgent),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    beforeEach(() => {
      jest
        .spyOn(repository.manager, 'transaction' as any)
        .mockImplementation((cb: (manager: any) => any) => {
          return cb(mockManager) as unknown;
        });
    });

    it('should create an agent and sync instance', async () => {
      mockManager.create.mockReturnValue(mockAgent);
      mockManager.save.mockResolvedValue(mockAgent);
      mockManager.findOne.mockResolvedValue(mockAgent);

      const createDto = {
        name: mockAgent.name,
        description: mockAgent.description,
        systemInstructions: 'Test Instructions',
        role: 'Test Role',
        modelId: 'model-123',
        providerId: 'provider-123',
      };

      jest.spyOn(service as any, 'syncAgentInstance').mockImplementation();

      const result = await service.create(createDto);
      expect(result).toEqual(mockAgent);
      expect(repository.manager['transaction']).toHaveBeenCalled();
      expect(mockManager.save).toHaveBeenCalled();
    });

    it('should rollback transaction if syncAgentInstance fails on creation', async () => {
      mockManager.create.mockReturnValue(mockAgent);
      mockManager.save.mockResolvedValue(mockAgent);
      mockManager.findOne.mockResolvedValue(mockAgent);

      jest.spyOn(service as any, 'syncAgentInstance').mockImplementation(() => {
        throw new Error('Instantiation Failed');
      });

      const createDto = { name: 'FailBot', modelId: 'm1', providerId: 'p1' };

      await expect(service.create(createDto)).rejects.toThrow(
        'Instantiation Failed',
      );
      expect(repository.manager['transaction']).toHaveBeenCalled();
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

    it('should update an agent atomically', async () => {
      mockManager.update.mockResolvedValue({ affected: 1 });
      mockManager.findOne.mockResolvedValue(mockAgent);
      jest.spyOn(service as any, 'syncAgentInstance').mockImplementation();

      const result = await service.update('uuid-123', { name: 'Updated' });
      expect(result).toEqual(mockAgent);
      expect(repository.manager['transaction']).toHaveBeenCalled();
    });

    it('should rollback transaction if syncAgentInstance fails on update', async () => {
      mockManager.update.mockResolvedValue({ affected: 1 });
      mockManager.findOne.mockResolvedValue(mockAgent);
      jest.spyOn(service as any, 'syncAgentInstance').mockImplementation(() => {
        throw new Error('Update Instantiation Failed');
      });

      await expect(
        service.update('uuid-123', { name: 'FailUpdate' }),
      ).rejects.toThrow('Update Instantiation Failed');
      expect(repository.manager['transaction']).toHaveBeenCalled();
    });

    it('should throw NotFoundException on update if not found', async () => {
      mockManager.update.mockResolvedValue({ affected: 0 });
      mockManager.findOne.mockResolvedValue(null);

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
