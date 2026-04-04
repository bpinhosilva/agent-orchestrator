import { useEffect, useId, useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  ClipboardList,
  FileText,
  Flag,
  Sparkles,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { agentsApi, type Agent } from '../../api/agents';
import { projectsApi, type Project } from '../../api/projects';
import { tasksApi, TaskPriority, TaskStatus } from '../../api/tasks';
import MarkdownField from '../MarkdownField';
import { useNotification } from '../../hooks/useNotification';
import {
  TASK_TEMPLATE,
  createTaskSchema,
  type CreateTaskFormValues,
} from '../../lib/taskFormSchemas';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const createTaskDefaults: CreateTaskFormValues = {
  title: '',
  description: TASK_TEMPLATE,
  status: TaskStatus.BACKLOG,
  priority: TaskPriority.MEDIUM,
  assigneeId: '',
  projectId: '',
};

const CreateTaskModal = ({ isOpen, onClose, onCreated }: CreateTaskModalProps) => {
  const queryClient = useQueryClient();
  const { notifyApiError, notifyError, notifySuccess } = useNotification();
  const titleErrorId = useId();
  const descriptionErrorId = useId();
  const statusErrorId = useId();
  const priorityErrorId = useId();
  const assigneeErrorId = useId();
  const projectErrorId = useId();
  const titleId = useId();
  const modalTitleId = useId();
  const modalDescriptionId = useId();

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: createTaskDefaults,
    mode: 'onBlur',
  });

  const agentsQuery = useQuery({
    queryKey: ['agents'],
    enabled: isOpen,
    queryFn: async () => {
      const response = await agentsApi.findAll();
      return response.data;
    },
  });

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    enabled: isOpen,
    queryFn: async () => {
      const response = await projectsApi.findAll();
      return response.data;
    },
  });

  useEffect(() => {
    if (!isOpen) {
      reset(createTaskDefaults);
      return;
    }

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, reset]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (agentsQuery.error) {
      notifyApiError(agentsQuery.error, 'Agents Load Failed');
    }
  }, [agentsQuery.error, isOpen, notifyApiError]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (projectsQuery.error) {
      notifyApiError(projectsQuery.error, 'Projects Load Failed');
    }
  }, [isOpen, notifyApiError, projectsQuery.error]);

  const projects = useMemo(() => projectsQuery.data ?? [], [projectsQuery.data]);
  const currentProjectId = useWatch({ control, name: 'projectId' });

  useEffect(() => {
    if (!isOpen || projects.length === 0 || currentProjectId) {
      return;
    }

    setValue('projectId', projects[0].id, {
      shouldDirty: false,
      shouldValidate: true,
    });
  }, [currentProjectId, isOpen, projects, setValue]);

  const createMutation = useMutation({
    mutationFn: async (values: CreateTaskFormValues) => {
      await tasksApi.create(values.projectId, {
        title: values.title,
        description: values.description,
        status: values.status,
        priority: values.priority as TaskPriority,
        assigneeId: values.assigneeId || undefined,
        projectId: values.projectId,
      });

      return values;
    },
    onSuccess: (values) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', values.projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      notifySuccess('Task Commissioned', 'The task node has been added to the orchestration grid.');
      onCreated?.();
      onClose();
      reset({ ...createTaskDefaults, projectId: values.projectId });
    },
    onError: (error) => {
      notifyApiError(error, 'Task Creation Failed');
    },
  });

  const agents = agentsQuery.data ?? [];
  const fetchingData = agentsQuery.isPending || projectsQuery.isPending;
  const loading = createMutation.isPending;
  const priority = useWatch({ control, name: 'priority' });
  const status = useWatch({ control, name: 'status' });
  const assigneeId = useWatch({ control, name: 'assigneeId' });
  const projectId = useWatch({ control, name: 'projectId' });

  const handleCreate = handleSubmit(
    async (values) => {
      await createMutation.mutateAsync(values);
    },
    () => {
      notifyError('Validation Error', 'Please review the highlighted fields before commissioning the task.');
    },
  );

  const handleClose = () => {
    if (loading) {
      return;
    }
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-surface/80 backdrop-blur-xl"
          aria-hidden="true"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={modalTitleId}
          aria-describedby={modalDescriptionId}
          aria-busy={fetchingData || loading}
          className="relative w-full max-w-3xl h-full max-h-[750px] bg-surface-container-low rounded-2xl shadow-2xl overflow-hidden flex flex-col ring-1 ring-outline-variant/10"
        >
          <div className="px-8 py-6 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-low/50 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <ClipboardList size={22} aria-hidden="true" />
              </div>
              <div>
                <h2 id={modalTitleId} className="text-xl font-black font-headline text-white tracking-tight">
                  Comission New Task
                </h2>
                <p
                  id={modalDescriptionId}
                  className="text-[10px] uppercase tracking-widest text-on-surface-variant/60 font-bold"
                >
                  Node Specification Protocol
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              aria-label="Close create task modal"
              className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
            <section className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-1 bg-primary h-4 rounded-full" />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant">
                  Essential Intelligence
                </h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label
                    htmlFor={titleId}
                    className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-1"
                  >
                    Task Title
                  </label>
                  <div className="bg-surface-container-highest/30 rounded-xl p-0.5 ring-1 ring-outline-variant/10 focus-within:ring-primary/40 focus-within:bg-surface-container-highest/50 transition-all">
                    <input
                      id={titleId}
                      type="text"
                      placeholder="e.g. Synthesize Vector DB results"
                      aria-invalid={Boolean(errors.title)}
                      aria-describedby={errors.title ? titleErrorId : undefined}
                      className="w-full bg-transparent border-none text-sm text-on-surface h-12 px-4 focus:outline-none placeholder:text-on-surface-variant/30 font-medium"
                      {...register('title')}
                    />
                  </div>
                  {errors.title && (
                    <p id={titleErrorId} className="text-xs text-error font-semibold">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                      Objective / Description
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setValue('description', TASK_TEMPLATE, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-surface-container-highest text-[9px] font-black text-on-surface-variant/60 uppercase tracking-widest transition-colors"
                        title="Reset to template"
                      >
                        <FileText size={10} aria-hidden="true" />
                        Template
                      </button>
                      <div className="w-px h-3 bg-outline-variant/10" />
                      <button
                        type="button"
                        onClick={() =>
                          setValue('description', '', {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-error/10 text-[9px] font-black text-error/60 hover:text-error uppercase tracking-widest transition-colors"
                        title="Clear field"
                      >
                        <Trash2 size={10} aria-hidden="true" />
                        Clear
                      </button>
                    </div>
                  </div>
                  <Controller
                    control={control}
                    name="description"
                    render={({ field }) => (
                      <MarkdownField
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Describe the desired output and constraints for this node..."
                        height="h-52"
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
            </section>

            <section className="space-y-6 pt-10 border-t border-outline-variant/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-1 bg-secondary h-4 rounded-full" />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant">
                  Operational Configuration
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-1 flex items-center gap-1.5">
                    <Flag size={12} className="text-secondary" aria-hidden="true" />
                    Priority Level
                  </label>
                  <div className="grid grid-cols-4 gap-2 p-1 bg-surface-container-highest/30 rounded-xl ring-1 ring-outline-variant/10">
                    {[
                      { id: TaskPriority.LOW, label: 'LOW' },
                      { id: TaskPriority.MEDIUM, label: 'MED' },
                      { id: TaskPriority.HIGH, label: 'HIGH' },
                      { id: TaskPriority.CRITICAL, label: 'CRIT' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={priority === item.id}
                        onClick={() =>
                          setValue('priority', item.id, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        className={`py-2 rounded-lg text-[10px] font-black tracking-widest transition-all ${
                          priority === item.id
                            ? item.id === TaskPriority.CRITICAL || item.id === TaskPriority.HIGH
                              ? 'bg-error text-on-error shadow-lg shadow-error/30'
                              : 'bg-primary text-on-primary shadow-lg shadow-primary/30'
                            : 'hover:bg-surface-container-highest text-on-surface-variant'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  {errors.priority && (
                    <p id={priorityErrorId} className="text-xs text-error font-semibold">
                      {errors.priority.message}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <label
                    htmlFor="create-task-status"
                    className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-1"
                  >
                    Initial Status
                  </label>
                  <div className="bg-surface-container-highest/30 rounded-xl p-0.5 ring-1 ring-outline-variant/10 focus-within:ring-primary/40 transition-all relative">
                    <select
                      id="create-task-status"
                      value={status}
                      onChange={(event) =>
                        setValue('status', event.target.value as CreateTaskFormValues['status'], {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      aria-invalid={Boolean(errors.status)}
                      aria-describedby={errors.status ? statusErrorId : undefined}
                      className="w-full bg-transparent border-none text-xs font-bold text-on-surface h-10 px-4 focus:outline-none appearance-none cursor-pointer uppercase tracking-widest"
                    >
                      {[TaskStatus.BACKLOG, TaskStatus.IN_PROGRESS, TaskStatus.REVIEW].map((value) => (
                        <option
                          key={value}
                          value={value}
                          className="bg-surface-container-low text-on-surface uppercase"
                        >
                          {value}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/60">
                      <ChevronDown size={16} aria-hidden="true" />
                    </div>
                  </div>
                  {errors.status && (
                    <p id={statusErrorId} className="text-xs text-error font-semibold">
                      {errors.status.message}
                    </p>
                  )}
                </div>

                <div className="space-y-3 col-span-full">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-1 flex items-center gap-1.5">
                    <User size={12} className="text-primary" aria-hidden="true" />
                    Assigned Intelligence (Optional)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {agents.map((agent: Agent) => (
                      <button
                        key={agent.id}
                        type="button"
                        aria-pressed={assigneeId === agent.id}
                        onClick={() =>
                          setValue('assigneeId', assigneeId === agent.id ? '' : agent.id, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        className={`p-3 rounded-xl border flex items-center gap-3 transition-all text-left ${
                          assigneeId === agent.id
                            ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(173,198,255,0.1)]'
                            : 'bg-surface-container-highest/20 border-outline-variant/5 hover:border-outline-variant/30 hover:bg-surface-container-highest/30'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                            assigneeId === agent.id
                              ? 'bg-primary text-surface'
                              : 'bg-surface-container-high text-on-surface-variant'
                          }`}
                        >
                          {agent.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className={`text-[11px] font-bold ${assigneeId === agent.id ? 'text-white' : 'text-on-surface-variant'}`}>
                            {agent.name}
                          </div>
                          <div className="text-[9px] text-on-surface-variant/50 uppercase tracking-widest font-black leading-none mt-0.5">
                            {agent.role || 'Agent'}
                          </div>
                        </div>
                      </button>
                    ))}
                    {agents.length === 0 && !agentsQuery.isPending && (
                      <div className="col-span-full py-4 text-center border-2 border-dashed border-outline-variant/10 rounded-xl">
                        <span className="text-[10px] font-bold text-on-surface-variant/30 uppercase tracking-[0.2em]">
                          No active intelligence found
                        </span>
                      </div>
                    )}
                  </div>
                  {errors.assigneeId && (
                    <p id={assigneeErrorId} className="text-xs text-error font-semibold">
                      {errors.assigneeId.message}
                    </p>
                  )}
                </div>

                {projects.length > 1 ? (
                  <div className="space-y-3 col-span-full">
                    <label
                      htmlFor="create-task-project"
                      className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-1"
                    >
                      Target Project
                    </label>
                    <div className="bg-surface-container-highest/30 rounded-xl p-0.5 ring-1 ring-outline-variant/10 focus-within:ring-primary/40 transition-all relative">
                      <select
                        id="create-task-project"
                        value={projectId}
                        onChange={(event) =>
                          setValue('projectId', event.target.value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        aria-invalid={Boolean(errors.projectId)}
                        aria-describedby={errors.projectId ? projectErrorId : undefined}
                        className="w-full bg-transparent border-none text-xs font-bold text-on-surface h-10 px-4 focus:outline-none appearance-none cursor-pointer"
                      >
                        {projects.map((project: Project) => (
                          <option key={project.id} value={project.id} className="bg-surface-container-low text-on-surface">
                            {project.title}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/60">
                        <ChevronDown size={16} aria-hidden="true" />
                      </div>
                    </div>
                    {errors.projectId && (
                      <p id={projectErrorId} className="text-xs text-error font-semibold">
                        {errors.projectId.message}
                      </p>
                    )}
                  </div>
                ) : projects.length === 1 ? (
                  <div className="col-span-full px-4 py-2 bg-surface-container-highest/10 rounded-lg border border-outline-variant/10 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">
                      Target Project
                    </span>
                    <span className="text-xs font-bold text-primary/80">{projects[0].title}</span>
                  </div>
                ) : (
                  <div className="col-span-full p-4 bg-error/5 border border-error/20 rounded-xl text-center">
                    <p className="text-xs font-bold text-error">No Project Detected</p>
                    <p className="text-[10px] text-on-surface-variant/60 mt-1 uppercase tracking-widest font-black">
                      Create a project in the sidebar before commissioning tasks
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="px-8 py-6 bg-surface-container-low/80 backdrop-blur-md border-t border-outline-variant/10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest">
              <Sparkles size={12} className="text-primary animate-pulse" aria-hidden="true" />
              Agentic Orchestration Active
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-6 py-2.5 rounded-lg text-sm font-bold text-on-surface-variant hover:text-white transition-all hover:bg-surface-container-highest disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={loading || fetchingData || projects.length === 0}
                className="px-10 py-2.5 rounded-lg bg-primary text-on-primary text-sm font-black shadow-[0_8px_20px_rgba(173,198,255,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed group relative overflow-hidden disabled:hover:scale-100"
              >
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                {loading ? 'Processing...' : 'Comission Task'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CreateTaskModal;
