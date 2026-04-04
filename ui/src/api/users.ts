import client from './client';

export interface User {
  id: string;
  name: string;
  last_name: string;
  email: string;
  role?: string;
  avatar?: string;
  avatarUrl?: string;
}

export const usersApi = {
  findAll: async (): Promise<User[]> => {
    const response = await client.get('/users');
    return response.data;
  },
  updateRole: async (userId: string, role: string): Promise<User> => {
    const response = await client.patch(`/users/${userId}`, { role });
    return response.data;
  },
};
