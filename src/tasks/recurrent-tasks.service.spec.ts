import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RecurrentTasksService } from './recurrent-tasks.service';
import {
  RecurrentTask,
  RecurrentTaskStatus,
} from './entities/recurrent-task.entity';
import { RecurrentTaskExec } from './entities/recurrent-task-exec.entity';
import { RecurrentTaskSchedulerService } from './recurrent-task-scheduler.service';

type TaskResult = { id: string; lastRun: Date | null };

describe('RecurrentTasksService', () => {
  let service: RecurrentTasksService;
  let mockManager: {
    count: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    remove: jest.Mock;
  };
  let mockQb: {
    leftJoinAndSelect: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    orderBy: jest.Mock;
    getMany: jest.Mock;
    getOne: jest.Mock;
  };
  let mockRepository: {
    createQueryBuilder: jest.Mock;
    findOne: jest.Mock;
    manager: { transaction: jest.Mock };
  };
  let mockExecRepository: { findAndCount: jest.Mock };
  let mockSchedulerService: { unregisterTasks: jest.Mock };

  beforeEach(async () => {
    mockManager = {
      count: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    mockQb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getOne: jest.fn(),
    };

    mockRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQb),
      findOne: jest.fn(),
      manager: {
        transaction: jest
          .fn()
          .mockImplementation((cb: (manager: typeof mockManager) => unknown) =>
            cb(mockManager),
          ),
      },
    };

    mockExecRepository = { findAndCount: jest.fn() };

    mockSchedulerService = { unregisterTasks: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecurrentTasksService,
        {
          provide: getRepositoryToken(RecurrentTask),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(RecurrentTaskExec),
          useValue: mockExecRepository,
        },
        {
          provide: RecurrentTaskSchedulerService,
          useValue: mockSchedulerService,
        },
      ],
    }).compile();

    service = module.get<RecurrentTasksService>(RecurrentTasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const projectId = 'project-uuid';
    const dto = {
      title: 'Daily Report',
      description: 'Generate daily report',
      cronExpression: '0 9 * * *',
      assigneeId: 'agent-uuid',
    };

    it('should create an active recurrent task successfully', async () => {
      const savedTask = {
        id: 'task-uuid',
        ...dto,
        status: RecurrentTaskStatus.ACTIVE,
      };
      mockManager.count.mockResolvedValue(0);
      mockManager.create.mockReturnValue(savedTask);
      mockManager.save.mockResolvedValue(savedTask);

      const result = await service.create(dto, projectId);

      expect(result).toEqual(savedTask);
      expect(mockManager.count).toHaveBeenCalledWith(RecurrentTask, {
        where: { status: RecurrentTaskStatus.ACTIVE },
      });
      expect(mockManager.create).toHaveBeenCalledWith(
        RecurrentTask,
        expect.objectContaining({
          assignee: { id: 'agent-uuid' },
          project: { id: projectId },
        }),
      );
    });

    it('should default to ACTIVE status when dto.status is not provided', async () => {
      const savedTask = { id: 'task-uuid', status: RecurrentTaskStatus.ACTIVE };
      mockManager.count.mockResolvedValue(0);
      mockManager.create.mockReturnValue(savedTask);
      mockManager.save.mockResolvedValue(savedTask);

      await service.create(dto, projectId);

      expect(mockManager.create).toHaveBeenCalledWith(
        RecurrentTask,
        expect.objectContaining({ status: RecurrentTaskStatus.ACTIVE }),
      );
    });

    it('should throw BadRequestException when max active tasks (5) is reached', async () => {
      mockManager.count.mockResolvedValue(5);

      await expect(
        service.create(
          { ...dto, status: RecurrentTaskStatus.ACTIVE },
          projectId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow creating a PAUSED task even when max active count is reached', async () => {
      const savedTask = { id: 'task-uuid', status: RecurrentTaskStatus.PAUSED };
      mockManager.count.mockResolvedValue(5);
      mockManager.create.mockReturnValue(savedTask);
      mockManager.save.mockResolvedValue(savedTask);

      await expect(
        service.create(
          { ...dto, status: RecurrentTaskStatus.PAUSED },
          projectId,
        ),
      ).resolves.not.toThrow();

      expect(mockManager.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return tasks mapped with lastRun from latest execution', async () => {
      const execUpdatedAt = new Date('2024-01-15T09:00:00Z');
      const tasks = [
        {
          id: 'task-1',
          title: 'T1',
          executions: [{ id: 'exec-1', updatedAt: execUpdatedAt }],
        },
      ];
      mockQb.getMany.mockResolvedValue(tasks);

      const result = (await service.findAll('project-uuid')) as TaskResult[];

      expect(result).toHaveLength(1);
      expect(result[0].lastRun).toEqual(execUpdatedAt);
    });

    it('should return lastRun as null when task has no executions', async () => {
      const tasks = [{ id: 'task-1', title: 'T1', executions: [] }];
      mockQb.getMany.mockResolvedValue(tasks);

      const result = (await service.findAll('project-uuid')) as TaskResult[];

      expect(result[0].lastRun).toBeNull();
    });
  });

  describe('findOne', () => {
    it('should return a task with lastRun populated', async () => {
      const execUpdatedAt = new Date();
      const task = {
        id: 'task-uuid',
        executions: [{ updatedAt: execUpdatedAt }],
      };
      mockQb.getOne.mockResolvedValue(task);

      const result = (await service.findOne('task-uuid')) as TaskResult;

      expect(result.id).toEqual('task-uuid');
      expect(result.lastRun).toEqual(execUpdatedAt);
    });

    it('should apply projectId filter when provided', async () => {
      mockQb.getOne.mockResolvedValue({ id: 'task-uuid', executions: [] });

      await service.findOne('task-uuid', 'project-uuid');

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'task.projectId = :projectId',
        { projectId: 'project-uuid' },
      );
    });

    it('should return lastRun as null when task has no executions', async () => {
      mockQb.getOne.mockResolvedValue({ id: 'task-uuid', executions: [] });

      const result = (await service.findOne('task-uuid')) as TaskResult;

      expect(result.lastRun).toBeNull();
    });

    it('should throw NotFoundException when task not found', async () => {
      mockQb.getOne.mockResolvedValue(null);

      await expect(service.findOne('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const taskId = 'task-uuid';
    const projectId = 'project-uuid';
    const pausedTask = {
      id: taskId,
      title: 'Old Title',
      status: RecurrentTaskStatus.PAUSED,
      assignee: null,
    };

    beforeEach(() => {
      mockManager.findOne.mockResolvedValue(pausedTask);
      mockManager.save.mockResolvedValue(undefined);
      mockQb.getOne.mockResolvedValue({
        ...pausedTask,
        executions: [],
        lastRun: null,
      });
    });

    it('should update task fields and return the updated task', async () => {
      const result = (await service.update(
        taskId,
        { title: 'New Title', description: 'New desc' },
        projectId,
      )) as TaskResult;

      expect(mockManager.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should update assignee when assigneeId is provided', async () => {
      await service.update(taskId, { assigneeId: 'new-agent-uuid' }, projectId);

      expect(mockManager.save).toHaveBeenCalledWith(
        expect.objectContaining({ assignee: { id: 'new-agent-uuid' } }),
      );
    });

    it('should throw NotFoundException when task not found', async () => {
      mockManager.findOne.mockResolvedValue(null);

      await expect(
        service.update('missing-id', { title: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when activating a task and max active count is reached', async () => {
      mockManager.count.mockResolvedValue(5);

      await expect(
        service.update(taskId, { status: RecurrentTaskStatus.ACTIVE }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should not check active count when task is already ACTIVE and status stays ACTIVE', async () => {
      const activeTask = { ...pausedTask, status: RecurrentTaskStatus.ACTIVE };
      mockManager.findOne.mockResolvedValue(activeTask);

      await service.update(taskId, { status: RecurrentTaskStatus.ACTIVE });

      expect(mockManager.count).not.toHaveBeenCalled();
    });

    it('should call unregisterTasks when status becomes PAUSED', async () => {
      await service.update(
        taskId,
        { status: RecurrentTaskStatus.PAUSED },
        projectId,
      );

      expect(mockSchedulerService.unregisterTasks).toHaveBeenCalledWith(taskId);
    });

    it('should not call unregisterTasks for non-PAUSED status changes', async () => {
      mockManager.count.mockResolvedValue(0);

      await service.update(
        taskId,
        { status: RecurrentTaskStatus.ACTIVE },
        projectId,
      );

      expect(mockSchedulerService.unregisterTasks).not.toHaveBeenCalled();
    });

    it('should log error if unregisterTasks throws but still return the task', async () => {
      mockSchedulerService.unregisterTasks.mockImplementation(() => {
        throw new Error('scheduler error');
      });

      await expect(
        service.update(
          taskId,
          { status: RecurrentTaskStatus.PAUSED },
          projectId,
        ),
      ).resolves.toBeDefined();
    });
  });

  describe('remove', () => {
    const taskId = 'task-uuid';

    it('should remove task and call unregisterTasks', async () => {
      const task = { id: taskId };
      mockManager.findOne.mockResolvedValue(task);
      mockManager.remove.mockResolvedValue(undefined);

      await service.remove(taskId, 'project-uuid');

      expect(mockManager.remove).toHaveBeenCalledWith(task);
      expect(mockSchedulerService.unregisterTasks).toHaveBeenCalledWith(taskId);
    });

    it('should throw NotFoundException when task not found', async () => {
      mockManager.findOne.mockResolvedValue(null);

      await expect(service.remove('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should propagate error from unregisterTasks (unlike update, remove does not swallow scheduler errors)', async () => {
      mockManager.findOne.mockResolvedValue({ id: taskId });
      mockManager.remove.mockResolvedValue(undefined);
      mockSchedulerService.unregisterTasks.mockImplementation(() => {
        throw new Error('scheduler error');
      });

      await expect(service.remove(taskId)).rejects.toThrow('scheduler error');
    });
  });

  describe('findExecutions', () => {
    const taskId = 'task-uuid';
    const projectId = 'project-uuid';

    it('should return paginated executions', async () => {
      const execs = [{ id: 'exec-1' }, { id: 'exec-2' }];
      mockRepository.findOne.mockResolvedValue({ id: taskId });
      mockExecRepository.findAndCount.mockResolvedValue([execs, 2]);

      const result = await service.findExecutions(taskId, projectId, 1, 10);

      expect(result.data).toEqual(execs);
      expect(result.total).toEqual(2);
      expect(mockExecRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 10 }),
      );
    });

    it('should apply correct skip offset for page 2', async () => {
      mockRepository.findOne.mockResolvedValue({ id: taskId });
      mockExecRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findExecutions(taskId, projectId, 2, 5);

      expect(mockExecRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 }),
      );
    });

    it('should use default page and limit when not provided', async () => {
      mockRepository.findOne.mockResolvedValue({ id: taskId });
      mockExecRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findExecutions(taskId, projectId);

      expect(mockExecRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 10 }),
      );
    });

    it('should throw NotFoundException when task not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findExecutions('missing-id', projectId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
