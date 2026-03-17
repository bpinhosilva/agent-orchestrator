export interface AgentResponse {
  content: string;
  metadata?: Record<string, any>;
}

export interface Agent {
  getName(): string;
  processText(input: string): Promise<AgentResponse>;
}
