import React, { useEffect, useMemo, useState } from 'react';
import { Box, Info, Plus, Rocket, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRegisterProviderMutation } from '../hooks/providers/useProviderQueries';
import { useNotification } from '../hooks/useNotification';
import { cn } from '../lib/cn';

interface RegisterProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (providerId: string) => void;
}

const RegisterProviderModal: React.FC<RegisterProviderModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { notifyError } = useNotification();
  const [providerName, setProviderName] = useState('');
  const [models, setModels] = useState<string[]>(['']);

  const registerProviderMutation = useRegisterProviderMutation({
    onSuccess: (provider) => {
      onCreated?.(provider.id);
      setProviderName('');
      setModels(['']);
      onClose();
    },
  });

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !registerProviderMutation.isPending) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }

    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, registerProviderMutation.isPending]);

  const canRemoveModel = models.length > 1;
  const hasProviderName = providerName.trim().length > 0;
  const activeModelCount = useMemo(
    () => models.filter((model) => model.trim().length > 0).length,
    [models],
  );

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
    if (registerProviderMutation.isPending) {
      return;
    }

    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!hasProviderName) {
      notifyError('Validation Error', 'Please enter a provider name');
      return;
    }

    await registerProviderMutation.mutateAsync({
      providerName,
      models,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            disabled={registerProviderMutation.isPending}
            aria-label="Close register provider modal"
            className="absolute inset-0 bg-background/80 backdrop-blur-md disabled:cursor-not-allowed"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="register-provider-title"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-surface-container-low/90 backdrop-blur-2xl rounded-2xl shadow-[0_0_50px_-12px_rgba(173,198,255,0.2)] overflow-hidden border border-outline-variant/20"
          >
            <div className="px-8 pt-8 pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Box size={18} className="text-primary" />
                  </div>
                  <h2 id="register-provider-title" className="text-xl font-headline font-bold text-on-surface tracking-tight">
                    Register Provider
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={registerProviderMutation.isPending}
                  aria-label="Close register provider modal"
                  title="Close"
                  className="p-2 rounded-full hover:bg-white/5 transition-colors text-on-surface-variant/40 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-xs text-on-surface-variant font-medium opacity-60">
                Onboard a new computational gateway to your agentic ecosystem.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="px-8 py-4 space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-primary tracking-[0.2em] uppercase" htmlFor="provider-name-input">
                    Provider Name
                  </label>
                  <div className="bg-surface-container-lowest/50 rounded-xl p-0.5 ring-1 ring-outline-variant/10 focus-within:ring-primary/40 transition-all">
                    <input
                      id="provider-name-input"
                      type="text"
                      value={providerName}
                      onChange={(event) => setProviderName(event.target.value)}
                      placeholder="e.g., OpenAI"
                      disabled={registerProviderMutation.isPending}
                      className="w-full bg-transparent border-none rounded-lg px-4 py-3 text-sm focus:outline-none text-white placeholder:text-on-surface-variant/20 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-black text-primary tracking-[0.2em] uppercase">
                      Model Variants
                    </label>
                    <span className="text-[10px] text-on-surface-variant/40 italic font-medium">
                      {activeModelCount > 0 ? `${activeModelCount} pending` : 'Define available endpoints'}
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 scrollbar-hide">
                    {models.map((model, index) => (
                      <motion.div
                        key={`${model}-${index}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex gap-2 group"
                      >
                        <div className="relative flex-1 bg-surface-container-lowest/50 rounded-xl p-0.5 ring-1 ring-outline-variant/5 focus-within:ring-secondary/40 transition-all">
                          <input
                            type="text"
                            value={model}
                            onChange={(event) => updateModel(index, event.target.value)}
                            placeholder="gpt-4o"
                            disabled={registerProviderMutation.isPending}
                            className="w-full bg-transparent border-none rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none placeholder:text-on-surface-variant/20 disabled:opacity-60"
                            aria-label={`Model variant ${index + 1}`}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeModel(index)}
                          disabled={!canRemoveModel || registerProviderMutation.isPending}
                          aria-label={`Remove model variant ${index + 1}`}
                          title={canRemoveModel ? 'Remove model variant' : 'At least one model input is kept visible'}
                          className={cn(
                            'w-10 h-10 flex items-center justify-center transition-colors bg-surface-container-highest/10 rounded-xl',
                            canRemoveModel
                              ? 'text-on-surface-variant/20 hover:text-error hover:bg-error/10'
                              : 'text-on-surface-variant/10 cursor-not-allowed opacity-50',
                            registerProviderMutation.isPending && 'cursor-not-allowed opacity-50',
                          )}
                        >
                          <Trash2 size={16} />
                        </button>
                      </motion.div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addModel}
                    disabled={registerProviderMutation.isPending}
                    className="w-full py-3 border-2 border-dashed border-outline-variant/10 rounded-xl flex items-center justify-center gap-2 text-on-surface-variant/40 hover:border-primary/40 hover:text-primary transition-all group font-bold text-[10px] uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Add model variant"
                  >
                    <Plus size={14} className="group-hover:scale-110 transition-transform" />
                    Add model variant
                  </button>
                </div>

                <div className="bg-tertiary-container/10 p-5 rounded-2xl flex gap-4 border border-tertiary/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-tertiary/5 blur-2xl rounded-full -mr-10 -mt-10" />
                  <div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center shrink-0">
                    <Info size={18} className="text-tertiary" />
                  </div>
                  <p className="text-[11px] text-on-surface-variant/80 leading-relaxed font-medium">
                    Once registered, these models will be available in the{' '}
                    <span className="text-tertiary font-bold">Orchestration Canvas</span> for node deployment and agent personality mapping.
                  </p>
                </div>
              </div>

              <div className="px-8 py-8 flex items-center justify-end gap-6 bg-gradient-to-t from-surface-container-lowest/50 to-transparent">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={registerProviderMutation.isPending}
                  className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registerProviderMutation.isPending || !hasProviderName}
                  className="bg-primary px-8 py-3 rounded-xl text-on-primary text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.05] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {registerProviderMutation.isPending ? (
                    <span className="w-3 h-3 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                  ) : (
                    <>
                      <Rocket size={14} />
                      Register Provider
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-primary/10 blur-[60px] rounded-full pointer-events-none" />
            <div className="absolute top-0 right-0 w-32 h-1 bg-gradient-to-l from-secondary/40 to-transparent" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RegisterProviderModal;
