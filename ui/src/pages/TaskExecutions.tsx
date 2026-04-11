import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ChevronRight, 
  Edit, 
  Play, 
  Pause,
  Filter, 
  Download, 
  ChevronLeft, 
  ChevronsLeft, 
  ChevronsRight,
  Activity,
  TrendingUp,
  Zap,
  Clock,
  Layout,
} from 'lucide-react';
import { CronExpressionParser } from 'cron-parser';
import { 
  recurrentTasksApi, 
  type RecurrentTask, 
  type RecurrentTaskExec, 
  RecurrentTaskStatus,
  ExecStatus 
} from '../api/recurrent-tasks';
import { TaskPriority, getTaskPriorityLabel } from '../api/tasks';
import { useProject } from '../hooks/useProject';
import { useNotification } from '../hooks/useNotification';
import CreateRecurrentTaskModal from '../components/CreateRecurrentTaskModal';
import ConfirmDialog from '../components/ConfirmDialog';
import ExecLogModal from '../components/ExecLogModal';

const TaskExecutions: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const { activeProject, loading: projectLoading } = useProject();
  const { notifyApiError, notifySuccess } = useNotification();

  const [task, setTask] = useState<RecurrentTask | null>(null);
  const [executions, setExecutions] = useState<RecurrentTaskExec[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isExecuteConfirmOpen, setIsExecuteConfirmOpen] = useState(false);
  const [isPauseConfirmOpen, setIsPauseConfirmOpen] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [selectedExec, setSelectedExec] = useState<RecurrentTaskExec | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const limit = 10;

  const fetchData = useCallback(async () => {
    if (!activeProject || !taskId) return;

    try {
      setLoading(true);
      const [taskRes, execRes] = await Promise.all([
        recurrentTasksApi.findOne(activeProject.id, taskId),
        recurrentTasksApi.findExecutions(activeProject.id, taskId, page, limit)
      ]);
      setTask(taskRes.data);
      setExecutions(execRes.data.data);
      setTotal(execRes.data.total);
    } catch (error) {
      notifyApiError(error, 'Failed to coordinate data retrieval');
    } finally {
      setLoading(false);
    }
  }, [activeProject, taskId, page, notifyApiError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleConfirmExecute = async () => {
    if (!activeProject || !task) return;

    try {
      setExecuting(true);
      await recurrentTasksApi.update(activeProject.id, task.id, {
        status: RecurrentTaskStatus.ACTIVE,
      });
      notifySuccess(
        'Protocol Activated',
        `Operation "${task.title}" has been successfully re-activated.`
      );
      fetchData();
    } catch (error) {
      notifyApiError(error, 'Failed to activate protocol status');
    } finally {
      setExecuting(false);
      setIsExecuteConfirmOpen(false);
    }
  };

  const handleConfirmPause = async () => {
    if (!activeProject || !task) return;

    try {
      setExecuting(true);
      await recurrentTasksApi.update(activeProject.id, task.id, {
        status: RecurrentTaskStatus.PAUSED,
      });
      notifySuccess(
        'Protocol Paused',
        `Operation "${task.title}" has been paused.`
      );
      fetchData();
    } catch (error) {
      notifyApiError(error, 'Failed to pause protocol');
    } finally {
      setExecuting(false);
      setIsPauseConfirmOpen(false);
    }
  };

  const formatDuration = (ms: number) => {
    if (!ms) return '0s';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${String(seconds % 60).padStart(2, '0')}s`;
    }
    return `${seconds}s`;
  };

  // --- Computed Metrics (from current page of executions) ---
  const completedExecutions = executions.filter(
    (e) => e.status === ExecStatus.SUCCESS || e.status === ExecStatus.FAILURE
  );
  const successCount = executions.filter((e) => e.status === ExecStatus.SUCCESS).length;
  const successRate = completedExecutions.length > 0
    ? (successCount / completedExecutions.length) * 100
    : null;

  const executionsWithLatency = executions.filter((e) => e.latencyMs > 0);
  const avgLatencyMs = executionsWithLatency.length > 0
    ? executionsWithLatency.reduce((sum, e) => sum + e.latencyMs, 0) / executionsWithLatency.length
    : null;



  const nextRunInfo = useMemo(() => {
    if (task?.status !== RecurrentTaskStatus.ACTIVE || !task?.cronExpression) return null;
    try {
      const interval = CronExpressionParser.parse(task.cronExpression);
      const next = interval.next().toDate();
      const now = new Date();
      const diffMs = next.getTime() - now.getTime();
      if (diffMs <= 0) return { relative: 'now', absolute: next.toUTCString().split(' ')[4] + ' UTC' };
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHours = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHours / 24);
      let relative: string;
      if (diffDays > 0) {
        relative = `in ${diffDays}d ${diffHours % 24}h`;
      } else if (diffHours > 0) {
        relative = `in ${diffHours}h ${diffMin % 60}m`;
      } else if (diffMin > 0) {
        relative = `in ${diffMin}m`;
      } else {
        relative = `in ${diffSec}s`;
      }
      const pad = (n: number) => String(n).padStart(2, '0');
      const absolute = `${pad(next.getUTCHours())}:${pad(next.getUTCMinutes())}:${pad(next.getUTCSeconds())} UTC`;
      return { relative, absolute };
    } catch {
      return null;
    }
  }, [task?.cronExpression, task?.status]);

  // Bar chart: pick the latest 6 executions with latency, sorted oldest→newest for left-to-right time flow
  const barSlice = executionsWithLatency
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(-6);

  // Normalize heights using range (min→max) with a 15% floor so bars are always visible
  // and differences, even small ones, are amplified across the full chart height.
  const barData: { height: number; label: string }[] = barSlice.length > 0
    ? (() => {
        const MIN_HEIGHT = 15;
        const latencies = barSlice.map((e) => e.latencyMs);
        const minL = Math.min(...latencies);
        const maxL = Math.max(...latencies);
        const range = maxL - minL;
        return barSlice.map((e) => ({
          height: range > 0
            ? MIN_HEIGHT + ((e.latencyMs - minL) / range) * (100 - MIN_HEIGHT)
            : 60, // all bars identical — flat mid-height
          label: formatDuration(e.latencyMs),
        }));
      })()
    : [40, 60, 50, 80, 75, 100].map((h) => ({ height: h, label: '' }));

  if (projectLoading || (loading && !task)) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-on-surface-variant font-black uppercase tracking-[0.3em] animate-pulse">Initializing Data Grid</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <div className="w-20 h-20 bg-surface-container-highest rounded-3xl flex items-center justify-center text-on-surface-variant/20 mb-6 border border-outline-variant/10">
          <Layout size={40} />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">Signal Lost</h2>
        <p className="text-on-surface-variant max-w-sm mt-2">The requested recurrent protocol could not be located in the current cluster.</p>
        <Link to="/scheduler" className="mt-8 text-primary font-bold uppercase tracking-widest text-xs hover:underline flex items-center gap-2">
          <ChevronLeft size={16} /> Return to Scheduler
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-700 space-y-10">
      {/* Header Section */}
      <header className="mb-10">
        <nav className="flex items-center gap-2 text-on-surface-variant/60 text-[10px] font-black uppercase tracking-widest mb-4">
          <Link to="/scheduler" className="hover:text-primary transition-colors">Scheduler</Link>
          <ChevronRight size={12} className="opacity-40" />
          <span className="text-primary/70">{task.title}</span>
        </nav>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-headline font-black text-white tracking-tight">{task.title}</h1>
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
              task.status === RecurrentTaskStatus.ACTIVE ? 'bg-secondary/10 text-secondary border-secondary/20 shadow-[0_0_15px_rgba(78,222,163,0.1)]' :
              task.status === RecurrentTaskStatus.PAUSED ? 'bg-surface-container-highest text-on-surface-variant/60 border-outline-variant/20' :
              'bg-error/10 text-error border-error/20 shadow-[0_0_15px_rgba(255,180,171,0.1)]'
            }`}>
              {task.status}
            </span>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="bg-surface-container-high text-on-surface px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-surface-container-highest transition-all flex items-center gap-2 border border-outline-variant/10 group active:scale-95"
            >
              <Edit size={16} className="text-on-surface-variant group-hover:text-primary transition-colors" /> Edit Task
            </button>
            {task.status === RecurrentTaskStatus.ACTIVE ? (
              <button
                onClick={() => setIsPauseConfirmOpen(true)}
                className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 bg-surface-container-high text-on-surface-variant hover:bg-error/10 hover:text-error border border-outline-variant/10 hover:border-error/30 shadow-lg active:scale-95"
              >
                <Pause size={16} fill="currentColor" /> Pause Task
              </button>
            ) : (
              <button 
                onClick={() => setIsExecuteConfirmOpen(true)}
                className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 bg-primary text-on-primary hover:opacity-90 shadow-lg shadow-primary/20 active:scale-95"
              >
                <Play size={16} fill="currentColor" /> Activate Now
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Operational Profile */}
        <div className="bg-surface-container-low/40 backdrop-blur-xl p-8 rounded-3xl border border-outline-variant/10 shadow-xl group hover:border-primary/20 transition-all">
          <div className="flex justify-between items-start mb-10">
            <h3 className="text-on-surface-variant/40 text-[10px] font-black uppercase tracking-[0.2em]">Operational Profile</h3>
            <Activity size={20} className="text-primary opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs text-on-surface-variant font-medium">Assigned Agent</span>
              <span className="text-xs text-tertiary font-black uppercase tracking-wider">{task.assignee?.name || 'Unassigned'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-on-surface-variant font-medium">Cron Schedule</span>
              <code className="text-[11px] bg-surface-container-lowest px-2.5 py-1.5 rounded-lg text-primary font-mono tracking-widest border border-outline-variant/5">{task.cronExpression}</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-on-surface-variant font-medium">Priority</span>
              <span className={`text-xs font-black uppercase tracking-widest ${
                String(task.priority) === String(TaskPriority.CRITICAL) ? 'text-error' :
                String(task.priority) === String(TaskPriority.HIGH) ? 'text-secondary' : 
                String(task.priority) === String(TaskPriority.MEDIUM) ? 'text-primary' : 'text-on-surface-variant'
              }`}>{getTaskPriorityLabel(task.priority)}</span>
            </div>
            </div>
            </div>
        {/* Success Rate */}
        <div className="bg-surface-container-low/40 backdrop-blur-xl p-8 rounded-3xl border border-outline-variant/10 shadow-xl relative overflow-hidden group hover:border-secondary/20 transition-all">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-on-surface-variant/40 text-[10px] font-black uppercase tracking-[0.2em]">Success Rate</h3>
            <TrendingUp size={20} className="text-secondary opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex items-baseline gap-3 mb-8">
            {successRate !== null ? (
              <span className="text-5xl font-headline font-black text-white" data-testid="success-rate">
                {successRate.toFixed(1)}%
              </span>
            ) : (
              <span className="text-5xl font-headline font-black text-on-surface-variant/30" data-testid="success-rate">
                —
              </span>
            )}
            {successRate !== null && (
              <span className="text-secondary text-[10px] font-black uppercase tracking-widest bg-secondary/10 px-2 py-0.5 rounded-full">
                {completedExecutions.length} exec{completedExecutions.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="h-24 w-full flex items-end gap-1.5 mt-4">
            {barData.map((bar, i) => (
              <div
                key={i}
                title={bar.label}
                className="flex-1 relative group/bar flex flex-col items-center justify-end cursor-crosshair"
                style={{ height: '100%' }}
              >
                {/* Tooltip on hover */}
                {bar.label && (
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-mono text-secondary opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {bar.label}
                  </span>
                )}
                <div
                  className="w-full bg-secondary/15 rounded-t-md border-t-2 border-secondary/40 hover:bg-secondary/30 hover:border-secondary/70 transition-all"
                  style={{ height: `${bar.height}%` }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Execution Metrics */}
        <div className="bg-surface-container-low/40 backdrop-blur-xl p-8 rounded-3xl border border-outline-variant/10 shadow-xl group hover:border-tertiary/20 transition-all">
          <div className="flex justify-between items-start mb-10">
            <h3 className="text-on-surface-variant/40 text-[10px] font-black uppercase tracking-[0.2em]">Execution Metrics</h3>
            <Zap size={20} className="text-tertiary opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="space-y-10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/30 mb-2">Avg Duration</p>
              <p className="text-2xl font-black text-white" data-testid="avg-duration">
                {avgLatencyMs !== null ? formatDuration(avgLatencyMs) : '—'}
              </p>
            </div>
            {nextRunInfo && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/30 mb-2">Next Run</p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-primary" data-testid="next-run-relative">{nextRunInfo.relative}</span>
                  <span className="text-[9px] font-mono bg-surface-container-highest px-2 py-1 rounded text-on-surface-variant border border-outline-variant/5" data-testid="next-run-absolute">{nextRunInfo.absolute}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main History Table */}
      <section className="bg-surface-container-low rounded-3xl border border-outline-variant/10 shadow-2xl overflow-hidden">
        <div className="px-10 py-8 flex items-center justify-between bg-surface-container-low/20 border-b border-outline-variant/5">
          <h2 className="text-xl font-headline font-black text-white uppercase tracking-tight">Execution Manifest</h2>
          <div className="flex gap-2">
            <button className="p-2.5 text-on-surface-variant hover:text-primary transition-all active:scale-90 bg-surface-container-high/40 rounded-xl border border-outline-variant/10">
              <Filter size={18} />
            </button>
            <button className="p-2.5 text-on-surface-variant hover:text-primary transition-all active:scale-90 bg-surface-container-high/40 rounded-xl border border-outline-variant/10">
              <Download size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest/30 text-[9px] font-black uppercase tracking-[0.3em] text-on-surface-variant/40">
                <th className="px-10 py-5">Correlation ID</th>
                <th className="px-8 py-5">Temporal Stamp</th>
                <th className="px-8 py-5">System Status</th>
                <th className="px-8 py-5">Latency</th>
                <th className="px-8 py-5">Operational Snippet</th>
                <th className="px-10 py-5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-10 py-8 text-center bg-surface-container-high/5">
                      <div className="h-4 bg-surface-container-highest rounded-full w-full opacity-20"></div>
                    </td>
                  </tr>
                ))
              ) : executions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-10 py-20 text-center text-on-surface-variant/40 italic font-mono text-xs uppercase tracking-widest bg-surface-container-high/5">
                    No operational history detected in current stream
                  </td>
                </tr>
              ) : (
                executions.map((exec) => (
                  <tr key={exec.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="px-10 py-6 text-xs font-black text-primary font-mono tracking-widest">
                      #EXEC-{exec.id.split('-')[0].toUpperCase()}
                    </td>
                    <td className="px-8 py-6 text-xs text-on-surface font-bold">
                      {new Date(exec.createdAt).toLocaleString()}
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                        exec.status === ExecStatus.SUCCESS ? 'text-secondary bg-secondary/10 border-secondary/20' :
                        exec.status === ExecStatus.FAILURE ? 'text-error bg-error/10 border-error/20' :
                        'text-tertiary bg-tertiary/10 border-tertiary/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          exec.status === ExecStatus.SUCCESS ? 'bg-secondary' :
                          exec.status === ExecStatus.FAILURE ? 'bg-error' :
                          'bg-tertiary'
                        }`}></span>
                        {exec.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-xs text-on-surface-variant/80 font-mono">
                      {formatDuration(exec.latencyMs)}
                    </td>
                    <td className="px-8 py-6 max-w-[300px]">
                      <div className="bg-surface-container-lowest/50 px-3 py-2 rounded-lg border border-outline-variant/10 group-hover:border-primary/20 transition-colors">
                        <span className="text-[10px] text-on-surface-variant/70 font-mono truncate block">
                          {exec.result || 'Empty operational log buffer'}
                        </span>
                      </div>
                    </td>
                      <td className="px-10 py-6 text-right">
                        <button
                          onClick={() => { setSelectedExec(exec); setIsLogModalOpen(true); }}
                          className="text-[9px] font-black uppercase tracking-[0.2em] text-primary border border-primary/20 px-4 py-2 rounded-xl hover:bg-primary/10 transition-all active:scale-95 group-hover:border-primary/40">
                          View Log
                        </button>
                      </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-10 py-6 flex items-center justify-between border-t border-outline-variant/10 bg-surface-container-lowest/10">
          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">
            Scanning range <span className="text-on-surface-variant">{(page - 1) * limit + 1} - {Math.min(page * limit, total)}</span> of <span className="text-on-surface-variant">{total}</span> sequences
          </p>
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(1)}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-highest transition-all disabled:opacity-20"
            >
              <ChevronsLeft size={18} />
            </button>
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-highest transition-all disabled:opacity-20"
            >
              <ChevronLeft size={18} />
            </button>
            
            <div className="flex items-center gap-1.5 px-4 font-mono font-black text-xs">
              <span className="text-primary">{page}</span>
              <span className="text-on-surface-variant/20 italic">/</span>
              <span className="text-on-surface-variant/60">{Math.ceil(total / limit) || 1}</span>
            </div>

            <button 
              disabled={page >= Math.ceil(total / limit)}
              onClick={() => setPage(p => p + 1)}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-highest transition-all disabled:opacity-20"
            >
              <ChevronRight size={18} />
            </button>
            <button 
              disabled={page >= Math.ceil(total / limit)}
              onClick={() => setPage(Math.ceil(total / limit) || 1)}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-highest transition-all disabled:opacity-20"
            >
              <ChevronsRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer Info Section */}
      <footer className="flex justify-between items-center px-4">
        <div className="flex items-center gap-3 text-on-surface-variant/30 font-black uppercase tracking-[0.3em] text-[8px]">
          <Clock size={12} />
          Cluster Synchronized: {new Date().toLocaleTimeString()} UTC
        </div>
      </footer>

      {activeProject && task && (
        <CreateRecurrentTaskModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          projectId={activeProject.id}
          initialData={task}
          onSuccess={() => {
            setIsEditModalOpen(false);
            fetchData();
          }}
        />
      )}

      <ConfirmDialog
        isOpen={isExecuteConfirmOpen}
        onClose={() => setIsExecuteConfirmOpen(false)}
        onConfirm={handleConfirmExecute}
        title="Activate Protocol"
        message={`Are you sure you want to re-activate the automated orchestration routine "${task.title}"? This will resume the scheduled executions according to the cron definition.`}
        confirmText="Confirm Activation"
        variant="primary"
        loading={executing}
      />

      <ConfirmDialog
        isOpen={isPauseConfirmOpen}
        onClose={() => setIsPauseConfirmOpen(false)}
        onConfirm={handleConfirmPause}
        title="Pause Protocol"
        message={`Are you sure you want to pause "${task.title}"? Scheduled executions will be suspended until the task is re-activated.`}
        confirmText="Confirm Pause"
        variant="danger"
        loading={executing}
      />

      <ExecLogModal
        isOpen={isLogModalOpen}
        onClose={() => { setIsLogModalOpen(false); setSelectedExec(null); }}
        exec={selectedExec}
      />
    </div>
  );
};

export default TaskExecutions;
