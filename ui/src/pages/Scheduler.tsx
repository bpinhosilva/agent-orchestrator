import { 
  TrendingUp, 
  CheckCircle, 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Bot,
  Activity,
  Database,
  Sparkles,
  Search,
  Plus,
  Layout,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { recurrentTasksApi, type RecurrentTask, RecurrentTaskStatus } from '../api/recurrent-tasks';
import CreateRecurrentTaskModal from '../components/CreateRecurrentTaskModal';
import { useNotification } from '../hooks/useNotification';
import { useProject } from '../hooks/useProject';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const Scheduler: React.FC = () => {
  const { activeProject, loading: projectLoading } = useProject();
  const { notifySuccess, notifyApiError } = useNotification();
  const navigate = useNavigate();
  
  const [tasks, setTasks] = useState<RecurrentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<RecurrentTask | undefined>(undefined);

  const fetchTasks = useCallback(async () => {
    if (!activeProject) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await recurrentTasksApi.findAll(activeProject.id);
      setTasks(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      notifyApiError(error, 'Error fetching recurrent tasks');
    } finally {
      setLoading(false);
    }
  }, [activeProject, notifyApiError]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleDelete = async (id: string, title: string) => {
    if (!activeProject) {
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the recurrent protocol "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await recurrentTasksApi.delete(activeProject.id, id);
      notifySuccess('Protocol Terminated', `The task "${title}" has been removed from the fleet.`);
      fetchTasks();
    } catch (error) {
      notifyApiError(error, 'Error deleting task');
    }
  };

  const openCreateModal = () => {
    setEditingTask(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (task: RecurrentTask) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (task: RecurrentTask) => {
    if (!activeProject) {
      return;
    }

    const newStatus = task.status === RecurrentTaskStatus.ACTIVE 
      ? RecurrentTaskStatus.PAUSED 
      : RecurrentTaskStatus.ACTIVE;
    
    try {
      await recurrentTasksApi.update(activeProject.id, task.id, {
        status: newStatus,
      });
      notifySuccess(
        `Protocol ${newStatus === RecurrentTaskStatus.ACTIVE ? 'Resumed' : 'Paused'}`, 
        `Operation "${task.title}" has been ${newStatus === RecurrentTaskStatus.ACTIVE ? 're-activated' : 'suspended'}.`
      );
      fetchTasks();
    } catch (error) {
      notifyApiError(error, 'Failed to update protocol status');
    }
  };

  const stats = [
    { label: 'Active Schedules', value: tasks.filter(t => t.status === RecurrentTaskStatus.ACTIVE).length.toString(), change: '+12%', icon: TrendingUp, color: 'text-secondary', bg: 'bg-secondary/10' },
    { label: 'Success Rate', value: '99.8%', trend: 99.8, icon: Activity, color: 'text-primary' },
    { label: 'Paused Agents', value: tasks.filter(t => t.status === RecurrentTaskStatus.PAUSED).length.toString(), subtext: 'Awaiting manual audit', icon: Pause, color: 'text-on-surface-variant' },
    { label: 'Critical Errors', value: tasks.filter(t => t.status === RecurrentTaskStatus.ERROR).length.toString(), subtext: 'System integrity: nominal', icon: CheckCircle, color: 'text-error', bg: 'bg-error/10' },
  ];

  if (projectLoading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-on-surface-variant text-sm font-black uppercase tracking-[0.3em] animate-pulse">Initializing Temporal Grid</p>
        </div>
      </div>
    );
  }

  if (!activeProject) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 bg-surface-container-highest rounded-3xl flex items-center justify-center text-on-surface-variant/20 mx-auto border border-outline-variant/10 shadow-xl">
            <Layout size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black font-headline text-white tracking-tight">No Active Projects Found</h2>
            <p className="text-on-surface-variant text-sm leading-relaxed">Temporal orchestration requires an active project. Create or select a project from the sidebar to manage recurrent tasks.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl font-headline font-extrabold text-white tracking-tight mb-2">Temporal Orchestration</h2>
          <p className="text-on-surface-variant font-body max-w-md">
            Manage autonomous agent lifecycle schedules and recurrent operational flows within the <span className="text-primary font-bold">Alpha-Centauri</span> cluster.
          </p>
        </motion.div>
        
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openCreateModal}
          className="px-6 py-3.5 bg-primary text-on-primary rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 transition-all border border-primary-container/20 group hover:shadow-primary/40"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
          New Scheduled Task
        </motion.button>
      </div>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 shadow-xl group hover:border-primary/20 transition-colors"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 mb-1">{stat.label}</p>
            <h3 className={`text-3xl font-headline font-black ${stat.color}`}>{stat.value}</h3>
            
            {stat.change && (
              <div className={`mt-4 flex items-center text-[10px] font-black uppercase tracking-wider ${stat.color} ${stat.bg} px-2.5 py-1 rounded-full w-fit`}>
                <stat.icon size={12} className="mr-1.5" />
                {stat.change} vs last month
              </div>
            )}
            
            {stat.trend !== undefined && (
              <div className="mt-4 w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.trend}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="bg-primary h-full shadow-[0_0_12px_rgba(173,198,255,0.6)]"
                />
              </div>
            )}
            
            {stat.subtext && (
              <p className="mt-4 text-[11px] text-on-surface-variant/50 font-medium italic">{stat.subtext}</p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Recurrent Tasks Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/10 shadow-2xl"
      >
        <div className="px-8 py-5 flex flex-col md:flex-row justify-between items-center gap-4 bg-surface-container-high/30 border-b border-outline-variant/10">
          <h4 className="font-headline font-bold text-lg text-white">Recurrent Protocols</h4>
          <div className="flex gap-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(78,222,163,0.4)]"></span> Active
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-on-surface-variant/40"></span> Paused
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-error shadow-[0_0_8px_rgba(255,180,171,0.4)]"></span> Error
            </span>
          </div>
        </div>

        <div className="divide-y divide-outline-variant/10">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
              <RefreshCw className="text-primary animate-spin" size={40} />
              <p className="text-on-surface-variant font-mono text-xs uppercase tracking-widest animate-pulse">Synchronizing Fleet States...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 space-y-6 text-center">
              <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant">
                <Database size={32} />
              </div>
              <div className="space-y-1">
                <h5 className="text-xl font-headline font-bold text-white">No active protocols detected</h5>
                <p className="text-on-surface-variant max-w-sm font-body">Deployment requested: Initiating autonomous routines requires manual configuration.</p>
              </div>
              <button 
                onClick={openCreateModal}
                className="px-4 py-2 border border-primary/30 text-primary rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 transition-colors"
              >
                Initiate First Sequence
              </button>
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="px-8 py-6 hover:bg-surface-container-high/20 transition-all group">
                <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_160px_160px_160px_220px] items-center gap-10">
                  {/* Column 1: Icon */}
                  <div className={`w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center border border-outline-variant/20 group-hover:border-primary/30 transition-colors shadow-inner`}>
                    <Activity className={task.status === RecurrentTaskStatus.ERROR ? 'text-error' : 'text-primary'} size={24} />
                  </div>

                  {/* Column 2: Title & Agent */}
                  <div>
                    <h5 
                      className="text-xl font-headline font-black text-white mb-2 group-hover:text-primary transition-colors tracking-tight cursor-pointer"
                      onClick={() => navigate(`/scheduler/tasks/${task.id}/executions`)}
                    >
                      {task.title}
                    </h5>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 bg-surface-container-highest px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-on-surface-variant border border-outline-variant/10 shadow-sm">
                        <Bot size={12} />
                        {task.assignee?.name || 'Unassigned'}
                      </span>
                    </div>
                  </div>

                  {/* Column 3: Execution Pattern */}
                  <div className="hidden lg:block">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40 mb-2">Cycle Pattern</p>
                    <div className="flex flex-col gap-1">
                      <p className="font-mono text-xs text-tertiary font-bold tracking-widest">{task.cronExpression}</p>
                      <p className="text-[10px] text-on-surface-variant/60 font-medium uppercase tracking-tighter italic">Recurrent Loop</p>
                    </div>
                  </div>

                  {/* Column 4: Last Execution */}
                  <div className="hidden lg:block">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40 mb-2">Last Execution</p>
                    <p className={`text-sm font-bold tracking-tight text-white/90`}>
                      {task.lastRun ? new Date(task.lastRun).toLocaleString() : (
                        <span className="text-on-surface-variant/40 italic">Never executed</span>
                      )}
                    </p>
                  </div>

                  {/* Column 5: Created At */}
                  <div className="hidden lg:block">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40 mb-2">Deployed</p>
                    <p className="text-sm font-bold text-on-surface tracking-tight">{new Date(task.createdAt).toLocaleDateString()}</p>
                  </div>

                  {/* Column 6: Status & Actions */}
                  <div className="flex items-center justify-end relative h-full">
                    <div className="flex items-center gap-4 group-hover:opacity-0 transition-opacity">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                        task.status === RecurrentTaskStatus.ACTIVE ? 'bg-secondary/10 text-secondary border-secondary/20 shadow-[0_0_15px_rgba(78,222,163,0.1)]' :
                        task.status === RecurrentTaskStatus.PAUSED ? 'bg-surface-container-highest text-on-surface-variant/60 border-outline-variant/20' :
                        'bg-error/10 text-error border-error/20 shadow-[0_0_15px_rgba(255,180,171,0.1)]'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                    
                    <div className="absolute right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                      <button 
                        className={`p-3 transition-colors ${task.status === RecurrentTaskStatus.ACTIVE ? 'text-secondary hover:text-secondary/80' : 'text-on-surface-variant hover:text-secondary'}`} 
                        title={task.status === RecurrentTaskStatus.ACTIVE ? 'Pause Protocol' : 'Resume Protocol'}
                        onClick={() => handleToggleStatus(task)}
                      >
                        {task.status === RecurrentTaskStatus.ACTIVE ? <Pause size={20} /> : <Play size={20} />}
                      </button>
                      <button 
                        className="p-3 text-on-surface-variant hover:text-primary transition-colors" 
                        title="Edit"
                        onClick={() => openEditModal(task)}
                      >
                        <Edit size={20} />
                      </button>
                      <button 
                        className="p-3 text-on-surface-variant hover:text-error transition-colors" 
                        title="Delete"
                        onClick={() => handleDelete(task.id, task.title)}
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* AI Insight Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
        className="p-8 rounded-3xl bg-gradient-to-br from-tertiary/10 via-surface-container-low to-surface-container-low border border-tertiary/20 relative overflow-hidden group"
      >
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
          <div className="w-16 h-16 bg-tertiary/10 rounded-2xl border border-tertiary/20 flex items-center justify-center text-tertiary shadow-xl group-hover:scale-110 transition-transform duration-500">
            <Sparkles size={32} />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h4 className="text-xl font-headline font-black text-tertiary mb-2 uppercase tracking-tight">Orchestrator Intelligence Insight</h4>
              <p className="text-on-surface-variant leading-relaxed max-w-4xl font-body italic text-base">
                "Scheduling patterns suggest a resource collision likely at <span className="text-tertiary font-bold">03:00 UTC</span> between 'Daily Market Sweep' and the 'Primary Indexer'. I recommend shifting the Market Sweep forward by 15 minutes to optimize throughput by 12.4%."
              </p>
            </div>
            <div className="flex gap-4">
              <button className="px-6 py-2.5 bg-tertiary text-on-tertiary rounded-xl font-black text-xs uppercase tracking-widest hover:opacity-90 shadow-lg shadow-tertiary/20 transition-all">Apply Optimization</button>
              <button className="px-6 py-2.5 border border-tertiary/30 text-tertiary rounded-xl font-black text-xs uppercase tracking-widest hover:bg-tertiary/5 transition-colors">Dismiss</button>
            </div>
          </div>
        </div>
        {/* Abstract background glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-tertiary/5 blur-[100px] rounded-full group-hover:bg-tertiary/10 transition-colors duration-1000"></div>
      </motion.div>

      {/* Floating System Stream (Relative to main container for now, but will likely be fixed if integrated into layout) */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="fixed bottom-8 right-8 w-80 bg-surface-container-highest/60 backdrop-blur-2xl p-6 rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.5)] border border-outline-variant/20 z-10"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse shadow-[0_0_8px_rgba(78,222,163,0.6)]"></span>
            <span className="text-[10px] font-black font-headline uppercase tracking-[0.2em] text-secondary">Real-time Stream</span>
          </div>
          <button className="text-on-surface-variant hover:text-white transition-colors">
            <Search size={14} />
          </button>
        </div>
        
        <div className="space-y-4">
          {[
            { time: '09:42:11', msg: 'started execution sweep', node: 'Oracle-v2', nodeColor: 'text-primary' },
            { time: '09:41:00', msg: 'verified task queue (12 tasks)', node: 'Cron-Engine', nodeColor: 'text-on-surface' },
            { time: '09:30:00', msg: 'archived 400 records', node: 'Log-Service', nodeColor: 'text-secondary' },
          ].map((log, i) => (
            <div key={i} className="flex gap-4 text-xs font-medium">
              <span className="text-on-surface-variant/40 font-mono tracking-tighter shrink-0">{log.time}</span>
              <p className="text-on-surface-variant/80">
                <span className={`${log.nodeColor} font-black`}>{log.node}</span> {log.msg}
              </p>
            </div>
          ))}
        </div>
        
        <button className="w-full mt-8 py-3 bg-surface-container/40 border border-outline-variant/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 hover:bg-surface-container-high hover:text-white transition-all">
          Expand Log Manifest
        </button>
      </motion.div>

      <CreateRecurrentTaskModal 
        projectId={activeProject.id}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchTasks();
        }}
        initialData={editingTask}
      />
    </div>
  );
};

export default Scheduler;
