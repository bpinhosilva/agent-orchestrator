import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

const testHome = path.join(
  os.tmpdir(),
  `agent-orchestrator-test-${Date.now()}`,
);

if (!fs.existsSync(testHome)) {
  fs.mkdirSync(testHome, { recursive: true });
}

process.env.GEMINI_API_KEY = 'test_key';
process.env.JWT_SECRET = 'test_secret_test_secret_test_secret_12345';
process.env.JWT_REFRESH_SECRET =
  'test_refresh_secret_test_refresh_secret_12345';
process.env.AGENT_ORCHESTRATOR_HOME = testHome;

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { AgentsService } from '../src/agents/agents.service';
import { AuthService } from '../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { UserRole } from '../src/users/entities/user.entity';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  const originalEnv = process.env;

  beforeAll(() => {
    // Empty beforeAll as we did the setup at the top level
  });

  afterAll(() => {
    process.env = originalEnv;
    // Cleanup test directory
    if (fs.existsSync(testHome)) {
      fs.rmSync(testHome, { recursive: true, force: true });
    }
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    app.use(cookieParser());

    // Sync schema to ensure tables exist before module init hooks
    const dataSource = app.get(DataSource);
    await dataSource.synchronize(true);

    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/api/v1/agents/process (POST)', async () => {
    console.log('Inside test');
    const authService = app.get(AuthService);
    const jwtService = app.get(JwtService);
    const agentsService = app.get(AgentsService);

    // Mock validateUser to return a dummy user
    jest.spyOn(authService, 'validateUser').mockResolvedValue({
      id: 'test-user-id',
      email: 'test@test.com',
      name: 'Test User',
      last_name: 'Tester',
      role: UserRole.ADMIN,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Mock processRequest
    jest
      .spyOn(agentsService, 'processRequest')
      .mockResolvedValue({ content: 'mocked output from e2e' });

    // Generate a valid token
    const token = jwtService.sign({
      sub: 'test-user-id',
      email: 'test@test.com',
    });

    return request(app.getHttpServer())
      .post('/api/v1/agents/process')
      .set('Authorization', `Bearer ${token}`)
      .send({ agentId: 'test-agent-id', input: 'hello' })
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({ content: 'mocked output from e2e' });
      });
  });

  it('/api/v1/auth/me (GET) returns current user after cookie login', async () => {
    const authService = app.get(AuthService);

    await authService.register({
      name: 'Cookie User',
      last_name: 'Tester',
      email: 'cookie-user@example.com',
      password: 'password123',
    });

    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/v1/auth/login')
      .send({
        email: 'cookie-user@example.com',
        password: 'password123',
      })
      .expect(200);

    await agent
      .get('/api/v1/auth/me')
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          email: 'cookie-user@example.com',
          name: 'Cookie User',
          last_name: 'Tester',
          avatar: 'avatar-01',
          avatarUrl: '/avatar-presets/avatar-01.svg',
        });
        expect(res.body).not.toHaveProperty('password');
      });
  });
});
