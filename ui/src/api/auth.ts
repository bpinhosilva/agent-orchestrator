import client from './client';
import type { User } from './users';

export interface LoginResponse {
  access_token: string;
  user?: User;
}

export interface RegisterResponse {
  id: string;
  username: string;
  email: string;
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await client.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (username: string, email: string, password: string): Promise<RegisterResponse> => {
    const response = await client.post('/auth/register', { username, email, password });
    return response.data;
  },
  me: async (): Promise<User> => {
    const response = await client.get('/auth/me');
    return response.data;
  },
};
