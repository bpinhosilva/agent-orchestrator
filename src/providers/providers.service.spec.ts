import { Test, TestingModule } from '@nestjs/testing';
import { ProvidersService } from './providers.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Provider } from './entities/provider.entity';
import { Repository } from 'typeorm';

describe('ProvidersService', () => {
  let service: ProvidersService;
  let repository: Repository<Provider>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProvidersService,
        {
          provide: getRepositoryToken(Provider),
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

    service = module.get<ProvidersService>(ProvidersService);
    repository = module.get<Repository<Provider>>(getRepositoryToken(Provider));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a provider', async () => {
    const createDto = { name: 'Google', description: 'Google AI' };
    const mockProvider = {
      id: '1',
      ...createDto,
      createdAt: new Date(),
      updatedAt: new Date(),
      models: [],
    } as unknown as Provider;
    jest.spyOn(repository, 'create').mockReturnValue(mockProvider);
    jest.spyOn(repository, 'save').mockResolvedValue(mockProvider);

    expect(await service.create(createDto)).toEqual(mockProvider);
  });

  it('should return all providers', async () => {
    const mockProvider = { id: '1', name: 'Google' } as unknown as Provider;
    jest.spyOn(repository, 'find').mockResolvedValue([mockProvider]);
    expect(await service.findAll()).toEqual([mockProvider]);
  });
});
