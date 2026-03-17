import { GoogleGenerativeAI } from '@google/generative-ai';
import { Agent, AgentResponse } from '../interfaces/agent.interface';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class GeminiAgent implements Agent {
  private readonly logger = new Logger(GeminiAgent.name);
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY environment variable is not set');
      throw new Error('GEMINI_API_KEY is required to initialize GeminiAgent');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  getName(): string {
    return 'GeminiAgent';
  }

  async processText(input: string): Promise<AgentResponse> {
    this.logger.debug(`Processing input with GeminiAgent`);
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
      const result = await model.generateContent(input);
      const output = result.response.text();

      return {
        content: output,
        metadata: {
          model: 'gemini-2.5-flash-lite',
        },
      };
    } catch (error) {
      this.logger.error(`Error processing text: ${error.message}`, error.stack);
      throw error;
    }
  }
}
