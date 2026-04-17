import { OllamaAgent } from './ollama.agent';
import { ConfigService } from '@nestjs/config';

const mockChat = jest.fn();

jest.mock('ollama', () => ({
  Ollama: jest.fn().mockImplementation(() => ({
    chat: mockChat,
  })),
}));

import { Ollama } from 'ollama';

const MockedOllama = Ollama as jest.MockedClass<typeof Ollama>;

describe('OllamaAgent', () => {
  let agent: OllamaAgent;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'OLLAMA_HOST') return 'http://localhost:11434';
        if (key === 'OLLAMA_API_KEY') return '';
        return undefined;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    mockChat.mockReset();
    MockedOllama.mockClear();

    mockChat.mockResolvedValue({
      message: { role: 'assistant', content: 'mocked ollama response' },
      model: 'gemma4',
      done: true,
      done_reason: 'stop',
      eval_count: 20,
      prompt_eval_count: 10,
    });

    agent = new OllamaAgent(mockConfigService);
  });

  it('should use default model gemma4', () => {
    expect(agent.getModel()).toBe('gemma4');
  });

  it('should report provider as ollama', () => {
    expect(agent.getProvider()).toBe('ollama');
  });

  it('should return content from chat response', async () => {
    const response = await agent.processText('hello');
    expect(response.content).toBe('mocked ollama response');
  });

  it('should include model in response metadata', async () => {
    const response = await agent.processText('hello');
    expect(response.metadata?.model).toBe('gemma4');
  });

  it('should call ollama.chat with user message', async () => {
    await agent.processText('what is AI?');
    expect(mockChat).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemma4',
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'user', content: 'what is AI?' }),
        ]) as unknown,
      }),
    );
  });

  it('should include system prompt as first message in chat', async () => {
    agent.updateConfig({ name: 'TestBot', role: 'assistant' });
    await agent.processText('hello');

    const chatCall = (
      mockChat.mock.calls as Array<
        [{ messages: Array<{ role: string; content: string }> }]
      >
    )[0][0];
    const systemMsg = chatCall.messages.find((m) => m.role === 'system');
    expect(systemMsg).toBeDefined();
    expect(systemMsg!.content).toContain('TestBot');
    expect(systemMsg!.content).toContain('assistant');
  });

  it('should use OLLAMA_HOST from config service', () => {
    agent = new OllamaAgent(mockConfigService);
    expect(MockedOllama).toHaveBeenCalledWith(
      expect.objectContaining({ host: 'http://localhost:11434' }),
    );
  });

  it('should fallback to http://127.0.0.1:11434 when OLLAMA_HOST not set', () => {
    mockConfigService.get.mockReturnValue(undefined);
    agent = new OllamaAgent(mockConfigService);
    expect(MockedOllama).toHaveBeenCalledWith(
      expect.objectContaining({ host: 'http://127.0.0.1:11434' }),
    );
  });

  it('should pass Authorization header when OLLAMA_API_KEY is set', () => {
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'OLLAMA_HOST') return 'https://api.ollama.com';
      if (key === 'OLLAMA_API_KEY') return 'my-secret-key';
      return undefined;
    });
    agent = new OllamaAgent(mockConfigService);
    expect(MockedOllama).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: { Authorization: 'Bearer my-secret-key' },
      }),
    );
  });

  it('should not pass Authorization header when OLLAMA_API_KEY is empty', () => {
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'OLLAMA_HOST') return 'http://localhost:11434';
      if (key === 'OLLAMA_API_KEY') return '';
      return undefined;
    });
    agent = new OllamaAgent(mockConfigService);
    expect(MockedOllama).toHaveBeenCalledWith(
      expect.not.objectContaining({
        headers: expect.anything() as unknown,
      }),
    );
  });

  it('should use updateConfig to set name, description, role, systemInstructions, model', () => {
    agent.updateConfig({
      name: 'MyBot',
      description: 'A helpful bot',
      role: 'assistant',
      systemInstructions: 'Be concise',
      model: 'llama3',
    });
    expect(agent.getName()).toBe('MyBot');
    expect(agent.getDescription()).toBe('A helpful bot');
    expect(agent.getRole()).toBe('assistant');
    expect(agent.getSystemInstructions()).toBe('Be concise');
    expect(agent.getModel()).toBe('llama3');
  });

  it('should include systemInstructions in system message', async () => {
    agent.updateConfig({ systemInstructions: 'Always respond in JSON.' });
    await agent.processText('hello');

    const chatCall = (
      mockChat.mock.calls as Array<
        [{ messages: Array<{ role: string; content: string }> }]
      >
    )[0][0];
    const systemMsg = chatCall.messages.find((m) => m.role === 'system');
    expect(systemMsg!.content).toContain('Always respond in JSON.');
  });

  it('should include personality matrix in system message when attributes set', async () => {
    agent.updateConfig({
      name: 'CreativeBot',
      attributes: { creativity: 4.5, strictness: 1.5 },
    });
    await agent.processText('test');

    const chatCall = (
      mockChat.mock.calls as Array<
        [{ messages: Array<{ role: string; content: string }> }]
      >
    )[0][0];
    const systemMsg = chatCall.messages.find((m) => m.role === 'system');
    expect(systemMsg!.content).toContain('[PERSONALITY MATRIX]');
    expect(systemMsg!.content).toContain('4.50/5');
    expect(systemMsg!.content).toContain('1.50/5');
  });

  it('should not include personality matrix when no attributes set', async () => {
    const freshAgent = new OllamaAgent(mockConfigService);
    await freshAgent.processText('test');

    const chatCall = (
      mockChat.mock.calls as Array<
        [{ messages: Array<{ role: string; content: string }> }]
      >
    )[0][0];
    const systemMsg = chatCall.messages.find((m) => m.role === 'system');
    expect(systemMsg?.content ?? '').not.toContain('[PERSONALITY MATRIX]');
  });

  it('should log and rethrow errors from chat', async () => {
    mockChat.mockRejectedValueOnce(new Error('connection refused'));
    await expect(agent.processText('hello')).rejects.toThrow(
      'connection refused',
    );
  });

  it('isFeatureSupported always returns false', () => {
    expect(agent.isFeatureSupported('grounding')).toBe(false);
    expect(agent.isFeatureSupported('anything')).toBe(false);
  });
});
