import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Project, ProjectStatus } from './entities/project.entity';

describe('ProjectsService', () => {
  let service: ProjectsService;

  const mockProjectRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: getRepositoryToken(Project),
          useValue: mockProjectRepository,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully insert a project', async () => {
      const createDto = {
        title: 'T',
        description: 'D',
        defaultAgentId: 'uuid-123',
      };
      const projectObj = {
        title: 'T',
        description: 'D',
        status: ProjectStatus.PLANNING,
      };
      mockProjectRepository.create.mockReturnValue(projectObj);
      mockProjectRepository.save.mockResolvedValue({ id: '1', ...projectObj });

      const result = await service.create(createDto);
      expect(result.id).toEqual('1');
      expect(mockProjectRepository.create).toHaveBeenCalled();
      expect(mockProjectRepository.save).toHaveBeenCalledWith(projectObj);
    });
  });

  describe('findAll', () => {
    it('should return an array of projects', async () => {
      mockProjectRepository.find.mockResolvedValue([{ id: '1' }]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should get a single project', async () => {
      mockProjectRepository.findOne.mockResolvedValue({ id: '1' });
      const result = await service.findOne('1');
      expect(result.id).toEqual('1');
    });

    it('should throw NotFoundException if project not found', async () => {
      mockProjectRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a project', async () => {
      const project = { id: '1', title: 'Old' };
      mockProjectRepository.findOne.mockResolvedValue(project);
      mockProjectRepository.save.mockResolvedValue({
        ...project,
        title: 'New',
      });

      const result = await service.update('1', { title: 'New' });
      expect(result.title).toEqual('New');
      expect(mockProjectRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a project', async () => {
      const project = { id: '1' };
      mockProjectRepository.findOne.mockResolvedValue(project);
      mockProjectRepository.remove.mockResolvedValue(project);

      await service.remove('1');
      expect(mockProjectRepository.remove).toHaveBeenCalledWith(project);
    });
  });
});
