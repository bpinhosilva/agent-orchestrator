import client from './client';
import type { Agent } from './agents';
import { TaskPriority } from './tasks';

export const RecurrentTaskStatus = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  ERROR: 'error',
} as const;

export type RecurrentTaskStatus = typeof RecurrentTaskStatus[keyof typeof RecurrentTaskStatus];

export const ExecStatus = {
  RUNNING: 'running',
  SUCCESS: 'success',
  FAILURE: 'failure',
  CANCELED: 'canceled',
} as const;

export type ExecStatus = typeof ExecStatus[keyof typeof ExecStatus];

export interface RecurrentTaskExec {
  id: string;
  status: ExecStatus;
  result: string;
  latencyMs: number;
  createdAt: string;
  updatedAt: string;
}

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
  findExecutions: (projectId: string, id: string, page = 1, limit = 10) =>
    client.get<{ data: RecurrentTaskExec[]; total: number }>(
      `/projects/${projectId}/recurrent-tasks/${id}/executions`,
      { params: { page, limit } },
    ),
};
