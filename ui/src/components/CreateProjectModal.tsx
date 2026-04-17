import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderPlus, Network, X, ChevronDown } from 'lucide-react';
import { projectsApi, ProjectStatus } from '../api/projects';
import { agentsApi, type Agent } from '../api/agents';
import { useNotification } from '../hooks/useNotification';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void | Promise<void>;
  canCreate?: boolean;
  blockedReason?: string;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  canCreate = true,
  blockedReason,
}) => {
  const { notifyError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>(ProjectStatus.PLANNING);
  const [ownerAgentId, setOwnerAgentId] = useState<string>('');

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      void fetchAgents();
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const fetchAgents = async () => {
    try {
      const res = await agentsApi.findAll();
      setAgents(res.data);
    } catch {
      // axios interceptor handles notification
    }
  };

  const handleCreate = async () => {
    if (!title) {
      notifyError('Validation Error', 'Project title is required');
      return;
    }
    if (!canCreate) {
      notifyError(
        'Project Creation Blocked',
        blockedReason ?? 'Project creation is unavailable right now',
      );
      return;
    }

    try {
      setLoading(true);
      await projectsApi.create({
        title,
        description: description || undefined,
        status,
        ownerAgentId: ownerAgentId || undefined,
      });

      await onCreated?.();
      onClose();
      // Reset form
      setTitle('');
      setDescription('');
      setStatus(ProjectStatus.PLANNING);
      setOwnerAgentId('');
    } catch {
      // axios interceptor handles notification
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-surface/80 backdrop-blur-xl"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-surface-container-low rounded-2xl shadow-2xl overflow-hidden flex flex-col ring-1 ring-outline-variant/10"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-low/50 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                <FolderPlus size={22} />
              </div>
              <div>
                <h2 className="text-xl font-black font-headline text-white tracking-tight">
                  Init Project
                </h2>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/60 font-bold">
                  New Project
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Area */}
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-1">
                Project Title
              </label>
              <div className="bg-surface-container-highest/30 rounded-xl p-0.5 ring-1 ring-outline-variant/10 focus-within:ring-primary/40 focus-within:bg-surface-container-highest/50 transition-all">
                <input
                  type="text"
                  placeholder="e.g. Market Dynamics Alpha"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={!canCreate}
                  className="w-full bg-transparent border-none text-sm text-on-surface h-12 px-4 focus:outline-none placeholder:text-on-surface-variant/30 font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-1">
                Project Description
              </label>
              <div className="bg-surface-container-highest/30 rounded-xl p-0.5 ring-1 ring-outline-variant/10 focus-within:ring-primary/40 transition-all">
                <textarea
                  placeholder="Define the scope and strategic goals..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!canCreate}
                  className="w-full bg-transparent border-none text-sm text-on-surface h-24 p-4 focus:outline-none placeholder:text-on-surface-variant/30 font-medium resize-none custom-scrollbar"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-1">
                  Status Protocol
                </label>
                <div className="bg-surface-container-highest/30 rounded-xl p-0.5 ring-1 ring-outline-variant/10 focus-within:ring-primary/40 transition-all relative">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                    disabled={!canCreate}
                    className="w-full bg-transparent border-none text-[11px] font-black text-on-surface h-10 px-4 focus:outline-none appearance-none cursor-pointer uppercase tracking-widest"
                  >
                    {Object.entries(ProjectStatus).map(([key, val]) => (
                      <option
                        key={val}
                        value={val}
                        className="bg-surface-container-low text-on-surface uppercase"
                      >
                        {key}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/60">
                    <ChevronDown size={14} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-1">
                  Project Lead (Optional)
                </label>
                <div className="bg-surface-container-highest/30 rounded-xl p-0.5 ring-1 ring-outline-variant/10 focus-within:ring-primary/40 transition-all relative">
                  <select
                    value={ownerAgentId}
                    onChange={(e) => setOwnerAgentId(e.target.value)}
                    disabled={!canCreate}
                    className="w-full bg-transparent border-none text-[11px] font-black text-on-surface h-10 px-4 focus:outline-none appearance-none cursor-pointer"
                  >
                    <option
                      value=""
                      className="bg-surface-container-low text-on-surface uppercase"
                    >
                      No Lead assigned
                    </option>
                    {agents.map((agent) => (
                      <option
                        key={agent.id}
                        value={agent.id}
                        className="bg-surface-container-low text-on-surface"
                      >
                        {agent.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/60">
                    <ChevronDown size={14} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Area */}
          <div className="px-8 py-6 bg-surface-container-low/80 backdrop-blur-md border-t border-outline-variant/10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest">
              <Network size={12} className="text-secondary animate-pulse" />
              {canCreate
                ? 'Initializing Network Node'
                : 'Project creation unavailable'}
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-lg text-sm font-bold text-on-surface-variant hover:text-white transition-all hover:bg-surface-container-highest"
              >
                Abort
              </button>
              <button
                onClick={handleCreate}
                disabled={loading || !canCreate}
                className="px-10 py-2.5 rounded-lg bg-secondary text-surface text-sm font-black shadow-[0_8px_20px_rgba(78,222,163,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                {loading ? 'Initializing...' : 'Create Project'}
              </button>
            </div>
          </div>
          {!canCreate && blockedReason && (
            <div className="px-8 pb-6 text-xs text-error">{blockedReason}</div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CreateProjectModal;
