import client from './client';
import type { Agent } from './agents';
import { TaskPriority } from './tasks';

export const RecurrentTaskStatus = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  ERROR: 'error',
} as const;

export type RecurrentTaskStatus = typeof RecurrentTaskStatus[keyof typeof RecurrentTaskStatus];

export interface RecurrentTask {
  id: string;
  title: string;
  description: string;
  status: RecurrentTaskStatus;
  priority: TaskPriority;
  cronExpression: string;
  assignee: Agent;
  lastRun?: string;
  nextRun?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecurrentTaskDto {
  title: string;
  description: string;
  status?: RecurrentTaskStatus;
  priority?: TaskPriority;
  cronExpression: string;
  assigneeId: string;
}

export type UpdateRecurrentTaskDto = Partial<CreateRecurrentTaskDto>;

export const recurrentTasksApi = {
  create: (projectId: string, data: CreateRecurrentTaskDto) =>
    client.post<RecurrentTask>(`/projects/${projectId}/recurrent-tasks`, data),
  findAll: (projectId: string) =>
    client.get<RecurrentTask[]>(`/projects/${projectId}/recurrent-tasks`),
  findOne: (projectId: string, id: string) =>
    client.get<RecurrentTask>(`/projects/${projectId}/recurrent-tasks/${id}`),
  update: (projectId: string, id: string, data: UpdateRecurrentTaskDto) =>
    client.patch<RecurrentTask>(
      `/projects/${projectId}/recurrent-tasks/${id}`,
      data,
    ),
  delete: (projectId: string, id: string) =>
    client.delete(`/projects/${projectId}/recurrent-tasks/${id}`),
};
