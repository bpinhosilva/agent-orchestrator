import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password', async () => {
      mockUsersService.findOne.mockResolvedValue({ id: '1', password: 'hash' });
      const result = await service.validateUser('1');
      expect(result).toEqual({ id: '1' });
    });

    it('should return null if user not found', async () => {
      mockUsersService.findOne.mockRejectedValue(new Error('Not found'));
      const result = await service.validateUser('1');
      expect(result).toBeNull();
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockUsersService.create.mockResolvedValue({
        id: '1',
        password: 'hashedPassword',
        email: 'test@test.com',
      });

      const result = await service.register({
        name: 'Test',
        email: 'test@test.com',
        password: 'password',
      });
      expect(result).toEqual({ id: '1', email: 'test@test.com' });
      expect(mockUsersService.create).toHaveBeenCalledWith({
        name: 'Test',
        email: 'test@test.com',
        password: 'hashedPassword',
      });
    });

    it('should throw ConflictException if email exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ id: '1' });
      await expect(
        service.register({
          name: 'Test',
          email: 'test@test.com',
          password: 'password',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login user and return token', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        password: 'hashedPassword',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('token');

      const result = await service.login({
        email: 'test@test.com',
        password: 'password',
      });
      expect(result).toEqual({ access_token: 'token' });
    });

    it('should throw UnauthorizedException if bad password', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        password: 'hashedPassword',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
