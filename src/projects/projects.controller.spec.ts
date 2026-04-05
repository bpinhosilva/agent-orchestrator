import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectStatus } from './entities/project.entity';
import { User, UserRole } from '../users/entities/user.entity';

describe('ProjectsController', () => {
  let controller: ProjectsController;

  const mockUser = { id: 'user-1', role: UserRole.USER } as User;

  const mockProjectsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    addMember: jest.fn(),
    getMembers: jest.fn(),
    removeMember: jest.fn(),
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

      const result = await controller.create(createDto, mockUser);
      expect(result.id).toEqual('1');
      expect(mockProjectsService.create).toHaveBeenCalledWith(
        createDto,
        mockUser,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of projects', async () => {
      mockProjectsService.findAll.mockResolvedValue([
        { id: '1', title: 'Task 1' },
      ]);
      const result = await controller.findAll(mockUser);
      expect(result).toHaveLength(1);
      expect(mockProjectsService.findAll).toHaveBeenCalledWith(
        mockUser,
        undefined,
        false,
      );
    });

    it('should pass userId and all=true to service', async () => {
      mockProjectsService.findAll.mockResolvedValue([]);
      await controller.findAll(mockUser, 'test-user', 'true');
      expect(mockProjectsService.findAll).toHaveBeenCalledWith(
        mockUser,
        'test-user',
        true,
      );
    });

    it('should pass all=false when query is not "true"', async () => {
      mockProjectsService.findAll.mockResolvedValue([]);
      await controller.findAll(mockUser, undefined, 'false');
      expect(mockProjectsService.findAll).toHaveBeenCalledWith(
        mockUser,
        undefined,
        false,
      );
    });
  });

  describe('findOne', () => {
    it('should return a single project', async () => {
      mockProjectsService.findOne.mockResolvedValue({
        id: '1',
        title: 'Task 1',
      });
      const result = await controller.findOne('1', mockUser);
      expect(result.id).toEqual('1');
      expect(mockProjectsService.findOne).toHaveBeenCalledWith('1', mockUser);
    });
  });

  describe('update', () => {
    it('should update a project', async () => {
      const updateDto = { title: 'New Title' };
      mockProjectsService.update.mockResolvedValue({
        id: '1',
        title: 'New Title',
      });
      const result = await controller.update('1', updateDto, mockUser);
      expect(result.title).toEqual('New Title');
      expect(mockProjectsService.update).toHaveBeenCalledWith(
        '1',
        updateDto,
        mockUser,
      );
    });
  });

  describe('remove', () => {
    it('should remove a project', async () => {
      mockProjectsService.remove.mockResolvedValue(undefined);
      await controller.remove('1', mockUser);
      expect(mockProjectsService.remove).toHaveBeenCalledWith('1', mockUser);
    });
  });

  describe('addMember', () => {
    it('should add a member to a project', async () => {
      const addMemberDto = { userId: 'user-2' };
      mockProjectsService.addMember.mockResolvedValue(undefined);
      await controller.addMember('1', addMemberDto, mockUser);
      expect(mockProjectsService.addMember).toHaveBeenCalledWith(
        '1',
        addMemberDto,
        mockUser,
      );
    });
  });

  describe('getMembers', () => {
    it('should return members of a project', async () => {
      mockProjectsService.getMembers.mockResolvedValue([]);
      const result = await controller.getMembers('1', mockUser);
      expect(result).toEqual([]);
      expect(mockProjectsService.getMembers).toHaveBeenCalledWith(
        '1',
        mockUser,
      );
    });
  });

  describe('removeMember', () => {
    it('should remove a member from a project', async () => {
      mockProjectsService.removeMember.mockResolvedValue(undefined);
      await controller.removeMember('1', 'user-2', mockUser);
      expect(mockProjectsService.removeMember).toHaveBeenCalledWith(
        '1',
        'user-2',
        mockUser,
      );
    });
  });
});
