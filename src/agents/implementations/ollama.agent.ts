import { Ollama } from 'ollama';
import { Agent, AgentResponse } from '../interfaces/agent.interface';
import { Injectable, Logger, Optional, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DEFAULT_MODEL_BY_PROVIDER } from '../default-provider-models';
import { RegisterAgent } from '../registry/agent.registry';
import { buildPersonalitySection } from '../personality.util';
import type { AgentAttributes } from '../dto/agent-attributes.dto';

@Injectable({ scope: Scope.TRANSIENT })
@RegisterAgent('ollama')
export class OllamaAgent implements Agent {
  private readonly logger = new Logger(OllamaAgent.name);
  private readonly ollama: Ollama;
  private name: string = 'OllamaAgent';
  private description?: string;
  private systemInstructions?: string;
  private role?: string;
  private provider: string = 'ollama';
  private model: string;
  private attributes?: AgentAttributes | null;

  constructor(
    private readonly configService: ConfigService,
    @Optional() model: string = DEFAULT_MODEL_BY_PROVIDER.ollama,
  ) {
    this.model = model;

    const host =
      this.configService.get<string>('OLLAMA_HOST') ?? 'http://127.0.0.1:11434';
    const apiKey = this.configService.get<string>('OLLAMA_API_KEY') ?? '';

    const config: ConstructorParameters<typeof Ollama>[0] = { host };
    if (apiKey) {
      config.headers = { Authorization: `Bearer ${apiKey}` };
    }

    this.ollama = new Ollama(config);
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description || '';
  }

  getSystemInstructions(): string {
    return this.systemInstructions || '';
  }

  getRole(): string {
    return this.role || '';
  }

  getProvider(): string {
    return this.provider;
  }

  getModel(): string {
    return this.model;
  }

  updateConfig(config: Record<string, any>): void {
    if (config['name']) this.name = config['name'] as string;
    if (config['description'])
      this.description = config['description'] as string;
    if (config['systemInstructions'])
      this.systemInstructions = config['systemInstructions'] as string;
    if (config['role']) this.role = config['role'] as string;
    if (config['provider']) this.provider = config['provider'] as string;
    if (config['model']) this.model = config['model'] as string;
    if ('attributes' in config)
      this.attributes = config['attributes'] as AgentAttributes | null;
  }

  private buildSystemPrompt(): string {
    return [
      `Your name is ${this.name}.`,
      this.role ? `Your role is: ${this.role}.` : '',
      this.description ? `Description of yourself: ${this.description}.` : '',
      this.systemInstructions
        ? `Instructions:\n${this.systemInstructions}`
        : '',
      buildPersonalitySection(this.attributes),
    ]
      .filter(Boolean)
      .join('\n');
  }

  async processText(input: string): Promise<AgentResponse> {
    this.logger.debug(
      `Processing input with OllamaAgent. Model: ${this.model}`,
    );
    try {
      const systemPrompt = this.buildSystemPrompt();

      const response = await this.ollama.chat({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: input },
        ],
        stream: false,
      });

      return {
        content: response.message.content,
        metadata: {
          model: this.model,
          usage: {
            eval_count: response.eval_count,
            prompt_eval_count: response.prompt_eval_count,
          },
        },
      };
    } catch (error) {
      this.logger.error(`Ollama Error: ${error}`);
      throw error;
    }
  }

  isFeatureSupported(_feature: string): boolean {
    void _feature;
    return false;
  }
}
