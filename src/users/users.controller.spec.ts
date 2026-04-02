import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
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
    it('should find all users', async () => {
      mockUsersService.findAll.mockResolvedValue([{ id: '1' }]);
      const result = await controller.findAll();
      expect(result).toHaveLength(1);
      expect(mockUsersService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should find a single user', async () => {
      mockUsersService.findOne.mockResolvedValue({ id: '1' });
      const result = await controller.findOne('1');
      expect(result.id).toEqual('1');
      expect(mockUsersService.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const dto = { name: 'New' };
      mockUsersService.update.mockResolvedValue({ id: '1', ...dto });
      const result = await controller.update('1', dto);
      expect(result.name).toEqual('New');
      expect(mockUsersService.update).toHaveBeenCalledWith('1', dto);
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
