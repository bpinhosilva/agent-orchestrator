import client from './client';
import type { Agent } from './agents';

export const TaskStatus = {
  BACKLOG: 'backlog',
  IN_PROGRESS: 'in-progress',
  REVIEW: 'review',
  DONE: 'done',
} as const;

export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus];

export const TaskPriority = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
} as const;

export type TaskPriority = typeof TaskPriority[keyof typeof TaskPriority];

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  output?: string;
  assignee?: Agent;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  title: string;
  description: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  output?: string;
  assigneeId?: string;
  projectId: string;
}

export type UpdateTaskDto = Partial<Omit<CreateTaskDto, 'assigneeId'>> & {
  assigneeId?: string | null;
};

export const tasksApi = {
  create: (projectId: string, data: CreateTaskDto) =>
    client.post<Task>(`/projects/${projectId}/tasks`, data),
  findAll: (projectId: string) => client.get<Task[]>(`/projects/${projectId}/tasks`),
  findOne: (projectId: string, id: string) =>
    client.get<Task>(`/projects/${projectId}/tasks/${id}`),
  update: (projectId: string, id: string, data: UpdateTaskDto) =>
    client.patch<Task>(`/projects/${projectId}/tasks/${id}`, data),
  delete: (projectId: string, id: string) =>
    client.delete(`/projects/${projectId}/tasks/${id}`),
};
