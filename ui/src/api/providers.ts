import client from './client';
import type { Model } from './models';

export interface Provider {
  id: string;
  name: string;
  description?: string;
}

export const providersApi = {
  findAll: () => client.get<Provider[]>('/providers'),
  findOne: (id: string) => client.get<Provider>(`/providers/${id}`),
  findModels: (id: string) => client.get<Model[]>(`/providers/${id}/models`),
  create: (data: Partial<Provider>) => client.post<Provider>('/providers', data),
  update: (id: string, data: Partial<Provider>) => client.patch<Provider>(`/providers/${id}`, data),
  delete: (id: string) => client.delete(`/providers/${id}`),
};
