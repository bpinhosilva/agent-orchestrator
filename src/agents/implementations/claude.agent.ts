import { query, SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import { Agent, AgentResponse } from '../interfaces/agent.interface';
import { Injectable, Logger, Optional } from '@nestjs/common';
import { Task } from '../../tasks/entities/task.entity';
import { Project } from '../../projects/entities/project.entity';

import { RegisterAgent } from '../registry/agent.registry';

@Injectable()
@RegisterAgent('anthropic')
export class ClaudeAgent implements Agent {
  private readonly logger = new Logger(ClaudeAgent.name);
  private name: string = 'ClaudeAgent';
  private description?: string;
  private systemInstructions?: string;
  private role?: string;
  private provider: string = 'anthropic';
  private model: string;

  constructor(@Optional() model: string = 'claude-opus-4-6') {
    this.model = model;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      this.logger.error('ANTHROPIC_API_KEY environment variable is not set');
      throw new Error(
        'ANTHROPIC_API_KEY is required to initialize ClaudeAgent',
      );
    }
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

  private buildSystemPrompt(): string {
    return [
      `Your name is ${this.name}.`,
      this.role ? `Your role is: ${this.role}.` : '',
      this.description ? `Description of yourself: ${this.description}.` : '',
      this.systemInstructions
        ? `Instructions:\n${this.systemInstructions}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  async processText(input: string): Promise<AgentResponse> {
    this.logger.debug(
      `Processing input with ClaudeAgent. Model: ${this.model}`,
    );
    try {
      const systemPrompt = this.buildSystemPrompt();
      let resultContent = '';
      let resultMetadata: Record<string, any> = {};

      const q = query({
        prompt: input,
        options: {
          model: this.model,
          systemPrompt,
          permissionMode: 'bypassPermissions',
          persistSession: false,
          tools: [],
        },
      });

      for await (const message of q as AsyncIterable<SDKMessage>) {
        if (message.type === 'result' && message.subtype === 'success') {
          resultContent = message.result;
          resultMetadata = {
            model: this.model,
            usage: message.usage,
            totalCostUsd: message.total_cost_usd,
            numTurns: message.num_turns,
          };
        }
      }

      return {
        content: resultContent,
        metadata: resultMetadata,
      };
    } catch (error) {
      this.logger.error(`Claude Error: ${error}`);
      throw error;
    }
  }

  isFeatureSupported(feature: string): boolean {
    void feature;
    return false;
  }

  async performTask(task: Task, project: Project): Promise<AgentResponse> {
    this.logger.debug(
      `Performing task: ${task.title} for project: ${project.title}`,
    );
    const prompt = `
Task: ${task.title}
Description: ${task.description}
Project: ${project.title}
Project Description: ${project.description}

Please perform the task and provide the output.
`;
    return this.processText(prompt);
  }
}
