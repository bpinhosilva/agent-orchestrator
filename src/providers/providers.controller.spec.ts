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

  it('should find all providers', async () => {
    const mockProviders = [
      { id: '1', name: 'OpenAI' },
    ] as unknown as Provider[];
    jest.spyOn(service, 'findAll').mockResolvedValue(mockProviders);
    expect(await controller.findAll()).toEqual(mockProviders);
  });
});
