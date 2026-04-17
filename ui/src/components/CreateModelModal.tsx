import React, { useEffect, useMemo, useState } from 'react';
import { Cpu, Plus, Trash2, X, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCreateModelsMutation } from '../hooks/providers/useProviderQueries';
import { cn } from '../lib/cn';

interface CreateModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  providerId: string;
  providerName: string;
}

const CreateModelModal: React.FC<CreateModelModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  providerId,
  providerName,
}) => {
  const [models, setModels] = useState<string[]>(['']);

  const createModelsMutation = useCreateModelsMutation({
    onSuccess: () => {
      onCreated();
      setModels(['']);
      onClose();
    },
  });

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !createModelsMutation.isPending) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }

    return () => window.removeEventListener('keydown', handleEsc);
  }, [createModelsMutation.isPending, isOpen, onClose]);

  const hasActiveModels = useMemo(
    () => models.some((model) => model.trim().length > 0),
    [models],
  );
  const canRemoveModel = models.length > 1;

  const addModel = () => setModels((currentModels) => [...currentModels, '']);
  const updateModel = (index: number, value: string) => {
    setModels((currentModels) => {
      const nextModels = [...currentModels];
      nextModels[index] = value;
      return nextModels;
    });
  };
  const removeModel = (index: number) => {
    if (!canRemoveModel) {
      return;
    }

    setModels((currentModels) => currentModels.filter((_, modelIndex) => modelIndex !== index));
  };

  const handleClose = () => {
    if (createModelsMutation.isPending) {
      return;
    }

    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!providerId || !hasActiveModels) {
      return;
    }

    await createModelsMutation.mutateAsync({
      providerId,
      models,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 text-white">
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            disabled={createModelsMutation.isPending}
            aria-label="Close create model modal"
            className="absolute inset-0 bg-background/80 backdrop-blur-md disabled:cursor-not-allowed"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-model-title"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-surface-container-low/90 backdrop-blur-2xl rounded-2xl shadow-[0_0_50px_-12px_rgba(78,222,163,0.1)] overflow-hidden border border-outline-variant/20"
          >
            <div className="px-8 pt-8 pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Cpu size={18} className="text-primary" />
                  </div>
                  <h2 id="create-model-title" className="text-xl font-headline font-bold text-on-surface tracking-tight">
                    Expand Provider Fleets
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={createModelsMutation.isPending}
                  aria-label="Close create model modal"
                  title="Close"
                  className="p-2 rounded-full hover:bg-white/5 transition-colors text-on-surface-variant/40 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-xs text-on-surface-variant font-medium opacity-60">
                Registering new registry variants for <span className="text-primary font-bold">{providerName}</span>
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="px-8 py-4 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-black text-primary tracking-[0.2em] uppercase">
                      Model Identifiers
                    </label>
                    <span className="text-[10px] text-on-surface-variant/40 italic font-medium">
                      Batch register endpoints
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-none custom-scrollbar">
                    {models.map((model, index) => (
                      <motion.div
                        key={`${model}-${index}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex gap-2 group"
                      >
                        <div className="relative flex-1 bg-surface-container-lowest/50 rounded-xl p-0.5 ring-1 ring-outline-variant/10 focus-within:ring-primary/40 transition-all">
                          <input
                            autoFocus={index === models.length - 1}
                            type="text"
                            value={model}
                            onChange={(event) => updateModel(index, event.target.value)}
                            placeholder="e.g., gpt-4o-2024-05-13"
                            disabled={createModelsMutation.isPending}
                            className="w-full bg-transparent border-none rounded-lg px-4 py-3 text-sm focus:outline-none text-white placeholder:text-on-surface-variant/20 disabled:opacity-60"
                            aria-label={`Model identifier ${index + 1}`}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeModel(index)}
                          disabled={!canRemoveModel || createModelsMutation.isPending}
                          aria-label={`Remove model identifier ${index + 1}`}
                          title={canRemoveModel ? 'Remove model identifier' : 'At least one model input is kept visible'}
                          className={cn(
                            'w-12 h-12 flex items-center justify-center transition-colors bg-surface-container-highest/10 rounded-xl',
                            canRemoveModel
                              ? 'text-on-surface-variant/20 hover:text-error hover:bg-error/10'
                              : 'text-on-surface-variant/10 cursor-not-allowed opacity-50',
                            createModelsMutation.isPending && 'cursor-not-allowed opacity-50',
                          )}
                        >
                          <Trash2 size={18} />
                        </button>
                      </motion.div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addModel}
                    disabled={createModelsMutation.isPending}
                    className="w-full py-4 border-2 border-dashed border-primary/20 rounded-xl flex items-center justify-center gap-3 text-on-surface-variant/40 hover:border-primary/40 hover:text-primary transition-all group font-bold text-[10px] uppercase tracking-widest bg-primary/5 hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Add model identifier"
                  >
                    <Plus size={16} className="group-hover:scale-110 transition-transform" />
                    Register New Target variant
                  </button>
                </div>

                <div className="bg-primary/5 p-5 rounded-2xl flex gap-4 border border-primary/5 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-2xl rounded-full -mr-10 -mt-10 pointer-events-none" />
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Zap size={18} className="text-primary" />
                  </div>
                  <p className="text-[11px] text-on-surface-variant/80 leading-relaxed font-medium">
                    Batch models registered here will be synchronized with the{' '}
                    <span className="text-primary font-bold">Orchestrator Registry</span> for global accessibility.
                  </p>
                </div>
              </div>

              <div className="px-8 py-8 flex items-center justify-end gap-6 bg-gradient-to-t from-surface-container-lowest/50 to-transparent">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={createModelsMutation.isPending}
                  className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createModelsMutation.isPending || !hasActiveModels || !providerId}
                  className="bg-primary px-8 py-3.5 rounded-xl text-on-primary text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.05] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {createModelsMutation.isPending ? (
                    <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus size={16} />
                      Append Provider Fleets
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-primary/10 blur-[60px] rounded-full pointer-events-none" />
            <div className="absolute top-0 right-0 w-32 h-1 bg-gradient-to-l from-secondary/40 to-transparent" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateModelModal;
