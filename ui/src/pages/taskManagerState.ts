import { type Task as ApiTask, TaskStatus } from '../api/tasks';
import type { Task as BoardTask } from '../components/tasks/types';

const BOARD_AGENT_COLOR_CLASS = 'bg-surface-container-highest border-outline-variant/30';

const getBoardProgress = (status: BoardTask['status']) => {
  if (status === 'done') {
    return 100;
  }

  if (status === 'in-progress') {
    return 50;
  }

  return 0;
};

const getStatusSortRank = (status: BoardTask['status']) => {
  switch (status) {
    case 'backlog':
      return 0;
    case 'in-progress':
      return 1;
    case 'review':
      return 2;
    case 'done':
      return 3;
    case 'archived':
      return 4;
  }
};

export function mapApiTaskToBoardTask(task: ApiTask, projectId: string): BoardTask {
  const status = task.status as BoardTask['status'];

  return {
    id: task.id,
    status,
    code: `#TASK-${task.id.substring(0, 4).toUpperCase()}`,
    title: task.title,
    priority: task.priority as BoardTask['priority'],
    agent: {
      name: task.assignee?.name || 'Unassigned',
      emoji: task.assignee?.emoji,
      colorClass: BOARD_AGENT_COLOR_CLASS,
    },
    isActive: status === 'in-progress',
    progress: getBoardProgress(status),
    projectId,
    updatedAt: task.updatedAt,
  };
}

export function sortBoardTasks(a: BoardTask, b: BoardTask): number {
  const statusRankDiff = getStatusSortRank(a.status) - getStatusSortRank(b.status);
  if (statusRankDiff !== 0) {
    return statusRankDiff;
  }

  if (a.status === 'backlog' && b.status === 'backlog') {
    const priorityDiff = (a.priority || 0) - (b.priority || 0);
    return priorityDiff !== 0 ? priorityDiff : a.id.localeCompare(b.id);
  }

  const updatedAtDiff =
    new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
  return updatedAtDiff !== 0 ? updatedAtDiff : a.id.localeCompare(b.id);
}

export function applyTaskServerUpdate(
  tasks: BoardTask[],
  event: string,
  updatedTaskData: ApiTask,
  projectId: string,
): BoardTask[] {
  if (event === 'deleted' || updatedTaskData.status === TaskStatus.ARCHIVED) {
    return tasks.filter((task) => task.id !== updatedTaskData.id);
  }

  const mappedTask = mapApiTaskToBoardTask(updatedTaskData, projectId);
  const existingTaskIndex = tasks.findIndex((task) => task.id === updatedTaskData.id);

  if (existingTaskIndex === -1) {
    return [...tasks, mappedTask].sort(sortBoardTasks);
  }

  return tasks
    .map((task) => (task.id === updatedTaskData.id ? mappedTask : task))
    .sort(sortBoardTasks);
}

export function updateBoardTaskStatus(
  tasks: BoardTask[],
  taskId: string,
  newStatus: BoardTask['status'],
): BoardTask[] {
  if (newStatus === 'archived') {
    return tasks.filter((task) => task.id !== taskId);
  }

  return tasks
    .map((task) =>
      task.id === taskId
        ? {
            ...task,
            status: newStatus,
            isActive: newStatus === 'in-progress',
            progress: getBoardProgress(newStatus),
          }
        : task,
    )
    .sort(sortBoardTasks);
}
