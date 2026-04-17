import { Test, TestingModule } from '@nestjs/testing';
import { ProvidersController } from './providers.controller';
import { ProvidersService } from './providers.service';
import { Provider } from './entities/provider.entity';

describe('ProvidersController', () => {
  let controller: ProvidersController;
  let service: ProvidersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProvidersController],
      providers: [
        {
          provide: ProvidersService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            findProviderModels: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProvidersController>(ProvidersController);
    service = module.get<ProvidersService>(ProvidersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a provider', async () => {
    const dto = { name: 'Google', description: 'Google AI' };
    const mockProvider = { id: '1', ...dto } as unknown as Provider;
    jest.spyOn(service, 'create').mockResolvedValue(mockProvider);
    expect(await controller.create(dto)).toEqual(mockProvider);
  });

  it('should find all providers', async () => {
    const mockProviders = [
      { id: '1', name: 'OpenAI' },
    ] as unknown as Provider[];
    jest.spyOn(service, 'findAll').mockResolvedValue(mockProviders);
    expect(await controller.findAll()).toEqual(mockProviders);
  });

  it('should find one provider', async () => {
    const mockProvider = { id: '1', name: 'OpenAI' } as unknown as Provider;
    jest.spyOn(service, 'findOne').mockResolvedValue(mockProvider);
    expect(await controller.findOne('1')).toEqual(mockProvider);
  });

  it('should find provider models', async () => {
    const mockModels = [{ id: 'm1', name: 'GPT-4' }];
    jest.spyOn(service, 'findProviderModels').mockResolvedValue(mockModels);
    expect(await controller.findModels('1')).toEqual(mockModels);
  });

  it('should update a provider', async () => {
    const dto = { name: 'Google Update' };
    const mockProvider = {
      id: '1',
      name: 'Google Update',
    } as unknown as Provider;
    jest.spyOn(service, 'update').mockResolvedValue(mockProvider);
    expect(await controller.update('1', dto)).toEqual(mockProvider);
  });

  it('should remove a provider', async () => {
    const removeSpy = jest
      .spyOn(service, 'remove')
      .mockResolvedValue(undefined);
    await controller.remove('1');
    expect(removeSpy).toHaveBeenCalledWith('1');
  });
});
