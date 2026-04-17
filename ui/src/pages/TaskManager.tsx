import React, { lazy, Suspense, useState, useCallback, useMemo } from 'react';
import { ListPlus, ArrowRight, ShieldAlert, Layout } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import TaskBoard from '../components/tasks/TaskBoard';
import TaskCard from '../components/tasks/TaskCard';
import TaskStats from '../components/tasks/TaskStats';
import ArchiveZone from '../components/tasks/ArchiveZone';
import ConfirmDialog from '../components/ConfirmDialog';
import AppErrorBoundary from '../components/AppErrorBoundary';
import { useProject } from '../hooks/useProject';
import { useNotification } from '../hooks/useNotification';
import { useTaskSSE } from '../hooks/useTaskSSE';
import { useTaskDnD } from '../hooks/useTaskDnD';
import { tasksApi, TaskStatus, type Task as ApiTask } from '../api/tasks';
import { cn } from '../lib/cn';
import { usePersistentFlag } from '../hooks/usePersistentFlag';
import type { Task as ComponentTask } from '../components/tasks/types';
import {
  applyTaskServerUpdate,
  mapApiTaskToBoardTask,
  sortBoardTasks,
  updateBoardTaskStatus,
} from './taskManagerState';

const CreateTaskModal = lazy(() => import('../components/tasks/CreateTaskModal'));

const TaskManager: React.FC = () => {
  const { activeProject, loading: projectLoading } = useProject();
  const { notifyError } = useNotification();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [skipConfirm, setSkipConfirm] = usePersistentFlag('skipArchiveConfirm', false);
  const [checkValue, setCheckValue] = useState(false);

  const queryKey = useMemo(() => ['tasks', activeProject?.id] as const, [activeProject?.id]);

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey,
    queryFn: async () => {
      const allTasksData = await tasksApi.fetchAll(activeProject!.id);
      return allTasksData
        .filter((task) => task.status !== 'archived')
        .map((task) => mapApiTaskToBoardTask(task, activeProject!.id))
        .sort(sortBoardTasks);
    },
    enabled: Boolean(activeProject?.id),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const handleSseUpdate = useCallback((event: string, updatedTaskData: ApiTask) => {
    if (!activeProject || updatedTaskData.projectId !== activeProject.id) return;

    queryClient.setQueryData<ComponentTask[]>(queryKey, (currentTasks = []) =>
      applyTaskServerUpdate(currentTasks, event, updatedTaskData, activeProject.id),
    );
  }, [activeProject, queryClient, queryKey]);

  useTaskSSE(activeProject?.id, handleSseUpdate);

  const handleTaskCreated = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  const handleStatusChange = useCallback(async (taskId: string, newStatus: string) => {
     if (!activeProject) return;
     try {
        await tasksApi.update(activeProject.id, taskId, { status: newStatus as TaskStatus });
        queryClient.setQueryData<ComponentTask[]>(queryKey, (currentTasks = []) =>
          updateBoardTaskStatus(currentTasks, taskId, newStatus as ComponentTask['status']),
        );
      } catch {
        notifyError('Status Update Failed', 'Failed to update task status in the neural mesh.');
       queryClient.invalidateQueries({ queryKey });
      }
   }, [activeProject, notifyError, queryClient, queryKey]);

  const setCachedTasks = useCallback<React.Dispatch<React.SetStateAction<ComponentTask[]>>>(
    (nextTasks) => {
      queryClient.setQueryData<ComponentTask[]>(queryKey, (currentTasks = []) => {
        if (typeof nextTasks === 'function') {
          return nextTasks(currentTasks);
        }

        return nextTasks;
      });
    },
    [queryClient, queryKey],
  );

  const {
    activeId,
    sensors,
    collisionDetection,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    isConfirmOpen,
    setIsConfirmOpen,
    pendingArchiveId,
    setPendingArchiveId,
  } = useTaskDnD({
    tasks,
    setTasks: setCachedTasks,
    onStatusChange: handleStatusChange,
    skipArchiveConfirm: skipConfirm,
  });

  const confirmArchive = useCallback(async () => {
    if (pendingArchiveId) {
      if (checkValue) {
        setSkipConfirm(true);
      }
      await handleStatusChange(pendingArchiveId, 'archived');
    }
    setIsConfirmOpen(false);
    setPendingArchiveId(null);
  }, [checkValue, handleStatusChange, pendingArchiveId, setIsConfirmOpen, setPendingArchiveId, setSkipConfirm]);

  const activeTask = useMemo(
    () => tasks.find((task) => task.id === activeId),
    [tasks, activeId],
  );

  const taskCounts = useMemo(
    () =>
      tasks.reduce(
        (counts, task) => {
          counts[task.status] += 1;
          return counts;
        },
        {
          backlog: 0,
          'in-progress': 0,
          review: 0,
          done: 0,
          archived: 0,
        } as Record<ComponentTask['status'], number>,
      ),
    [tasks],
  );

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
            <h2 className="text-2xl font-black font-headline text-white tracking-tight">No Active Projects Found</h2>
            <p className="text-on-surface-variant text-sm leading-relaxed">The orchestration grid is currently offline. Please create a project in the sidebar to begin commissioning agentic tasks.</p>
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
                The <span className="text-error font-bold italic">"{activeProject.title}"</span> project currently lacks a Designated Lead Agent. 
                A lead is required to oversee autonomous task assignment, token allocation, and critical project operations.
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

      <Suspense fallback={null}>
        <CreateTaskModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={handleTaskCreated}
        />
      </Suspense>

      {/* Kanban Board */}
      <AppErrorBoundary
        title="Unable to render task board"
        description="The Kanban board hit an unexpected error. You can still use the rest of Task Manager while retrying this section."
      >
        <section
          aria-label="Task board panel"
          aria-busy={loadingTasks}
          className={cn('space-y-4', loadingTasks && tasks.length === 0 && 'min-h-96')}
        >
          {loadingTasks && tasks.length === 0 ? (
            <div className="flex h-96 w-full items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-outline-variant/30 border-t-primary" />
            </div>
          ) : (
            <TaskBoard tasks={tasks} />
          )}
        </section>
      </AppErrorBoundary>

      <TaskStats tasks={tasks} taskCounts={taskCounts} projectTitle={activeProject.title} />
    </div>
  );

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={collisionDetection} 
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
        message="Are you sure you want to transfer this task to the archive? This operation will remove the task node from the active grid."
        confirmText="Archive Task"
        variant="warning"
        showCheckbox
        onCheckboxChange={setCheckValue}
      />
    </DndContext>
  );
};

export default TaskManager;
