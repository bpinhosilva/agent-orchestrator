import client from './client';
import type { Agent } from './agents';

export const ProjectStatus = {
  PLANNING: 'planning',
  ACTIVE: 'active',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
} as const;

export type ProjectStatus = typeof ProjectStatus[keyof typeof ProjectStatus];

export interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  ownerAgent: Agent | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectDto {
  title: string;
  description?: string;
  status?: ProjectStatus;
  ownerAgentId?: string | null;
}

export type UpdateProjectDto = Partial<CreateProjectDto>;

export const projectsApi = {
  create: (data: CreateProjectDto) => client.post<Project>('/projects', data),
  findAll: () => client.get<Project[]>('/projects'),
  findOne: (id: string) => client.get<Project>(`/projects/${id}`),
  update: (id: string, data: UpdateProjectDto) =>
    client.patch<Project>(`/projects/${id}`, data),
  delete: (id: string) => client.delete(`/projects/${id}`),
  addMember: (projectId: string, userId: string, role = 'member') =>
    client.post(`/projects/${projectId}/members`, { userId, role }),
  removeMember: (projectId: string, userId: string) =>
    client.delete(`/projects/${projectId}/members/${userId}`),
};
