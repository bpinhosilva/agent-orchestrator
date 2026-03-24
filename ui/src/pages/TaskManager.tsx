import React, { useState, useEffect } from 'react';
import { ListPlus, Sparkles, ArrowRight, ShieldAlert } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import TaskBoard from '../components/tasks/TaskBoard';
import CreateTaskModal from '../components/tasks/CreateTaskModal';
import { projectsApi, type Project } from '../api/projects';

const TaskManager: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await projectsApi.findAll();
        setProjects(res.data);
      } catch (error) {
        console.error('Failed to fetch projects in TaskManager:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const activeProject = projects.length > 0 ? projects[0] : null;
  const missingLead = activeProject && !activeProject.ownerAgent;

  return (
    <div className="space-y-10">
      {/* Missing Lead Warning */}
      {!loading && missingLead && (
        <div className="bg-error/10 border border-error/20 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500 shadow-lg shadow-error/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-error/20 flex items-center justify-center text-error border border-error/30">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h4 className="text-sm font-black text-white uppercase tracking-tight">Administrative Protocol Warning</h4>
              <p className="text-xs text-on-surface-variant max-w-2xl leading-relaxed mt-0.5">
                The <span className="text-error font-bold italic">"{activeProject.title}"</span> sector currently lacks a Designated Lead Agent. 
                A lead is required to oversee autonomous task assignment, token allocation, and critical sector operations.
              </p>
            </div>
          </div>
          <NavLink 
            to={`/projects/${activeProject.id}`} 
            className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-error text-on-error text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap text-center shadow-lg shadow-error/20"
          >
            Assign Protocol Lead
          </NavLink>
        </div>
      )}
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold font-headline tracking-tight text-white">Agentic Task Canvas</h1>
          <p className="text-outline text-sm mt-1">Orchestrating 24 parallel node operations</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-on-primary px-5 py-2.5 rounded-lg flex items-center gap-2 font-bold text-sm transition-all shadow-lg shadow-primary/10"
          >
            <ListPlus size={18} />
            New Task
          </button>
        </div>
      </div>

      <CreateTaskModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onCreated={() => {
          // This will be used to refresh the board once we move away from mock data
          console.log('Task created!');
        }}
      />

      {/* Kanban Board */}
      <TaskBoard />

      {/* Bento Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-outline-variant/10 col-span-1 md:col-span-2 flex flex-col md:flex-row justify-between items-center gap-6" style={{ background: 'rgba(34, 42, 61, 0.4)', backdropFilter: 'blur(12px)' }}>
          <div>
            <h3 className="font-headline font-bold text-lg text-on-surface">Efficiency Matrix</h3>
            <p className="text-outline text-sm">Throughput increased by 14% this epoch.</p>
            <div className="mt-4 flex gap-6">
              <div className="flex flex-col">
                <span className="text-2xl font-extrabold text-primary">0.42ms</span>
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Avg Latency</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-extrabold text-secondary">99.8%</span>
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Node Success</span>
              </div>
            </div>
          </div>
          
          <div className="w-full md:w-48 h-24 bg-surface-container-highest/30 rounded-lg relative overflow-hidden flex items-end px-2 gap-1">
            <div className="w-full bg-primary/20 h-1/2 rounded-t"></div>
            <div className="w-full bg-primary/30 h-2/3 rounded-t"></div>
            <div className="w-full bg-primary/40 h-1/3 rounded-t"></div>
            <div className="w-full bg-primary/50 h-3/4 rounded-t"></div>
            <div className="w-full bg-primary h-full rounded-t"></div>
            <div className="w-full bg-primary/70 h-1/2 rounded-t"></div>
            <div className="w-full bg-primary/40 h-1/4 rounded-t"></div>
            <div className="absolute inset-0 pointer-events-none opacity-30 flex items-center justify-center">
              <span className="text-primary text-xs font-mono uppercase tracking-[1em]">Optimizing</span>
            </div>
          </div>
        </div>

        <div className="bg-tertiary-container/10 p-6 rounded-2xl border border-tertiary/10 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-tertiary/5 text-8xl transition-transform group-hover:scale-110">
            <Sparkles size={80} />
          </div>
          <h3 className="font-headline font-bold text-tertiary">AI Suggestions</h3>
          <p className="text-on-surface-variant text-sm mt-2 relative z-10">I recommend re-assigning #NODE-402 to Fin-Oracle for faster vector execution.</p>
          <button className="mt-4 text-xs font-bold text-tertiary flex items-center gap-1 hover:underline relative z-10">
            Apply System Change
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskManager;
