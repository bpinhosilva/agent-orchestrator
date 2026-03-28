import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
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
      mockAuthService.register.mockResolvedValue({
        id: '1',
        name: 'Test',
        email: 'test@test.com',
      });

      const result = await controller.register(dto);
      expect(result.id).toEqual('1');
      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('should login a user', async () => {
      const dto = { email: 'test@test.com', password: 'password' };
      mockAuthService.login.mockResolvedValue({ access_token: 'token' });

      const result = await controller.login(dto);
      expect(result.access_token).toEqual('token');
      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
    });
  });
});
