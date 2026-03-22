export interface AgentResponse {
  content: string;
  metadata?: Record<string, any>;
}

export interface Agent {
  getName(): string;
  getDescription?(): string;
  getSystemInstructions?(): string;
  getRole?(): string;
  getProvider?(): string;
  getModel?(): string;
  updateConfig?(config: Record<string, any>): void;
  processText(input: string): Promise<AgentResponse>;
}
