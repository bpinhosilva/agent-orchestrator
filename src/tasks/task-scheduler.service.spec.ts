import { Test, TestingModule } from '@nestjs/testing';
import { TaskSchedulerService } from './task-scheduler.service';
import { AgentsService } from '../agents/agents.service';
import { Project, ProjectStatus } from '../projects/entities/project.entity';
import { Task, TaskStatus, TaskPriority } from './entities/task.entity';
import { AgentEntity } from '../agents/entities/agent.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TaskComment } from './entities/comment.entity';
import { StorageService } from '../common/storage.service';
import {
  StoragePathHelper,
  StorageObjectPath,
} from '../common/storage-path.helper';
import { TasksService } from './tasks.service';
import { ConfigService } from '@nestjs/config';
import { SystemSettingsService } from '../system-settings/system-settings.service';

describe('TaskSchedulerService', () => {
  let service: TaskSchedulerService;

  const mockProjectRepository = {
    find: jest.fn(),
    save: jest.fn(),
  };

  const mockTaskRepository = {
    find: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    manager: {
      transaction: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    },
  };

  mockTaskRepository.manager.transaction.mockImplementation(
    (cb: (manager: typeof mockTaskRepository.manager) => unknown) =>
      cb(mockTaskRepository.manager),
  );

  const mockAgentsService = {
    findAll: jest.fn(),
    processRequest: jest.fn(),
    probe: jest.fn(),
  };

  const mockCommentRepository = {
    create: jest.fn().mockReturnValue({}),
    save: jest.fn(),
  };

  const mockStorageService = {
    saveBase64: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
  };

  const mockObjectPath: StorageObjectPath = {
    id: 'test-uuid',
    originalName: 'generated-image.png',
    mimeType: 'image/png',
    filePath: '2024/01/15/tasks/task-id/test-uuid.png',
  };

  const mockStoragePathHelper = {
    generate: jest.fn().mockReturnValue(mockObjectPath),
  };

  const mockSystemSettingsService = {
    getSettings: jest.fn().mockResolvedValue({
      data: {
        taskScheduler: {
          pollIntervalInMs: 20000,
          maxTaskPerExecution: 5,
        },
      },
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskSchedulerService,
        {
          provide: getRepositoryToken(Project),
          useValue: mockProjectRepository,
        },
        { provide: getRepositoryToken(Task), useValue: mockTaskRepository },
        {
          provide: getRepositoryToken(TaskComment),
          useValue: mockCommentRepository,
        },
        { provide: AgentsService, useValue: mockAgentsService },
        { provide: StorageService, useValue: mockStorageService },
        { provide: StoragePathHelper, useValue: mockStoragePathHelper },
        { provide: TasksService, useValue: { emitTaskEvent: jest.fn() } },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(true) },
        },
        {
          provide: SystemSettingsService,
          useValue: mockSystemSettingsService,
        },
      ],
    }).compile();

    service = module.get<TaskSchedulerService>(TaskSchedulerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleTaskScheduling', () => {
    it('should assign a task and then perform it in the next iteration', async () => {
      const ownerAgent = { id: 'agent-1', name: 'Owner' } as AgentEntity;
      const activeProject = {
        id: 'project-1',
        title: 'P1',
        status: ProjectStatus.ACTIVE,
        ownerAgent,
      } as Project;
      const taskNoAssignee = {
        id: 'task-1',
        title: 'T1',
        status: TaskStatus.BACKLOG,
        priority: TaskPriority.HIGH,
        project: activeProject,
        assignee: null,
      } as Task;
      const taskWithAssignee = {
        ...taskNoAssignee,
        assignee: { id: 'agent-2', name: 'Assignee' },
      } as Task;

      mockProjectRepository.find.mockResolvedValue([activeProject]);

      mockTaskRepository.find
        .mockResolvedValueOnce([taskNoAssignee]) // Iteration 1: Needs assignment
        .mockResolvedValueOnce([taskWithAssignee]) // Iteration 2: Needs performance
        .mockResolvedValueOnce([]); // Iteration 3: Done

      // Mock manager for assignment and performance
      mockTaskRepository.manager.findOne
        .mockResolvedValueOnce(taskNoAssignee) // assignTask: findOne
        .mockResolvedValueOnce(taskWithAssignee) // performTask: in-progress findOne
        .mockResolvedValueOnce(taskWithAssignee); // performTask: final update findOne

      mockTaskRepository.manager.save.mockImplementation((t: unknown) => t);

      mockTaskRepository.manager.create.mockImplementation(
        (_entity: unknown, data: unknown) => data,
      );

      mockAgentsService.findAll.mockResolvedValue([
        ownerAgent,
        taskWithAssignee.assignee,
      ]);
      mockAgentsService.processRequest.mockResolvedValue({
        content: JSON.stringify({ agentId: 'agent-2' }),
      });
      mockAgentsService.probe.mockResolvedValue({ content: 'Result' });

      await service.handleTaskScheduling();

      // 1. Project should be checked
      expect(mockProjectRepository.find).toHaveBeenCalled();

      // 2. Task assignment should be requested from ownerAgent
      expect(mockAgentsService.processRequest).toHaveBeenCalled();

      // 3. Task performance should be requested from assignee
      expect(mockAgentsService.probe).toHaveBeenCalledWith(
        'agent-2',
        expect.any(String),
      );

      // 4. Task status should be updated to REVIEW (via save)
      expect(mockTaskRepository.manager.save).toHaveBeenCalled();

      // 5. Comment should be saved via manager
      expect(mockTaskRepository.manager.create).toHaveBeenCalled();
    });

    it('should correctly extract agentId from a conversational LLM response', async () => {
      const ownerAgent = { id: 'agent-1', name: 'Owner' } as AgentEntity;
      const activeProject = {
        id: 'project-1',
        title: 'P1',
        status: ProjectStatus.ACTIVE,
        ownerAgent,
      } as Project;
      const task = {
        id: 'task-1',
        title: 'T1',
        status: TaskStatus.BACKLOG,
        priority: TaskPriority.HIGH,
        project: activeProject,
        assignee: null,
      } as Task;

      const conversationalResponse = `
I need to assign this task.
The Creative Designer is the best fit.
\`\`\`json
{"agentId": "agent-2"}
\`\`\`
I hope this helps!
      `;

      mockProjectRepository.find.mockResolvedValue([activeProject]);
      mockTaskRepository.find
        .mockResolvedValueOnce([task])
        .mockResolvedValueOnce([]);

      mockTaskRepository.manager.findOne.mockResolvedValue(task);
      mockTaskRepository.manager.save.mockImplementation((t: unknown) => t);

      mockAgentsService.findAll.mockResolvedValue([
        ownerAgent,
        { id: 'agent-2', name: 'Creative Designer' } as AgentEntity,
      ]);
      mockAgentsService.processRequest.mockResolvedValue({
        content: conversationalResponse,
      });

      await service.handleTaskScheduling();

      // Verify that the task was assigned to agent-2 despite the conversational text
      expect(task.assignee?.id).toBe('agent-2');
    });
  });
});
