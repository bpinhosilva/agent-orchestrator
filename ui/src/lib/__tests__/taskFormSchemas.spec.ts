import { describe, it, expect } from 'vitest';
import { taskDetailSchema, createTaskSchema, recurrentTaskSchema } from '../taskFormSchemas';
import { TaskPriority, TaskStatus } from '../../api/tasks';

const validTaskDetailBase = {
  title: 'Node Alpha',
  description: 'Operational description',
  status: TaskStatus.BACKLOG,
  assigneeId: '',
};

const validCreateTaskBase = {
  title: 'Node Alpha',
  description: 'Operational description',
  status: TaskStatus.BACKLOG,
  assigneeId: '',
  projectId: 'project-1',
};

describe('taskDetailSchema – priority field', () => {
  it.each([
    TaskPriority.CRITICAL,
    TaskPriority.HIGH,
    TaskPriority.MEDIUM,
    TaskPriority.LOW,
  ])('accepts numeric priority %i', (priority) => {
    const result = taskDetailSchema.safeParse({ ...validTaskDetailBase, priority });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.priority).toBe(priority);
  });

  it.each([
    [String(TaskPriority.CRITICAL), TaskPriority.CRITICAL],
    [String(TaskPriority.HIGH), TaskPriority.HIGH],
    [String(TaskPriority.MEDIUM), TaskPriority.MEDIUM],
    [String(TaskPriority.LOW), TaskPriority.LOW],
  ])(
    'form-coerced string "%s" becomes number %i before reaching the schema',
    (strPriority, expected) => {
      // The form always coerces via Number() in reset() and onChange before Zod validates.
      // Verify that Number(string) produces a value the schema accepts.
      const numericPriority = Number(strPriority);
      const result = taskDetailSchema.safeParse({ ...validTaskDetailBase, priority: numericPriority });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.priority).toBe(expected);
    },
  );

  it('rejects undefined priority with "Priority is required"', () => {
    const result = taskDetailSchema.safeParse({ ...validTaskDetailBase, priority: undefined });
    expect(result.success).toBe(false);
    if (!result.success) {
      const priorityError = result.error.issues.find((i) => i.path[0] === 'priority');
      expect(priorityError?.message).toBe('Priority is required');
    }
  });

  it('rejects an out-of-range priority with "Select a valid priority level"', () => {
    const result = taskDetailSchema.safeParse({ ...validTaskDetailBase, priority: 99 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const priorityError = result.error.issues.find((i) => i.path[0] === 'priority');
      expect(priorityError?.message).toBe('Select a valid priority level');
    }
  });
});

describe('createTaskSchema – priority field', () => {
  it('accepts a numeric priority', () => {
    const result = createTaskSchema.safeParse({ ...validCreateTaskBase, priority: TaskPriority.HIGH });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.priority).toBe(TaskPriority.HIGH);
  });

  it('form-coerced string "1" becomes HIGH priority before reaching the schema', () => {
    const result = createTaskSchema.safeParse({ ...validCreateTaskBase, priority: Number('1') });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.priority).toBe(TaskPriority.HIGH);
  });
});

describe('recurrentTaskSchema – priority field', () => {
  it('accepts a numeric priority', () => {
    const result = recurrentTaskSchema.safeParse({
      title: 'Daily sweep',
      description: 'Runs every night',
      cronExpression: '0 0 * * *',
      assigneeId: 'agent-1',
      priority: TaskPriority.LOW,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.priority).toBe(TaskPriority.LOW);
  });

  it('form-coerced string "3" becomes LOW priority before reaching the schema', () => {
    const result = recurrentTaskSchema.safeParse({
      title: 'Daily sweep',
      description: 'Runs every night',
      cronExpression: '0 0 * * *',
      assigneeId: 'agent-1',
      priority: Number('3'),
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.priority).toBe(TaskPriority.LOW);
  });
});
