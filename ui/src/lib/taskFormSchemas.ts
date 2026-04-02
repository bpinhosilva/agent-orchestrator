import { z } from 'zod';
import { TaskPriority, TaskStatus } from '../api/tasks';

export const TASK_TEMPLATE = `# Background

# To Do

# Validation`;

export const DEFAULT_AGENT_INSTRUCTIONS = `# ROLE DEFINITION
Act as a high-level quantitative researcher.
Prioritize source credibility and peer-reviewed data.

# OUTPUT FORMAT
Return all results in Markdown tables with clear citations.`;

const taskPriorityValues = [
  TaskPriority.CRITICAL,
  TaskPriority.HIGH,
  TaskPriority.MEDIUM,
  TaskPriority.LOW,
] as const;

const taskPrioritySchema = z
  .number({ error: 'Priority is required' })
  .int()
  .refine((value) => taskPriorityValues.includes(value as (typeof taskPriorityValues)[number]), {
    message: 'Select a valid priority level',
  });

const taskDetailStatusValues = [
  TaskStatus.BACKLOG,
  TaskStatus.IN_PROGRESS,
  TaskStatus.REVIEW,
  TaskStatus.DONE,
] as const;

const createTaskStatusValues = [
  TaskStatus.BACKLOG,
  TaskStatus.IN_PROGRESS,
  TaskStatus.REVIEW,
] as const;

export const taskDetailSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Node designation is required')
    .max(120, 'Node designation must be 120 characters or fewer'),
  description: z
    .string()
    .trim()
    .min(1, 'Objective / parameters are required')
    .max(2000, 'Objective / parameters must be 2000 characters or fewer'),
  status: z.enum(taskDetailStatusValues, {
    error: 'Select a valid status',
  }),
  priority: taskPrioritySchema,
  assigneeId: z.string(),
});

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Task title is required')
    .max(120, 'Task title must be 120 characters or fewer'),
  description: z
    .string()
    .trim()
    .min(1, 'Objective / description is required')
    .max(2000, 'Objective / description must be 2000 characters or fewer'),
  status: z.enum(createTaskStatusValues, {
    error: 'Select a valid initial status',
  }),
  priority: taskPrioritySchema,
  assigneeId: z.string(),
  projectId: z.string().trim().min(1, 'Target project is required'),
});

export const createAgentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Agent name is required')
    .max(80, 'Agent name must be 80 characters or fewer'),
  role: z
    .string()
    .trim()
    .min(1, 'Primary role is required')
    .max(80, 'Primary role must be 80 characters or fewer'),
  description: z.string().max(1000, 'Description must be 1000 characters or fewer'),
  providerId: z.string().trim().min(1, 'Provider is required'),
  modelId: z.string().trim().min(1, 'Model is required'),
  instructions: z.string().max(1000, 'System instructions must be 1000 characters or fewer'),
});

export type TaskDetailFormValues = {
  title: string;
  description: string;
  status: (typeof taskDetailStatusValues)[number];
  priority: number;
  assigneeId: string;
};

export type CreateTaskFormValues = {
  title: string;
  description: string;
  status: (typeof createTaskStatusValues)[number];
  priority: number;
  assigneeId: string;
  projectId: string;
};

export type CreateAgentFormValues = {
  name: string;
  role: string;
  description: string;
  providerId: string;
  modelId: string;
  instructions: string;
};
