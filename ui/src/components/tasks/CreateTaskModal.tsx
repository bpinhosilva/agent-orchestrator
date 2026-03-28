import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ClipboardList,
  User,
  Flag,
  ChevronDown,
  X,
  Trash2,
  FileText
} from 'lucide-react';
import MarkdownField from '../MarkdownField';
import { tasksApi, TaskStatus, TaskPriority } from '../../api/tasks';
import { agentsApi, type Agent } from '../../api/agents';
import { projectsApi, type Project } from '../../api/projects';
import { useNotification } from '../../hooks/useNotification';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose, onCreated }) => {
  const { notifyError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  // Data State
  const [agents, setAgents] = useState<Agent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const TASK_TEMPLATE = `# Background\n\n# To Do\n\n# Validation`;

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState(TASK_TEMPLATE);
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.BACKLOG);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      loadData();
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const loadData = async () => {
    try {
      setFetchingData(true);
      const [agentsRes, projectsRes] = await Promise.all([
        agentsApi.findAll(),
        projectsApi.findAll()
      ]);
      setAgents(agentsRes.data);
      setProjects(projectsRes.data);

      if (projectsRes.data.length > 0) {
        setProjectId(projectsRes.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load data for modal:', error);
    } finally {
      setFetchingData(false);
    }
  };

  const handleCreate = async () => {
    if (!title || !description || !projectId) {
      notifyError('Validation Error', 'Title, Description and Project are required');
      return;
    }

    try {
      setLoading(true);
      await tasksApi.create(projectId, {
        title,
        description,
        status,
        priority,
        assigneeId: assigneeId || undefined,
        projectId,
      });

      onCreated?.();
      onClose();
      // Reset form
      setTitle('');
      setDescription(TASK_TEMPLATE);
      setStatus(TaskStatus.BACKLOG);
      setPriority(TaskPriority.MEDIUM);
      setAssigneeId('');
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-surface/80 backdrop-blur-xl"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl h-full max-h-[750px] bg-surface-container-low rounded-2xl shadow-2xl overflow-hidden flex flex-col ring-1 ring-outline-variant/10"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-low/50 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <ClipboardList size={22} />
              </div>
              <div>
                <h2 className="text-xl font-black font-headline text-white tracking-tight">Comission New Task</h2>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/60 font-bold">Node Specification Protocol</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
            {/* Essential Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-1 bg-primary h-4 rounded-full" />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant">Essential Intelligence</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-1">Task Title</label>
                  <div className="bg-surface-container-highest/30 rounded-xl p-0.5 ring-1 ring-outline-variant/10 focus-within:ring-primary/40 focus-within:bg-surface-container-highest/50 transition-all">
                    <input
                      type="text"
                      placeholder="e.g. Synthesize Vector DB results"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-transparent border-none text-sm text-on-surface h-12 px-4 focus:outline-none placeholder:text-on-surface-variant/30 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Objective / Description</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDescription(TASK_TEMPLATE)}
                        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-surface-container-highest text-[9px] font-black text-on-surface-variant/60 uppercase tracking-widest transition-colors"
                        title="Reset to template"
                      >
                        <FileText size={10} />
                        Template
                      </button>
                      <div className="w-px h-3 bg-outline-variant/10" />
                      <button
                        type="button"
                        onClick={() => setDescription('')}
                        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-error/10 text-[9px] font-black text-error/60 hover:text-error uppercase tracking-widest transition-colors"
                        title="Clear field"
                      >
                        <Trash2 size={10} />
                        Clear
                      </button>
                    </div>
                  </div>
                  <MarkdownField
                    value={description}
                    onChange={setDescription}
                    placeholder="Describe the desired output and constraints for this node..."
                    height="h-52"
                    maxLength={2000}
                  />
                </div>
              </div>
            </section>

            {/* Operational Directives */}
            <section className="space-y-6 pt-10 border-t border-outline-variant/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-1 bg-secondary h-4 rounded-full" />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant">Operational Configuration</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Priority Selection */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-1 flex items-center gap-1.5">
                    <Flag size={12} className="text-secondary" />
                    Priority Level
                  </label>
                  <div className="grid grid-cols-4 gap-2 p-1 bg-surface-container-highest/30 rounded-xl ring-1 ring-outline-variant/10">
                    {[
                      { id: TaskPriority.LOW, label: 'LOW' },
                      { id: TaskPriority.MEDIUM, label: 'MED' },
                      { id: TaskPriority.HIGH, label: 'HIGH' },
                      { id: TaskPriority.CRITICAL, label: 'CRIT' }
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setPriority(p.id as TaskPriority)}
                        className={`py-2 rounded-lg text-[10px] font-black tracking-widest transition-all ${priority === p.id
                          ? p.id === TaskPriority.CRITICAL || p.id === TaskPriority.HIGH
                            ? 'bg-error text-on-error shadow-lg shadow-error/30'
                            : 'bg-primary text-on-primary shadow-lg shadow-primary/30'
                          : 'hover:bg-surface-container-highest text-on-surface-variant'
                          }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Selection */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-1">Initial Status</label>
                  <div className="bg-surface-container-highest/30 rounded-xl p-0.5 ring-1 ring-outline-variant/10 focus-within:ring-primary/40 transition-all relative">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as TaskStatus)}
                      className="w-full bg-transparent border-none text-xs font-bold text-on-surface h-10 px-4 focus:outline-none appearance-none cursor-pointer uppercase tracking-widest"
                    >
                      {Object.values(TaskStatus)
                        .filter(s => s !== TaskStatus.DONE && s !== TaskStatus.ARCHIVED)
                        .map(s => (
                          <option key={s} value={s} className="bg-surface-container-low text-on-surface uppercase">{s}</option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/60">
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </div>

                {/* Agent Assignment */}
                <div className="space-y-3 col-span-full">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-1 flex items-center gap-1.5">
                    <User size={12} className="text-primary" />
                    Assigned Intelligence (Optional)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {agents.map((agent) => (
                      <button
                        key={agent.id}
                        onClick={() => setAssigneeId(assigneeId === agent.id ? '' : agent.id)}
                        className={`p-3 rounded-xl border flex items-center gap-3 transition-all text-left ${assigneeId === agent.id
                          ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(173,198,255,0.1)]'
                          : 'bg-surface-container-highest/20 border-outline-variant/5 hover:border-outline-variant/30 hover:bg-surface-container-highest/30'
                          }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${assigneeId === agent.id ? 'bg-primary text-surface' : 'bg-surface-container-high text-on-surface-variant'}`}>
                          {agent.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className={`text-[11px] font-bold ${assigneeId === agent.id ? 'text-white' : 'text-on-surface-variant'}`}>{agent.name}</div>
                          <div className="text-[9px] text-on-surface-variant/50 uppercase tracking-widest font-black leading-none mt-0.5">{agent.role || 'Agent'}</div>
                        </div>
                      </button>
                    ))}
                    {agents.length === 0 && (
                      <div className="col-span-full py-4 text-center border-2 border-dashed border-outline-variant/10 rounded-xl">
                        <span className="text-[10px] font-bold text-on-surface-variant/30 uppercase tracking-[0.2em]">No active intelligence found</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Project Selection */}
                {projects.length > 1 ? (
                  <div className="space-y-3 col-span-full">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-1">Target Project</label>
                    <div className="bg-surface-container-highest/30 rounded-xl p-0.5 ring-1 ring-outline-variant/10 focus-within:ring-primary/40 transition-all relative">
                      <select
                        value={projectId}
                        onChange={(e) => setProjectId(e.target.value)}
                        className="w-full bg-transparent border-none text-xs font-bold text-on-surface h-10 px-4 focus:outline-none appearance-none cursor-pointer"
                      >
                        {projects.map(p => (
                          <option key={p.id} value={p.id} className="bg-surface-container-low text-on-surface">{p.title}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/60">
                        <ChevronDown size={16} />
                      </div>
                    </div>
                  </div>
                ) : projects.length === 1 ? (
                  <div className="col-span-full px-4 py-2 bg-surface-container-highest/10 rounded-lg border border-outline-variant/10 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Target Sector</span>
                    <span className="text-xs font-bold text-primary/80">{projects[0].title}</span>
                  </div>
                ) : (
                  <div className="col-span-full p-4 bg-error/5 border border-error/20 rounded-xl text-center">
                    <p className="text-xs font-bold text-error">No Project Sector Detected</p>
                    <p className="text-[10px] text-on-surface-variant/60 mt-1 uppercase tracking-widest font-black">Initialize a sector in the sidebar before commissioning tasks</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Footer Action */}
          <div className="px-8 py-6 bg-surface-container-low/80 backdrop-blur-md border-t border-outline-variant/10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest">
              <Sparkles size={12} className="text-primary animate-pulse" />
              Agentic Orchestration Active
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-lg text-sm font-bold text-on-surface-variant hover:text-white transition-all hover:bg-surface-container-highest"
              >
                Discard
              </button>
              <button
                onClick={handleCreate}
                disabled={loading || fetchingData}
                className="px-10 py-2.5 rounded-lg bg-primary text-on-primary text-sm font-black shadow-[0_8px_20px_rgba(173,198,255,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed group relative overflow-hidden"
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
