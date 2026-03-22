import React, { useState } from 'react';
import { 
  X, 
  Cpu, 
  Plus,
  Zap,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { modelsApi } from '../api/models';
import { useNotification } from '../contexts/NotificationContext';

interface CreateModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  providerId: string;
  providerName: string;
}

const CreateModelModal: React.FC<CreateModelModalProps> = ({ isOpen, onClose, onCreated, providerId, providerName }) => {
  const { notifyError } = useNotification();
  const [loading, setLoading] = useState(false);
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
  const removeModel = (index: number) => {
    if (models.length > 1) {
      setModels(models.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeModels = models.filter(m => m.trim() !== '');
    if (activeModels.length === 0) return;

    try {
      setLoading(true);
      await Promise.all(
        activeModels.map(m => modelsApi.create({
          name: m,
          providerId: providerId
        }))
      );
      // notifySuccess('Models Registered', `Successfully added ${activeModels.length} models to ${providerName}.`);
      onCreated();
      onClose();
      setModels(['']);
    } catch (error) {
      console.error('Failed to register models:', error);
      notifyError('Registration Incomplete', 'Failed to register some or all model variants. The system will attempt to synchronize remaining nodes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 text-white">
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
            className="relative w-full max-w-lg bg-surface-container-low/90 backdrop-blur-2xl rounded-2xl shadow-[0_0_50px_-12px_rgba(78,222,163,0.1)] overflow-hidden border border-outline-variant/20"
          >
            {/* Modal Header */}
            <div className="px-8 pt-8 pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Cpu size={18} className="text-primary" />
                  </div>
                  <h2 className="text-xl font-headline font-bold text-on-surface tracking-tight">Expand Provider Fleets</h2>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/5 transition-colors text-on-surface-variant/40 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-xs text-on-surface-variant font-medium opacity-60">Registering new registry variants for <span className="text-primary font-bold">{providerName}</span></p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Modal Body */}
              <div className="px-8 py-4 space-y-6">
                {/* Models Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-black text-primary tracking-[0.2em] uppercase">Model Identifiers</label>
                    <span className="text-[10px] text-on-surface-variant/40 italic font-medium">Batch Register Endpoints</span>
                  </div>
                  
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-none custom-scrollbar">
                    {models.map((model, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex gap-2 group"
                      >
                        <div className="relative flex-1 bg-surface-container-lowest/50 rounded-xl p-0.5 ring-1 ring-outline-variant/10 focus-within:ring-primary/40 transition-all">
                          <input 
                            autoFocus={index === models.length - 1}
                            type="text"
                            value={model}
                            onChange={(e) => updateModel(index, e.target.value)}
                            placeholder="e.g., gpt-4o-2024-05-13"
                            className="w-full bg-transparent border-none rounded-lg px-4 py-3 text-sm focus:outline-none text-white placeholder:text-on-surface-variant/20"
                          />
                        </div>
                        <button 
                          type="button"
                          onClick={() => removeModel(index)}
                          className={`w-12 h-12 flex items-center justify-center text-on-surface-variant/20 hover:text-error transition-colors bg-surface-container-highest/10 rounded-xl hover:bg-error/10 ${models.length === 1 ? 'opacity-0 pointer-events-none' : ''}`}
                        >
                          <Trash2 size={18} />
                        </button>
                      </motion.div>
                    ))}
                  </div>

                  {/* Add Button */}
                  <button 
                    type="button"
                    onClick={addModel}
                    className="w-full py-4 border-2 border-dashed border-outline-variant/10 rounded-xl flex items-center justify-center gap-3 text-on-surface-variant/40 hover:border-primary/40 hover:text-primary transition-all group font-bold text-[10px] uppercase tracking-widest bg-primary/5 hover:bg-primary/10 border-primary/20"
                  >
                    <Plus size={16} className="group-hover:scale-110 transition-transform" />
                    Register New Target variant
                  </button>
                </div>

                {/* Info Card */}
                <div className="bg-primary/5 p-5 rounded-2xl flex gap-4 border border-primary/5 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-2xl rounded-full -mr-10 -mt-10 pointer-events-none" />
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Zap size={18} className="text-primary" />
                  </div>
                  <p className="text-[11px] text-on-surface-variant/80 leading-relaxed font-medium">
                    Batch models registered here will be synchronized with the <span className="text-primary font-bold">Orchestrator Registry</span> for global accessibility.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-8 py-8 flex items-center justify-end gap-6 bg-gradient-to-t from-surface-container-lowest/50 to-transparent">
                <button 
                  type="button"
                  onClick={onClose}
                  className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  disabled={loading || models.every(m => !m.trim())}
                  className="bg-primary px-8 py-3.5 rounded-xl text-on-primary text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.05] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale flex items-center gap-2"
                >
                  {loading ? (
                     <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus size={16} />
                      Append Providers Fleets
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Design Elements */}
            <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-primary/10 blur-[60px] rounded-full pointer-events-none" />
            <div className="absolute top-0 right-0 w-32 h-1 bg-gradient-to-l from-secondary/40 to-transparent" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateModelModal;
