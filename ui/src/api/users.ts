import client from './client';

export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
}

export const usersApi = {
  findAll: async (): Promise<User[]> => {
    const response = await client.get('/users');
    return response.data;
  },
};
