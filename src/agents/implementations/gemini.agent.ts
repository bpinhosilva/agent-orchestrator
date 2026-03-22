import { GoogleGenAI } from '@google/genai';
import { Agent, AgentResponse } from '../interfaces/agent.interface';
import { Injectable, Logger, Optional } from '@nestjs/common';

import { RegisterAgent } from '../registry/agent.registry';

@Injectable()
@RegisterAgent('Google')
export class GeminiAgent implements Agent {
  private readonly logger = new Logger(GeminiAgent.name);
  private genAI: GoogleGenAI;
  private name: string = 'GeminiAgent';
  private description?: string;
  private systemInstructions?: string;
  private role?: string;
  private provider: string = 'Google';
  private model: string;

  constructor(@Optional() model: string = 'gemini-2.5-flash-lite') {
    this.model = model;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY environment variable is not set');
      throw new Error('GEMINI_API_KEY is required to initialize GeminiAgent');
    }
    this.genAI = new GoogleGenAI({ apiKey });
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
  }

  async processText(input: string): Promise<AgentResponse> {
    this.logger.debug(`Processing input with GeminiAgent`);
    try {
      const contents = input;

      const response = await this.genAI.models.generateContent({
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
          ]
            .filter(Boolean)
            .join('\n'),
        },
      });

      return {
        content: response.text ?? '',
        metadata: {
          model: this.model,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Error processing text: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error(`Error processing text: ${String(error)}`);
      }
      throw error;
    }
  }
}
