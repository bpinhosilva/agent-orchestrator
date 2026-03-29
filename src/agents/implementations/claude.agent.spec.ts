import { ClaudeAgent } from './claude.agent';
import { ConfigService } from '@nestjs/config';

jest.mock('@anthropic-ai/claude-agent-sdk', () => {
  const mockAsyncIterable = async function* () {
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
  };

  return {
    query: jest.fn().mockReturnValue(mockAsyncIterable()),
  };
});

describe('ClaudeAgent', () => {
  let agent: ClaudeAgent;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn().mockReturnValue('test_key'),
    } as unknown as jest.Mocked<ConfigService>;
    agent = new ClaudeAgent(mockConfigService);
  });

  it('should throw an error if API key is not set during processText', async () => {
    mockConfigService.get.mockReturnValue(undefined);
    await expect(agent.processText('test')).rejects.toThrow(
      'ANTHROPIC_API_KEY is required to initialize ClaudeAgent',
    );
  });

  it('should generate content with claude-sonnet-4-5', async () => {
    agent = new ClaudeAgent(mockConfigService, 'claude-sonnet-4-5');
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
});
