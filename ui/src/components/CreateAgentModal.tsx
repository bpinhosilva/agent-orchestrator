import { useEffect, useId, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Box,
  ChevronDown,
  Edit2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { agentsApi, BALANCED_ATTRIBUTES } from '../api/agents';
import { providersApi, type Provider } from '../api/providers';
import type { Model } from '../api/models';
import MarkdownField from './MarkdownField';
import PersonalityMatrix from './PersonalityMatrix';
import { useNotification } from '../hooks/useNotification';
import {
  DEFAULT_AGENT_INSTRUCTIONS,
  createAgentSchema,
  type CreateAgentFormValues,
} from '../lib/taskFormSchemas';
import AgentEmojiPickerModal from './AgentEmojiPickerModal';
import {
  DEFAULT_AGENT_EMOJI,
  getAgentEmojiOption,
  normalizeAgentEmoji,
} from '../lib/agentEmojis';

interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const createAgentDefaults: CreateAgentFormValues = {
  name: '',
  role: '',
  description: '',
  emoji: DEFAULT_AGENT_EMOJI,
  providerId: '',
  modelId: '',
  instructions: DEFAULT_AGENT_INSTRUCTIONS,
  attributes: { ...BALANCED_ATTRIBUTES },
};

const steps = [
  { id: 1, title: 'Essential Config', subtitle: 'ID, ROLE & MODEL' },
  { id: 2, title: 'Intelligence Tuning', subtitle: 'COGNITIVE MATRIX' },
  { id: 3, title: 'Instructions', subtitle: 'KNOWLEDGE BASE' },
];

const CreateAgentModal = ({ isOpen, onClose, onCreated }: CreateAgentModalProps) => {
  const queryClient = useQueryClient();
  const { notifyApiError, notifyError, notifySuccess } = useNotification();
  const [activeStep, setActiveStep] = useState(1);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const modalTitleId = useId();
  const modalDescriptionId = useId();
  const nameErrorId = useId();
  const roleErrorId = useId();
  const descriptionErrorId = useId();
  const providerErrorId = useId();
  const modelErrorId = useId();
  const instructionsErrorId = useId();

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<CreateAgentFormValues>({
    resolver: zodResolver(createAgentSchema),
    defaultValues: createAgentDefaults,
    mode: 'onBlur',
  });

  const providerId = useWatch({ control, name: 'providerId' });
  const modelId = useWatch({ control, name: 'modelId' });
  const selectedEmoji = useWatch({ control, name: 'emoji' });

  const providersQuery = useQuery({
    queryKey: ['providers'],
    enabled: isOpen,
    queryFn: async () => {
      const response = await providersApi.findAll();
      return response.data;
    },
  });

  const modelsQuery = useQuery({
    queryKey: ['provider-models', providerId],
    enabled: isOpen && Boolean(providerId),
    queryFn: async () => {
      const response = await providersApi.findModels(providerId);
      return response.data;
    },
  });

  useEffect(() => {
    if (!isOpen) {
      reset(createAgentDefaults);
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

    if (providersQuery.error) {
      notifyApiError(providersQuery.error, 'Providers Load Failed');
    }
  }, [isOpen, notifyApiError, providersQuery.error]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (modelsQuery.error) {
      notifyApiError(modelsQuery.error, 'Models Load Failed');
    }
  }, [isOpen, modelsQuery.error, notifyApiError]);

  const providers = useMemo(() => providersQuery.data ?? [], [providersQuery.data]);
  const availableModels = useMemo(() => modelsQuery.data ?? [], [modelsQuery.data]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (providers.length === 0) {
      if (providerId) {
        setValue('providerId', '', { shouldDirty: false, shouldValidate: true });
      }
      return;
    }

    if (!providerId || !providers.some((provider) => provider.id === providerId)) {
      setValue('providerId', providers[0].id, { shouldDirty: false, shouldValidate: true });
    }
  }, [isOpen, providerId, providers, setValue]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (!providerId) {
      if (modelId) {
        setValue('modelId', '', { shouldDirty: false, shouldValidate: true });
      }
      return;
    }

    if (availableModels.length === 0) {
      if (modelId) {
        setValue('modelId', '', { shouldDirty: false, shouldValidate: true });
      }
      return;
    }

    if (!modelId || !availableModels.some((model) => model.id === modelId)) {
      setValue('modelId', availableModels[0].id, { shouldDirty: false, shouldValidate: true });
    }
  }, [availableModels, isOpen, modelId, providerId, setValue]);

  const createMutation = useMutation({
    mutationFn: async (values: CreateAgentFormValues) => {
      await agentsApi.create({
        name: values.name,
        emoji: values.emoji,
        role: values.role,
        description: values.description,
        systemInstructions: values.instructions,
        modelId: values.modelId,
        status: 'active',
        attributes: values.attributes,
      });

      return values;
    },
    onSuccess: (values) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      notifySuccess('Agent Deployed', `Successfully commissioned ${values.name} into the fleet.`);
      onCreated?.();
      onClose();
      reset(createAgentDefaults);
      setActiveStep(1);
    },
    onError: (error) => {
      notifyApiError(error, 'Deployment Failed');
    },
  });

  const loading = createMutation.isPending;
  const fetchingData = providersQuery.isPending || modelsQuery.isPending;

  const handleDeploy = handleSubmit(
    async (values) => {
      await createMutation.mutateAsync(values);
    },
    () => {
      notifyError('Validation Error', 'Please review the highlighted fields before deploying the agent.');
    },
  );

  const handleClose = () => {
    if (loading) {
      return;
    }
    setActiveStep(1);
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
          aria-busy={loading || fetchingData}
          className="relative w-full max-w-5xl h-full max-h-[850px] bg-surface-container-low rounded-2xl shadow-2xl overflow-hidden flex flex-col ring-1 ring-outline-variant/10"
        >
          <div className="px-8 py-6 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-low/50 backdrop-blur-md sticky top-0 z-10">
            <div>
              <h2 id={modalTitleId} className="text-2xl font-black font-headline text-white tracking-tight">
                Create New Agent
              </h2>
              <p id={modalDescriptionId} className="text-sm text-on-surface-variant/80 mt-1">
                Configure a specialized AI persona to handle specific nodes in your automation flows.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-6 py-2.5 rounded-md text-sm font-bold text-on-surface-variant hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeploy}
                disabled={loading || providers.length === 0 || availableModels.length === 0}
                className="px-8 py-2.5 rounded-md bg-primary text-on-primary text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? 'Deploying...' : 'Deploy Agent'}
              </button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            <div className="w-72 bg-surface-container-low/30 border-r border-outline-variant/5 p-8 flex flex-col gap-10">
              <div className="space-y-8">
                {steps.map((step) => (
                  <button
                    key={step.id}
                    type="button"
                    className="flex gap-4 group cursor-pointer text-left w-full"
                    onClick={() => setActiveStep(step.id)}
                    aria-pressed={activeStep === step.id}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                        activeStep === step.id
                          ? 'bg-secondary text-surface'
                          : 'bg-surface-container-highest text-on-surface-variant'
                      }`}
                    >
                      {step.id.toString().padStart(2, '0')}
                    </div>
                    <div>
                      <h4
                        className={`text-xs font-bold font-headline transition-colors ${
                          activeStep === step.id ? 'text-white' : 'text-on-surface-variant'
                        }`}
                      >
                        {step.title}
                      </h4>
                      <p className="text-[9px] font-bold tracking-widest text-on-surface-variant/50 mt-0.5">
                        {step.subtitle}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-auto bg-tertiary/10 rounded-xl p-5 ring-1 ring-tertiary/20 backdrop-blur-sm relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-tertiary/10 rounded-full blur-2xl group-hover:bg-tertiary/20 transition-all duration-700" />
                <div className="flex items-center gap-2 mb-3 text-tertiary">
                  <Sparkles size={14} aria-hidden="true" />
                  <span className="text-[10px] font-black uppercase tracking-widest">AI Suggestion</span>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed italic">
                  "Try selecting <span className="text-tertiary font-bold">Researcher</span> role for high-depth data synthesis tasks."
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
              <section className="space-y-8">
                <div className="flex items-center gap-3">
                  <div className="w-1 bg-secondary h-6 rounded-full" />
                  <h3 className="text-lg font-bold font-headline text-white">Basic Configuration</h3>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEmojiPickerOpen(true)}
                  className="group flex w-full items-center justify-between rounded-[24px] border border-outline-variant/10 bg-surface-container-highest/20 p-5 text-left transition-all hover:border-primary/30 hover:bg-surface-container-highest/35"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-[20px] border border-primary/20 bg-surface-container-high text-5xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                      <span aria-hidden="true">{normalizeAgentEmoji(selectedEmoji)}</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.32em] text-primary/80">
                        Emoji signature
                      </p>
                      <h4 className="mt-2 font-headline text-xl font-black text-white">
                        {getAgentEmojiOption(selectedEmoji).label}
                      </h4>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        {getAgentEmojiOption(selectedEmoji).hint}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container-high text-on-surface-variant transition-colors group-hover:text-on-surface">
                    <Edit2 size={16} aria-hidden="true" />
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label
                      htmlFor="create-agent-name"
                      className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60"
                    >
                      Agent Name
                    </label>
                    <div className="bg-surface-container-highest/30 rounded-lg p-0.5 ring-1 ring-outline-variant/10 focus-within:ring-primary/40 transition-all">
                      <input
                        id="create-agent-name"
                        type="text"
                        placeholder="e.g. Researcher-X"
                        aria-invalid={Boolean(errors.name)}
                        aria-describedby={errors.name ? nameErrorId : undefined}
                        className="w-full bg-transparent border-none text-sm text-on-surface h-10 px-3 focus:outline-none placeholder:text-on-surface-variant/30"
                        {...register('name')}
                      />
                    </div>
                    {errors.name && (
                      <p id={nameErrorId} className="text-xs text-error font-semibold">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="create-agent-role"
                      className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60"
                    >
                      Primary Role
                    </label>
                    <div className="bg-surface-container-highest/30 rounded-lg p-0.5 ring-1 ring-outline-variant/10 focus-within:ring-primary/40 transition-all text-on-surface">
                      <input
                        id="create-agent-role"
                        type="text"
                        placeholder="e.g. Researcher"
                        aria-invalid={Boolean(errors.role)}
                        aria-describedby={errors.role ? roleErrorId : undefined}
                        className="w-full bg-transparent border-none text-sm text-on-surface h-10 px-4 focus:outline-none placeholder:text-on-surface-variant/30"
                        {...register('role')}
                      />
                    </div>
                    {errors.role && (
                      <p id={roleErrorId} className="text-xs text-error font-semibold">
                        {errors.role.message}
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
                        label="Description"
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Define what this agent aims to achieve... You can use markdown for formatting."
                        height="h-32"
                        maxLength={1000}
                      />
                    )}
                  />
                  {errors.description && (
                    <p id={descriptionErrorId} className="text-xs text-error font-semibold">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div className="pt-4 space-y-8 border-t border-outline-variant/10">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                        Select Provider
                      </label>
                      {fetchingData && (
                        <span className="text-[10px] text-primary animate-pulse font-bold uppercase tracking-widest">
                          Updating...
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      {providers.map((provider: Provider) => (
                        <button
                          key={provider.id}
                          type="button"
                          aria-pressed={providerId === provider.id}
                          onClick={() => {
                            if (providerId === provider.id) {
                              return;
                            }
                            setValue('providerId', provider.id, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                            setValue('modelId', '', {
                              shouldDirty: true,
                              shouldValidate: false,
                            });
                          }}
                          className={`p-4 rounded-xl flex flex-col items-center gap-3 transition-all ${
                            providerId === provider.id
                              ? 'bg-primary/10 ring-2 ring-primary shadow-[0_0_20px_rgba(173,198,255,0.15)]'
                              : 'bg-surface-container-highest/30 ring-1 ring-outline-variant/10 hover:bg-surface-container-highest/50'
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                              providerId === provider.id
                                ? 'bg-primary text-surface'
                                : 'bg-surface-container-high text-on-surface-variant'
                            }`}
                          >
                            <Box size={20} aria-hidden="true" />
                          </div>
                          <div className="text-center">
                            <h4
                              className={`text-xs font-black uppercase tracking-wider ${
                                providerId === provider.id ? 'text-white' : 'text-on-surface-variant'
                              }`}
                            >
                              {provider.name}
                            </h4>
                          </div>
                        </button>
                      ))}
                      {providers.length === 0 && !providersQuery.isPending && (
                        <div className="col-span-4 py-8 border-2 border-dashed border-outline-variant/10 rounded-xl flex flex-col items-center justify-center text-on-surface-variant/40 gap-2">
                          <Layers size={24} aria-hidden="true" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">
                            No providers registered
                          </span>
                        </div>
                      )}
                    </div>
                    {errors.providerId && (
                      <p id={providerErrorId} className="text-xs text-error font-semibold">
                        {errors.providerId.message}
                      </p>
                    )}
                  </div>

                  <AnimatePresence mode="wait">
                    {providerId && (
                      <motion.div
                        key={providerId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4 pt-4 border-t border-outline-variant/5"
                      >
                        <label
                          htmlFor="create-agent-model"
                          className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60"
                        >
                          Model Variant Selection
                        </label>
                        <div className="bg-surface-container-highest/30 rounded-lg p-0.5 ring-1 ring-outline-variant/10 focus-within:ring-primary/40 transition-all relative">
                          <select
                            id="create-agent-model"
                            value={modelId}
                            onChange={(event) =>
                              setValue('modelId', event.target.value, {
                                shouldDirty: true,
                                shouldValidate: true,
                              })
                            }
                            aria-invalid={Boolean(errors.modelId)}
                            aria-describedby={errors.modelId ? modelErrorId : undefined}
                            className="w-full bg-transparent border-none text-sm text-on-surface h-10 px-3 focus:outline-none appearance-none cursor-pointer"
                          >
                            <option value="" disabled className="bg-surface-container-low text-on-surface">
                              Select a model...
                            </option>
                            {availableModels.map((model: Model) => (
                              <option key={model.id} value={model.id} className="bg-surface-container-low text-on-surface">
                                {model.name}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/60">
                            <ChevronDown size={18} aria-hidden="true" />
                          </div>
                        </div>
                        {errors.modelId && (
                          <p id={modelErrorId} className="text-xs text-error font-semibold">
                            {errors.modelId.message}
                          </p>
                        )}
                        {availableModels.length === 0 && !modelsQuery.isPending && (
                          <div className="py-6 text-center bg-error/5 rounded-xl border border-error/10">
                            <span className="text-[10px] font-bold text-error uppercase tracking-widest opacity-60">
                              No model variants found for this provider
                            </span>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </section>

              <section className="space-y-10">
                <div className="flex items-center gap-3">
                  <div className="w-1 bg-primary h-6 rounded-full" />
                  <h3 className="text-lg font-bold font-headline text-white">Intelligence Tuning</h3>
                </div>

                <Controller
                  control={control}
                  name="attributes"
                  render={({ field }) => (
                    <PersonalityMatrix
                      value={field.value ?? { ...BALANCED_ATTRIBUTES }}
                      onChange={field.onChange}
                    />
                  )}
                />
              </section>

              <section className="space-y-8">
                <div className="flex items-center gap-3">
                  <div className="w-1 bg-tertiary h-6 rounded-full" />
                  <h3 className="text-lg font-bold font-headline text-white">Operational Directives</h3>
                </div>

                <div className="space-y-2">
                  <Controller
                    control={control}
                    name="instructions"
                    render={({ field }) => (
                      <MarkdownField
                        label="System Instructions"
                        value={field.value}
                        onChange={field.onChange}
                        height="h-64"
                        helperText="Prompt Engineering Active"
                        maxLength={1000}
                      />
                    )}
                  />
                  {errors.instructions && (
                    <p id={instructionsErrorId} className="text-xs text-error font-semibold">
                      {errors.instructions.message}
                    </p>
                  )}
                </div>

                {/* <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                    Knowledge Integration
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      className="border-2 border-dashed border-outline-variant/10 rounded-xl p-6 flex flex-col items-center justify-center gap-2 group cursor-pointer hover:border-primary/30 transition-all"
                    >
                      <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors">
                        <Code size={18} aria-hidden="true" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                        Connect Repo
                      </span>
                    </button>
                    <button
                      type="button"
                      className="border-2 border-dashed border-outline-variant/10 rounded-xl p-6 flex flex-col items-center justify-center gap-2 group cursor-pointer hover:border-primary/30 transition-all"
                    >
                      <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors">
                        <Shield size={18} aria-hidden="true" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                        Access Policies
                      </span>
                    </button>
                  </div>
                </div> */}
              </section>
            </div>
          </div>
        </motion.div>
        <AgentEmojiPickerModal
          isOpen={isEmojiPickerOpen}
          selectedEmoji={normalizeAgentEmoji(selectedEmoji)}
          currentEmoji={DEFAULT_AGENT_EMOJI}
          isSaving={loading}
          onSelect={(emoji) =>
            setValue('emoji', emoji, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          onClose={() => setIsEmojiPickerOpen(false)}
          onConfirm={() => setIsEmojiPickerOpen(false)}
        />
      </div>
    </AnimatePresence>
  );
};

export default CreateAgentModal;
