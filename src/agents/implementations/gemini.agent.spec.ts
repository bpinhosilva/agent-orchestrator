import { GeminiAgent } from './gemini.agent';
import { ConfigService } from '@nestjs/config';

const mockGenerateContent = jest.fn().mockResolvedValue({
  text: 'mocked text output',
});

jest.mock('@google/genai', () => {
  return {
    GoogleGenAI: jest.fn().mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent,
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
    mockGenerateContent.mockClear();
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

  it('should accept attributes via updateConfig', () => {
    agent.updateConfig({
      attributes: { creativity: 3.0, strictness: 3.5 },
    });
    expect(agent).toBeDefined();
  });

  it('should include personality matrix in system instruction when attributes set', async () => {
    agent.updateConfig({
      name: 'RigidAnalyst',
      attributes: { creativity: 1.5, strictness: 4.8 },
    });

    await agent.processText('analyze this');

    const calls = mockGenerateContent.mock.calls as {
      config: { systemInstruction: string };
    }[][];
    const callArgs = calls[0][0];
    const systemInstruction: string = callArgs.config.systemInstruction;
    expect(systemInstruction).toContain('[PERSONALITY MATRIX]');
    expect(systemInstruction).toContain('1.50/5');
    expect(systemInstruction).toContain('4.80/5');
    expect(systemInstruction).toContain('Analytical');
    expect(systemInstruction).toContain('Rigorous');
  });

  it('should not include personality matrix section when no attributes set', async () => {
    const freshAgent = new GeminiAgent(mockConfigService);
    await freshAgent.processText('test');

    const calls = mockGenerateContent.mock.calls as {
      config: { systemInstruction: string };
    }[][];
    const callArgs = calls[0][0];
    const systemInstruction: string = callArgs.config.systemInstruction;
    expect(systemInstruction).not.toContain('[PERSONALITY MATRIX]');
  });

  it('should reflect balanced defaults in system instruction', async () => {
    agent.updateConfig({
      attributes: { creativity: 3.0, strictness: 3.5 },
    });

    await agent.processText('test');

    const calls = mockGenerateContent.mock.calls as {
      config: { systemInstruction: string };
    }[][];
    const callArgs = calls[0][0];
    const systemInstruction: string = callArgs.config.systemInstruction;
    expect(systemInstruction).toContain('Balanced');
    expect(systemInstruction).toContain('Structured');
  });
});
