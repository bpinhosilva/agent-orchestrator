import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, Paperclip, MessageSquare, Zap, Eye, Check } from 'lucide-react';
import type { Task } from './types';

interface TaskCardProps {
  task: Task;
  isOverlay?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, isOverlay }) => {
  const navigate = useNavigate();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: _isDragging,
  } = useSortable({ id: isOverlay ? `overlay-${task.id}` : task.id, data: { ...task } });

  const isDragging = isOverlay ? false : _isDragging;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityColor = (p?: string) => {
    if (p === 'HIGH') return 'bg-error-container/20 text-error';
    if (p === 'MED') return 'bg-secondary-container/20 text-secondary';
    return 'bg-surface-container-highest text-outline';
  };

  const renderTimeIcon = () => {
    switch (task.timeIcon) {
      case 'schedule': return <Clock size={14} className="mr-1" />;
      case 'attach_file': return <Paperclip size={14} className="mr-1" />;
      case 'comment': return <MessageSquare size={14} className="mr-1" />;
      default: return null;
    }
  };

  const isDone = task.status === 'done';
  const isActive = task.isActive;

  let cardClasses = 'group rounded-xl p-4 border transition-all duration-300 shadow-xl cursor-grab active:cursor-grabbing relative overflow-hidden';
  
  if (isDragging) {
    cardClasses += ' opacity-50 ring-2 ring-primary bg-surface-container-high border-primary/50';
  } else if (isDone) {
    cardClasses += ' opacity-70 hover:opacity-100 surface-container-low border-outline-variant/10 shadow-sm grayscale hover:grayscale-0';
  } else if (isActive) {
    cardClasses += ' bg-surface-container-high border-primary/40 shadow-[0_0_20px_rgba(173,198,255,0.1)]';
  } else {
    cardClasses += ' surface-container-low border-outline-variant/10 hover:border-primary/30 hover:shadow-primary/5';
  }

  if (isOverlay) {
    cardClasses += ' rotate-2 scale-105 shadow-2xl z-50';
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners} 
      className={cardClasses}
      onClick={() => {
        if (!isOverlay) navigate(`/tasks/${task.id}`);
      }}
    >
      {isActive && (
        <div className="absolute top-0 right-0 p-2">
          <Zap size={16} className="text-primary fill-primary" />
        </div>
      )}

      <div className="flex justify-between items-start mb-3">
        <span className={`text-[10px] font-bold font-label px-2 py-0.5 rounded ${isActive ? 'text-primary bg-primary-container/50' : 'text-outline bg-surface-container-lowest'}`}>
          {task.code}
        </span>
        {isDone ? (
          <div className="h-4 w-4 rounded-full bg-secondary-container/30 flex items-center justify-center">
            <Check size={10} className="text-secondary font-bold" />
          </div>
        ) : (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
            {task.priority || 'LOW'}
          </span>
        )}
      </div>

      <h4 className={`font-headline font-bold mb-4 leading-tight transition-colors ${isDone ? 'text-outline line-through' : 'text-on-surface group-hover:text-primary'}`}>
        {task.title}
      </h4>

      {isActive && task.progress !== undefined && (
        <>
          <p className="text-[11px] text-outline mb-4">Processing nodes...</p>
          <div className="space-y-1.5 mb-4">
            <div className="flex justify-between text-[10px] font-bold text-on-surface-variant">
              <span>PROGRESS</span>
              <span>{task.progress}%</span>
            </div>
            <div className="h-1.5 w-full bg-surface-container-lowest rounded-full overflow-hidden">
              <div className="h-full bg-secondary rounded-full" style={{ width: `${task.progress}%` }}></div>
            </div>
          </div>
        </>
      )}

      {!isActive && task.progress !== undefined && (
        <div className="space-y-1.5 mb-4">
          <div className="h-1.5 w-full bg-surface-container-lowest rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${task.progress}%` }}></div>
          </div>
        </div>
      )}

      {task.awaitingReview && (
        <div className="bg-tertiary-container/10 border border-tertiary/10 p-2 rounded-lg mb-4">
          <div className="flex items-center gap-2 text-[10px] text-tertiary font-bold">
            <Eye size={12} /> Awaiting Human Validation
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2">
          <img 
            src={task.agent.avatar} 
            alt="Agent" 
            className={`h-6 w-6 rounded object-cover ${task.agent.colorClass || 'bg-surface-container-highest border border-outline-variant/30'} ${isDone ? 'grayscale' : ''}`}
          />
          <span className={`text-[11px] font-medium ${isActive ? 'text-on-surface' : (isDone ? 'text-outline/50' : 'text-outline')}`}>
            {task.agent.name}
          </span>
        </div>
        
        {isDone ? (
          <span className="text-[10px] text-secondary font-bold">COMPLETED</span>
        ) : task.timeIcon && (
          <div className="flex items-center text-outline text-[11px]">
            {renderTimeIcon()} {task.timeValue}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
