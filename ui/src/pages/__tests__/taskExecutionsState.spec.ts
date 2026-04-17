import { describe, expect, it } from 'vitest';
import {
  TASK_EXECUTIONS_LIMIT,
  buildExecutionsQueryKey,
  buildRecurrentTaskQueryKey,
  buildTaskExecutionsSummary,
  getNextRunInfo,
} from '../taskExecutionsState';
import { ExecStatus, RecurrentTaskStatus, type RecurrentTask, type RecurrentTaskExec } from '../../api/recurrent-tasks';
import { TaskPriority } from '../../api/tasks';

const buildTask = (overrides: Partial<RecurrentTask> = {}): RecurrentTask => ({
  id: 'task-1',
  title: 'Daily Market Sweep',
  description: 'Scan the market every morning.',
  status: RecurrentTaskStatus.ACTIVE,
  priority: TaskPriority.MEDIUM,
  cronExpression: '0 0 * * *',
  assignee: { id: 'agent-1', name: 'Fin-Oracle' },
  createdAt: '2026-04-13T00:00:00.000Z',
  updatedAt: '2026-04-13T01:00:00.000Z',
  ...overrides,
});

const buildExecution = (overrides: Partial<RecurrentTaskExec> = {}): RecurrentTaskExec => ({
  id: 'exec-1',
  status: ExecStatus.SUCCESS,
  result: 'Completed',
  latencyMs: 60_000,
  artifacts: null,
  createdAt: '2026-04-13T01:00:00.000Z',
  updatedAt: '2026-04-13T01:00:00.000Z',
  ...overrides,
});

describe('taskExecutionsState', () => {
  it('exports stable query keys and pagination defaults', () => {
    expect(TASK_EXECUTIONS_LIMIT).toBe(10);
    expect(buildRecurrentTaskQueryKey('project-1', 'task-1')).toEqual(['recurrent-task', 'project-1', 'task-1']);
    expect(buildExecutionsQueryKey('project-1', 'task-1', 2)).toEqual([
      'recurrent-task',
      'project-1',
      'task-1',
      'executions',
      2,
      10,
    ]);
  });

  it('computes success, average latency, and bar data from executions', () => {
    const summary = buildTaskExecutionsSummary([
      buildExecution({ id: 'exec-1', latencyMs: 30_000 }),
      buildExecution({ id: 'exec-2', latencyMs: 60_000 }),
      buildExecution({ id: 'exec-3', status: ExecStatus.FAILURE, latencyMs: 90_000 }),
      buildExecution({ id: 'exec-4', status: ExecStatus.RUNNING, latencyMs: 0 }),
    ]);

    expect(summary.completedExecutions).toHaveLength(3);
    expect(summary.successRate).toBeCloseTo(66.666, 2);
    expect(summary.avgLatencyMs).toBe(60_000);
    expect(summary.barData).toHaveLength(3);
    expect(summary.barData[0]?.label).toBe('30s');
  });

  it('derives next-run info only for active tasks with a valid cron expression', () => {
    expect(getNextRunInfo(buildTask({ cronExpression: '*/5 * * * *' }), new Date('2026-04-13T00:00:00.000Z'))).toEqual({
      relative: 'in 5m',
      absolute: '00:05:00 UTC',
    });

    expect(getNextRunInfo(buildTask({ status: RecurrentTaskStatus.PAUSED }), new Date('2026-04-13T00:00:00.000Z'))).toBeNull();
    expect(getNextRunInfo(buildTask({ cronExpression: 'not-a-cron' }), new Date('2026-04-13T00:00:00.000Z'))).toBeNull();
  });
});
