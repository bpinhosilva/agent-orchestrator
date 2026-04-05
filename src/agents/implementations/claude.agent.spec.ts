import { ClaudeAgent } from './claude.agent';
import { ConfigService } from '@nestjs/config';
import { query as mockQuery } from '@anthropic-ai/claude-agent-sdk';

const makeAsyncIterable = () =>
  (async function* () {
    await Promise.resolve();
    yield {
      type: 'result',
      subtype: 'success',
      result: 'mocked claude response',
      total_cost_usd: 0.001,
      num_turns: 1,
      usage: {
        input_tokens: 10,
        output_tokens: 5,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
      },
    };
  })();

jest.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: jest.fn(),
}));

describe('ClaudeAgent', () => {
  let agent: ClaudeAgent;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn().mockReturnValue('test_key'),
    } as unknown as jest.Mocked<ConfigService>;
    agent = new ClaudeAgent(mockConfigService);
    (mockQuery as jest.Mock).mockReturnValue(makeAsyncIterable());
  });

  it('should throw an error if API key is not set during processText', async () => {
    mockConfigService.get.mockReturnValue(undefined);
    await expect(agent.processText('test')).rejects.toThrow(
      'ANTHROPIC_API_KEY is required to initialize ClaudeAgent',
    );
  });

  it('should generate content with claude-sonnet-4-5', async () => {
    agent = new ClaudeAgent(mockConfigService, 'claude-sonnet-4-5');
    (mockQuery as jest.Mock).mockReturnValue(makeAsyncIterable());
    const response = await agent.processText('test query');
    expect(response.content).toBe('mocked claude response');
    expect(response.metadata?.model).toBe('claude-sonnet-4-5');
  });

  it('should use updateConfig to set properties', () => {
    agent.updateConfig({
      name: 'TestAgent',
      description: 'A test agent',
      role: 'Tester',
      systemInstructions: 'Be helpful',
      model: 'claude-opus-4-5',
    });
    expect(agent.getName()).toBe('TestAgent');
    expect(agent.getDescription()).toBe('A test agent');
    expect(agent.getRole()).toBe('Tester');
    expect(agent.getSystemInstructions()).toBe('Be helpful');
    expect(agent.getModel()).toBe('claude-opus-4-5');
  });

  it('should report provider as Anthropic', () => {
    expect(agent.getProvider()).toBe('anthropic');
  });

  it('should accept attributes via updateConfig', () => {
    agent.updateConfig({
      attributes: { creativity: 4.0, strictness: 3.5 },
    });
    expect(agent).toBeDefined();
  });

  it('should include personality matrix in system prompt when attributes set', async () => {
    agent.updateConfig({
      name: 'CreativeAgent',
      attributes: { creativity: 4.5, strictness: 1.5 },
    });

    await agent.processText('test');

    const calls = (mockQuery as jest.Mock).mock.calls as {
      options: { systemPrompt: string };
    }[][];
    const lastCall = calls[calls.length - 1][0];
    const systemPrompt: string = lastCall.options.systemPrompt;
    expect(systemPrompt).toContain('[PERSONALITY MATRIX]');
    expect(systemPrompt).toContain('4.50/5');
    expect(systemPrompt).toContain('1.50/5');
    expect(systemPrompt).toContain('Inventive');
    expect(systemPrompt).toContain('Flexible');
  });

  it('should not include personality matrix section when no attributes set', async () => {
    const freshAgent = new ClaudeAgent(mockConfigService);
    (mockQuery as jest.Mock).mockReturnValue(makeAsyncIterable());

    await freshAgent.processText('test');

    const calls = (mockQuery as jest.Mock).mock.calls as {
      options: { systemPrompt: string };
    }[][];
    const lastCall = calls[calls.length - 1][0];
    const systemPrompt: string = lastCall.options.systemPrompt;
    expect(systemPrompt).not.toContain('[PERSONALITY MATRIX]');
  });
});
