import client from './client';
import type { User } from './users';

export interface LoginResponse {
  message: string;
}

export interface RegisterResponse {
  id: string;
  name: string;
  last_name: string;
  email: string;
  avatar: string;
  avatarUrl: string;
}

export interface RefreshResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface UpdateProfilePayload {
  name?: string;
  last_name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  avatar?: string;
}

export const authApi = {
  login: async (email: string, password: string): Promise<void> => {
    await client.post('/auth/login', { email, password });
  },
  register: async (
    name: string,
    last_name: string,
    email: string,
    password: string,
    avatar?: string,
  ): Promise<RegisterResponse> => {
    const response = await client.post('/auth/register', {
      name,
      last_name,
      email,
      password,
      avatar,
    });
    return response.data;
  },
  me: async (): Promise<User> => {
    const response = await client.get('/auth/me');
    return response.data;
  },
  updateProfile: async (payload: UpdateProfilePayload): Promise<User> => {
    const response = await client.patch('/auth/me', payload);
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
