import { useEffect, useId, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftRight,
  ChevronRight,
  Save,
  Settings2,
  ShieldCheck,
  StopCircle,
  Trash2,
  Wallet,
  Zap,
} from 'lucide-react';
import { agentsApi, type Agent } from '../api/agents';
import { tasksApi, TaskPriority, TaskStatus } from '../api/tasks';
import MarkdownField from '../components/MarkdownField';
import CommentSection from '../components/tasks/CommentSection';
import ConfirmDialog from '../components/ConfirmDialog';
import InitialsAvatar from '../components/InitialsAvatar';
import { useNotification } from '../hooks/useNotification';
import { taskDetailSchema, type TaskDetailFormValues } from '../lib/taskFormSchemas';

const taskDetailDefaults: TaskDetailFormValues = {
  title: '',
  description: '',
  status: TaskStatus.BACKLOG,
  priority: TaskPriority.MEDIUM,
  assigneeId: '',
};

const TaskDetail = () => {
  const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notifyApiError, notifyError, notifySuccess } = useNotification();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const statusErrorId = useId();
  const titleErrorId = useId();
  const priorityErrorId = useId();
  const descriptionErrorId = useId();
  const assigneeErrorId = useId();

  const {
    control,
    formState: { errors, isDirty },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<TaskDetailFormValues>({
    resolver: zodResolver(taskDetailSchema),
    defaultValues: taskDetailDefaults,
    mode: 'onBlur',
  });

  const taskQuery = useQuery({
    queryKey: ['task', projectId, taskId],
    enabled: Boolean(projectId && taskId),
    queryFn: async () => {
      const response = await tasksApi.findOne(projectId!, taskId!);
      return response.data;
    },
  });

  const agentsQuery = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const response = await agentsApi.findAll();
      return response.data;
    },
  });

  useEffect(() => {
    if (taskQuery.error) {
      notifyApiError(taskQuery.error, 'Fetch Error');
    }
  }, [notifyApiError, taskQuery.error]);

  useEffect(() => {
    if (agentsQuery.error) {
      notifyApiError(agentsQuery.error, 'Agents Load Failed');
    }
  }, [agentsQuery.error, notifyApiError]);

  useEffect(() => {
    if (!taskQuery.data) {
      return;
    }

    const normalizedStatus =
      taskQuery.data.status === TaskStatus.ARCHIVED ? TaskStatus.BACKLOG : taskQuery.data.status;

    reset({
      title: taskQuery.data.title,
      description: taskQuery.data.description,
      status: normalizedStatus,
      priority: taskQuery.data.priority,
      assigneeId: taskQuery.data.assignee?.id ?? '',
    });
  }, [reset, taskQuery.data]);

  const updateMutation = useMutation({
    mutationFn: async (values: TaskDetailFormValues) => {
      if (!projectId || !taskId) {
        throw new Error('Task route is missing required identifiers');
      }

      await tasksApi.update(projectId, taskId, {
        title: values.title,
        description: values.description,
        status: values.status,
        priority: values.priority as TaskPriority,
        assigneeId: values.assigneeId || null,
      });

      return values;
    },
    onSuccess: (values) => {
      if (!projectId || !taskId) {
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['task', projectId, taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      reset(values);
      notifySuccess('Task Updated', 'Intelligence node parameters successfully reconfigured.');
    },
    onError: (error) => {
      notifyApiError(error, 'Update Failed');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!projectId || !taskId) {
        throw new Error('Task route is missing required identifiers');
      }

      await tasksApi.delete(projectId, taskId);
    },
    onSuccess: () => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      }
      queryClient.removeQueries({ queryKey: ['task', projectId, taskId] });
      notifySuccess('Task Decommissioned', 'Intelligence node removed from the orchestration grid.');
      navigate('/');
    },
    onError: (error) => {
      notifyApiError(error, 'Decommission Failed');
    },
  });

  const task = taskQuery.data;
  const agents = useMemo(() => agentsQuery.data ?? [], [agentsQuery.data]);
  const currentTitle = useWatch({ control, name: 'title' });
  const currentStatus = useWatch({ control, name: 'status' });
  const currentPriority = useWatch({ control, name: 'priority' });
  const currentAssigneeId = useWatch({ control, name: 'assigneeId' });
  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.id === currentAssigneeId) ?? null,
    [agents, currentAssigneeId],
  );

  const isBusy = taskQuery.isPending || updateMutation.isPending || deleteMutation.isPending;

  const handleSave = handleSubmit(
    async (values) => {
      await updateMutation.mutateAsync(values);
    },
    () => {
      notifyError('Validation Error', 'Please review the highlighted fields before saving.');
    },
  );

  const handleDelete = () => {
    if (deleteMutation.isPending) return;
    setIsDeleteConfirmOpen(true);
  };

  if (taskQuery.isPending) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center" aria-busy="true">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-on-surface-variant text-sm font-black uppercase tracking-[0.3em] animate-pulse">
            Accessing Node Data
          </p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="max-w-4xl mx-auto w-full py-16 text-center space-y-4">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-on-surface-variant/60">
          Task intelligence node unavailable
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-5 py-2 rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors"
        >
          Return to Task Manager
        </button>
      </div>
    );
  }

  const nodeCode = `#NODE-${task.id.substring(0, 4).toUpperCase()}`;

  return (
    <>
    <div className="max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <nav className="flex items-center space-x-2 text-sm text-on-surface-variant font-medium" aria-label="Task breadcrumb">
          <button
            type="button"
            className="hover:text-primary transition-colors"
            onClick={() => navigate('/')}
          >
            Task Manager
          </button>
          <ChevronRight size={16} aria-hidden="true" />
          <span className="text-on-surface">{nodeCode}</span>
        </nav>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isBusy}
            className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest text-error hover:bg-error/10 transition-all rounded-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={16} aria-hidden="true" />
            Decommission
          </button>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest text-on-surface bg-surface-container-high hover:bg-surface-container-highest transition-all rounded-xl opacity-50 cursor-not-allowed"
          >
            <StopCircle size={16} aria-hidden="true" />
            Halt execution
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isBusy || !isDirty}
            className="flex items-center gap-2 px-6 py-2 text-xs font-black uppercase tracking-widest bg-primary text-on-primary rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Save size={16} aria-hidden="true" />
            {updateMutation.isPending ? 'Synchronizing...' : 'Save Protocol'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />

            <div className="flex items-start justify-between mb-10 relative z-10 gap-4">
              <div className="space-y-1 min-w-0">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">
                  Intelligence Node identifier
                </label>
                <h2 className="text-3xl font-headline font-black text-white tracking-tight break-words">
                  {nodeCode}: {currentTitle || task.title}
                </h2>
              </div>
              <div className="relative shrink-0">
                <select
                  {...register('status')}
                  aria-invalid={Boolean(errors.status)}
                  aria-describedby={errors.status ? statusErrorId : undefined}
                  className={`appearance-none cursor-pointer px-6 py-2 rounded-xl border font-black text-[10px] uppercase tracking-widest outline-none transition-all hover:brightness-110 active:scale-95 ${
                    currentStatus === TaskStatus.DONE
                      ? 'bg-secondary/10 border-secondary/20 text-secondary'
                      : currentStatus === TaskStatus.IN_PROGRESS
                        ? 'bg-primary/10 border-primary/20 text-primary'
                        : 'bg-surface-container-highest/50 border-outline-variant/20 text-on-surface-variant'
                  }`}
                >
                  <option value={TaskStatus.BACKLOG} className="bg-surface-container-low">
                    Backlog
                  </option>
                  <option value={TaskStatus.IN_PROGRESS} className="bg-surface-container-low">
                    In Progress
                  </option>
                  <option value={TaskStatus.REVIEW} className="bg-surface-container-low">
                    Review
                  </option>
                  <option value={TaskStatus.DONE} className="bg-surface-container-low">
                    Done
                  </option>
                </select>
                {currentStatus === TaskStatus.IN_PROGRESS && (
                  <span className="absolute -left-1 -top-1 flex h-2 w-2" aria-hidden="true">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                )}
              </div>
            </div>
            {errors.status && (
              <p id={statusErrorId} className="mb-6 text-xs text-error font-semibold">
                {errors.status.message}
              </p>
            )}

            <div className="space-y-8 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label
                    htmlFor="task-detail-title"
                    className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-1"
                  >
                    Node Designation
                  </label>
                  <input
                    id="task-detail-title"
                    className="w-full bg-surface-container-highest/30 border border-outline-variant/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-primary/40 focus:bg-surface-container-highest/50 transition-all outline-none font-medium"
                    type="text"
                    aria-invalid={Boolean(errors.title)}
                    aria-describedby={errors.title ? titleErrorId : undefined}
                    {...register('title')}
                  />
                  {errors.title && (
                    <p id={titleErrorId} className="text-xs text-error font-semibold">
                      {errors.title.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="task-detail-priority"
                    className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-1"
                  >
                    Operational Priority
                  </label>
                  <Controller
                    control={control}
                    name="priority"
                    render={({ field }) => (
                      <select
                        id="task-detail-priority"
                        value={field.value}
                        onChange={(event) => field.onChange(Number(event.target.value))}
                        onBlur={field.onBlur}
                        aria-invalid={Boolean(errors.priority)}
                        aria-describedby={errors.priority ? priorityErrorId : undefined}
                        className={`w-full border rounded-xl px-4 py-3 text-sm transition-all outline-none font-black tracking-widest uppercase appearance-none ${
                          currentPriority === TaskPriority.CRITICAL
                            ? 'bg-error/30 text-white border-error shadow-[0_0_15px_rgba(255,107,107,0.15)] ring-1 ring-error/20'
                            : 'bg-surface-container-highest/30 text-white border-outline-variant/10 focus:ring-1 focus:ring-primary/40 focus:bg-surface-container-highest/50'
                        }`}
                      >
                        <option value={TaskPriority.CRITICAL} className="bg-surface-container-low">
                          CRITICAL
                        </option>
                        <option value={TaskPriority.HIGH} className="bg-surface-container-low">
                          HIGH
                        </option>
                        <option value={TaskPriority.MEDIUM} className="bg-surface-container-low">
                          MEDIUM
                        </option>
                        <option value={TaskPriority.LOW} className="bg-surface-container-low">
                          LOW
                        </option>
                      </select>
                    )}
                  />
                  {errors.priority && (
                    <p id={priorityErrorId} className="text-xs text-error font-semibold">
                      {errors.priority.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Controller
                  control={control}
                  name="description"
                  render={({ field }) => (
                    <MarkdownField
                      label="Objective / Parameters"
                      value={field.value}
                      onChange={(value) => field.onChange(value)}
                      placeholder="Describe the desired output and constraints for this node..."
                      height="h-56"
                      helperText="Supports GitHub Flavored Markdown for logic structure"
                      initialMode="preview"
                      maxLength={2000}
                    />
                  )}
                />
                {errors.description && (
                  <p id={descriptionErrorId} className="text-xs text-error font-semibold">
                    {errors.description.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <CommentSection taskId={taskId || ''} />
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant/10 shadow-xl">
            <label className="text-[10px] font-black uppercase tracking-widest text-tertiary/80 block mb-6">
              Assigned Intelligence
            </label>

            <div className="space-y-4">
              <div className="relative">
                <select
                  value={currentAssigneeId}
                  onChange={(event) => {
                    setValue('assigneeId', event.target.value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                  aria-invalid={Boolean(errors.assigneeId)}
                  aria-describedby={errors.assigneeId ? assigneeErrorId : undefined}
                  className="w-full bg-surface-container-high/50 border border-outline-variant/5 rounded-2xl p-5 appearance-none cursor-pointer focus:ring-1 focus:ring-tertiary/40 outline-none text-white font-headline font-black transition-all hover:border-tertiary/30"
                >
                  <option value="">Protocol Unassigned</option>
                  {agents.map((agent: Agent) => (
                    <option key={agent.id} value={agent.id} className="bg-surface-container-low">
                      {agent.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/40">
                  <ArrowLeftRight size={20} aria-hidden="true" />
                </div>
              </div>
              {errors.assigneeId && (
                <p id={assigneeErrorId} className="text-xs text-error font-semibold">
                  {errors.assigneeId.message}
                </p>
              )}

              {selectedAgent ? (
                <div className="flex items-center gap-5 p-5 bg-tertiary/5 rounded-2xl border border-tertiary/10 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="h-14 w-14 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary overflow-hidden shadow-inner">
                    <InitialsAvatar
                      name={selectedAgent.name || 'U'}
                      size={48}
                      className="rounded-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-headline font-black text-white">{selectedAgent.name}</h4>
                    <p className="text-[10px] text-tertiary/60 font-black uppercase tracking-widest mt-1">
                      {selectedAgent.role || 'Intelligence Unit'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-5 p-5 bg-surface-container-high/20 rounded-2xl border border-dashed border-outline-variant/20 italic">
                  <div className="h-14 w-14 rounded-xl bg-surface-container-highest/30 flex items-center justify-center text-on-surface-variant/20">
                    <Zap size={24} aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-headline font-bold text-on-surface-variant/40">Awaiting Assignment</h4>
                    <p className="text-[9px] text-on-surface-variant/30 font-black uppercase tracking-widest mt-1">
                      Grid performance limited
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              disabled
              aria-disabled="true"
              className="w-full mt-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant transition-all flex items-center justify-center gap-3 bg-surface-container-highest/20 rounded-xl border border-outline-variant/5 opacity-50 cursor-not-allowed"
            >
              <Settings2 size={16} className="text-primary" aria-hidden="true" />
              Tune Node Parameters
            </button>
          </div>

          <div className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant/10 shadow-xl">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 block mb-8">
              Execution metrics
            </label>
            <div className="space-y-8">
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-on-surface">
                    Node Progress
                  </span>
                  <span className="text-xs font-mono text-primary font-bold">
                    {currentStatus === TaskStatus.DONE ? '100' : currentStatus === TaskStatus.IN_PROGRESS ? '42' : '0'}%
                  </span>
                </div>
                <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${currentStatus === TaskStatus.DONE ? 'bg-secondary' : 'bg-primary'}`}
                    style={{ width: `${currentStatus === TaskStatus.DONE ? 100 : currentStatus === TaskStatus.IN_PROGRESS ? 42 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-surface-container-highest/20 rounded-xl border border-outline-variant/5">
                  <div className="flex items-center gap-2 mb-1 text-on-surface-variant/60">
                    <Zap size={14} className="text-secondary" aria-hidden="true" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Latency</span>
                  </div>
                  <div className="text-lg font-mono font-bold text-white">{task.llmLatency || 0}ms</div>
                </div>
                <div className="p-4 bg-surface-container-highest/20 rounded-xl border border-outline-variant/5">
                  <div className="flex items-center gap-2 mb-1 text-on-surface-variant/60">
                    <Wallet size={14} className="text-tertiary" aria-hidden="true" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Node Cost</span>
                  </div>
                  <div className="text-lg font-mono font-bold text-white">${(task.costEstimate || 0).toFixed(6)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-secondary/5 to-primary/5 p-8 rounded-2xl border border-secondary/10 relative overflow-hidden group shadow-xl">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 text-secondary/5 opacity-50 transition-transform group-hover:scale-110">
              <ShieldCheck size={120} aria-hidden="true" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary/80">
                  Integrity status
                </span>
                <span className="px-2 py-0.5 bg-secondary/20 text-secondary text-[9px] font-black rounded uppercase">
                  Optimal
                </span>
              </div>
              <div className="text-4xl font-headline font-black text-white tracking-tighter">99.8%</div>
              <p className="text-[10px] text-on-surface-variant/60 mt-2 italic font-medium leading-relaxed">
                Intelligence stream verified and synchronized across grid.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ConfirmDialog
      isOpen={isDeleteConfirmOpen}
      onClose={() => setIsDeleteConfirmOpen(false)}
      onConfirm={() => {
        setIsDeleteConfirmOpen(false);
        deleteMutation.mutate();
      }}
      title="Decommission Task Node?"
      message="Are you sure you want to decommission this task node? This action cannot be undone."
      confirmText="Decommission"
      variant="danger"
      loading={deleteMutation.isPending}
    />
    </>
  );
};

export default TaskDetail;
