import React, { memo, useId, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { MoreHorizontal } from 'lucide-react';
import TaskCard from './TaskCard';
import type { Task, TaskStatus } from './types';
import { cn } from '../../lib/cn';

interface TaskColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  dotColorClass: string;
  badgeBgClass: string;
  badgeTextClass: string;
}

const TaskColumnComponent: React.FC<TaskColumnProps> = ({
  id,
  title,
  tasks,
  dotColorClass,
  badgeBgClass,
  badgeTextClass,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const headingId = useId();
  const taskIds = useMemo(() => tasks.map((task) => task.id), [tasks]);

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-5">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={cn('h-2 w-2 rounded-full', dotColorClass)}
          />
          <h3
            id={headingId}
            className={cn(
              'font-headline text-sm font-bold uppercase tracking-widest',
              badgeTextClass,
            )}
          >
            {title}
          </h3>
          <span
            aria-label={`${tasks.length} tasks`}
            className={cn(
              'rounded px-1.5 py-0.5 text-[10px] font-bold',
              badgeBgClass,
              badgeTextClass,
            )}
          >
            {tasks.length}
          </span>
        </div>
        <button
          type="button"
          disabled
          aria-label={`${title} column options unavailable`}
          title={`${title} column options unavailable`}
          className={cn(
            'transition-colors',
            'text-outline hover:text-primary',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-outline',
          )}
        >
          <MoreHorizontal size={18} aria-hidden="true" />
        </button>
      </div>

      <div
        ref={setNodeRef}
        role="list"
        aria-labelledby={headingId}
        className={cn(
          'flex min-h-[300px] flex-col gap-5 rounded-xl transition-colors duration-200',
          isOver && 'bg-surface-container-high/30 ring-2 ring-outline-variant/20',
        )}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
        {tasks.length === 0 ? (
          <p className="sr-only">{title} column is empty.</p>
        ) : null}
      </div>
    </section>
  );
};

const TaskColumn = memo(TaskColumnComponent);

export default TaskColumn;
