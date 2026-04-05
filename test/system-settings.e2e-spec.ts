import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import * as bcrypt from 'bcrypt';

const testHome = path.join(
  os.tmpdir(),
  `agent-orchestrator-settings-test-${Date.now()}`,
);

if (!fs.existsSync(testHome)) {
  fs.mkdirSync(testHome, { recursive: true });
}

process.env.GEMINI_API_KEY = 'test_key';
process.env.JWT_SECRET = 'test_secret_test_secret_test_secret_12345';
process.env.AGENT_ORCHESTRATOR_HOME = testHome;
process.env.NODE_ENV = 'test';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { User, UserRole } from '../src/users/entities/user.entity';
import { SystemSettingsData } from '../src/system-settings/system-settings.service';

describe('SystemSettings (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  const originalEnv = process.env;

  afterAll(() => {
    process.env = originalEnv;
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

    dataSource = app.get(DataSource);
    await dataSource.synchronize(true);

    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  async function createAdminUser() {
    const userRepository = dataSource.getRepository(User);
    const admin = userRepository.create({
      name: 'Admin',
      last_name: 'User',
      email: 'admin@example.com',
      password: await bcrypt.hash('password123', 10),
      role: UserRole.ADMIN,
    });
    return userRepository.save(admin);
  }

  async function createRegularUser() {
    const userRepository = dataSource.getRepository(User);
    const user = userRepository.create({
      name: 'Regular',
      last_name: 'User',
      email: 'user@example.com',
      password: await bcrypt.hash('password123', 10),
      role: UserRole.USER,
    });
    return userRepository.save(user);
  }

  describe('GET /api/v1/system-settings', () => {
    it('should return 401 if not authenticated', () => {
      return request(app.getHttpServer())
        .get('/api/v1/system-settings')
        .expect(401);
    });

    it('should return 403 if not an admin', async () => {
      await createRegularUser();
      const agent = request.agent(app.getHttpServer());
      await agent
        .post('/api/v1/auth/login')
        .send({ email: 'user@example.com', password: 'password123' })
        .expect(200);

      return agent.get('/api/v1/system-settings').expect(403);
    });

    it('should return default settings if none exist (Admin)', async () => {
      await createAdminUser();
      const agent = request.agent(app.getHttpServer());
      await agent
        .post('/api/v1/auth/login')
        .send({ email: 'admin@example.com', password: 'password123' })
        .expect(200);

      const response = await agent.get('/api/v1/system-settings').expect(200);
      expect(response.body).toBeDefined();
      const body = response.body as { data: SystemSettingsData };
      expect(body.data).toBeDefined();
      // Check for some expected default sections
      expect(body.data).toHaveProperty('scheduler');
      expect(body.data).toHaveProperty('cluster');
    });
  });

  describe('PATCH /api/v1/system-settings', () => {
    it('should update settings (Admin)', async () => {
      await createAdminUser();
      const agent = request.agent(app.getHttpServer());
      await agent
        .post('/api/v1/auth/login')
        .send({ email: 'admin@example.com', password: 'password123' })
        .expect(200);

      const newData = {
        scheduler: { pollInterval: 1000 },
        cluster: { provider: 'Claude' },
      };

      const response = await agent
        .patch('/api/v1/system-settings')
        .send({ data: newData })
        .expect(200);

      const body = response.body as { data: SystemSettingsData };
      expect(body.data).toEqual(expect.objectContaining(newData));

      // Verify persistence
      const getResponse = await agent
        .get('/api/v1/system-settings')
        .expect(200);
      const getBody = getResponse.body as { data: SystemSettingsData };
      expect(getBody.data).toEqual(expect.objectContaining(newData));
    });

    it('should return 403 if regular user tries to update', async () => {
      await createRegularUser();
      const agent = request.agent(app.getHttpServer());
      await agent
        .post('/api/v1/auth/login')
        .send({ email: 'user@example.com', password: 'password123' })
        .expect(200);

      return agent
        .patch('/api/v1/system-settings')
        .send({ data: { some: 'data' } })
        .expect(403);
    });
  });
});
