import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { MoreHorizontal, Archive } from 'lucide-react';
import TaskCard from './TaskCard';
import type { Task, TaskStatus } from './types';

interface TaskColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  colorClass: string;
  dotColorClass: string;
  badgeBgClass: string;
  badgeTextClass: string;
}

const TaskColumn: React.FC<TaskColumnProps> = ({ 
  id, 
  title, 
  tasks, 
  dotColorClass, 
  badgeBgClass, 
  badgeTextClass 
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${dotColorClass}`}></span>
          <h3 className={`font-headline font-bold text-sm uppercase tracking-widest ${dotColorClass.replace('bg-', 'text-').replace('animate-pulse', '')}`}>
            {title}
          </h3>
          <span className={`${badgeBgClass} ${badgeTextClass} text-[10px] px-1.5 py-0.5 rounded font-bold`}>
            {tasks.length}
          </span>
        </div>
        <button className="text-outline hover:text-primary transition-colors">
          <MoreHorizontal size={18} />
        </button>
      </div>

      <div 
        ref={setNodeRef} 
        className={`flex flex-col gap-5 min-h-[300px] rounded-xl transition-colors duration-200 ${isOver ? 'bg-surface-container-high/30 ring-2 ring-outline-variant/20' : ''}`}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>

        {id === 'done' && tasks.length > 0 && (
          <div className="border-2 border-dashed border-outline-variant/20 rounded-xl h-24 flex items-center justify-center text-outline-variant hover:border-outline-variant/40 transition-colors cursor-pointer">
            <Archive size={20} />
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskColumn;
