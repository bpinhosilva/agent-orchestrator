import React, { useState, useEffect, useCallback } from 'react';
import { ListPlus, Sparkles, ArrowRight, ShieldAlert, Layout } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import TaskBoard from '../components/tasks/TaskBoard';
import CreateTaskModal from '../components/tasks/CreateTaskModal';
import { useProject } from '../hooks/useProject';
import { useNotification } from '../hooks/useNotification';
import { tasksApi, TaskStatus } from '../api/tasks';
import type { Task as ComponentTask } from '../components/tasks/types';

const TaskManager: React.FC = () => {
  const { activeProject, loading: projectLoading } = useProject();
  const { notifyApiError, notifyError } = useNotification();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [tasks, setTasks] = useState<ComponentTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchTasks = useCallback(async () => {
    if (!activeProject) return;
    try {
      setLoadingTasks(true);
      const res = await tasksApi.findAll(activeProject.id);
      
      const mappedTasks: ComponentTask[] = res.data.map((t) => ({
        id: t.id,
        status: t.status as ComponentTask['status'],
        code: `#TASK-${t.id.substring(0, 4).toUpperCase()}`,
        title: t.title,
        priority: t.priority as ComponentTask['priority'],
        agent: {
          name: t.assignee?.name || 'Unassigned',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(t.assignee?.name || 'U')}&background=random&color=fff`,
          colorClass: 'bg-surface-container-highest border-outline-variant/30'
        },
        isActive: t.status === 'in-progress',
        progress: t.status === 'done' ? 100 : t.status === 'in-progress' ? 50 : 0,
        projectId: activeProject.id
      }));

      setTasks(mappedTasks);
    } catch (error) {
      console.error('Failed to fetch tasks in TaskManager:', error);
      notifyApiError(error, 'Fetch Error');
    } finally {
      setLoadingTasks(false);
    }
  }, [activeProject, notifyApiError]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks, refreshKey]);

  const handleTaskCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
     if (!activeProject) return;
     try {
       await tasksApi.update(activeProject.id, taskId, { status: newStatus as TaskStatus });
       // No need to fetch here, TaskBoard already updated optimistically in most cases, 
       // but we could refresh to be sure or just update local state if needed.
       setTasks(prev => prev.map(t => t.id === taskId ? { 
          ...t, 
          status: newStatus as ComponentTask['status'],
          isActive: newStatus === 'in-progress'
        } : t));
     } catch (error) {
       console.error('Failed to update task status:', error);
      notifyError('Status Update Failed', 'Failed to update task status in the neural mesh.');
      fetchTasks(); // Reload on error
    }
  };

  if (projectLoading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-on-surface-variant text-sm font-black uppercase tracking-[0.3em] animate-pulse">Initializing Neural Mesh</p>
        </div>
      </div>
    );
  }

  if (!activeProject) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 bg-surface-container-highest rounded-3xl flex items-center justify-center text-on-surface-variant/20 mx-auto border border-outline-variant/10 shadow-xl">
             <Layout size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black font-headline text-white tracking-tight">No Active Sectors Found</h2>
            <p className="text-on-surface-variant text-sm leading-relaxed">The orchestration grid is currently offline. Please initialize a new project sector in the sidebar to begin commissioning agentic tasks.</p>
          </div>
          <NavLink 
            to="/" 
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-on-primary rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            Go to Dashboard
            <ArrowRight size={16} />
          </NavLink>
        </div>
      </div>
    );
  }

  const missingLead = !activeProject.ownerAgent;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Missing Lead Warning */}
      {missingLead && (
        <div className="bg-error/10 border border-error/20 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500 shadow-lg shadow-error/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-error/20 flex items-center justify-center text-error border border-error/30">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h4 className="text-sm font-black text-white uppercase tracking-tight">Administrative Protocol Warning</h4>
              <p className="text-xs text-on-surface-variant max-w-2xl leading-relaxed mt-0.5">
                The <span className="text-error font-bold italic">"{activeProject.title}"</span> sector currently lacks a Designated Lead Agent. 
                A lead is required to oversee autonomous task assignment, token allocation, and critical sector operations.
              </p>
            </div>
          </div>
          <NavLink 
            to={`/projects/${activeProject.id}`} 
            className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-error text-on-error text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap text-center shadow-lg shadow-error/20"
          >
            Assign Protocol Lead
          </NavLink>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Fleet Command</span>
             <div className="h-1 w-1 rounded-full bg-outline-variant/30" />
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/40">{activeProject.title}</span>
          </div>
          <h1 className="text-4xl font-extrabold font-headline tracking-tight text-white">Agentic Task Canvas</h1>
          <p className="text-outline text-sm mt-1">
            Orchestrating <span className="text-primary font-bold">{tasks.length}</span> parallel node operations
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-on-primary px-6 py-3 rounded-xl flex items-center gap-2 font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            <ListPlus size={18} />
            Commission Task
          </button>
        </div>
      </div>

      <CreateTaskModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onCreated={handleTaskCreated}
      />

      {/* Kanban Board */}
      {loadingTasks && tasks.length === 0 ? (
        <div className="w-full h-96 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border border-outline-variant/30 border-t-primary animate-spin rounded-full"></div>
        </div>
      ) : (
        <TaskBoard 
            projectId={activeProject.id} 
            tasks={tasks} 
            onTasksChange={setTasks}
            onStatusChange={handleStatusChange}
        />
      )}

      {/* Stats Section with dynamic data if possible, else simplified */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-outline-variant/10 col-span-1 md:col-span-2 flex flex-col md:flex-row justify-between items-center gap-6" style={{ background: 'rgba(34, 42, 61, 0.4)', backdropFilter: 'blur(12px)' }}>
          <div>
            <h3 className="font-headline font-bold text-lg text-on-surface">Efficiency Matrix</h3>
            <p className="text-outline text-sm">System performance metrics for active sector.</p>
            <div className="mt-4 flex gap-6">
              <div className="flex flex-col">
                <span className="text-2xl font-extrabold text-primary">
                    {tasks.filter(t => t.status === 'done').length}
                </span>
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Completed</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-extrabold text-secondary">
                    {tasks.filter(t => t.status === 'in-progress').length}
                </span>
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Active Nodes</span>
              </div>
            </div>
          </div>
          
          <div className="w-full md:w-48 h-24 bg-surface-container-highest/30 rounded-lg relative overflow-hidden flex items-end px-2 gap-1">
             {/* Dynamic mini-bars based on real counts */}
            {['backlog', 'in-progress', 'review', 'done'].map((status, i) => {
                const count = tasks.filter(t => t.status === status).length;
                const height = tasks.length > 0 ? (count / tasks.length) * 100 : 10;
                return (
                    <div 
                        key={status} 
                        className="w-full bg-primary/40 rounded-t transition-all duration-500" 
                        style={{ height: `${Math.max(height, 5)}%`, opacity: 0.3 + (i * 0.2) }}
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
                ? `Managing ${tasks.length} tasks across ${activeProject.title}. Drag tasks between columns to update their operational status.`
                : "Initialize new tasks to begin sector orchestration. Tasks will automatically be mapped to assigned intelligence nodes."
              }
          </p>
        </div>
      </div>
    </div>
  );
};

export default TaskManager;
