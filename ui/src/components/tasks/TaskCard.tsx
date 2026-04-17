import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, Clock, MessageSquare, Paperclip } from 'lucide-react';
import type { Task } from './types';
import { cn } from '../../lib/cn';
import { normalizeAgentEmoji } from '../../lib/agentEmojis';

interface TaskCardProps {
  task: Task;
  isOverlay?: boolean;
}

const getPriorityColor = (priority?: number) => {
  if (priority === 0) {
    return 'bg-error text-white shadow-[0_0_10px_rgba(255,107,107,0.3)]';
  }

  if (priority === 1) {
    return 'bg-error-container/40 font-black text-error';
  }

  if (priority === 2) {
    return 'bg-secondary-container/40 font-black text-secondary';
  }

  return 'bg-surface-container-highest font-black text-on-surface-variant';
};

const getPriorityLabel = (priority?: number) => {
  if (priority === 0) return 'Critical';
  if (priority === 1) return 'High';
  if (priority === 2) return 'Medium';
  return 'Low';
};

const getPriorityBadgeLabel = (priority?: number) => {
  if (priority === 0) return 'CRIT';
  if (priority === 1) return 'HIGH';
  if (priority === 2) return 'MED';
  return 'LOW';
};

const renderTimeIcon = (timeIcon?: Task['timeIcon']) => {
  switch (timeIcon) {
    case 'schedule':
      return <Clock size={14} className="mr-1" aria-hidden="true" />;
    case 'attach_file':
      return <Paperclip size={14} className="mr-1" aria-hidden="true" />;
    case 'comment':
      return <MessageSquare size={14} className="mr-1" aria-hidden="true" />;
    default:
      return null;
  }
};

const TaskCardComponent: React.FC<TaskCardProps> = ({ task, isOverlay }) => {
  const navigate = useNavigate();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: sortableDragging,
  } = useSortable({ id: isOverlay ? `overlay-${task.id}` : task.id, data: { ...task } });

  const isDragging = isOverlay ? false : sortableDragging;
  const isDone = task.status === 'done';
  const isActive = task.isActive;
  const showActiveDetails = isActive || isOverlay;
  const priorityLabel = getPriorityLabel(task.priority);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleClick = () => {
    if (!isOverlay) {
      navigate(`/projects/${task.projectId}/tasks/${task.id}`);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'group relative flex h-full cursor-grab flex-col overflow-hidden rounded-xl border p-4 shadow-xl transition-all duration-300 active:cursor-grabbing',
        isDragging && 'scale-[0.98] border-outline-variant/20 bg-surface-container-low opacity-40 grayscale',
        isOverlay &&
          'z-[100] scale-[1.05] cursor-grabbing border-primary/60 bg-surface-container-high shadow-[0_20px_50px_rgba(173,198,255,0.3)] ring-2 ring-primary/40 antialiased',
        !isDragging &&
          !isOverlay &&
          isDone &&
          'border-outline-variant/10 bg-surface-container-low opacity-70 shadow-sm grayscale hover:opacity-100 hover:grayscale-0',
        !isDragging &&
          !isOverlay &&
          !isDone &&
          'border-outline-variant/10 bg-surface-container-low hover:border-primary/30 hover:shadow-primary/5',
        !isDragging &&
          !isOverlay &&
          !isDone &&
          isActive &&
          'border-primary/40 bg-surface-container-high/50 shadow-lg',
      )}
      onClick={handleClick}
      aria-label={`Task ${task.code}: ${task.title}. ${priorityLabel} priority. Status ${task.status}.${isOverlay ? ' Drag preview active.' : ' Drag to move or open details.'}`}
      aria-roledescription="Draggable task card"
    >
      <span className="sr-only">
        {isOverlay
          ? 'Dragging preview.'
          : 'Press space to start dragging this task, then use arrow keys to move it.'}
      </span>

      <div className="mb-3 flex items-start justify-between">
        <span
          className={cn(
            'rounded px-2 py-0.5 font-headline text-[10px] font-black uppercase tracking-widest transition-colors',
            showActiveDetails
              ? 'border border-primary/20 bg-primary-container/30 text-primary'
              : 'bg-surface-container-highest/30 text-on-surface-variant/40',
          )}
        >
          {task.code}
        </span>
        {isDone ? (
          <div
            aria-label="Completed task"
            className="flex h-4 w-4 items-center justify-center rounded-full bg-secondary-container/30"
          >
            <Check size={10} className="font-bold text-secondary" aria-hidden="true" />
          </div>
        ) : (
          <span
            aria-label={`${priorityLabel} priority`}
            className={cn(
              'rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-widest transition-colors',
              showActiveDetails || isOverlay
                ? getPriorityColor(task.priority)
                : 'bg-transparent text-on-surface-variant/60',
            )}
          >
            {getPriorityBadgeLabel(task.priority)}
          </span>
        )}
      </div>

      <h4
        className={cn(
          'mb-4 text-base font-headline font-extrabold leading-tight transition-colors',
          isDone
            ? 'text-outline line-through'
            : 'text-on-surface group-hover:text-primary',
        )}
      >
        {task.title}
      </h4>

      <div className="mt-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'rounded border border-outline-variant/10 bg-surface-container-highest/50 p-1',
              showActiveDetails && 'border-primary/30',
            )}
          >
            <span
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-sm text-sm',
                isDone && 'grayscale',
              )}
              aria-label={`${task.agent.name} emoji`}
            >
              {normalizeAgentEmoji(task.agent.emoji)}
            </span>
          </div>
          <span
            className={cn(
              'text-[11px] font-bold tracking-tight',
              showActiveDetails ? 'text-on-surface' : 'text-on-surface-variant/40',
            )}
          >
            {task.agent.name}
          </span>
        </div>

        {isDone ? (
          <span className="text-[10px] font-black tracking-widest text-secondary">
            COMPLETED
          </span>
        ) : (
          task.timeIcon &&
          !showActiveDetails && (
            <div
              className="flex items-center text-[10px] font-black uppercase tracking-widest text-on-surface-variant/30"
              aria-label={`${task.timeLabel ?? 'Task detail'} ${task.timeValue ?? ''}`.trim()}
            >
              {renderTimeIcon(task.timeIcon)}
              {task.timeValue}
            </div>
          )
        )}
      </div>
    </div>
  );
};

const TaskCard = memo(TaskCardComponent);

export default TaskCard;
