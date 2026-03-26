import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Info, 
  Box,
  Rocket
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { providersApi } from '../api/providers';
import { modelsApi } from '../api/models';
import { useNotification } from '../hooks/useNotification';

interface RegisterProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const RegisterProviderModal: React.FC<RegisterProviderModalProps> = ({ isOpen, onClose, onCreated }) => {
  const { notifyApiError, notifyError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [providerName, setProviderName] = useState('');
  const [models, setModels] = useState<string[]>(['']);

  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const addModel = () => setModels([...models, '']);
  const updateModel = (index: number, value: string) => {
    const newModels = [...models];
    newModels[index] = value;
    setModels(newModels);
  };
  const removeModel = (index: number) => setModels(models.filter((_, i) => i !== index));

  const handleRegister = async () => {
    if (!providerName) {
      notifyError('Validation Error', 'Please enter a provider name');
      return;
    }

    try {
      setLoading(true);
      // Create provider
      const providerRes = await providersApi.create({ name: providerName });
      const providerId = providerRes.data.id;

      // Create models associated with provider
      const activeModels = models.filter(m => m.trim() !== '');
      await Promise.all(activeModels.map(m => modelsApi.create({ name: m, providerId })));

      // notifySuccess('Provider Registered', `Successfully onboarded ${providerName} to the ecosystem.`);
      onCreated?.();
      onClose();
      // Reset
      setProviderName('');
      setModels(['']);
    } catch (error) {
      console.error('Failed to register provider:', error);
      notifyApiError(error, 'Registration Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
          />

          {/* Modal Window */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-surface-container-low/90 backdrop-blur-2xl rounded-2xl shadow-[0_0_50px_-12px_rgba(173,198,255,0.2)] overflow-hidden border border-outline-variant/20"
          >
            {/* Modal Header */}
            <div className="px-8 pt-8 pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Box size={18} className="text-primary" />
                  </div>
                  <h2 className="text-xl font-headline font-bold text-on-surface tracking-tight">Register Provider</h2>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/5 transition-colors text-on-surface-variant/40 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-xs text-on-surface-variant font-medium opacity-60">Onboard a new computational gateway to your agentic ecosystem.</p>
            </div>

            {/* Modal Body (Form) */}
            <div className="px-8 py-4 space-y-6">
              {/* Provider Name */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-primary tracking-[0.2em] uppercase">Provider Name</label>
                <div className="bg-surface-container-lowest/50 rounded-xl p-0.5 ring-1 ring-outline-variant/10 focus-within:ring-primary/40 transition-all">
                  <input 
                    type="text"
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    placeholder="e.g., OpenAI"
                    className="w-full bg-transparent border-none rounded-lg px-4 py-3 text-sm focus:outline-none text-white placeholder:text-on-surface-variant/20"
                  />
                </div>
              </div>

              {/* Models Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-black text-primary tracking-[0.2em] uppercase">Model Variants</label>
                  <span className="text-[10px] text-on-surface-variant/40 italic font-medium">Define available endpoints</span>
                </div>
                
                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 scrollbar-hide">
                  {models.map((model, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-2 group"
                    >
                      <div className="relative flex-1 bg-surface-container-lowest/50 rounded-xl p-0.5 ring-1 ring-outline-variant/5 focus-within:ring-secondary/40 transition-all">
                          <input 
                            type="text"
                            value={model}
                            onChange={(e) => updateModel(index, e.target.value)}
                            placeholder="gpt-4o"
                            className="w-full bg-transparent border-none rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none placeholder:text-on-surface-variant/20"
                          />
                      </div>
                      <button 
                        onClick={() => removeModel(index)}
                        className="w-10 h-10 flex items-center justify-center text-on-surface-variant/20 hover:text-error transition-colors bg-surface-container-highest/10 rounded-xl hover:bg-error/10"
                      >
                        <Trash2 size={16} />
                      </button>
                    </motion.div>
                  ))}
                </div>

                {/* Add Button */}
                <button 
                  onClick={addModel}
                  className="w-full py-3 border-2 border-dashed border-outline-variant/10 rounded-xl flex items-center justify-center gap-2 text-on-surface-variant/40 hover:border-primary/40 hover:text-primary transition-all group font-bold text-[10px] uppercase tracking-widest"
                >
                  <Plus size={14} className="group-hover:scale-110 transition-transform" />
                  Add model variant
                </button>
              </div>

              {/* Info Context */}
              <div className="bg-tertiary-container/10 p-5 rounded-2xl flex gap-4 border border-tertiary/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-tertiary/5 blur-2xl rounded-full -mr-10 -mt-10" />
                <div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center shrink-0">
                  <Info size={18} className="text-tertiary" />
                </div>
                <p className="text-[11px] text-on-surface-variant/80 leading-relaxed font-medium">
                  Once registered, these models will be available in the <span className="text-tertiary font-bold">Orchestration Canvas</span> for node deployment and agent personality mapping.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-8 flex items-center justify-end gap-6 bg-gradient-to-t from-surface-container-lowest/50 to-transparent">
              <button 
                onClick={onClose}
                className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleRegister}
                disabled={loading}
                className="bg-primary px-8 py-3 rounded-xl text-on-primary text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.05] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale flex items-center gap-2"
              >
                {loading ? (
                   <span className="w-3 h-3 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                ) : (
                  <>
                    <Rocket size={14} />
                    Register Provider
                  </>
                )}
              </button>
            </div>

            {/* Design Elements */}
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-primary/10 blur-[60px] rounded-full pointer-events-none" />
            <div className="absolute top-0 right-0 w-32 h-1 bg-gradient-to-l from-secondary/40 to-transparent" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RegisterProviderModal;
