import { GoogleGenAI } from '@google/genai';
import { Agent, AgentResponse } from '../interfaces/agent.interface';
import { Injectable, Logger, Optional, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DEFAULT_MODEL_BY_PROVIDER } from '../default-provider-models';
import { RegisterAgent } from '../registry/agent.registry';
import { buildPersonalitySection } from '../personality.util';
import type { AgentAttributes } from '../dto/agent-attributes.dto';

@Injectable({ scope: Scope.TRANSIENT })
@RegisterAgent('google')
export class GeminiAgent implements Agent {
  private readonly logger = new Logger(GeminiAgent.name);
  private genAI: GoogleGenAI | null = null;
  private name: string = 'GeminiAgent';
  private description?: string;
  private systemInstructions?: string;
  private role?: string;
  private provider: string = 'google';
  private model: string;
  private enableGrounding: boolean = true;
  private attributes?: AgentAttributes | null;

  constructor(
    private readonly configService: ConfigService,
    @Optional() model: string = DEFAULT_MODEL_BY_PROVIDER.google,
  ) {
    this.model = model;
  }

  private getGenAI(): GoogleGenAI {
    if (this.genAI) return this.genAI;

    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY environment variable is not set');
      throw new Error('GEMINI_API_KEY is required to initialize GeminiAgent');
    }
    this.genAI = new GoogleGenAI({ apiKey });
    return this.genAI;
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
    if (config['enableGrounding'] !== undefined)
      this.enableGrounding = !!config['enableGrounding'];
    if ('attributes' in config)
      this.attributes = config['attributes'] as AgentAttributes | null;
  }

  async processText(input: string): Promise<AgentResponse> {
    const isGrounded = this.isGroundingSupported();
    this.logger.debug(
      `Processing input with GeminiAgent. Model: ${this.model}, Grounding Supported: ${isGrounded}, Grounding Enabled: ${this.enableGrounding}`,
    );
    try {
      const contents = input;
      const tools = this.getTools();
      if (tools.length > 0) {
        this.logger.debug(`Adding tools to request: ${JSON.stringify(tools)}`);
      }
      const genAI = this.getGenAI();
      const response = await genAI.models.generateContent({
        model: this.model,
        contents,
        config: {
          systemInstruction: [
            `Your name is ${this.name}.`,
            this.role ? `Your role is: ${this.role}.` : '',
            this.description
              ? `Description of yourself: ${this.description}.`
              : '',
            this.systemInstructions
              ? `Instructions:\n${this.systemInstructions}`
              : '',
            buildPersonalitySection(this.attributes),
          ]
            .filter(Boolean)
            .join('\n'),
          tools,
        },
      });

      const candidate = response.candidates?.[0];
      const groundingMetadata = candidate?.groundingMetadata;

      if (groundingMetadata) {
        this.logger.debug(
          `Grounding Metadata found: ${JSON.stringify(groundingMetadata, null, 2)}`,
        );
      }

      return {
        content: response.text || '',
        image: response.data,
        metadata: {
          model: this.model,
          groundingMetadata: groundingMetadata || undefined,
          usage: response.usageMetadata,
        },
      };
    } catch (error) {
      this.logger.error(`Gemini Error: ${error}`);
      throw error;
    }
  }

  isFeatureSupported(feature: string): boolean {
    if (feature === 'grounding' || feature === 'googleSearch') {
      return this.isGroundingSupported();
    }
    return false;
  }

  private getTools(): any[] {
    const tools: any[] = [];
    if (this.enableGrounding && this.isGroundingSupported()) {
      tools.push({
        googleSearch: {
          searchTypes: {
            webSearch: {},
          },
        },
      });
    }
    return tools;
  }

  private isGroundingSupported(): boolean {
    const supportedPrefixes = [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-2.0-flash',
      'gemini-2.0-pro',
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      'gemini-3.1-flash',
      'gemini-3.1-pro',
      'gemini-3-flash',
    ];

    const excludedSuffixes = [
      '-image',
      '-vision',
      '-thinking',
      '-experimental',
    ];

    const modelName = this.model.startsWith('models/')
      ? this.model.slice(7)
      : this.model;

    const hasSupportedPrefix = supportedPrefixes.some((p) =>
      modelName.startsWith(p),
    );
    const hasExcludedSuffix = excludedSuffixes.some((s) =>
      modelName.includes(s),
    );

    return hasSupportedPrefix && !hasExcludedSuffix;
  }
}
