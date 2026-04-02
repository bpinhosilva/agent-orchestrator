import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Project, ProjectStatus } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { User, UserRole } from '../users/entities/user.entity';

describe('ProjectsService', () => {
  let service: ProjectsService;

  const mockProjectRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
    manager: {
      transaction: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    },
  };

  const mockMemberRepository = {
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockUser = { id: 'user-1', role: UserRole.USER } as User;
  const mockAdmin = { id: 'admin-1', role: UserRole.ADMIN } as User;

  mockProjectRepository.manager.transaction.mockImplementation(
    (cb: (manager: typeof mockProjectRepository.manager) => unknown) =>
      cb(mockProjectRepository.manager),
  );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: getRepositoryToken(Project),
          useValue: mockProjectRepository,
        },
        {
          provide: getRepositoryToken(ProjectMember),
          useValue: mockMemberRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
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
        ownerAgentId: 'uuid-123',
      };
      const projectObj = {
        title: 'T',
        description: 'D',
        status: ProjectStatus.PLANNING,
      };
      const savedProject = { id: '1', ...projectObj };
      const membershipObj = {
        project: savedProject,
        user: { id: mockUser.id },
        role: 'owner',
      };

      mockProjectRepository.manager.create
        .mockReturnValueOnce(projectObj)
        .mockReturnValueOnce(membershipObj);
      mockProjectRepository.manager.save
        .mockResolvedValueOnce(savedProject)
        .mockResolvedValueOnce({ id: 'pm-1', ...membershipObj });

      const result = await service.create(createDto, mockUser);
      expect(result.id).toEqual('1');
      expect(mockProjectRepository.manager.create).toHaveBeenCalledTimes(2);
      expect(mockProjectRepository.manager.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('findAll', () => {
    it('should return all projects for admin user', async () => {
      mockProjectRepository.find.mockResolvedValue([{ id: '1' }]);
      const result = await service.findAll(mockAdmin);
      expect(result).toHaveLength(1);
      expect(mockProjectRepository.find).toHaveBeenCalled();
    });

    it('should return only member projects for regular user', async () => {
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: '1' }]),
      };
      mockProjectRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.findAll(mockUser);
      expect(result).toHaveLength(1);
      expect(mockProjectRepository.createQueryBuilder).toHaveBeenCalledWith(
        'project',
      );
      expect(mockQueryBuilder.innerJoin).toHaveBeenCalled();
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should get a single project', async () => {
      const project = {
        id: '1',
        members: [{ user: { id: 'user-1' }, role: 'owner' }],
      };
      mockProjectRepository.findOne.mockResolvedValue(project);
      const result = await service.findOne('1', mockUser);
      expect(result.id).toEqual('1');
    });

    it('should throw NotFoundException if project not found', async () => {
      mockProjectRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne('1', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      const project = {
        id: '1',
        members: [{ user: { id: 'other-user' }, role: 'owner' }],
      };
      mockProjectRepository.findOne.mockResolvedValue(project);
      await expect(service.findOne('1', mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    it('should update a project', async () => {
      const project = {
        id: '1',
        title: 'Old',
        members: [{ user: { id: 'user-1' }, role: 'owner' }],
      };
      mockProjectRepository.manager.findOne.mockResolvedValue(project);
      mockProjectRepository.manager.save.mockResolvedValue({
        ...project,
        title: 'New',
      });

      const result = await service.update('1', { title: 'New' }, mockUser);
      expect(result.title).toEqual('New');
      expect(mockProjectRepository.manager.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if project not found', async () => {
      mockProjectRepository.manager.findOne.mockResolvedValue(null);
      await expect(
        service.update('1', { title: 'New' }, mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      const project = {
        id: '1',
        title: 'Old',
        members: [{ user: { id: 'other-user' }, role: 'owner' }],
      };
      mockProjectRepository.manager.findOne.mockResolvedValue(project);
      await expect(
        service.update('1', { title: 'New' }, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should remove a project', async () => {
      const project = {
        id: '1',
        members: [{ user: { id: 'user-1' }, role: 'owner' }],
      };
      mockProjectRepository.findOne.mockResolvedValue(project);
      mockProjectRepository.remove.mockResolvedValue(project);

      await service.remove('1', mockUser);
      expect(mockProjectRepository.remove).toHaveBeenCalledWith(project);
    });

    it('should throw NotFoundException if project not found', async () => {
      mockProjectRepository.findOne.mockResolvedValue(null);
      await expect(service.remove('1', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      const project = {
        id: '1',
        members: [{ user: { id: 'user-1' }, role: 'member' }],
      };
      mockProjectRepository.findOne.mockResolvedValue(project);
      await expect(service.remove('1', mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
