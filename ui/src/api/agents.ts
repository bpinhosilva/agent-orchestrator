import client from './client';

export interface Agent {
  id: string;
  name: string;
  role?: string;
  description?: string;
  systemInstructions?: string;
  provider: string;
  modelId: string;
  model?: {
    id: string;
    name: string;
    provider?: {
      id: string;
      name: string;
    };
  };
  status?: 'active' | 'inactive' | 'idle' | 'updating';
}

export interface AgentResponse {
  content: string;
  image?: string;
  metadata?: Record<string, unknown>;
}

export const agentsApi = {
  findAll: () => client.get<Agent[]>('/agents'),
  findOne: (id: string) => client.get<Agent>(`/agents/${id}`),
  create: (data: Partial<Agent>) => client.post<Agent>('/agents', data),
  update: (id: string, data: Partial<Agent>) => client.patch<Agent>(`/agents/${id}`, data),
  delete: (id: string) => client.delete(`/agents/${id}`),
  probe: (agentId: string, input: string) => client.post<AgentResponse>('/agents/probe', { agentId, input }),
};
