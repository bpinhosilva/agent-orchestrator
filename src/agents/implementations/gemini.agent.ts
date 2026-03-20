import { GoogleGenAI } from '@google/genai';
import { Agent, AgentResponse } from '../interfaces/agent.interface';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class GeminiAgent implements Agent {
  private readonly logger = new Logger(GeminiAgent.name);
  private genAI: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY environment variable is not set');
      throw new Error('GEMINI_API_KEY is required to initialize GeminiAgent');
    }
    this.genAI = new GoogleGenAI({ apiKey });
  }

  getName(): string {
    return 'GeminiAgent';
  }

  async processText(input: string): Promise<AgentResponse> {
    this.logger.debug(`Processing input with GeminiAgent`);
    try {
      const response = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: input,
      });

      return {
        content: response.text ?? '',
        metadata: {
          model: 'gemini-2.5-flash-lite',
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
