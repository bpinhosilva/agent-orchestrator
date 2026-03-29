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
  create: (data: CreateRecurrentTaskDto) =>
    client.post<RecurrentTask>('/recurrent-tasks', data),
  findAll: () =>
    client.get<RecurrentTask[]>('/recurrent-tasks'),
  findOne: (id: string) =>
    client.get<RecurrentTask>(`/recurrent-tasks/${id}`),
  update: (id: string, data: UpdateRecurrentTaskDto) =>
    client.patch<RecurrentTask>(`/recurrent-tasks/${id}`, data),
  delete: (id: string) =>
    client.delete(`/recurrent-tasks/${id}`),
};
