import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import * as bcrypt from 'bcrypt';
import type { User } from '../users/entities/user.entity';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    serializeUser: jest.fn((user: Partial<User>) => ({
      ...user,
      avatar: user.avatar ?? 'avatar-01',
      avatarUrl: `/avatar-presets/${user.avatar ?? 'avatar-01'}.svg`,
    })),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') {
        return 'test-secret-at-least-32-characters-long';
      }
      return null;
    }),
  };

  const mockRefreshTokenRepository = {
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
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
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: mockRefreshTokenRepository,
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
      mockUsersService.findOne.mockResolvedValue({
        id: '1',
        avatar: 'avatar-01',
      });
      const result = await service.validateUser('1');
      expect(result).toEqual({
        id: '1',
        avatar: 'avatar-01',
        avatarUrl: '/avatar-presets/avatar-01.svg',
      });
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
        name: 'Test',
        last_name: 'User',
        email: 'test@test.com',
        avatar: 'avatar-01',
      });

      const result = await service.register({
        name: 'Test',
        last_name: 'User',
        email: 'test@test.com',
        password: 'password',
      });
      expect(result).toEqual({
        id: '1',
        name: 'Test',
        last_name: 'User',
        email: 'test@test.com',
        avatar: 'avatar-01',
        avatarUrl: '/avatar-presets/avatar-01.svg',
      });
      expect(mockUsersService.create).toHaveBeenCalledWith({
        name: 'Test',
        last_name: 'User',
        email: 'test@test.com',
        password: 'hashedPassword',
      });
    });

    it('should throw ConflictException if email exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ id: '1' });
      await expect(
        service.register({
          name: 'Test',
          last_name: 'User',
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
      mockRefreshTokenRepository.save.mockResolvedValue({
        id: 'refresh-id',
        token: 'hashed-token',
      });

      const result = await service.login({
        email: 'test@test.com',
        password: 'password',
      });

      expect(result).toEqual({
        access_token: 'token',
        refresh_token: 'token',
        expires_in: 3600,
        refresh_expires_in: 86400,
        refresh_absolute_expires_in: 2592000,
        token_type: 'Bearer',
      });
      expect(mockJwtService.sign).toHaveBeenCalled();
      expect(mockRefreshTokenRepository.save).toHaveBeenCalled();
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
