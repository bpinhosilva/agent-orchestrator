import client from './client';
import type { PaginatedResponse } from './pagination';

export interface User {
  id: string;
  name: string;
  lastName: string;
  email: string;
  role?: string;
  avatar?: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserPayload {
  name: string;
  lastName: string;
  email: string;
  password: string;
  avatar?: string;
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const usersApi = {
  findAll: async (
    params?: ListUsersParams,
  ): Promise<PaginatedResponse<User>> => {
    const response = await client.get<PaginatedResponse<User>>('/users', {
      params,
    });
    return response.data;
  },
  findOne: async (userId: string): Promise<User> => {
    const response = await client.get(`/users/${userId}`);
    return response.data;
  },
  updateRole: async (userId: string, role: string): Promise<User> => {
    const response = await client.patch(`/users/${userId}`, { role });
    return response.data;
  },
  deleteUser: async (userId: string): Promise<void> => {
    await client.delete(`/users/${userId}`);
  },
  /**
   * Creates a new user via the admin-accessible auth/register endpoint.
   * Does NOT auto-login — the current admin session is preserved.
   */
  createUser: async (payload: CreateUserPayload): Promise<User> => {
    const response = await client.post('/auth/register', payload);
    return response.data;
  },
};
