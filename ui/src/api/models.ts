import client from './client';

export interface Model {
  id: string;
  name: string;
  providerId?: string;
}

export const modelsApi = {
  findAll: () => client.get<Model[]>('/models'),
  findByProvider: (providerId: string) => client.get<Model[]>(`/models/provider/${providerId}`),
  findOne: (id: string) => client.get<Model>(`/models/${id}`),
  create: (data: Partial<Model>) => client.post<Model>('/models', data),
  update: (id: string, data: Partial<Model>) => client.patch<Model>(`/models/${id}`, data),
  delete: (id: string) => client.delete(`/models/${id}`),
};
