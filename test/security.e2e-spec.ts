import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

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
process.env.NODE_ENV = 'test';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';

describe('Security Headers & CORS (e2e)', () => {
  let app: INestApplication<App>;
  const originalEnv = process.env;

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

    // Add helmet middleware for security headers
    app.use(helmet());

    // Configure CORS based on NODE_ENV
    const nodeEnv = process.env.NODE_ENV || 'development';
    const corsOptions: CorsOptions = {
      credentials: true,
    };

    if (nodeEnv === 'development') {
      corsOptions.origin = ['http://localhost:5173', 'http://localhost:3000'];
    } else if (nodeEnv === 'production') {
      corsOptions.origin = ['http://localhost:15789', 'http://0.0.0.0:15789'];
    } else {
      corsOptions.origin = true;
    }

    app.enableCors(corsOptions);

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

  describe('Helmet Security Headers', () => {
    it('should include X-Frame-Options header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1')
        .expect(401);

      expect(response.headers['x-frame-options']).toBeDefined();
      // Helmet defaults to SAMEORIGIN, which is secure
      expect(['DENY', 'SAMEORIGIN']).toContain(
        response.headers['x-frame-options'],
      );
    });

    it('should include X-Content-Type-Options header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1')
        .expect(401);

      expect(response.headers['x-content-type-options']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should include X-XSS-Protection header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1')
        .expect(401);

      expect(response.headers['x-xss-protection']).toBeDefined();
      // Helmet modern default is '0' which disables it for modern browsers
      // that use CSP instead. This is correct and secure.
      expect(['0', '1; mode=block']).toContain(
        response.headers['x-xss-protection'],
      );
    });

    it('should include Content-Security-Policy header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1')
        .expect(401);

      expect(response.headers['content-security-policy']).toBeDefined();
    });

    it('should include Strict-Transport-Security header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1')
        .expect(401);

      expect(response.headers['strict-transport-security']).toBeDefined();
    });
  });

  describe('CORS Configuration', () => {
    it('should accept requests from whitelisted origins in test environment', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1')
        .set('Origin', 'http://localhost:5173')
        .expect(401);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should properly handle preflight requests', async () => {
      const response = await request(app.getHttpServer())
        .options('/api/v1')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'GET');

      expect(response.status).toBeLessThan(500);
    });
  });
});
