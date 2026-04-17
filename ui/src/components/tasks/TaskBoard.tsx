import React, { memo, useMemo } from 'react';
import TaskColumn from './TaskColumn';
import type { Task, TaskStatus } from './types';
import { cn } from '../../lib/cn';

type BoardColumnId = Exclude<TaskStatus, 'archived'>;

const BOARD_COLUMNS: ReadonlyArray<{
  id: BoardColumnId;
  title: string;
  dotColorClass: string;
  badgeBgClass: string;
  badgeTextClass: string;
}> = [
  {
    id: 'backlog',
    title: 'Backlog',
    dotColorClass: 'bg-outline',
    badgeBgClass: 'bg-surface-container-high',
    badgeTextClass: 'text-outline-variant',
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    dotColorClass: 'bg-primary animate-pulse',
    badgeBgClass: 'bg-primary-container',
    badgeTextClass: 'text-primary',
  },
  {
    id: 'review',
    title: 'Review',
    dotColorClass: 'bg-tertiary',
    badgeBgClass: 'bg-tertiary-container',
    badgeTextClass: 'text-tertiary',
  },
  {
    id: 'done',
    title: 'Done',
    dotColorClass: 'bg-secondary',
    badgeBgClass: 'bg-secondary-container/20',
    badgeTextClass: 'text-secondary',
  },
];

interface TaskBoardProps {
  tasks: Task[];
}

const TaskBoardComponent: React.FC<TaskBoardProps> = ({ tasks }) => {
  const tasksByStatus = useMemo(() => {
    const grouped: Record<BoardColumnId, Task[]> = {
      backlog: [],
      'in-progress': [],
      review: [],
      done: [],
    };

    tasks.forEach((task) => {
      if (task.status !== 'archived') {
        grouped[task.status].push(task);
      }
    });

    return grouped;
  }, [tasks]);

  return (
    <section
      aria-label="Kanban task board"
      className={cn('grid grid-cols-1 items-start gap-6 md:grid-cols-2 lg:grid-cols-4')}
    >
      {BOARD_COLUMNS.map((column) => (
        <TaskColumn
          key={column.id}
          id={column.id}
          title={column.title}
          dotColorClass={column.dotColorClass}
          badgeBgClass={column.badgeBgClass}
          badgeTextClass={column.badgeTextClass}
          tasks={tasksByStatus[column.id]}
        />
      ))}
    </section>
  );
};

const TaskBoard = memo(TaskBoardComponent);

export default TaskBoard;
