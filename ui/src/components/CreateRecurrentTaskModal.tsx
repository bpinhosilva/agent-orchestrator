import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X as CloseIcon, 
  Rocket as RocketIcon, 
  Fingerprint as IdIcon, 
  Bot as BotIcon, 
  Clock as ClockIcon, 
  AlertCircle as PriorityIcon, 
  Code as CodeIconLucide, 
  Languages as TranslateIcon,
  Brain as BrainIcon,
  ChevronDown as ExpandIcon,
  Cpu as TokenIcon,
  Sparkles as WizardIcon,
  Wand2 as MagicIcon
} from 'lucide-react';
import cronstrue from 'cronstrue';
import { agentsApi } from '../api/agents';
import { recurrentTasksApi, type RecurrentTask, RecurrentTaskStatus } from '../api/recurrent-tasks';
import { TaskPriority } from '../api/tasks';
import { useNotification } from '../hooks/useNotification';
import MarkdownField from './MarkdownField';
import {
  recurrentTaskSchema,
  type RecurrentTaskFormValues,
} from '../lib/taskFormSchemas';

interface CreateRecurrentTaskModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: RecurrentTask;
}

const createRecurrentTaskDefaults: RecurrentTaskFormValues = {
  title: '',
  description: '',
  cronExpression: '',
  assigneeId: '',
  priority: TaskPriority.MEDIUM,
};

const CreateRecurrentTaskModal = ({
  projectId,
  isOpen,
  onClose,
  onSuccess,
  initialData
}: CreateRecurrentTaskModalProps) => {
  const { notifyApiError, notifyError } = useNotification();
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<RecurrentTaskFormValues>({
    resolver: zodResolver(recurrentTaskSchema),
    defaultValues: createRecurrentTaskDefaults,
    mode: 'onBlur',
  });

  const cronExpression = useWatch({ control, name: 'cronExpression' });
  const assigneeId = useWatch({ control, name: 'assigneeId' });
  const priority = useWatch({ control, name: 'priority' });

  const agentsQuery = useQuery({
    queryKey: ['agents'],
    enabled: isOpen,
    queryFn: async () => {
      const response = await agentsApi.findAll();
      return response.data ?? [];
    },
  });

  const cronPresets = [
    { label: 'Every 10s', value: '*/10 * * * * *' },
    { label: 'Every 15m', value: '*/15 * * * *' },
    { label: 'Hourly', value: '0 * * * *' },
    { label: 'Daily (12AM)', value: '0 0 * * *' },
    { label: 'Weekly (Sun)', value: '0 0 * * 0' },
    { label: 'Monthly (1st)', value: '0 0 1 * *' },
  ];

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleEsc);
    reset(
      initialData
        ? {
            title: initialData.title,
            description: initialData.description,
            cronExpression: initialData.cronExpression,
            assigneeId: initialData.assignee.id,
            priority: Number(initialData.priority),
          }
        : createRecurrentTaskDefaults,
    );

    return () => {
      window.removeEventListener('keydown', handleEsc);
      setIsWizardOpen(false);
      setShowAgentDropdown(false);
      reset(createRecurrentTaskDefaults);
    };
  }, [initialData, isOpen, onClose, reset]);

  useEffect(() => {
    if (!isOpen || !agentsQuery.error) {
      return;
    }

    notifyApiError(agentsQuery.error, 'Agents Load Failed');
  }, [agentsQuery.error, isOpen, notifyApiError]);

  const createOrUpdateMutation = useMutation({
    mutationFn: async (values: RecurrentTaskFormValues) => {
      if (initialData) {
        await recurrentTasksApi.update(projectId, initialData.id, {
          title: values.title,
          description: values.description,
          cronExpression: values.cronExpression,
          assigneeId: values.assigneeId,
          priority: values.priority as TaskPriority,
        });
        return;
      }

      await recurrentTasksApi.create(projectId, {
        title: values.title,
        description: values.description,
        cronExpression: values.cronExpression,
        assigneeId: values.assigneeId,
        priority: values.priority as TaskPriority,
        status: RecurrentTaskStatus.ACTIVE,
      });
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (error) => {
      notifyApiError(error, 'Operation Failed');
    },
  });

  const cronInterpretation = useMemo(() => {
    if (!cronExpression || errors.cronExpression) {
      return null;
    }

    try {
      return cronstrue.toString(cronExpression);
    } catch {
      return null;
    }
  }, [cronExpression, errors.cronExpression]);

  const getPriorityLabel = (p: TaskPriority) => {
    switch (p) {
      case TaskPriority.CRITICAL: return 'CRIT';
      case TaskPriority.HIGH: return 'HIGH';
      case TaskPriority.MEDIUM: return 'MED';
      case TaskPriority.LOW: return 'LOW';
      default: return 'MED';
    }
  };

  const agents = agentsQuery.data ?? [];
  const selectedAgent = agents.find((agent) => agent.id === assigneeId);
  const fetchingAgents = agentsQuery.isPending || agentsQuery.isFetching;
  const loading = createOrUpdateMutation.isPending;

  const handleSave = handleSubmit(
    async (values) => {
      await createOrUpdateMutation.mutateAsync(values);
    },
    () => {
      notifyError(
        'Validation Error',
        'Please fill in all required fields before deploying the task.',
      );
    },
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] bg-background/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="glass-panel w-full max-w-2xl rounded-xl overflow-hidden shadow-2xl glow-primary flex flex-col my-8"
          data-testid="recurrent-task-modal"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="p-6 pb-0 flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-headline font-extrabold text-primary tracking-tight">
                {initialData ? 'Update Protocol' : 'Deploy New Task'}
              </h2>
              <p className="text-sm text-on-surface-variant mt-1">
                {initialData ? 'Modify the existing automated orchestration routine.' : 'Configure an automated orchestration routine.'}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-on-surface-variant hover:text-on-surface transition-colors p-1"
            >
              <CloseIcon size={24} />
            </button>
          </div>

          <form onSubmit={handleSave} className="flex flex-col">
            {/* Modal Content */}
            <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
              {/* Section 1: Task Identity */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-tertiary">
                  <IdIcon size={16} />
                  <h3 className="text-xs font-bold uppercase tracking-widest font-headline">Task Identity</h3>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-on-surface-variant px-1">Task Name</label>
                    <input
                      type="text"
                      className="w-full bg-surface-container-lowest border-none rounded-lg p-3 text-on-surface placeholder:text-outline-variant focus:ring-1 focus:ring-tertiary transition-all"
                      placeholder="e.g., Daily Market Sweep"
                      {...register('title')}
                    />
                  </div>
                  <Controller
                    control={control}
                    name="description"
                    render={({ field }) => (
                      <MarkdownField
                        label="Description"
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Briefly describe the objective of this task... You can use markdown for formatting."
                        height="h-32"
                        helperText="Supports GitHub Flavored Markdown"
                      />
                    )}
                  />
                </div>
              </section>

              {/* Section 2: Agent Fleet */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <BotIcon size={16} />
                  <h3 className="text-xs font-bold uppercase tracking-widest font-headline">Agent Fleet</h3>
                </div>
                <div className="relative">
                  <div 
                    className="flex items-center bg-surface-container-lowest rounded-lg p-3 cursor-pointer hover:bg-surface-container-high transition-colors ring-1 ring-outline-variant/10 focus-within:ring-primary/40"
                    onClick={() => setShowAgentDropdown(!showAgentDropdown)}
                    role="combobox"
                    aria-expanded={showAgentDropdown}
                    data-testid="agent-select"
                  >
                    <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center mr-3">
                      <BrainIcon size={16} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-on-surface">
                        {selectedAgent ? selectedAgent.name : 'Select Intelligence Core'}
                      </div>
                      <div className="text-xs text-on-surface-variant">
                        {selectedAgent ? (selectedAgent.role || 'Active Agent') : 'Choose an active agent for execution'}
                      </div>
                    </div>
                    <ExpandIcon size={20} className={`text-outline transition-transform ${showAgentDropdown ? 'rotate-180' : ''}`} />
                  </div>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {showAgentDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 w-full mt-2 bg-surface-container-highest rounded-lg shadow-xl p-2 z-50 border border-outline-variant/20 max-h-60 overflow-y-auto custom-scrollbar"
                        data-testid="agent-dropdown"
                      >
                        {fetchingAgents ? (
                          <div className="p-4 text-center text-xs text-on-surface-variant animate-pulse">Scanning fleet...</div>
                        ) : agents.length === 0 ? (
                          <div className="p-4 text-center text-xs text-on-surface-variant">No active agents found.</div>
                        ) : (
                          agents.map((agent) => (
                            <div
                              key={agent.id}
                              className="p-3 hover:bg-surface-container-low rounded cursor-pointer flex items-center gap-3 transition-colors group"
                              onClick={() => {
                                 setValue('assigneeId', agent.id, { shouldDirty: true, shouldValidate: true });
                                 setShowAgentDropdown(false);
                               }}
                              data-testid={`agent-option-${agent.id}`}
                            >
                              <div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <TokenIcon size={14} className="text-secondary group-hover:text-primary" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{agent.name}</div>
                                <div className="text-[10px] text-secondary">{agent.status || 'Active'} • {agent.role || 'Core'}</div>
                              </div>
                            </div>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Hidden select for accessibility/testing */}
                   <select
                     className="sr-only"
                     value={assigneeId}
                     onChange={(event) =>
                       setValue('assigneeId', event.target.value, {
                         shouldDirty: true,
                         shouldValidate: true,
                       })
                     }
                   >
                     <option value="">Select Agent</option>
                     {agents.map((agent) => (
                       <option key={agent.id} value={agent.id}>{agent.name}</option>
                     ))}
                   </select>
                 </div>
              </section>

              {/* Section 3 & 4: Scheduling & Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-secondary">
                    <ClockIcon size={16} />
                    <h3 className="text-xs font-bold uppercase tracking-widest font-headline">Scheduling Protocol</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="relative flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                         required
                          className={`w-full bg-surface-container-lowest border-none rounded-lg p-3 font-mono text-sm text-secondary focus:ring-1 transition-all pr-10 ${errors.cronExpression ? 'ring-1 ring-error' : 'focus:ring-secondary'}`}
                          type="text"
                          {...register('cronExpression')}
                          placeholder="e.g. 0 0 * * *"
                        />
                        <CodeIconLucide size={16} className="absolute right-3 top-3.5 text-outline-variant" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsWizardOpen(!isWizardOpen)}
                        className={`p-3 rounded-lg border transition-all ${isWizardOpen ? 'bg-secondary/20 border-secondary text-secondary shadow-[0_0_10px_rgba(78,222,163,0.2)]' : 'bg-surface-container-lowest border-outline-variant/10 text-on-surface-variant hover:text-secondary hover:border-secondary/30'}`}
                        title="Open Cron Wizard"
                      >
                        <MagicIcon size={18} />
                      </button>
                    </div>

                    <AnimatePresence>
                      {isWizardOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden bg-surface-container-highest/30 rounded-xl border border-secondary/10"
                        >
                          <div className="p-4 space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-secondary/60">
                              <WizardIcon size={12} />
                              Temporal Presets
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {cronPresets.map((preset) => (
                                     <button
                                   key={preset.value}
                                   type="button"
                                   onClick={() => {
                                     setValue('cronExpression', preset.value, {
                                       shouldDirty: true,
                                       shouldValidate: true,
                                     });
                                   }}
                                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
                                    cronExpression === preset.value
                                      ? 'bg-secondary text-on-secondary border-secondary shadow-lg shadow-secondary/20'
                                      : 'bg-surface-container-lowest border-outline-variant/10 text-on-surface-variant hover:border-secondary/40 hover:text-secondary'
                                  }`}
                                >
                                  {preset.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {cronInterpretation && !errors.cronExpression && (
                      <div className="flex items-center gap-2 text-[11px] text-secondary font-medium bg-secondary/5 px-3 py-2 rounded-lg border border-secondary/10 animate-in fade-in slide-in-from-left-2">
                        <TranslateIcon size={14} className="shrink-0" />
                        <span>{cronInterpretation}</span>
                      </div>
                    )}

                    <div className="px-1 py-1">
                      <p className="text-[9px] text-on-surface-variant/40 font-mono uppercase tracking-[0.1em] flex gap-2">
                        <span className="text-secondary/60 opacity-60 font-black">[Sec]</span>
                        <span>Min</span>
                        <span>Hour</span>
                        <span>Dom</span>
                        <span>Mon</span>
                        <span>Dow</span>
                      </p>
                    </div>

                    {errors.cronExpression?.message && (
                      <p className="text-[10px] text-error px-1 flex items-center gap-1.5 font-medium">
                        <PriorityIcon size={12} />
                        {errors.cronExpression.message}
                      </p>
                    )}
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-error">
                    <PriorityIcon size={16} />
                    <h3 className="text-xs font-bold uppercase tracking-widest font-headline">Execution Priority</h3>
                  </div>
                  <div className="flex bg-surface-container-lowest p-1 rounded-lg">
                    {[TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH, TaskPriority.CRITICAL].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() =>
                          setValue('priority', p, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        className={`flex-1 py-2 text-[10px] font-bold rounded transition-all ${
                          Number(priority) === Number(p)
                            ? (p === TaskPriority.CRITICAL ? 'bg-error/20 text-error' : 'bg-surface-container-high text-primary') 
                            : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        {getPriorityLabel(p)}
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              {/* Section 5: Visual Preview (Mocked for now) */}
              <section className="bg-surface-container-low p-5 rounded-xl border border-outline-variant/10">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-bold font-headline text-on-surface-variant tracking-wide">Deployment Preview</h4>
                  <span className="text-[10px] bg-secondary-container/30 text-secondary px-2 py-0.5 rounded-full font-bold uppercase">System Cluster 0-A</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs p-2 bg-surface-container-high/50 rounded-lg">
                    <span className="text-on-surface font-medium italic">Logic integrity check passed</span>
                    <span className="text-secondary font-bold">READY</span>
                  </div>
                  <div className="text-[10px] text-on-surface-variant leading-relaxed">
                    This task will be registered in the Alpha-Centauri cluster and executed by <span className="text-primary">{selectedAgent?.name || 'an assigned agent'}</span> according to the provided temporal sequence.
                  </div>
                </div>
              </section>
            </div>

            {/* Actions Footer */}
            <div className="p-6 bg-surface-container-low/50 flex justify-end items-center gap-4 sticky bottom-0 border-t border-outline-variant/10">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-bold text-on-surface-variant hover:text-on-surface transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-2.5 text-sm font-bold bg-primary text-on-primary rounded-lg shadow-lg hover:shadow-primary/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                ) : (
                  <RocketIcon size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                )}
                {initialData ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CreateRecurrentTaskModal;
