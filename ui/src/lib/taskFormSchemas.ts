import { z } from 'zod';
import { TaskPriority, TaskStatus } from '../api/tasks';
import { AGENT_EMOJI_VALUES } from './agentEmojis';

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
  .coerce.number({ error: 'Priority is required' })
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

const isValidCronFieldCount = (cronExpression: string) => {
  const fields = cronExpression.trim().split(/\s+/);
  return fields.length === 5 || fields.length === 6;
};

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

export const recurrentTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Task name is required')
    .max(120, 'Task name must be 120 characters or fewer'),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(2000, 'Description must be 2000 characters or fewer'),
  cronExpression: z
    .string()
    .trim()
    .min(1, 'Cron expression is required')
    .refine(isValidCronFieldCount, {
      message: 'Invalid cron format (expected 5 or 6 fields)',
    }),
  assigneeId: z.string().trim().min(1, 'Please select an agent'),
  priority: taskPrioritySchema,
});

const attributeValue = z
  .number()
  .min(1, 'Must be at least 1')
  .max(5, 'Must be at most 5')
  .refine((v) => Math.round(v * 100) === v * 100, {
    message: 'Maximum 2 decimal places',
  });

export const agentAttributesSchema = z.object({
  creativity: attributeValue.optional(),
  strictness: attributeValue.optional(),
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
  emoji: z.enum(AGENT_EMOJI_VALUES, {
    error: 'Select a valid emoji signature',
  }),
  providerId: z.string().trim().min(1, 'Provider is required'),
  modelId: z.string().trim().min(1, 'Model is required'),
  instructions: z.string().max(1000, 'System instructions must be 1000 characters or fewer'),
  attributes: agentAttributesSchema.optional(),
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

export type RecurrentTaskFormValues = {
  title: string;
  description: string;
  cronExpression: string;
  assigneeId: string;
  priority: number;
};

export type CreateAgentFormValues = {
  name: string;
  role: string;
  description: string;
  emoji: (typeof AGENT_EMOJI_VALUES)[number];
  providerId: string;
  modelId: string;
  instructions: string;
  attributes?: {
    creativity?: number;
    strictness?: number;
  };
};
