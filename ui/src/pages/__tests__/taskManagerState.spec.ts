import { describe, expect, it } from 'vitest';
import {
  applyTaskServerUpdate,
  mapApiTaskToBoardTask,
  sortBoardTasks,
  updateBoardTaskStatus,
} from '../taskManagerState';
import { TaskPriority, TaskStatus, type Task as ApiTask } from '../../api/tasks';
import type { Task as BoardTask } from '../../components/tasks/types';

const buildApiTask = (overrides: Partial<ApiTask> = {}): ApiTask => ({
  id: 'task-1',
  title: 'Review model outputs',
  description: 'Check final synthesis.',
  status: TaskStatus.BACKLOG,
  priority: TaskPriority.HIGH,
  projectId: 'project-1',
  createdAt: '2026-04-13T00:00:00.000Z',
  updatedAt: '2026-04-13T01:00:00.000Z',
  ...overrides,
});

const buildBoardTask = (overrides: Partial<BoardTask> = {}): BoardTask => ({
  id: 'task-1',
  status: 'backlog',
  code: '#TASK-TASK',
  title: 'Review model outputs',
  priority: TaskPriority.HIGH,
  agent: {
    name: 'Unassigned',
    colorClass: 'bg-surface-container-highest border-outline-variant/30',
  },
  isActive: false,
  progress: 0,
  projectId: 'project-1',
  updatedAt: '2026-04-13T01:00:00.000Z',
  ...overrides,
});

describe('taskManagerState', () => {
  it('maps API tasks into board tasks with stable defaults', () => {
    expect(
      mapApiTaskToBoardTask(
        buildApiTask({
          id: 'abcd-1234',
          assignee: { id: 'agent-1', name: 'Atlas' },
        }),
        'project-1',
      ),
    ).toEqual({
      id: 'abcd-1234',
      status: 'backlog',
      code: '#TASK-ABCD',
      title: 'Review model outputs',
      priority: TaskPriority.HIGH,
      agent: {
        name: 'Atlas',
        emoji: undefined,
        colorClass: 'bg-surface-container-highest border-outline-variant/30',
      },
      isActive: false,
      progress: 0,
      projectId: 'project-1',
      updatedAt: '2026-04-13T01:00:00.000Z',
    });
  });

  it('sorts backlog by priority and active work by most recent update', () => {
    const backlogHigh = buildBoardTask({ id: 'a', priority: TaskPriority.HIGH, updatedAt: '2026-04-13T01:00:00.000Z' });
    const backlogLow = buildBoardTask({ id: 'b', priority: TaskPriority.LOW, updatedAt: '2026-04-13T03:00:00.000Z' });
    const inProgressNew = buildBoardTask({ id: 'c', status: 'in-progress', updatedAt: '2026-04-13T04:00:00.000Z' });
    const inProgressOld = buildBoardTask({ id: 'd', status: 'in-progress', updatedAt: '2026-04-13T02:00:00.000Z' });

    expect([backlogLow, inProgressOld, backlogHigh, inProgressNew].sort(sortBoardTasks).map((task) => task.id)).toEqual([
      'a',
      'b',
      'c',
      'd',
    ]);
  });

  it('replaces, inserts, and removes tasks from cached board data', () => {
    const current = [buildBoardTask(), buildBoardTask({ id: 'task-2', updatedAt: '2026-04-13T02:00:00.000Z' })];

    expect(
      applyTaskServerUpdate(current, 'updated', buildApiTask({ id: 'task-2', status: TaskStatus.IN_PROGRESS }), 'project-1').map(
        (task) => [task.id, task.status],
      ),
    ).toEqual([
      ['task-1', 'backlog'],
      ['task-2', 'in-progress'],
    ]);

    expect(
      applyTaskServerUpdate(current, 'created', buildApiTask({ id: 'task-3', updatedAt: '2026-04-13T03:00:00.000Z' }), 'project-1').map(
        (task) => task.id,
      ),
    ).toEqual(['task-1', 'task-2', 'task-3']);

    expect(
      applyTaskServerUpdate(current, 'deleted', buildApiTask({ id: 'task-1' }), 'project-1').map((task) => task.id),
    ).toEqual(['task-2']);

    expect(
      applyTaskServerUpdate(current, 'updated', buildApiTask({ id: 'task-1', status: TaskStatus.ARCHIVED }), 'project-1').map(
        (task) => task.id,
      ),
    ).toEqual(['task-2']);
  });

  it('updates cached task status without mutating unrelated entries', () => {
    expect(
      updateBoardTaskStatus(
        [buildBoardTask(), buildBoardTask({ id: 'task-2', status: 'review', isActive: false })],
        'task-2',
        'in-progress',
      ),
    ).toEqual([
      buildBoardTask(),
      buildBoardTask({ id: 'task-2', status: 'in-progress', isActive: true, progress: 50 }),
    ]);
  });
});
