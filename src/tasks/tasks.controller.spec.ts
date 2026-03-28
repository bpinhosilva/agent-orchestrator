import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TaskStatus } from './entities/task.entity';

describe('TasksController', () => {
  let controller: TasksController;

  const mockTasksService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a task', async () => {
      const createDto = {
        title: 'Test',
        description: 'desc',
        projectId: 'uuid-123',
      };
      mockTasksService.create.mockResolvedValue({
        id: '1',
        ...createDto,
        status: TaskStatus.BACKLOG,
      });

      const result = await controller.create('uuid-123', createDto);
      expect(result.id).toEqual('1');
      expect(mockTasksService.create).toHaveBeenCalledWith({
        ...createDto,
        projectId: 'uuid-123',
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of tasks', async () => {
      mockTasksService.findAll.mockResolvedValue([
        { id: '1', title: 'Task 1' },
      ]);
      const result = await controller.findAll('uuid-123');
      expect(result).toHaveLength(1);
      expect(mockTasksService.findAll).toHaveBeenCalledWith('uuid-123', {
        status: undefined,
        page: 1,
        limit: 50,
      });
    });
  });

  describe('findOne', () => {
    it('should return a single task', async () => {
      mockTasksService.findOne.mockResolvedValue({ id: '1', title: 'Task 1' });
      const result = await controller.findOne('uuid-123', '1');
      expect(result.id).toEqual('1');
      expect(mockTasksService.findOne).toHaveBeenCalledWith('1', 'uuid-123');
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const updateDto = { title: 'New Title' };
      mockTasksService.update.mockResolvedValue({
        id: '1',
        title: 'New Title',
      });
      const result = await controller.update('uuid-123', '1', updateDto);
      expect(result.title).toEqual('New Title');
      expect(mockTasksService.update).toHaveBeenCalledWith(
        '1',
        updateDto,
        'uuid-123',
      );
    });
  });

  describe('remove', () => {
    it('should remove a task', async () => {
      mockTasksService.remove.mockResolvedValue(undefined);
      await controller.remove('uuid-123', '1');
      expect(mockTasksService.remove).toHaveBeenCalledWith('1', 'uuid-123');
    });
  });
});
