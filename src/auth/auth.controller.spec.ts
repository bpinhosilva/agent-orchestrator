import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import type { Response, Request } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  const registerMock = jest.fn();
  const loginMock = jest.fn();
  const refreshMock = jest.fn();
  const revokeRefreshTokenMock = jest.fn();

  const mockAuthService = {
    register: registerMock,
    login: loginMock,
    refresh: refreshMock,
    revokeRefreshToken: revokeRefreshTokenMock,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('test') },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a user', async () => {
      const dto = {
        name: 'Test',
        email: 'test@test.com',
        password: 'password',
      };
      registerMock.mockResolvedValue({
        id: '1',
        name: 'Test',
        email: 'test@test.com',
      });

      const result = await controller.register(dto);
      expect(result.id).toEqual('1');
      expect(registerMock).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('should login a user and set auth tokens', async () => {
      const dto = { email: 'test@test.com', password: 'password' };
      loginMock.mockResolvedValue({
        access_token: 'access_token',
        refresh_token: 'refresh_token',
        expires_in: 3600,
        refresh_expires_in: 86400,
        token_type: 'Bearer',
      });
      const cookie = jest.fn().mockReturnThis();
      const json = jest.fn().mockReturnThis();

      const mockResponse = {
        cookie,
        json,
      } as unknown as Response;

      await controller.login(dto, mockResponse);

      expect(cookie).toHaveBeenCalledWith(
        'auth_token',
        'access_token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          path: '/',
        }),
      );
      expect(cookie).toHaveBeenCalledWith(
        'refresh_token',
        'refresh_token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          path: '/',
        }),
      );
      expect(json).toHaveBeenCalledWith({
        message: 'Logged in successfully',
      });
      expect(loginMock).toHaveBeenCalledWith(dto);
    });
  });

  describe('refresh', () => {
    it('should refresh tokens and return new access token', async () => {
      refreshMock.mockResolvedValue({
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
        expires_in: 3600,
        refresh_expires_in: 86400,
        token_type: 'Bearer',
      });

      const mockRequest = {
        cookies: { refresh_token: 'old_refresh_token' },
      } as unknown as Request;
      const status = jest.fn().mockReturnThis();
      const json = jest.fn().mockReturnThis();
      const cookie = jest.fn().mockReturnThis();

      const mockResponse = {
        status,
        json,
        cookie,
      } as unknown as Response;

      await controller.refresh(mockRequest, mockResponse);

      expect(refreshMock).toHaveBeenCalledWith('old_refresh_token');
      expect(cookie).toHaveBeenCalledWith(
        'auth_token',
        'new_access_token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          path: '/',
        }),
      );
      expect(cookie).toHaveBeenCalledWith(
        'refresh_token',
        'new_refresh_token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          path: '/',
        }),
      );
      expect(json).toHaveBeenCalledWith({
        message: 'Token refreshed successfully',
        expires_in: 3600,
        token_type: 'Bearer',
      });
    });

    it('should return 401 if refresh token missing', async () => {
      const mockRequest = {
        cookies: {},
      } as unknown as Request;
      const status = jest.fn().mockReturnThis();
      const json = jest.fn().mockReturnThis();

      const mockResponse = {
        status,
        json,
      } as unknown as Response;

      await controller.refresh(mockRequest, mockResponse);

      expect(status).toHaveBeenCalledWith(401);
      expect(json).toHaveBeenCalledWith({
        message: 'Refresh token not found',
      });
    });
  });

  describe('logout', () => {
    it('should logout a user and clear cookies', async () => {
      revokeRefreshTokenMock.mockResolvedValue(undefined);

      const mockRequest = {
        cookies: { refresh_token: 'refresh_token' },
      } as unknown as Request;
      const clearCookie = jest.fn().mockReturnThis();
      const json = jest.fn().mockReturnThis();

      const mockResponse = {
        clearCookie,
        json,
      } as unknown as Response;

      await controller.logout(mockRequest, mockResponse);

      expect(revokeRefreshTokenMock).toHaveBeenCalledWith('refresh_token');
      expect(clearCookie).toHaveBeenCalledWith('auth_token', {
        path: '/',
      });
      expect(clearCookie).toHaveBeenCalledWith('refresh_token', {
        path: '/',
      });
      expect(json).toHaveBeenCalledWith({
        message: 'Logged out successfully',
      });
    });
  });
});
