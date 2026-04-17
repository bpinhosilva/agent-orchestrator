import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SystemSettingsService } from './system-settings.service';
import { SystemSettings } from './entities/system-settings.entity';

describe('SystemSettingsService', () => {
  let service: SystemSettingsService;

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn().mockImplementation((dto: Partial<SystemSettings>) => dto),
    save: jest
      .fn()
      .mockImplementation((entity) =>
        Promise.resolve({ id: 'uuid', ...entity }),
      ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemSettingsService,
        {
          provide: getRepositoryToken(SystemSettings),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SystemSettingsService>(SystemSettingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSettings', () => {
    it('should return default settings if none exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      const result = await service.getSettings();
      expect(result.data).toBeDefined();
      expect(
        (result.data as { taskScheduler?: unknown }).taskScheduler,
      ).toBeDefined();
      expect(mockRepository.findOne).toHaveBeenCalled();
    });

    it('should return existing settings', async () => {
      const existing = { id: '1', data: { test: 'data' } };
      mockRepository.findOne.mockResolvedValue(existing);
      const result = await service.getSettings();
      expect(result).toEqual(existing);
    });
  });

  describe('updateSettings', () => {
    it('should create and save new settings if none exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      const newData = { test: 'new' };
      const result = await service.updateSettings({ data: newData });
      expect(result.data).toEqual(newData);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should update and save existing settings', async () => {
      const existing = { id: '1', data: { test: 'old' } };
      mockRepository.findOne.mockResolvedValue(existing);
      const newData = { test: 'new' };
      const result = await service.updateSettings({ data: newData });
      expect(result.data).toEqual(newData);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ data: newData }),
      );
    });
  });
});
