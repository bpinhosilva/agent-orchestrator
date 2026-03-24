import client from './client';

export const CommentAuthorType = {
  USER: 'user',
  AGENT: 'agent',
} as const;

export type CommentAuthorType = typeof CommentAuthorType[keyof typeof CommentAuthorType];

export interface TaskComment {
  id: string;
  content: string;
  authorType: CommentAuthorType;
  authorUser?: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  authorAgent?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  artifacts?: {
    id: string;
    originalName: string;
    mimeType: string;
    filePath: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentDto {
  content: string;
  authorType: CommentAuthorType;
  authorUserId?: string;
  authorAgentId?: string;
  artifacts?: {
    originalName: string;
    mimeType: string;
    filePath: string;
  }[];
}

export const commentsApi = {
  create: async (taskId: string, data: CreateCommentDto): Promise<TaskComment> => {
    const response = await client.post(`/tasks/${taskId}/comments`, data);
    return response.data;
  },

  findAllByTask: async (taskId: string): Promise<TaskComment[]> => {
    const response = await client.get(`/tasks/${taskId}/comments`);
    return response.data;
  },

  remove: async (taskId: string, commentId: string): Promise<void> => {
    await client.delete(`/tasks/${taskId}/comments/${commentId}`);
  },
};
