import client from './client';
import type { User } from './users';

export interface LoginResponse {
  message: string;
}

export interface RegisterResponse {
  id: string;
  username: string;
  email: string;
}

export interface RefreshResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export const authApi = {
  login: async (email: string, password: string): Promise<void> => {
    await client.post('/auth/login', { email, password });
  },
  register: async (username: string, email: string, password: string): Promise<RegisterResponse> => {
    const response = await client.post('/auth/register', { username, email, password });
    return response.data;
  },
  me: async (): Promise<User> => {
    const response = await client.get('/auth/me');
    return response.data;
  },
  refresh: async (): Promise<RefreshResponse> => {
    const response = await client.post('/auth/refresh', undefined, {
      skipAuthRefresh: true,
    });
    return response.data;
  },
  logout: async (): Promise<void> => {
    await client.post('/auth/logout');
  },
};
