import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;

  const mockUserRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should insert a new user', async () => {
      const dto = { name: 'Test', email: 'test@test.com' };
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(dto);
      mockUserRepository.save.mockResolvedValue({ id: '1', ...dto });

      const result = await service.create(dto);
      expect(result.id).toEqual('1');
      expect(mockUserRepository.save).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      mockUserRepository.find.mockResolvedValue([{ id: '1' }]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should find user by id', async () => {
      mockUserRepository.findOne.mockResolvedValue({ id: '1' });
      const result = await service.findOne('1');
      expect(result.id).toEqual('1');
    });

    it('should throw NotFoundException if user not found by id', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const user = { id: '1', name: 'Old' };
      const dto = { name: 'New' };
      mockUserRepository.findOne.mockResolvedValueOnce(user); // for findOne inside update
      mockUserRepository.save.mockResolvedValue({ ...user, ...dto });

      const result = await service.update('1', dto);
      expect(result.name).toEqual('New');
      expect(mockUserRepository.save).toHaveBeenCalledWith({ ...user, ...dto });
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      const user = { id: '1' };
      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.remove.mockResolvedValue(user);

      await service.remove('1');
      expect(mockUserRepository.remove).toHaveBeenCalledWith(user);
    });
  });
});
