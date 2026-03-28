import React from 'react';
import TaskColumn from './TaskColumn';
import type { Task, TaskStatus } from './types';

interface TaskBoardProps {
  tasks: Task[];
}

const TaskBoard: React.FC<TaskBoardProps> = ({ tasks }) => {
  const columns: { id: TaskStatus; title: string; dot: string; bg: string; text: string }[] = [
    { id: 'backlog', title: 'Backlog', dot: 'bg-outline', bg: 'bg-surface-container-high', text: 'text-outline-variant' },
    { id: 'in-progress', title: 'In-Progress', dot: 'bg-primary animate-pulse', bg: 'bg-primary-container', text: 'text-primary' },
    { id: 'review', title: 'Review', dot: 'bg-tertiary', bg: 'bg-tertiary-container', text: 'text-tertiary' },
    { id: 'done', title: 'Done', dot: 'bg-secondary', bg: 'bg-secondary-container/20', text: 'text-secondary' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
      {columns.map(col => (
        <TaskColumn
          key={col.id}
          id={col.id}
          title={col.title}
          dotColorClass={col.dot}
          badgeBgClass={col.bg}
          badgeTextClass={col.text}
          tasks={tasks.filter(t => t.status === col.id)}
          colorClass=""
        />
      ))}
    </div>
  );
};

export default TaskBoard;
