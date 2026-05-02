import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SchedulerRegistry } from '@nestjs/schedule';
import { RecurrentTaskSchedulerService } from './recurrent-task-scheduler.service';
import {
  RecurrentTask,
  RecurrentTaskStatus,
} from './entities/recurrent-task.entity';
import {
  RecurrentTaskExec,
  ExecStatus,
} from './entities/recurrent-task-exec.entity';
import { AgentsService } from '../agents/agents.service';
import { SystemSettingsService } from '../system-settings/system-settings.service';
import { StorageService } from '../common/storage.service';
import { StoragePathHelper } from '../common/storage-path.helper';

type ServicePrivates = {
  syncInterval: NodeJS.Timeout | null;
  maxActiveTasks: number;
  executionTimeout: number;
  runningTasks: Map<string, { execId: string; startTime: number }>;
};

const mockCronJobInstance = {
  start: jest.fn(),
  stop: jest.fn(),
  cronTime: { source: '* * * * *' },
};

jest.mock('cron', () => ({
  CronJob: jest.fn().mockImplementation(() => mockCronJobInstance),
}));

describe('RecurrentTaskSchedulerService', () => {
  let service: RecurrentTaskSchedulerService;
  let mockRecurrentTaskRepository: { find: jest.Mock; findOne: jest.Mock };
  let mockExecRepository: {
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
  };
  let mockSchedulerRegistry: {
    doesExist: jest.Mock;
    getCronJob: jest.Mock;
    deleteCronJob: jest.Mock;
    addCronJob: jest.Mock;
    getCronJobs: jest.Mock;
  };
  let mockAgentsService: { probe: jest.Mock };
  let mockSystemSettingsService: { getSettings: jest.Mock };
  let mockStorageService: { saveBase64: jest.Mock };
  let mockStoragePathHelper: { generate: jest.Mock };

  const defaultSettings = {
    data: {
      recurrentTasksScheduler: {
        pollIntervalInMs: 15000,
        executionTimeout: 120000,
        maxActiveTasks: 5,
      },
    },
  };

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    mockCronJobInstance.start.mockReset();
    mockCronJobInstance.stop.mockReset();

    mockRecurrentTaskRepository = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
    };
    mockExecRepository = {
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };
    mockSchedulerRegistry = {
      doesExist: jest.fn().mockReturnValue(false),
      getCronJob: jest.fn(),
      deleteCronJob: jest.fn(),
      addCronJob: jest.fn(),
      getCronJobs: jest.fn().mockReturnValue(new Map()),
    };
    mockAgentsService = { probe: jest.fn() };
    mockSystemSettingsService = {
      getSettings: jest.fn().mockResolvedValue(defaultSettings),
    };
    mockStorageService = {
      saveBase64: jest.fn().mockResolvedValue(undefined),
    };
    mockStoragePathHelper = {
      generate: jest.fn().mockReturnValue({
        id: 'uuid',
        originalName: 'generated-image.png',
        mimeType: 'image/png',
        filePath: 'path/to/image.png',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecurrentTaskSchedulerService,
        {
          provide: getRepositoryToken(RecurrentTask),
          useValue: mockRecurrentTaskRepository,
        },
        {
          provide: getRepositoryToken(RecurrentTaskExec),
          useValue: mockExecRepository,
        },
        { provide: SchedulerRegistry, useValue: mockSchedulerRegistry },
        { provide: AgentsService, useValue: mockAgentsService },
        { provide: SystemSettingsService, useValue: mockSystemSettingsService },
        { provide: StorageService, useValue: mockStorageService },
        { provide: StoragePathHelper, useValue: mockStoragePathHelper },
      ],
    }).compile();

    service = module.get<RecurrentTaskSchedulerService>(
      RecurrentTaskSchedulerService,
    );
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onApplicationBootstrap', () => {
    it('should register active tasks and schedule the sync interval', async () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');

      await service.onApplicationBootstrap();

      expect(mockRecurrentTaskRepository.find).toHaveBeenCalledWith({
        where: { status: RecurrentTaskStatus.ACTIVE },
        relations: ['assignee'],
      });
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 15000);
    });
  });

  describe('onModuleDestroy', () => {
    it('should clear the sync interval', async () => {
      await service.onApplicationBootstrap();
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      service.onModuleDestroy();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('should not throw when no interval is running', () => {
      (service as unknown as ServicePrivates).syncInterval = null;

      expect(() => service.onModuleDestroy()).not.toThrow();
    });
  });

  describe('unregisterTasks', () => {
    it('should stop and delete the cron job when it exists', () => {
      const mockJob = { stop: jest.fn() };
      mockSchedulerRegistry.doesExist.mockReturnValue(true);
      mockSchedulerRegistry.getCronJob.mockReturnValue(mockJob);

      service.unregisterTasks('task-uuid');

      expect(mockSchedulerRegistry.getCronJob).toHaveBeenCalledWith(
        'recurrent-task-task-uuid',
      );
      expect(mockJob.stop).toHaveBeenCalled();
      expect(mockSchedulerRegistry.deleteCronJob).toHaveBeenCalledWith(
        'recurrent-task-task-uuid',
      );
    });

    it('should do nothing when cron job does not exist', () => {
      mockSchedulerRegistry.doesExist.mockReturnValue(false);

      service.unregisterTasks('task-uuid');

      expect(mockSchedulerRegistry.getCronJob).not.toHaveBeenCalled();
      expect(mockSchedulerRegistry.deleteCronJob).not.toHaveBeenCalled();
    });
  });

  describe('executeTask', () => {
    const taskId = 'task-uuid';
    const execId = 'exec-uuid';
    const activeTask = {
      id: taskId,
      title: 'Daily Report',
      description: 'Generate report',
      status: RecurrentTaskStatus.ACTIVE,
      assignee: { id: 'agent-uuid', name: 'Bot' },
    };

    beforeEach(() => {
      mockRecurrentTaskRepository.findOne.mockResolvedValue(activeTask);
      mockExecRepository.create.mockReturnValue({ id: execId });
      mockExecRepository.save.mockResolvedValue({ id: execId });
    });

    it('should skip execution when max concurrent running tasks is reached', async () => {
      (service as unknown as ServicePrivates).maxActiveTasks = 2;
      (service as unknown as ServicePrivates).runningTasks.set('task-a', {
        execId: 'e1',
        startTime: Date.now(),
      });
      (service as unknown as ServicePrivates).runningTasks.set('task-b', {
        execId: 'e2',
        startTime: Date.now(),
      });

      await service.executeTask(taskId);

      expect(mockRecurrentTaskRepository.findOne).not.toHaveBeenCalled();
    });

    it('should skip execution when task is already running and not timed out', async () => {
      (service as unknown as ServicePrivates).runningTasks.set(taskId, {
        execId,
        startTime: Date.now() - 5000,
      });

      await service.executeTask(taskId);

      expect(mockRecurrentTaskRepository.findOne).not.toHaveBeenCalled();
    });

    it('should cancel the timed-out execution and proceed with a new one', async () => {
      (service as unknown as ServicePrivates).executionTimeout = 120000;
      (service as unknown as ServicePrivates).runningTasks.set(taskId, {
        execId: 'old-exec-uuid',
        startTime: Date.now() - 200000,
      });
      mockAgentsService.probe.mockResolvedValue({ content: 'Done' });

      await service.executeTask(taskId);

      expect(mockExecRepository.update).toHaveBeenCalledWith(
        'old-exec-uuid',
        expect.objectContaining({ status: ExecStatus.CANCELED }),
      );
      expect(mockAgentsService.probe).toHaveBeenCalled();
    });

    it('should skip when task not found', async () => {
      mockRecurrentTaskRepository.findOne.mockResolvedValue(null);

      await service.executeTask(taskId);

      expect(mockExecRepository.create).not.toHaveBeenCalled();
    });

    it('should skip when task is not ACTIVE', async () => {
      mockRecurrentTaskRepository.findOne.mockResolvedValue({
        ...activeTask,
        status: RecurrentTaskStatus.PAUSED,
      });

      await service.executeTask(taskId);

      expect(mockExecRepository.create).not.toHaveBeenCalled();
    });

    it('should skip when task has no assignee', async () => {
      mockRecurrentTaskRepository.findOne.mockResolvedValue({
        ...activeTask,
        assignee: null,
      });

      await service.executeTask(taskId);

      expect(mockExecRepository.create).not.toHaveBeenCalled();
    });

    it('should execute task successfully and update exec to SUCCESS', async () => {
      mockAgentsService.probe.mockResolvedValue({
        content: 'Report generated',
      });

      await service.executeTask(taskId);

      expect(mockExecRepository.update).toHaveBeenCalledWith(
        execId,
        expect.objectContaining({
          status: ExecStatus.SUCCESS,
          result: 'Report generated',
          artifacts: null,
        }),
      );
      expect(
        (service as unknown as ServicePrivates).runningTasks.has(taskId),
      ).toBe(false);
    });

    it('should save a base64 image artifact when the response includes an image', async () => {
      const base64Image = 'data:image/png;base64,' + 'A'.repeat(200);
      mockAgentsService.probe.mockResolvedValue({
        content: 'Done',
        image: base64Image,
      });

      await service.executeTask(taskId);

      expect(mockStorageService.saveBase64).toHaveBeenCalled();
      expect(mockExecRepository.update).toHaveBeenCalledWith(
        execId,
        expect.objectContaining({
          status: ExecStatus.SUCCESS,
          artifacts: expect.arrayContaining([
            expect.objectContaining({ filePath: 'path/to/image.png' }),
          ]) as unknown,
        }),
      );
    });

    it('should mark exec SUCCESS even when artifact save fails', async () => {
      mockAgentsService.probe.mockResolvedValue({
        content: 'Done',
        image: 'data:image/png;base64,' + 'A'.repeat(200),
      });
      mockStorageService.saveBase64.mockRejectedValue(new Error('disk full'));

      await service.executeTask(taskId);

      expect(mockExecRepository.update).toHaveBeenCalledWith(
        execId,
        expect.objectContaining({ status: ExecStatus.SUCCESS }),
      );
    });

    it('should update exec to FAILURE when agent probe throws', async () => {
      mockAgentsService.probe.mockRejectedValue(new Error('API timeout'));

      await service.executeTask(taskId);

      expect(mockExecRepository.update).toHaveBeenCalledWith(
        execId,
        expect.objectContaining({
          status: ExecStatus.FAILURE,
          result: 'API timeout',
        }),
      );
    });

    it('should remove task from runningTasks in finally block on both success and failure', async () => {
      mockAgentsService.probe.mockRejectedValue(new Error('failure'));

      await service.executeTask(taskId);

      expect(
        (service as unknown as ServicePrivates).runningTasks.has(taskId),
      ).toBe(false);
    });
  });

  describe('registerActiveTasks', () => {
    it('should register cron jobs for active tasks with valid cron expressions', async () => {
      const { CronJob } = jest.requireMock<{ CronJob: jest.Mock }>('cron');
      mockRecurrentTaskRepository.find.mockResolvedValue([
        {
          id: 'task-1',
          title: 'T1',
          cronExpression: '0 9 * * *',
          status: RecurrentTaskStatus.ACTIVE,
          assignee: { id: 'agent-1' },
        },
      ]);
      mockSchedulerRegistry.doesExist.mockReturnValue(false);

      await service.onApplicationBootstrap();

      expect(CronJob).toHaveBeenCalledWith('0 9 * * *', expect.any(Function));
      expect(mockSchedulerRegistry.addCronJob).toHaveBeenCalledWith(
        'recurrent-task-task-1',
        expect.any(Object),
      );
      expect(mockCronJobInstance.start).toHaveBeenCalled();
    });

    it('should skip tasks without a cronExpression', async () => {
      const { CronJob } = jest.requireMock<{ CronJob: jest.Mock }>('cron');
      mockRecurrentTaskRepository.find.mockResolvedValue([
        {
          id: 'task-1',
          title: 'T1',
          cronExpression: null,
          status: RecurrentTaskStatus.ACTIVE,
          assignee: { id: 'agent-1' },
        },
      ]);

      await service.onApplicationBootstrap();

      expect(CronJob).not.toHaveBeenCalled();
    });

    it('should not re-register a cron job that already exists', async () => {
      const { CronJob } = jest.requireMock<{ CronJob: jest.Mock }>('cron');
      mockRecurrentTaskRepository.find.mockResolvedValue([
        {
          id: 'task-1',
          title: 'T1',
          cronExpression: '0 9 * * *',
          status: RecurrentTaskStatus.ACTIVE,
        },
      ]);
      mockSchedulerRegistry.doesExist.mockReturnValue(true);

      await service.onApplicationBootstrap();

      expect(CronJob).not.toHaveBeenCalled();
    });

    it('should remove stale cron jobs for tasks that are no longer active', async () => {
      const staleMockJob = { stop: jest.fn() };
      mockSchedulerRegistry.getCronJobs.mockReturnValue(
        new Map([['recurrent-task-stale-id', staleMockJob]]),
      );
      mockRecurrentTaskRepository.find.mockResolvedValue([]);

      await service.onApplicationBootstrap();

      expect(staleMockJob.stop).toHaveBeenCalled();
      expect(mockSchedulerRegistry.deleteCronJob).toHaveBeenCalledWith(
        'recurrent-task-stale-id',
      );
    });

    it('should replace an inactive registered cron job for an active task', async () => {
      const { CronJob } = jest.requireMock<{ CronJob: jest.Mock }>('cron');
      let jobExists = true;
      const inactiveJob = {
        stop: jest.fn(),
        isActive: false,
        cronTime: { source: '5 0 * * *' },
      };

      mockSchedulerRegistry.getCronJobs.mockReturnValue(
        new Map([['recurrent-task-task-1', inactiveJob]]),
      );
      mockSchedulerRegistry.doesExist.mockImplementation(() => jobExists);
      mockSchedulerRegistry.deleteCronJob.mockImplementation(() => {
        jobExists = false;
      });
      mockRecurrentTaskRepository.find.mockResolvedValue([
        {
          id: 'task-1',
          title: 'Daily report',
          cronExpression: '5 0 * * *',
          status: RecurrentTaskStatus.ACTIVE,
          assignee: { id: 'agent-1' },
        },
      ]);

      await service.onApplicationBootstrap();

      expect(inactiveJob.stop).toHaveBeenCalled();
      expect(mockSchedulerRegistry.deleteCronJob).toHaveBeenCalledWith(
        'recurrent-task-task-1',
      );
      expect(CronJob).toHaveBeenCalledWith('5 0 * * *', expect.any(Function));
      expect(mockSchedulerRegistry.addCronJob).toHaveBeenCalledWith(
        'recurrent-task-task-1',
        expect.any(Object),
      );
      expect(mockCronJobInstance.start).toHaveBeenCalled();
    });

    it('should not throw when CronJob constructor throws for an invalid cron expression', async () => {
      const { CronJob } = jest.requireMock<{ CronJob: jest.Mock }>('cron');
      CronJob.mockImplementationOnce(() => {
        throw new Error('Invalid cron expression');
      });
      mockRecurrentTaskRepository.find.mockResolvedValue([
        {
          id: 'task-1',
          title: 'Bad Task',
          cronExpression: 'not-a-cron',
          status: RecurrentTaskStatus.ACTIVE,
          assignee: { id: 'agent-1' },
        },
      ]);
      mockSchedulerRegistry.doesExist.mockReturnValue(false);

      await expect(service.onApplicationBootstrap()).resolves.not.toThrow();
    });

    it('should refresh scheduler settings from system settings on each sync', async () => {
      await service.onApplicationBootstrap();

      expect(mockSystemSettingsService.getSettings).toHaveBeenCalled();
    });

    it('should use current settings if system settings fetch fails', async () => {
      mockSystemSettingsService.getSettings.mockRejectedValue(
        new Error('settings unavailable'),
      );

      await expect(service.onApplicationBootstrap()).resolves.not.toThrow();
    });
  });
});
