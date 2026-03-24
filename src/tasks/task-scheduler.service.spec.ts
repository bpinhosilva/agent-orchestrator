import { Test, TestingModule } from '@nestjs/testing';
import { TaskSchedulerService } from './task-scheduler.service';
import { AgentsService } from '../agents/agents.service';
import { Project, ProjectStatus } from '../projects/entities/project.entity';
import { Task, TaskStatus, TaskPriority } from './entities/task.entity';
import { AgentEntity } from '../agents/entities/agent.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TaskComment } from './entities/comment.entity';

describe('TaskSchedulerService', () => {
  let service: TaskSchedulerService;

  const mockProjectRepository = {
    find: jest.fn(),
    save: jest.fn(),
  };

  const mockTaskRepository = {
    find: jest.fn(),
    save: jest.fn(),
  };

  const mockAgentsService = {
    findAll: jest.fn(),
    processRequest: jest.fn(),
    probe: jest.fn(),
  };

  const mockCommentRepository = {
    create: jest.fn().mockReturnValue({}),
    save: jest.fn(),
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

      // Mock sequences
      mockTaskRepository.find
        .mockResolvedValueOnce([taskNoAssignee]) // Iteration 1: Needs assignment
        .mockResolvedValueOnce([taskWithAssignee]) // Iteration 2: Needs performance
        .mockResolvedValueOnce([]); // Iteration 3: Done

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
      expect(mockTaskRepository.save).toHaveBeenCalledTimes(2); // One for assignment, one for completion

      // 5. Comment should be saved
      expect(mockCommentRepository.save).toHaveBeenCalled();
    });
  });
});
