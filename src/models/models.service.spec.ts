import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ModelsService } from './models.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Model } from './entities/model.entity';
import { AgentEntity } from '../agents/entities/agent.entity';
import { Repository } from 'typeorm';

describe('ModelsService', () => {
  let service: ModelsService;
  let modelRepository: jest.Mocked<Repository<Model>>;
  let agentRepository: jest.Mocked<Repository<AgentEntity>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModelsService,
        {
          provide: getRepositoryToken(Model),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            preload: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(AgentEntity),
          useValue: {
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ModelsService>(ModelsService);
    modelRepository = module.get(getRepositoryToken(Model));
    agentRepository = module.get(getRepositoryToken(AgentEntity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a model', async () => {
    const createDto = { name: 'gpt-4', providerId: 'prov-1' };
    const mockModel = {
      id: '1',
      ...createDto,
      createdAt: new Date(),
      updatedAt: new Date(),
      provider: {},
      agents: [],
    } as unknown as Model;
    jest.spyOn(modelRepository, 'create').mockReturnValue(mockModel);
    jest.spyOn(modelRepository, 'save').mockResolvedValue(mockModel);

    expect(await service.create(createDto)).toEqual(mockModel);
  });

  it('should return all models', async () => {
    const mockModel = { id: '1', name: 'gpt-4' } as unknown as Model;
    jest.spyOn(modelRepository, 'find').mockResolvedValue([mockModel]);
    expect(await service.findAll()).toEqual([mockModel]);
  });

  describe('remove', () => {
    const mockModel = {
      id: 'model-1',
      name: 'gpt-4',
      provider: {},
      agents: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as Model;

    it('should remove a model when no agents are using it', async () => {
      jest.spyOn(modelRepository, 'findOne').mockResolvedValue(mockModel);
      const countSpy = jest
        .spyOn(agentRepository, 'count')
        .mockResolvedValue(0);
      const removeSpy = jest
        .spyOn(modelRepository, 'remove')
        .mockResolvedValue(mockModel);

      await expect(service.remove('model-1')).resolves.toBeUndefined();
      expect(countSpy).toHaveBeenCalledWith({
        where: { model: { id: 'model-1' } },
      });
      expect(removeSpy).toHaveBeenCalledWith(mockModel);
    });

    it('should throw ConflictException when agents are using the model', async () => {
      jest.spyOn(modelRepository, 'findOne').mockResolvedValue(mockModel);
      jest.spyOn(agentRepository, 'count').mockResolvedValue(2);
      const removeSpy = jest.spyOn(modelRepository, 'remove');

      await expect(service.remove('model-1')).rejects.toThrow(
        ConflictException,
      );
      await expect(service.remove('model-1')).rejects.toThrow(
        'Cannot delete model "gpt-4": 2 agent(s) are currently using it.',
      );
      expect(removeSpy).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when model does not exist', async () => {
      jest.spyOn(modelRepository, 'findOne').mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
