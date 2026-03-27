import { GeminiAgent } from './gemini.agent';
import { ConfigService } from '@nestjs/config';

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
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn().mockReturnValue('test_key'),
    } as unknown as jest.Mocked<ConfigService>;
    agent = new GeminiAgent(mockConfigService);
  });

  it('should throw an error if API key is not set during processText', async () => {
    mockConfigService.get.mockReturnValue(undefined);
    await expect(agent.processText('test')).rejects.toThrow(
      'GEMINI_API_KEY is required',
    );
  });

  it('should generate content with gemini-2.5-flash-lite', async () => {
    const response = await agent.processText('test query');
    expect(response.content).toBe('mocked text output');
    expect(response.metadata?.model).toBe('gemini-2.5-flash-lite');
  });
});
