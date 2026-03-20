import { GeminiAgent } from './gemini.agent';

jest.mock('@google/genai', () => {
  return {
    GoogleGenAI: jest.fn().mockImplementation(() => ({
      models: {
        generateContent: jest.fn().mockResolvedValue({
          text: 'mocked text output',
        }),
      },
    })),
  };
});

describe('GeminiAgent', () => {
  let agent: GeminiAgent;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, GEMINI_API_KEY: 'test_key' };
    agent = new GeminiAgent();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should throw an error if API key is not set', () => {
    delete process.env.GEMINI_API_KEY;
    expect(() => new GeminiAgent()).toThrow('GEMINI_API_KEY is required');
  });

  it('should generate content with gemini-2.5-flash-lite', async () => {
    const response = await agent.processText('test query');
    expect(response.content).toBe('mocked text output');
    expect(response.metadata?.model).toBe('gemini-2.5-flash-lite');
  });
});
