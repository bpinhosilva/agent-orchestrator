import React, { useEffect, useMemo, useState } from 'react';
import { Terminal, Cpu, RefreshCw, Save, XCircle, Activity } from 'lucide-react';
import { getSystemSettings, updateSystemSettings } from '../api/system-settings';
import type { SystemSettings } from '../api/system-settings';
import { useNotification } from '../hooks/useNotification';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { notifySuccess, notifyApiError, notifyInfo } = useNotification();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSystemSettings();
        setSettings(data);
      } catch (error) {
        notifyApiError(error, 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [notifyApiError]);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await updateSystemSettings(settings);
      notifySuccess('Settings committed', 'Configuration synchronized with central orchestrator.');
    } catch (error) {
      notifyApiError(error, 'Commit failed');
    } finally {
      setSaving(false);
    }
  };

  const errors = useMemo(() => {
    if (!settings) return {} as Record<string, string>;
    const e: Record<string, string> = {};
    const ts = settings.data.taskScheduler;
    const rs = settings.data.recurrentTasksScheduler;
    if (!ts.pollIntervalInMs || ts.pollIntervalInMs < 10000)
      e['ts.poll'] = 'Minimum 10 000 ms';
    if (!ts.maxTaskPerExecution || ts.maxTaskPerExecution < 1 || ts.maxTaskPerExecution > 15)
      e['ts.max'] = 'Must be between 1 and 15';
    if (!rs.pollIntervalInMs || rs.pollIntervalInMs < 15000)
      e['rs.poll'] = 'Minimum 15 000 ms';
    if (!rs.executionTimeout || rs.executionTimeout < 60000)
      e['rs.timeout'] = 'Minimum 60 000 ms';
    if (!rs.maxActiveTasks || rs.maxActiveTasks < 1 || rs.maxActiveTasks > 5)
      e['rs.max'] = 'Must be between 1 and 5';
    return e;
  }, [settings]);

  const hasErrors = Object.keys(errors).length > 0;

  const handleAbort = async () => {
    setLoading(true);
    try {
      const data = await getSystemSettings();
      setSettings(data);
      notifyInfo('Changes aborted', 'Configuration reloaded from the last known state.');
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const updateTaskScheduler = (key: keyof SystemSettings['data']['taskScheduler'], value: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      data: {
        ...settings.data,
        taskScheduler: { ...settings.data.taskScheduler, [key]: value },
      },
    });
  };

  const updateRecurrentScheduler = (key: keyof SystemSettings['data']['recurrentTasksScheduler'], value: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      data: {
        ...settings.data,
        recurrentTasksScheduler: { ...settings.data.recurrentTasksScheduler, [key]: value },
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 rounded-full border-4 border-outline-variant/30 border-t-primary animate-spin"></div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="flex flex-col h-full font-mono text-on-surface">
      {/* Header */}
      <div className="flex justify-between items-center mb-10 border-b border-outline-variant/10 pb-6">
        <div className="border-l-2 border-primary/40 pl-6">
          <h2 className="text-2xl font-bold text-on-surface mb-1">Developer Configuration Terminal</h2>
          <p className="text-on-surface-variant text-sm flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            Direct access to system scheduling and processing parameters.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleAbort}
            className="text-on-surface-variant text-[11px] hover:text-on-surface transition-colors px-3 py-1 flex items-center gap-2"
          >
            <XCircle size={14} /> ABORT_CHANGES
          </button>
          <button
            onClick={handleSave}
            disabled={saving || hasErrors}
            className="bg-primary/10 border border-primary/40 text-primary text-[11px] font-bold px-4 py-1 hover:bg-primary/20 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? <Activity size={14} className="animate-spin" /> : <Save size={14} />}
            COMMIT --PUSH
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 overflow-y-auto pr-2 custom-scrollbar pb-24">
        {/* Sidebar Nav */}
        <aside className="lg:col-span-1 border-r border-outline-variant/10 pr-4 hidden lg:flex flex-col gap-1">
          <nav className="space-y-0.5">
            <button className="w-full flex items-center gap-2 py-1.5 px-3 bg-primary/5 text-primary border-r-2 border-primary text-left">
              <Terminal size={14} />
              <span className="text-[11px] font-medium uppercase tracking-tight">Scheduler</span>
            </button>
            <button className="w-full flex items-center gap-2 py-1.5 px-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all text-left">
              <RefreshCw size={14} />
              <span className="text-[11px] font-medium uppercase tracking-tight">Recurrent</span>
            </button>
          </nav>
        </aside>

        {/* Main Config Content */}
        <div className="lg:col-span-3 space-y-12">

          {/* Section 01: Task Scheduler */}
          <section>
            <div className="font-mono text-xs font-bold text-primary mb-4 border-b border-outline-variant/20 pb-1 flex items-center gap-2 uppercase tracking-wider">
              <Cpu size={14} /> 01. TASK_SCHEDULER_CONFIG
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 bg-surface-container-low/30 p-6 border border-outline-variant/10">
              <div className="space-y-1">
                <label className="block font-mono text-[11px] text-on-surface-variant/80 uppercase tracking-wider mb-1">
                  Poll Interval (ms) <span className="text-outline normal-case">min 10 000</span>
                </label>
                <input
                  type="number"
                  min={10000}
                  value={settings.data.taskScheduler.pollIntervalInMs}
                  onChange={(e) => updateTaskScheduler('pollIntervalInMs', parseInt(e.target.value))}
                  className={`w-full bg-surface-container-lowest border px-3 py-1.5 text-secondary font-mono text-sm focus:ring-0 outline-none transition-colors ${errors['ts.poll'] ? 'border-error' : 'border-outline-variant/30 focus:border-primary'}`}
                />
                {errors['ts.poll'] && <p className="text-error text-[10px] mt-1">{errors['ts.poll']}</p>}
              </div>
              <div className="space-y-1">
                <label className="block font-mono text-[11px] text-on-surface-variant/80 uppercase tracking-wider mb-1">
                  Max Tasks Per Execution <span className="text-outline normal-case">1 – 15</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={15}
                  value={settings.data.taskScheduler.maxTaskPerExecution}
                  onChange={(e) => updateTaskScheduler('maxTaskPerExecution', parseInt(e.target.value))}
                  className={`w-full bg-surface-container-lowest border px-3 py-1.5 text-secondary font-mono text-sm focus:ring-0 outline-none transition-colors ${errors['ts.max'] ? 'border-error' : 'border-outline-variant/30 focus:border-primary'}`}
                />
                {errors['ts.max'] && <p className="text-error text-[10px] mt-1">{errors['ts.max']}</p>}
              </div>
            </div>
          </section>

          {/* Section 02: Recurrent Tasks Scheduler */}
          <section>
            <div className="font-mono text-xs font-bold text-primary mb-4 border-b border-outline-variant/20 pb-1 flex items-center gap-2 uppercase tracking-wider">
              <RefreshCw size={14} /> 02. RECURRENT_TASKS_SCHEDULER_CONFIG
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 bg-surface-container-low/30 p-6 border border-outline-variant/10">
              <div className="space-y-1">
                <label className="block font-mono text-[11px] text-on-surface-variant/80 uppercase tracking-wider mb-1">
                  Poll Interval (ms) <span className="text-outline normal-case">min 15 000</span>
                </label>
                <input
                  type="number"
                  min={15000}
                  value={settings.data.recurrentTasksScheduler.pollIntervalInMs}
                  onChange={(e) => updateRecurrentScheduler('pollIntervalInMs', parseInt(e.target.value))}
                  className={`w-full bg-surface-container-lowest border px-3 py-1.5 text-secondary font-mono text-sm focus:ring-0 outline-none transition-colors ${errors['rs.poll'] ? 'border-error' : 'border-outline-variant/30 focus:border-primary'}`}
                />
                {errors['rs.poll'] && <p className="text-error text-[10px] mt-1">{errors['rs.poll']}</p>}
              </div>
              <div className="space-y-1">
                <label className="block font-mono text-[11px] text-on-surface-variant/80 uppercase tracking-wider mb-1">
                  Execution Timeout (ms) <span className="text-outline normal-case">min 60 000</span>
                </label>
                <input
                  type="number"
                  min={60000}
                  value={settings.data.recurrentTasksScheduler.executionTimeout}
                  onChange={(e) => updateRecurrentScheduler('executionTimeout', parseInt(e.target.value))}
                  className={`w-full bg-surface-container-lowest border px-3 py-1.5 text-secondary font-mono text-sm focus:ring-0 outline-none transition-colors ${errors['rs.timeout'] ? 'border-error' : 'border-outline-variant/30 focus:border-primary'}`}
                />
                {errors['rs.timeout'] && <p className="text-error text-[10px] mt-1">{errors['rs.timeout']}</p>}
              </div>
              <div className="space-y-1">
                <label className="block font-mono text-[11px] text-on-surface-variant/80 uppercase tracking-wider mb-1">
                  Max Active Tasks <span className="text-outline normal-case">1 – 5</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={settings.data.recurrentTasksScheduler.maxActiveTasks}
                  onChange={(e) => updateRecurrentScheduler('maxActiveTasks', parseInt(e.target.value))}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 px-3 py-1.5 text-secondary font-mono text-sm focus:border-primary focus:ring-0 outline-none transition-colors"
                />
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Settings;


