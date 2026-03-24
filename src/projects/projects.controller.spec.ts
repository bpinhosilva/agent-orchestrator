import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectStatus } from './entities/project.entity';

describe('ProjectsController', () => {
  let controller: ProjectsController;

  const mockProjectsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: mockProjectsService,
        },
      ],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a project', async () => {
      const createDto = {
        title: 'Test Project',
        description: 'Desc',
        ownerAgentId: 'uuid-123',
      };
      mockProjectsService.create.mockResolvedValue({
        id: '1',
        ...createDto,
        status: ProjectStatus.PLANNING,
      });

      const result = await controller.create(createDto);
      expect(result.id).toEqual('1');
      expect(mockProjectsService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of projects', async () => {
      mockProjectsService.findAll.mockResolvedValue([
        { id: '1', title: 'Task 1' },
      ]);
      const result = await controller.findAll();
      expect(result).toHaveLength(1);
      expect(mockProjectsService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single project', async () => {
      mockProjectsService.findOne.mockResolvedValue({
        id: '1',
        title: 'Task 1',
      });
      const result = await controller.findOne('1');
      expect(result.id).toEqual('1');
      expect(mockProjectsService.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('update', () => {
    it('should update a project', async () => {
      const updateDto = { title: 'New Title' };
      mockProjectsService.update.mockResolvedValue({
        id: '1',
        title: 'New Title',
      });
      const result = await controller.update('1', updateDto);
      expect(result.title).toEqual('New Title');
      expect(mockProjectsService.update).toHaveBeenCalledWith('1', updateDto);
    });
  });

  describe('remove', () => {
    it('should remove a project', async () => {
      mockProjectsService.remove.mockResolvedValue(undefined);
      await controller.remove('1');
      expect(mockProjectsService.remove).toHaveBeenCalledWith('1');
    });
  });
});
