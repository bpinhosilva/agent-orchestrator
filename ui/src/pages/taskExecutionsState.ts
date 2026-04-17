import { CronExpressionParser } from 'cron-parser';
import {
  ExecStatus,
  RecurrentTaskStatus,
  type RecurrentTask,
  type RecurrentTaskExec,
} from '../api/recurrent-tasks';

export const TASK_EXECUTIONS_LIMIT = 10;

export const buildRecurrentTaskQueryKey = (projectId: string, taskId: string) =>
  ['recurrent-task', projectId, taskId] as const;

export const buildExecutionsQueryKey = (
  projectId: string,
  taskId: string,
  page: number,
) => ['recurrent-task', projectId, taskId, 'executions', page, TASK_EXECUTIONS_LIMIT] as const;

export const formatDuration = (ms: number) => {
  if (!ms) return '0s';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  if (minutes > 0) {
    return `${minutes}m ${String(seconds % 60).padStart(2, '0')}s`;
  }

  return `${seconds}s`;
};

export const getNextRunInfo = (task: RecurrentTask, now = new Date()) => {
  if (task.status !== RecurrentTaskStatus.ACTIVE || !task.cronExpression) {
    return null;
  }

  try {
    const interval = CronExpressionParser.parse(task.cronExpression, {
      currentDate: now,
    });
    const next = interval.next().toDate();
    const diffMs = next.getTime() - now.getTime();
    const absolute = `${String(next.getUTCHours()).padStart(2, '0')}:${String(next.getUTCMinutes()).padStart(2, '0')}:${String(next.getUTCSeconds()).padStart(2, '0')} UTC`;

    if (diffMs <= 0) {
      return { relative: 'now', absolute };
    }

    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    let relative: string;
    if (diffDays > 0) {
      relative = `in ${diffDays}d ${diffHours % 24}h`;
    } else if (diffHours > 0) {
      relative = `in ${diffHours}h ${diffMin % 60}m`;
    } else if (diffMin > 0) {
      relative = `in ${diffMin}m`;
    } else {
      relative = `in ${diffSec}s`;
    }

    return { relative, absolute };
  } catch {
    return null;
  }
};

export const buildTaskExecutionsSummary = (executions: RecurrentTaskExec[]) => {
  const completedExecutions = executions.filter(
    (execution) =>
      execution.status === ExecStatus.SUCCESS || execution.status === ExecStatus.FAILURE,
  );
  const successCount = executions.filter(
    (execution) => execution.status === ExecStatus.SUCCESS,
  ).length;
  const successRate =
    completedExecutions.length > 0 ? (successCount / completedExecutions.length) * 100 : null;

  const executionsWithLatency = executions.filter((execution) => execution.latencyMs > 0);
  const avgLatencyMs =
    executionsWithLatency.length > 0
      ? executionsWithLatency.reduce((sum, execution) => sum + execution.latencyMs, 0) /
        executionsWithLatency.length
      : null;

  const barSlice = executionsWithLatency
    .slice()
    .sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
    .slice(-6);

  const barData =
    barSlice.length > 0
      ? (() => {
          const minHeight = 15;
          const latencies = barSlice.map((execution) => execution.latencyMs);
          const minLatency = Math.min(...latencies);
          const maxLatency = Math.max(...latencies);
          const range = maxLatency - minLatency;

          return barSlice.map((execution) => ({
            height:
              range > 0
                ? minHeight + ((execution.latencyMs - minLatency) / range) * (100 - minHeight)
                : 60,
            label: formatDuration(execution.latencyMs),
          }));
        })()
      : [40, 60, 50, 80, 75, 100].map((height) => ({ height, label: '' }));

  return {
    completedExecutions,
    successRate,
    avgLatencyMs,
    barData,
  };
};
