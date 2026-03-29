import React, { useState, useEffect, useCallback } from 'react';
import { ListPlus, Sparkles, ArrowRight, ShieldAlert, Layout } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import TaskBoard from '../components/tasks/TaskBoard';
import CreateTaskModal from '../components/tasks/CreateTaskModal';
import { useProject } from '../hooks/useProject';
import { useNotification } from '../hooks/useNotification';
import { useTaskSSE } from '../hooks/useTaskSSE';
import { tasksApi, TaskStatus, type Task as ApiTask } from '../api/tasks';
import TaskCard from '../components/tasks/TaskCard';
import ArchiveZone from '../components/tasks/ArchiveZone';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import type { Task as ComponentTask } from '../components/tasks/types';

const TaskManager: React.FC = () => {
  const { activeProject, loading: projectLoading } = useProject();
  const { notifyApiError, notifyError } = useNotification();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [tasks, setTasks] = useState<ComponentTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // DnD State
  const [activeId, setActiveId] = useState<string | null>(null);
  const [initialStatus, setInitialStatus] = useState<ComponentTask['status'] | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingArchiveId, setPendingArchiveId] = useState<string | null>(null);
  const [skipConfirm, setSkipConfirm] = useState(() => {
    return localStorage.getItem('skipArchiveConfirm') === 'true';
  });
  const [checkValue, setCheckValue] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchTasks = useCallback(async () => {
    if (!activeProject) return;
    try {
      setLoadingTasks(true);
      // Fetch all tasks for the project (excluding archived in the backend might be better, 
      // but let's just fetch everything and handle it here so the archive column/logic works if needed).
      // Actually, requirement 1: "Don't fetch tasks that are archived"
      const allTasksData = await tasksApi.fetchAll(activeProject.id);
      
      const filteredTasks = allTasksData.filter(t => t.status !== 'archived');

      const mappedTasks: ComponentTask[] = filteredTasks.map((t) => ({
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
        projectId: activeProject.id,
        updatedAt: t.updatedAt
      }));

      // Sort tasks based on requirements:
      // 2. tasks in backlog by priority (lower number = higher priority)
      // 3. tasks in other columns by latest updatedAt (most recent first)
      const sortedTasks = [...mappedTasks].sort((a, b) => {
        if (a.status === 'backlog' && b.status === 'backlog') {
          return (a.priority || 0) - (b.priority || 0);
        }
        if (a.status !== 'backlog' && b.status !== 'backlog') {
          return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
        }
        return 0; // Default if in different categories (though they are filtered by column anyway)
      });

      setTasks(sortedTasks);
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

  const handleSseUpdate = useCallback((event: string, updatedTaskData: ApiTask) => {
    if (!activeProject || updatedTaskData.projectId !== activeProject.id) return;

    const mappedTask: ComponentTask = {
      id: updatedTaskData.id,
      status: updatedTaskData.status as ComponentTask['status'],
      code: `#TASK-${updatedTaskData.id.substring(0, 4).toUpperCase()}`,
      title: updatedTaskData.title,
      priority: updatedTaskData.priority as ComponentTask['priority'],
      agent: {
        name: updatedTaskData.assignee?.name || 'Unassigned',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(updatedTaskData.assignee?.name || 'U')}&background=random&color=fff`,
        colorClass: 'bg-surface-container-highest border-outline-variant/30'
      },
      isActive: updatedTaskData.status === 'in-progress',
      progress: updatedTaskData.status === 'done' ? 100 : updatedTaskData.status === 'in-progress' ? 50 : 0,
      projectId: updatedTaskData.projectId,
      updatedAt: updatedTaskData.updatedAt
    };

    setTasks(prevTasks => {
      if (event === 'deleted' || updatedTaskData.status === 'archived') {
        return prevTasks.filter(t => t.id !== updatedTaskData.id);
      }
      
      const exists = prevTasks.some(t => t.id === updatedTaskData.id);
      if (exists) {
        return prevTasks.map(t => t.id === updatedTaskData.id ? mappedTask : t).sort((a, b) => {
          if (a.status === 'backlog' && b.status === 'backlog') {
            return (a.priority || 0) - (b.priority || 0);
          }
          if (a.status !== 'backlog' && b.status !== 'backlog') {
            return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
          }
          return 0;
        });
      } else {
        const newTasks = [mappedTask, ...prevTasks];
        return newTasks.sort((a, b) => {
          if (a.status === 'backlog' && b.status === 'backlog') {
            return (a.priority || 0) - (b.priority || 0);
          }
          if (a.status !== 'backlog' && b.status !== 'backlog') {
            return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
          }
          return 0;
        });
      }
    });
  }, [activeProject]);

  useTaskSSE(activeProject?.id, handleSseUpdate);

  const handleTaskCreated = () => {
    // Rely on SSE or keep the fallback
    setRefreshKey(prev => prev + 1);
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
     if (!activeProject) return;
     try {
       await tasksApi.update(activeProject.id, taskId, { status: newStatus as TaskStatus });
       // No need to fetch here, TaskBoard already updated optimistically in most cases, 
       // but we could refresh to be sure or just update local state if needed.
       if (newStatus === 'archived') {
         setTasks(prev => prev.filter(t => t.id !== taskId));
       } else {
         setTasks(prev => prev.map(t => t.id === taskId ? { 
            ...t, 
            status: newStatus as ComponentTask['status'],
            isActive: newStatus === 'in-progress'
          } : t));
       }
     } catch (error) {
       console.error('Failed to update task status:', error);
      notifyError('Status Update Failed', 'Failed to update task status in the neural mesh.');
      fetchTasks(); // Reload on error
    }
  };

  // DnD Handlers
  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    setActiveId(id);
    const task = tasks.find(t => t.id === id);
    if (task) setInitialStatus(task.status);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeIndex = tasks.findIndex(t => t.id === activeId);
    const overIndex = tasks.findIndex(t => t.id === overId);
    
    if (activeIndex === -1) return;

    const isOverColumn = overId === 'backlog' || overId === 'in-progress' || overId === 'review' || overId === 'done';

    if (!isOverColumn && overIndex >= 0) {
      if (tasks[activeIndex].status !== tasks[overIndex].status) {
        const newItems = [...tasks];
        const newStatus = tasks[overIndex].status;
        newItems[activeIndex] = { 
          ...newItems[activeIndex], 
          status: newStatus,
          isActive: newStatus === 'in-progress'
        };
        setTasks(arrayMove(newItems, activeIndex, overIndex));
      }
    } else if (isOverColumn) {
      if (tasks[activeIndex].status !== overId) {
        const newItems = [...tasks];
        const newStatus = overId as ComponentTask['status'];
        newItems[activeIndex] = { 
          ...newItems[activeIndex], 
          status: newStatus,
          isActive: newStatus === 'in-progress'
        };
        setTasks(arrayMove(newItems, activeIndex, tasks.length - 1));
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    if (overId === 'archive') {
      if (skipConfirm) {
        await handleStatusChange(activeId, 'archived');
      } else {
        setPendingArchiveId(activeId);
        setIsConfirmOpen(true);
      }
      return;
    }

    const isOverColumn = overId === 'backlog' || overId === 'in-progress' || overId === 'review' || overId === 'done';
    const newStatus = isOverColumn ? (overId as ComponentTask['status']) : tasks.find(t => t.id === overId)?.status;

    if (newStatus && initialStatus !== newStatus) {
       await handleStatusChange(activeId, newStatus);
    }

    setInitialStatus(null);
    if (activeId === overId) return;

    const activeIndex = tasks.findIndex(t => t.id === activeId);
    const overIndex = tasks.findIndex(t => t.id === overId);
    
    if (activeIndex === -1) return;

    const isOverColumnCheck = overId === 'backlog' || overId === 'in-progress' || overId === 'review' || overId === 'done';
    if (!isOverColumnCheck && overIndex >= 0) {
      if (tasks[activeIndex].status === tasks[overIndex].status) {
         setTasks(arrayMove(tasks, activeIndex, overIndex));
      }
    }
  };

  const confirmArchive = async () => {
    if (pendingArchiveId) {
      if (checkValue) {
        localStorage.setItem('skipArchiveConfirm', 'true');
        setSkipConfirm(true);
      }
      await handleStatusChange(pendingArchiveId, 'archived');
    }
    setIsConfirmOpen(false);
    setPendingArchiveId(null);
  };

  const activeTask = tasks.find(t => t.id === activeId);

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

  const content = (
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
        
        <div className="flex-1 flex items-center justify-end gap-6 max-w-4xl">
          <ArchiveZone isDragging={!!activeId} />
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-on-primary px-8 py-3.5 rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
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
            tasks={tasks} 
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

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragStart={handleDragStart} 
      onDragOver={handleDragOver} 
      onDragEnd={handleDragEnd}
    >
      {content}
      
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
      </DragOverlay>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmArchive}
        title="Archive Protocol Task"
        message="Are you sure you want to transfer this task to the archival sector? This operation will remove the task node from the active grid."
        confirmText="Archive Task"
        variant="warning"
        showCheckbox
        onCheckboxChange={setCheckValue}
      />
    </DndContext>
  );
};

export default TaskManager;
