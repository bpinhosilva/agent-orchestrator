import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import type { User } from './entities/user.entity';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    serializeUser: jest.fn((user: Partial<User>) => ({
      ...user,
      avatarUrl: `/avatar-presets/${user.avatar ?? 'avatar-01'}.svg`,
    })),
    serializeUsers: jest.fn((users: Array<Partial<User>>) =>
      users.map((user: { avatar?: string }) => ({
        ...user,
        avatarUrl: `/avatar-presets/${user.avatar ?? 'avatar-01'}.svg`,
      })),
    ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return a paginated user response', async () => {
      mockUsersService.findAll.mockResolvedValue({
        items: [{ id: '1', avatar: 'avatar-01' }],
        total: 1,
        page: 1,
        limit: 15,
      });

      const result = await controller.findAll({
        page: 1,
        limit: 15,
        search: 'test',
      });

      expect(result).toEqual({
        items: [
          {
            id: '1',
            avatar: 'avatar-01',
            avatarUrl: '/avatar-presets/avatar-01.svg',
          },
        ],
        total: 1,
        page: 1,
        limit: 15,
      });
      expect(mockUsersService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 15,
        search: 'test',
      });
      expect(mockUsersService.serializeUsers).toHaveBeenCalledWith([
        { id: '1', avatar: 'avatar-01' },
      ]);
    });
  });

  describe('findOne', () => {
    it('should find a single user', async () => {
      mockUsersService.findOne.mockResolvedValue({
        id: '1',
        avatar: 'avatar-01',
      });
      const result = await controller.findOne('1');
      expect(result.id).toEqual('1');
      expect(mockUsersService.findOne).toHaveBeenCalledWith('1');
      expect(mockUsersService.serializeUser).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const dto = { name: 'New' };
      mockUsersService.update.mockResolvedValue({
        id: '1',
        avatar: 'avatar-01',
        ...dto,
      });
      const result = await controller.update('1', dto);
      expect(result.name).toEqual('New');
      expect(mockUsersService.update).toHaveBeenCalledWith('1', dto);
      expect(mockUsersService.serializeUser).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      mockUsersService.remove.mockResolvedValue(undefined);
      await controller.remove('1');
      expect(mockUsersService.remove).toHaveBeenCalledWith('1');
    });
  });
});
