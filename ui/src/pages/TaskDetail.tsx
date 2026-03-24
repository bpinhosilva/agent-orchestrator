import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  ArrowLeftRight, 
  Settings2, 
  Zap, 
  Wallet, 
  ShieldCheck,
  Trash2,
  StopCircle,
  Save
} from 'lucide-react';
import CommentSection from '../components/tasks/CommentSection';
import MarkdownField from '../components/MarkdownField';
import { tasksApi, TaskPriority, TaskStatus } from '../api/tasks';
import { agentsApi, type Agent } from '../api/agents';
import { useNotification } from '../hooks/useNotification';

const TaskDetail: React.FC = () => {
  const { projectId, taskId } = useParams<{ projectId: string, taskId: string }>();
  const navigate = useNavigate();
  const { notifySuccess, notifyError } = useNotification();
  
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.BACKLOG);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [assigneeId, setAssigneeId] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await agentsApi.findAll();
      setAgents(res.data);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  }, []);

  const fetchTask = useCallback(async () => {
    if (!projectId || !taskId) return;
    try {
      setLoading(true);
      const res = await tasksApi.findOne(projectId, taskId);
      const data = res.data;
      setTask(data);
      setTitle(data.title);
      setDescription(data.description);
      setStatus(data.status);
      setPriority(data.priority);
      setAssigneeId(data.assignee?.id || null);
    } catch (error) {
      console.error('Failed to fetch task:', error);
      notifyError('Fetch Error', 'Failed to load task intelligence node.');
    } finally {
      setLoading(false);
    }
  }, [projectId, taskId, notifyError]);

  useEffect(() => {
    fetchTask();
    fetchAgents();
  }, [fetchTask, fetchAgents]);

  const handleSave = async () => {
    if (!projectId || !taskId) return;
    try {
      setSaving(true);
      await tasksApi.update(projectId, taskId, {
        title,
        description,
        status,
        priority,
        assigneeId: assigneeId || null
      });
      notifySuccess('Task Updated', 'Intelligence node parameters successfully reconfigured.');
    } catch (error) {
      console.error('Failed to update task:', error);
      notifyError('Update Failed', 'Failed to synchronize parameters with the neural mesh.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!projectId || !taskId) return;
    if (!window.confirm('Are you sure you want to decommission this task node?')) return;
    
    try {
      await tasksApi.delete(projectId, taskId);
      notifySuccess('Task Decommissioned', 'Intelligence node removed from the orchestration grid.');
      navigate('/');
    } catch (error) {
      console.error('Failed to delete task:', error);
      notifyError('Decommission Failed', 'Failed to remove node from the grid.');
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-on-surface-variant text-sm font-black uppercase tracking-[0.3em] animate-pulse">Accessing Node Data</p>
        </div>
      </div>
    );
  }

  if (!task) return null;

  const nodeCode = `#NODE-${task.id.substring(0, 4).toUpperCase()}`;

  return (
    <div className="max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
      {/* Breadcrumb & Header Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <nav className="flex items-center space-x-2 text-sm text-on-surface-variant font-medium">
          <span 
            className="hover:text-primary transition-colors cursor-pointer"
            onClick={() => navigate('/')}
          >
            Task Manager
          </span>
          <ChevronRight size={16} />
          <span className="text-on-surface">{nodeCode}</span>
        </nav>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest text-error hover:bg-error/10 transition-all rounded-xl active:scale-95"
          >
            <Trash2 size={16} />
            Decommission
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest text-on-surface bg-surface-container-high hover:bg-surface-container-highest transition-all rounded-xl active:scale-95">
            <StopCircle size={16} />
            Halt execution
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 text-xs font-black uppercase tracking-widest bg-primary text-on-primary rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Synchronizing...' : 'Save Protocol'}
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Primary Task Details */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Task Definition Card */}
          <div className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
            
            <div className="flex items-start justify-between mb-10 relative z-10">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">Intelligence Node identifier</label>
                <h2 className="text-3xl font-headline font-black text-white tracking-tight">{nodeCode}: {task.title}</h2>
              </div>
              <div className="relative">
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className={`appearance-none cursor-pointer px-6 py-2 rounded-xl border font-black text-[10px] uppercase tracking-widest outline-none transition-all hover:brightness-110 active:scale-95 ${
                    status === TaskStatus.DONE ? 'bg-secondary/10 border-secondary/20 text-secondary' : 
                    status === TaskStatus.IN_PROGRESS ? 'bg-primary/10 border-primary/20 text-primary' : 
                    'bg-surface-container-highest/50 border-outline-variant/20 text-on-surface-variant'
                  }`}
                >
                  <option value={TaskStatus.BACKLOG} className="bg-surface-container-low">Backlog</option>
                  <option value={TaskStatus.IN_PROGRESS} className="bg-surface-container-low">In Progress</option>
                  <option value={TaskStatus.REVIEW} className="bg-surface-container-low">Review</option>
                  <option value={TaskStatus.DONE} className="bg-surface-container-low">Done</option>
                </select>
                {status === TaskStatus.IN_PROGRESS && (
                    <span className="absolute -left-1 -top-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                )}
              </div>
            </div>
            
            <div className="space-y-8 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-1">Node Designation</label>
                  <input 
                    className="w-full bg-surface-container-highest/30 border border-outline-variant/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-primary/40 focus:bg-surface-container-highest/50 transition-all outline-none font-medium" 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-1">Operational Priority</label>
                  <select 
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value) as TaskPriority)}
                    className={`w-full border rounded-xl px-4 py-3 text-sm transition-all outline-none font-black tracking-widest uppercase appearance-none ${
                      priority === TaskPriority.CRITICAL 
                        ? 'bg-error/30 text-white border-error shadow-[0_0_15px_rgba(255,107,107,0.15)] ring-1 ring-error/20' 
                        : 'bg-surface-container-highest/30 text-white border-outline-variant/10 focus:ring-1 focus:ring-primary/40 focus:bg-surface-container-highest/50'
                    }`}
                  >
                    <option value={TaskPriority.CRITICAL} className="bg-surface-container-low">CRITICAL</option>
                    <option value={TaskPriority.HIGH} className="bg-surface-container-low">HIGH</option>
                    <option value={TaskPriority.MEDIUM} className="bg-surface-container-low">MEDIUM</option>
                    <option value={TaskPriority.LOW} className="bg-surface-container-low">LOW</option>
                  </select>
                </div>
              </div>
              
              <MarkdownField
                label="Objective / Parameters"
                value={description}
                onChange={setDescription}
                placeholder="Describe the desired output and constraints for this node..."
                height="h-56"
                helperText="Supports GitHub Flavored Markdown for logic structure"
                initialMode="preview"
              />
            </div>
          </div>
          
          {/* Comments & Activity Section */}
          <div className="flex-1 min-h-0">
            <CommentSection taskId={taskId || ''} />
          </div>
        </div>
        
        {/* Right Column: Meta & Resources */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Agent Assignment Card */}
          <div className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant/10 shadow-xl">
            <label className="text-[10px] font-black uppercase tracking-widest text-tertiary/80 block mb-6">Assigned Intelligence</label>
            
            <div className="space-y-4">
              <div className="relative">
                <select
                  value={assigneeId || ''}
                  onChange={(e) => setAssigneeId(e.target.value || null)}
                  className="w-full bg-surface-container-high/50 border border-outline-variant/5 rounded-2xl p-5 appearance-none cursor-pointer focus:ring-1 focus:ring-tertiary/40 outline-none text-white font-headline font-black transition-all hover:border-tertiary/30"
                >
                  <option value="">Protocol Unassigned</option>
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id} className="bg-surface-container-low">
                        {agent.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/40">
                    <ArrowLeftRight size={20} />
                </div>
              </div>
              
              {assigneeId ? (
                <div className="flex items-center gap-5 p-5 bg-tertiary/5 rounded-2xl border border-tertiary/10 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="h-14 w-14 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary overflow-hidden shadow-inner">
                    <img 
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(agents.find(a => a.id === assigneeId)?.name || 'U')}&background=random&color=fff`}
                      alt="Agent Icon" 
                      className="w-full h-full p-1 rounded-xl object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-headline font-black text-white">{agents.find(a => a.id === assigneeId)?.name}</h4>
                    <p className="text-[10px] text-tertiary/60 font-black uppercase tracking-widest mt-1">{agents.find(a => a.id === assigneeId)?.role || 'Intelligence Unit'}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-5 p-5 bg-surface-container-high/20 rounded-2xl border border-dashed border-outline-variant/20 italic">
                  <div className="h-14 w-14 rounded-xl bg-surface-container-highest/30 flex items-center justify-center text-on-surface-variant/20">
                    <Zap size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-headline font-bold text-on-surface-variant/40">Awaiting Assignment</h4>
                    <p className="text-[9px] text-on-surface-variant/30 font-black uppercase tracking-widest mt-1">Grid performance limited</p>
                  </div>
                </div>
              )}
            </div>

            <button className="w-full mt-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant hover:text-white transition-all flex items-center justify-center gap-3 bg-surface-container-highest/20 rounded-xl border border-outline-variant/5">
              <Settings2 size={16} className="text-primary" />
              Tune Node Parameters
            </button>
          </div>
          
          {/* Performance Widgets (Simulated for design but contextual) */}
          <div className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant/10 shadow-xl">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 block mb-8">Execution metrics</label>
            <div className="space-y-8">
              
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-on-surface">Node Progress</span>
                  <span className="text-xs font-mono text-primary font-bold">{status === TaskStatus.DONE ? '100' : status === TaskStatus.IN_PROGRESS ? '42' : '0'}%</span>
                </div>
                <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${status === TaskStatus.DONE ? 'bg-secondary' : 'bg-primary'}`} 
                    style={{ width: `${status === TaskStatus.DONE ? 100 : status === TaskStatus.IN_PROGRESS ? 42 : 0}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-surface-container-highest/20 rounded-xl border border-outline-variant/5">
                    <div className="flex items-center gap-2 mb-1 text-on-surface-variant/60">
                        <Zap size={14} className="text-secondary" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Latency</span>
                    </div>
                    <div className="text-lg font-mono font-bold text-white">{task.llm_latency || 0}ms</div>
                  </div>
                  <div className="p-4 bg-surface-container-highest/20 rounded-xl border border-outline-variant/5">
                    <div className="flex items-center gap-2 mb-1 text-on-surface-variant/60">
                        <Wallet size={14} className="text-tertiary" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Node Cost</span>
                    </div>
                    <div className="text-lg font-mono font-bold text-white">${(task.cost_estimate || 0).toFixed(6)}</div>
                  </div>
              </div>
            </div>
          </div>
          
          {/* Health Indicator Widget */}
          <div className="bg-gradient-to-br from-secondary/5 to-primary/5 p-8 rounded-2xl border border-secondary/10 relative overflow-hidden group shadow-xl">
             <div className="absolute top-0 right-0 -mr-4 -mt-4 text-secondary/5 opacity-50 transition-transform group-hover:scale-110">
                <ShieldCheck size={120} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary/80">Integrity status</span>
                <span className="px-2 py-0.5 bg-secondary/20 text-secondary text-[9px] font-black rounded uppercase">Optimal</span>
              </div>
              <div className="text-4xl font-headline font-black text-white tracking-tighter">99.8%</div>
              <p className="text-[10px] text-on-surface-variant/60 mt-2 italic font-medium leading-relaxed">Intelligence stream verified and synchronized across grid.</p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
