import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task, TaskStatus } from './entities/task.entity';
import { AgentEntity } from '../agents/entities/agent.entity';

describe('TasksService', () => {
  let service: TasksService;

  const mockTaskRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
        },
        {
          provide: getRepositoryToken(AgentEntity),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully insert a task', async () => {
      const createDto = {
        title: 'T',
        description: 'D',
        projectId: 'uuid-123',
      };
      const taskObj = {
        title: 'T',
        description: 'D',
        status: TaskStatus.BACKLOG,
      };
      mockTaskRepository.create.mockReturnValue(taskObj);
      mockTaskRepository.save.mockResolvedValue({ id: '1', ...taskObj });

      const result = await service.create(createDto);
      expect(result.id).toEqual('1');
      expect(mockTaskRepository.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return a paginated object of tasks', async () => {
      mockTaskRepository.findAndCount.mockResolvedValue([[{ id: '1' }], 1]);
      const result = await service.findAll('uuid-123', {
        status: TaskStatus.BACKLOG,
        page: 1,
        limit: 10,
      });

      expect(result.items).toHaveLength(1);
      expect(result.total).toEqual(1);
      expect(result.page).toEqual(1);
      expect(result.limit).toEqual(10);
      expect(mockTaskRepository.findAndCount).toHaveBeenCalledWith({
        where: { project: { id: 'uuid-123' }, status: TaskStatus.BACKLOG },
        skip: 0,
        take: 10,
        order: { updatedAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should get a single task', async () => {
      mockTaskRepository.findOne.mockResolvedValue({ id: '1' });
      const result = await service.findOne('1', 'uuid-123');
      expect(result.id).toEqual('1');
      expect(mockTaskRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1', project: { id: 'uuid-123' } },
      });
    });

    it('should throw NotFoundException if task not found', async () => {
      mockTaskRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne('1', 'uuid-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const task = { id: '1', title: 'Old' };
      mockTaskRepository.findOne.mockResolvedValue(task);
      mockTaskRepository.save.mockResolvedValue({ ...task, title: 'New' });

      const result = await service.update('1', { title: 'New' }, 'uuid-123');
      expect(result.title).toEqual('New');
      expect(mockTaskRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a task', async () => {
      const task = { id: '1' };
      mockTaskRepository.findOne.mockResolvedValue(task);
      mockTaskRepository.remove.mockResolvedValue(task);

      await service.remove('1', 'uuid-123');
      expect(mockTaskRepository.remove).toHaveBeenCalledWith(task);
    });
  });
});
