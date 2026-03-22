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
            preload: jest.fn(),
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

  it('should return a single provider', async () => {
    const mockProvider = { id: '1', name: 'Google' } as unknown as Provider;
    jest.spyOn(repository, 'findOne').mockResolvedValue(mockProvider);
    expect(await service.findOne('1')).toEqual(mockProvider);
  });

  it('should throw if provider not found', async () => {
    jest.spyOn(repository, 'findOne').mockResolvedValue(null);
    await expect(service.findOne('1')).rejects.toThrow('Provider #1 not found');
  });

  it('should return provider models excluding provider data', async () => {
    const mockProvider = {
      id: '1',
      name: 'Google',
      models: [
        { id: 'm1', name: 'Gemini', provider: { id: '1', name: 'Google' } },
        { id: 'm2', name: 'PaLM', provider: { id: '1', name: 'Google' } },
      ],
    } as unknown as Provider;
    jest.spyOn(repository, 'findOne').mockResolvedValue(mockProvider);

    const models = await service.findProviderModels('1');
    expect(models).toEqual([
      { id: 'm1', name: 'Gemini' },
      { id: 'm2', name: 'PaLM' },
    ]);
  });

  it('should throw if provider for models not found', async () => {
    jest.spyOn(repository, 'findOne').mockResolvedValue(null);
    await expect(service.findProviderModels('1')).rejects.toThrow(
      'Provider #1 not found',
    );
  });

  it('should update a provider', async () => {
    const mockProvider = {
      id: '1',
      name: 'Google Update',
    } as unknown as Provider;
    jest.spyOn(repository, 'preload').mockResolvedValue(mockProvider);
    jest.spyOn(repository, 'save').mockResolvedValue(mockProvider);

    expect(await service.update('1', { name: 'Google Update' })).toEqual(
      mockProvider,
    );
  });

  it('should throw if provider to update not found', async () => {
    jest.spyOn(repository, 'preload').mockResolvedValue(undefined);
    await expect(service.update('1', { name: 'Update' })).rejects.toThrow(
      'Provider #1 not found',
    );
  });

  it('should remove a provider', async () => {
    const mockProvider = { id: '1', name: 'Google' } as unknown as Provider;
    jest.spyOn(repository, 'findOne').mockResolvedValue(mockProvider);
    const removeSpy = jest
      .spyOn(repository, 'remove')
      .mockResolvedValue(mockProvider);

    await service.remove('1');
    expect(removeSpy).toHaveBeenCalledWith(mockProvider);
  });
});
