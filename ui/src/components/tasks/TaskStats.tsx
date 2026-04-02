import React from 'react';
import { Sparkles } from 'lucide-react';
import type { Task } from './types';

interface TaskStatsProps {
  tasks: Task[];
  taskCounts: Record<Task['status'], number>;
  projectTitle: string;
}

const TaskStats: React.FC<TaskStatsProps> = ({ tasks, taskCounts, projectTitle }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div
      className="glass-card p-6 rounded-2xl border border-outline-variant/10 col-span-1 md:col-span-2 flex flex-col md:flex-row justify-between items-center gap-6"
      style={{ background: 'rgba(34, 42, 61, 0.4)', backdropFilter: 'blur(12px)' }}
    >
      <div>
        <h3 className="font-headline font-bold text-lg text-on-surface">Efficiency Matrix</h3>
        <p className="text-outline text-sm">System performance metrics for active sector.</p>
        <div className="mt-4 flex gap-6">
          <div className="flex flex-col">
            <span className="text-2xl font-extrabold text-primary">{taskCounts.done}</span>
            <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Completed</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-extrabold text-secondary">{taskCounts['in-progress']}</span>
            <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Active Nodes</span>
          </div>
        </div>
      </div>

      <div className="w-full md:w-48 h-24 bg-surface-container-highest/30 rounded-lg relative overflow-hidden flex items-end px-2 gap-1">
        {['backlog', 'in-progress', 'review', 'done'].map((status, i) => {
          const count = taskCounts[status as keyof typeof taskCounts];
          const height = tasks.length > 0 ? (count / tasks.length) * 100 : 10;
          return (
            <div
              key={status}
              className="w-full bg-primary/40 rounded-t transition-all duration-500"
              style={{ height: `${Math.max(height, 5)}%`, opacity: 0.3 + i * 0.2 }}
            />
          );
        })}
        <div className="absolute inset-0 pointer-events-none opacity-30 flex items-center justify-center">
          <span className="text-primary text-[8px] font-mono uppercase tracking-[0.5em]">Live Stats</span>
        </div>
      </div>
    </div>

    <div className="bg-tertiary-container/10 p-6 rounded-2xl border border-tertiary/10 relative overflow-hidden group">
      <div className="absolute -right-4 -top-4 text-tertiary/5 text-8xl transition-transform group-hover:scale-110">
        <Sparkles size={80} />
      </div>
      <h3 className="font-headline font-bold text-tertiary">Orchestration Info</h3>
      <p className="text-on-surface-variant text-sm mt-2 relative z-10">
        {tasks.length > 0
          ? `Managing ${tasks.length} tasks across ${projectTitle}. Drag tasks between columns to update their operational status.`
          : 'Initialize new tasks to begin sector orchestration. Tasks will automatically be mapped to assigned intelligence nodes.'}
      </p>
    </div>
  </div>
);

export default TaskStats;
