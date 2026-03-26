import client from './client';

export interface AgentProvider {
  id: string;
  name: string;
  description?: string;
}

export interface Agent {
  id: string;
  name: string;
  role?: string;
  description?: string;
  systemInstructions?: string;
  provider?: AgentProvider;
  model?: {
    id: string;
    name: string;
    provider?: AgentProvider;
  };
  status?: 'active' | 'inactive' | 'idle' | 'updating';
}

export interface CreateAgentPayload {
  name: string;
  role?: string;
  description?: string;
  systemInstructions?: string;
  providerId: string;
  modelId: string;
  status?: string;
}

export interface UpdateAgentPayload {
  name?: string;
  role?: string;
  description?: string;
  systemInstructions?: string;
  providerId?: string;
  modelId?: string;
  status?: string;
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

