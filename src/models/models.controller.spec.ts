import { Test, TestingModule } from '@nestjs/testing';
import { ModelsController } from './models.controller';
import { ModelsService } from './models.service';
import { Model } from './entities/model.entity';

describe('ModelsController', () => {
  let controller: ModelsController;
  let service: ModelsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModelsController],
      providers: [
        {
          provide: ModelsService,
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

    controller = module.get<ModelsController>(ModelsController);
    service = module.get<ModelsService>(ModelsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should find all models', async () => {
    const mockModels = [{ id: '1', name: 'gpt-4' }] as unknown as Model[];
    jest.spyOn(service, 'findAll').mockResolvedValue(mockModels);
    expect(await controller.findAll()).toEqual(mockModels);
  });
});
