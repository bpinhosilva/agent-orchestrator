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
        output: 'O',
        projectId: 'uuid-123',
      };
      const taskObj = {
        title: 'T',
        description: 'D',
        output: 'O',
        status: TaskStatus.BACKLOG,
      };
      mockTaskRepository.create.mockReturnValue(taskObj);
      mockTaskRepository.save.mockResolvedValue({ id: '1', ...taskObj });

      const result = await service.create(createDto);
      expect(result.id).toEqual('1');
      expect(result.output).toEqual('O');
      expect(mockTaskRepository.create).toHaveBeenCalled();
      expect(mockTaskRepository.save).toHaveBeenCalledWith(taskObj);
    });
  });

  describe('findAll', () => {
    it('should return an array of tasks', async () => {
      mockTaskRepository.find.mockResolvedValue([{ id: '1' }]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should get a single task', async () => {
      mockTaskRepository.findOne.mockResolvedValue({ id: '1' });
      const result = await service.findOne('1');
      expect(result.id).toEqual('1');
    });

    it('should throw NotFoundException if task not found', async () => {
      mockTaskRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const task = { id: '1', title: 'Old' };
      mockTaskRepository.findOne.mockResolvedValue(task);
      mockTaskRepository.save.mockResolvedValue({ ...task, title: 'New' });

      const result = await service.update('1', { title: 'New' });
      expect(result.title).toEqual('New');
      expect(mockTaskRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a task', async () => {
      const task = { id: '1' };
      mockTaskRepository.findOne.mockResolvedValue(task);
      mockTaskRepository.remove.mockResolvedValue(task);

      await service.remove('1');
      expect(mockTaskRepository.remove).toHaveBeenCalledWith(task);
    });
  });
});
