import client from './client';

export interface Agent {
  id: string;
  name: string;
  role?: string;
  provider: string;
  modelId: string;
  status?: string;
}

export const agentsApi = {
  findAll: () => client.get<Agent[]>('/agents'),
  findOne: (id: string) => client.get<Agent>(`/agents/${id}`),
  create: (data: Partial<Agent>) => client.post<Agent>('/agents', data),
  update: (id: string, data: Partial<Agent>) => client.patch<Agent>(`/agents/${id}`, data),
  delete: (id: string) => client.delete(`/agents/${id}`),
};
