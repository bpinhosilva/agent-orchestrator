import client from './client';
import type { Agent } from './agents';
import type { PaginatedResponse } from './pagination';

export const TaskStatus = {
  BACKLOG: 'backlog',
  IN_PROGRESS: 'in-progress',
  REVIEW: 'review',
  DONE: 'done',
  ARCHIVED: 'archived',
} as const;

export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus];

export const TaskPriority = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
} as const;

export type TaskPriority = typeof TaskPriority[keyof typeof TaskPriority];

export const getTaskPriorityLabel = (priority: TaskPriority | string | number): string => {
  const p = typeof priority === 'string' ? parseInt(priority, 10) : priority;
  switch (p) {
    case TaskPriority.CRITICAL:
      return 'CRITICAL';
    case TaskPriority.HIGH:
      return 'HIGH';
    case TaskPriority.MEDIUM:
      return 'MEDIUM';
    case TaskPriority.LOW:
      return 'LOW';
    default:
      return 'UNKNOWN';
  }
};

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: Agent;
  costEstimate?: number;
  llmLatency?: number;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  title: string;
  description: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  projectId: string;
}

export type UpdateTaskDto = Partial<Omit<CreateTaskDto, 'assigneeId'>> & {
  assigneeId?: string | null;
};

export const tasksApi = {
  create: (projectId: string, data: CreateTaskDto) =>
    client.post<Task>(`/projects/${projectId}/tasks`, data),
  findAll: (projectId: string, params?: { status?: TaskStatus; page?: number; limit?: number }) =>
    client.get<PaginatedResponse<Task>>(`/projects/${projectId}/tasks`, { params }),
  findOne: (projectId: string, id: string) =>
    client.get<Task>(`/projects/${projectId}/tasks/${id}`),
  update: (projectId: string, id: string, data: UpdateTaskDto) =>
    client.patch<Task>(`/projects/${projectId}/tasks/${id}`, data),
  delete: (projectId: string, id: string) =>
    client.delete(`/projects/${projectId}/tasks/${id}`),
  fetchAll: async (projectId: string, params?: { status?: TaskStatus; limit?: number }) => {
    let allItems: Task[] = [];
    let currentPage = 1;
    let hasMore = true;
    const limit = params?.limit || 50;

    while (hasMore) {
      const res = await tasksApi.findAll(projectId, { ...params, page: currentPage, limit });
      allItems = [...allItems, ...res.data.items];
      hasMore = allItems.length < res.data.total;
      currentPage++;
    }

    return allItems;
  },
};
