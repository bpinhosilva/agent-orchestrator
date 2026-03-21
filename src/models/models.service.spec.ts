import { Test, TestingModule } from '@nestjs/testing';
import { ModelsService } from './models.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Model } from './entities/model.entity';
import { Repository } from 'typeorm';

describe('ModelsService', () => {
  let service: ModelsService;
  let repository: Repository<Model>;

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
          },
        },
      ],
    }).compile();

    service = module.get<ModelsService>(ModelsService);
    repository = module.get<Repository<Model>>(getRepositoryToken(Model));
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
    jest.spyOn(repository, 'create').mockReturnValue(mockModel);
    jest.spyOn(repository, 'save').mockResolvedValue(mockModel);

    expect(await service.create(createDto)).toEqual(mockModel);
  });

  it('should return all models', async () => {
    const mockModel = { id: '1', name: 'gpt-4' } as unknown as Model;
    jest.spyOn(repository, 'find').mockResolvedValue([mockModel]);
    expect(await service.findAll()).toEqual([mockModel]);
  });
});
