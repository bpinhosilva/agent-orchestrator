import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  ArrowLeft,
  Save,
  Trash2,
  User,
  Layers,
  Sparkles,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { projectsApi, type Project, ProjectStatus } from '../api/projects';
import { agentsApi, type Agent } from '../api/agents';
import { useNotification } from '../hooks/useNotification';
import { useProject } from '../hooks/useProject';
import MarkdownField from '../components/MarkdownField';

const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { notifySuccess, notifyApiError } = useNotification();
  const { projects, refreshProjects } = useProject();

  const [project, setProject] = useState<Project | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const hasAnotherActiveProject = projects.some(
    (existingProject) =>
      existingProject.status === ProjectStatus.ACTIVE &&
      existingProject.id !== projectId,
  );

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>(ProjectStatus.PLANNING);
  const [ownerAgentId, setOwnerAgentId] = useState<string>('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [projRes, agentsRes] = await Promise.all([
        projectsApi.findOne(projectId!),
        agentsApi.findAll(),
      ]);

      const p = projRes.data;
      setProject(p);
      setAgents(agentsRes.data);

      // Initialize form
      setTitle(p.title);
      setDescription(p.description || '');
      setStatus(p.status || ProjectStatus.PLANNING);
      setOwnerAgentId(p.ownerAgent?.id || '');
    } catch (error) {
      notifyApiError(error, 'Fetch Error');
    } finally {
      setLoading(false);
    }
  }, [projectId, notifyApiError]);

  useEffect(() => {
    if (projectId) {
      void loadData();
    }
  }, [projectId, loadData]);

  const handleSave = async () => {
    if (!projectId) return;

    try {
      setSaving(true);
      await projectsApi.update(projectId, {
        title,
        description: description || undefined,
        status,
        ownerAgentId: ownerAgentId || null,
      });

      await refreshProjects();
      notifySuccess('Project Updated', 'Project settings have been updated');
    } catch (error) {
      notifyApiError(error, 'Sync Error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-4 border border-outline-variant/30 border-t-primary animate-spin"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center bg-surface-container-low rounded-3xl border border-outline-variant/10 max-w-lg mx-auto mt-20">
        <h2 className="text-xl font-black text-white mb-4">
          Project Not Found
        </h2>
        <button
          onClick={() => navigate('/')}
          className="bg-primary text-surface px-6 py-2 rounded-lg font-bold hover:scale-105 transition-all"
        >
          Return to Hub
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <button
            onClick={() => navigate('/')}
            className="w-12 h-12 rounded-2xl bg-surface-container-high border border-outline-variant/10 flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-surface-container-highest transition-all group"
          >
            <ArrowLeft
              size={20}
              className="group-hover:-translate-x-1 transition-transform"
            />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-lg bg-secondary/20 flex items-center justify-center text-secondary">
                <Briefcase size={12} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant">
                Project Console
              </span>
            </div>
            <h1 className="text-3xl font-black font-headline text-white tracking-tight -mt-1">
              {project.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-initial px-6 py-3 rounded-2xl bg-surface-container-high text-on-article-variant font-bold text-sm flex items-center justify-center gap-2 hover:bg-error/10 hover:text-error transition-all ring-1 ring-outline-variant/10 border-none">
            <Trash2 size={18} />
            Delete Project
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 md:flex-initial px-8 py-3 rounded-2xl bg-primary text-surface font-black text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:grayscale disabled:opacity-50"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-surface/30 border-t-surface rounded-full animate-spin" />
            ) : (
              <Save size={18} />
            )}
            Synchronize Parameters
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Core Config */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-surface-container-low rounded-3xl border border-outline-variant/10 overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b border-outline-variant/5 flex items-center gap-3">
              <Layers size={18} className="text-primary" />
              <h3 className="text-sm font-black uppercase tracking-widest text-on-surface">
                Project Settings
              </h3>
            </div>
            <div className="p-8 space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-1 italic">
                  Identification Tag
                </label>
                <div className="bg-surface-container-highest/30 rounded-2xl p-0.5 ring-1 ring-outline-variant/10 focus-within:ring-primary/40 focus-within:bg-surface-container-highest/50 transition-all">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-transparent border-none text-base text-on-surface h-14 px-5 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <MarkdownField
                  label="Operational Directives"
                  value={description}
                  onChange={setDescription}
                  height="h-64"
                  maxLength={5000}
                  placeholder="Enter strategic goals, scope, and specific node instructions..."
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right Column - Status & Personnel */}
        <div className="space-y-8">
          {/* Status Block */}
          <section className="bg-surface-container-low rounded-3xl border border-outline-variant/10 p-8 space-y-6 shadow-2xl">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 flex items-center gap-2">
                <ShieldCheck size={14} className="text-secondary" />
                Operational Protocol
              </label>
              <div className="grid grid-cols-1 gap-2">
                {Object.values(ProjectStatus).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    disabled={
                      s === ProjectStatus.ACTIVE &&
                      hasAnotherActiveProject &&
                      status !== ProjectStatus.ACTIVE
                    }
                    className={`px-4 py-3 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all text-left ${
                      status === s
                        ? 'bg-secondary/10 border-secondary text-secondary shadow-lg shadow-secondary/5'
                        : 'bg-surface-container-high/30 border-outline-variant/5 text-on-surface-variant/60 hover:bg-surface-container-high/60 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {s.replace('_', ' ')}
                      {status === s && (
                        <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              {hasAnotherActiveProject && status !== ProjectStatus.ACTIVE && (
                <p className="text-[11px] text-on-surface-variant/70">
                  Another project is already active. Move it out of active
                  status before activating this one.
                </p>
              )}
            </div>

            <div className="pt-6 border-t border-outline-variant/5 space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 flex items-center gap-2">
                <User size={14} className="text-primary" />
                Designated Project Lead
              </label>
              <div className="bg-surface-container-high/30 rounded-2xl p-0.5 ring-1 ring-outline-variant/10 transition-all relative">
                <select
                  value={ownerAgentId}
                  onChange={(e) => setOwnerAgentId(e.target.value)}
                  className="w-full bg-transparent border-none text-[11px] font-bold text-on-surface h-12 px-5 focus:outline-none appearance-none cursor-pointer"
                >
                  <option
                    value=""
                    className="bg-surface-container-low text-on-surface uppercase"
                  >
                    Unassigned Protocol Lead
                  </option>
                  {agents.map((agent) => (
                    <option
                      key={agent.id}
                      value={agent.id}
                      className="bg-surface-container-low text-on-surface font-bold uppercase tracking-tight"
                    >
                      {agent.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/60">
                  <ChevronDown size={14} />
                </div>
              </div>
              <p className="px-1 text-[11px] text-on-surface-variant/70 italic leading-relaxed">
                *The Project Lead will oversee autonomous reasoning and token
                allocation for this project.
              </p>
            </div>
          </section>

          {/* Activity Placeholder */}
          <div className="px-8 py-10 rounded-3xl bg-surface-container-low/30 border border-dashed border-outline-variant/10 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant/20 mb-4 animate-pulse">
              <Sparkles size={24} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 max-w-[180px]">
              Statistical insight logs will be synchronized here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
