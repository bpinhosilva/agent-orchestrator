import client from './client';

export interface AgentProvider {
  id: string;
  name: string;
  description?: string;
}

export interface AgentAttributes {
  creativity?: number;
  strictness?: number;
}

export const BALANCED_ATTRIBUTES: AgentAttributes = {
  creativity: 3.0,
  strictness: 3.5,
};

export interface Agent {
  id: string;
  name: string;
  emoji?: string;
  role?: string;
  description?: string;
  systemInstructions?: string;
  attributes?: AgentAttributes | null;
  model?: {
    id: string;
    name: string;
    provider?: AgentProvider;
  };
  status?: 'active' | 'inactive' | 'idle' | 'updating';
}

export interface CreateAgentPayload {
  name: string;
  emoji?: string;
  role?: string;
  description?: string;
  systemInstructions?: string;
  modelId: string;
  status?: string;
  attributes?: AgentAttributes | null;
}

export interface UpdateAgentPayload {
  name?: string;
  emoji?: string;
  role?: string;
  description?: string;
  systemInstructions?: string;
  modelId?: string;
  status?: string;
  attributes?: AgentAttributes | null;
}

export interface AgentResponse {
  content: string;
  image?: string;
  metadata?: Record<string, unknown>;
}

export const agentsApi = {
  findAll: () => client.get<Agent[]>('/agents'),
  findOne: (id: string) => client.get<Agent>(`/agents/${id}`),
  create: (data: CreateAgentPayload) => client.post<Agent>('/agents', data),
  update: (id: string, data: UpdateAgentPayload) => client.patch<Agent>(`/agents/${id}`, data),
  delete: (id: string) => client.delete(`/agents/${id}`),
  probe: (agentId: string, input: string) => client.post<AgentResponse>('/agents/probe', { agentId, input }),
};
