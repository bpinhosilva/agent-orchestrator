import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, Paperclip, MessageSquare, Zap, Check } from 'lucide-react';
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

  const isProminent = isDragging || isOverlay;
  const showActiveDetails = isActive && isProminent;

  let cardClasses = 'group rounded-xl p-4 border transition-all duration-300 shadow-xl cursor-grab active:cursor-grabbing relative overflow-hidden flex flex-col h-full';
  
  if (isDragging) {
    cardClasses += ' opacity-40 bg-surface-container-low border-outline-variant/20';
  } else if (isDone) {
    cardClasses += ' opacity-70 hover:opacity-100 bg-surface-container-low border-outline-variant/10 shadow-sm grayscale hover:grayscale-0';
  } else if (showActiveDetails) {
    cardClasses += ' bg-surface-container-high border-primary/40 shadow-[0_0_30px_rgba(173,198,255,0.15)] ring-1 ring-primary/20 scale-[1.02] z-50';
  } else {
    cardClasses += ' bg-surface-container-low border-outline-variant/10 hover:border-primary/30 hover:shadow-primary/5';
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
      {showActiveDetails && (
        <div className="absolute top-0 right-0 p-3">
          <Zap size={18} className="text-secondary fill-secondary drop-shadow-[0_0_8px_rgba(78,222,163,0.5)]" />
        </div>
      )}

      <div className="flex justify-between items-start mb-3">
        <span className={`text-[10px] font-black font-headline px-2 py-0.5 rounded tracking-widest uppercase transition-colors ${showActiveDetails ? 'text-primary bg-primary-container/30 border border-primary/20' : 'text-on-surface-variant/40 bg-surface-container-highest/30'}`}>
          {task.code}
        </span>
        {isDone ? (
          <div className="h-4 w-4 rounded-full bg-secondary-container/30 flex items-center justify-center">
            <Check size={10} className="text-secondary font-bold" />
          </div>
        ) : (
          <span className={`text-[10px] font-black px-2 py-0.5 rounded tracking-widest uppercase transition-colors ${showActiveDetails ? getPriorityColor(task.priority) : 'text-on-surface-variant/60 bg-transparent'}`}>
            {task.priority || 'LOW'}
          </span>
        )}
      </div>

      <h4 className={`font-headline font-extrabold mb-4 leading-tight transition-colors text-base ${isDone ? 'text-outline line-through' : 'text-on-surface group-hover:text-primary'}`}>
        {task.title}
      </h4>



      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2.5">
          <div className={`p-1 rounded bg-surface-container-highest/50 border border-outline-variant/10 ${showActiveDetails ? 'border-primary/30' : ''}`}>
            <img 
              src={task.agent.avatar} 
              alt="Agent" 
              className={`h-5 w-5 rounded-sm object-cover ${isDone ? 'grayscale' : ''}`}
            />
          </div>
          <span className={`text-[11px] font-bold tracking-tight ${showActiveDetails ? 'text-on-surface' : 'text-on-surface-variant/40'}`}>
            {task.agent.name}
          </span>
        </div>
        
        {isDone ? (
          <span className="text-[10px] text-secondary font-black tracking-widest">COMPLETED</span>
        ) : task.timeIcon && !showActiveDetails && (
          <div className="flex items-center text-on-surface-variant/30 text-[10px] font-black uppercase tracking-widest">
            {renderTimeIcon()} {task.timeValue}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
