import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { AgentsService } from '../src/agents/agents.service';
import { GeminiAgent } from '../src/agents/implementations/gemini.agent';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  const originalEnv = process.env;

  beforeAll(() => {
    process.env = { ...originalEnv, GEMINI_API_KEY: 'test_key' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(GeminiAgent)
      .useValue({
        getName: () => 'MockedGeminiAgent',
        processText: async () => ({ content: 'mocked agent response' }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  it('/api/v1/agents/process (POST)', () => {
    // We mock Gemini agent response since providing a fake api key still attempts a real network request.
    const agentsService = app.get(AgentsService);
    jest.spyOn(agentsService, 'processRequest').mockResolvedValue({ content: 'mocked output from e2e' });

    return request(app.getHttpServer() as any)
      .post('/api/v1/agents/process')
      .send({ input: 'hello' })
      .expect(200)
      .expect((res) => {
        expect(res.body.content).toBe('mocked output from e2e');
      });
  });
});
