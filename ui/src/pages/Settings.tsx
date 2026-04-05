import React, { useEffect, useState } from 'react';
import { Terminal, Shield, Key, Network, Cpu, Database, Palette, Save, XCircle, Activity } from 'lucide-react';
import { getSystemSettings, updateSystemSettings } from '../api/system-settings';
import type { SystemSettings } from '../api/system-settings';
import { useNotification } from '../hooks/useNotification';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { notifySuccess, notifyError, notifyInfo } = useNotification();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSystemSettings();
        setSettings(data);
      } catch {
        notifyError('Failed to load settings', 'Could not fetch system configuration from kernel.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [notifyError]);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await updateSystemSettings(settings);
      notifySuccess('Settings committed', 'Configuration synchronized with central orchestrator.');
    } catch {
      notifyError('Commit failed', 'Could not push changes to the backend.');
    } finally {
      setSaving(false);
    }
  };

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

  const updateNestedSetting = (section: keyof SystemSettings['data'], key: string, value: unknown) => {
    if (!settings) return;
    setSettings({
      ...settings,
      data: {
        ...settings.data,
        [section]: {
          ...settings.data[section],
          [key]: value,
        },
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
      {/* Internal Header */}
      <div className="flex justify-between items-center mb-10 border-b border-outline-variant/10 pb-6">
        <div className="border-l-2 border-primary/40 pl-6">
          <h2 className="text-2xl font-bold text-on-surface mb-1">Developer Configuration Terminal</h2>
          <p className="text-on-surface-variant text-sm flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            Kernel version 4.1.2-aetheric. Direct access to system scheduling and processing parameters.
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
            disabled={saving}
            className="bg-primary/10 border border-primary/40 text-primary text-[11px] font-bold px-4 py-1 hover:bg-primary/20 transition-all flex items-center gap-2"
          >
            {saving ? <Activity size={14} className="animate-spin" /> : <Save size={14} />} 
            COMMIT --PUSH
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 overflow-y-auto pr-2 custom-scrollbar pb-24">
        {/* Sidebar Nav (Purely Visual for the Terminal Look) */}
        <aside className="lg:col-span-1 border-r border-outline-variant/10 pr-4 hidden lg:flex flex-col gap-1">
          <div className="mb-6 px-2 opacity-60">
            <p className="text-[10px] text-primary uppercase tracking-[0.2em]">Node Environment</p>
            <p className="text-xs text-on-surface-variant mt-0.5">master@orchestrator-01</p>
          </div>
          <nav className="space-y-0.5">
            <button className="w-full flex items-center gap-2 py-1.5 px-3 bg-primary/5 text-primary border-r-2 border-primary text-left">
              <Terminal size={14} />
              <span className="text-[11px] font-medium uppercase tracking-tight">Core.yml</span>
            </button>
            <button className="w-full flex items-center gap-2 py-1.5 px-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all text-left">
              <Shield size={14} />
              <span className="text-[11px] font-medium uppercase tracking-tight">Auth.conf</span>
            </button>
            <button className="w-full flex items-center gap-2 py-1.5 px-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all text-left">
              <Key size={14} />
              <span className="text-[11px] font-medium uppercase tracking-tight">Secrets.env</span>
            </button>
            <button className="w-full flex items-center gap-2 py-1.5 px-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all text-left">
              <Network size={14} />
              <span className="text-[11px] font-medium uppercase tracking-tight">Network.json</span>
            </button>
          </nav>
        </aside>

        {/* Main Config Content */}
        <div className="lg:col-span-3 space-y-12">
          {/* Section 01: Scheduler */}
          <section>
            <div className="font-mono text-xs font-bold text-primary mb-4 border-b border-outline-variant/20 pb-1 flex items-center gap-2 uppercase tracking-wider">
              <Cpu size={14} /> 01. PROCESS_SCHEDULER_CONFIG
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 bg-surface-container-low/30 p-6 border border-outline-variant/10">
              <div className="space-y-1">
                <label className="block font-mono text-[11px] text-on-surface-variant/80 uppercase tracking-wider mb-1">Poll Interval (ms)</label>
                <input 
                  type="number" 
                  value={settings.data.scheduler.pollInterval}
                  onChange={(e) => updateNestedSetting('scheduler', 'pollInterval', parseInt(e.target.value))}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 px-3 py-1.5 text-secondary font-mono text-sm focus:border-primary focus:ring-0 outline-none transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-mono text-[11px] text-on-surface-variant/80 uppercase tracking-wider mb-1">Watchdog Timeout (ms)</label>
                <input 
                  type="number" 
                  value={settings.data.scheduler.watchdogTimeout}
                  onChange={(e) => updateNestedSetting('scheduler', 'watchdogTimeout', parseInt(e.target.value))}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 px-3 py-1.5 text-secondary font-mono text-sm focus:border-primary focus:ring-0 outline-none transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-mono text-[11px] text-on-surface-variant/80 uppercase tracking-wider mb-1">Queue Flush Frequency (ms)</label>
                <input 
                  type="number" 
                  value={settings.data.scheduler.queueFlushFrequency}
                  onChange={(e) => updateNestedSetting('scheduler', 'queueFlushFrequency', parseInt(e.target.value))}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 px-3 py-1.5 text-secondary font-mono text-sm focus:border-primary focus:ring-0 outline-none transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-mono text-[11px] text-on-surface-variant/80 uppercase tracking-wider mb-1">Heartbeat Period (s)</label>
                <input 
                  type="number" 
                  value={settings.data.scheduler.heartbeatPeriod}
                  onChange={(e) => updateNestedSetting('scheduler', 'heartbeatPeriod', parseInt(e.target.value))}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 px-3 py-1.5 text-secondary font-mono text-sm focus:border-primary focus:ring-0 outline-none transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-mono text-[11px] text-on-surface-variant/80 uppercase tracking-wider mb-1">Retry Backoff Multiplier</label>
                <input 
                  type="text" 
                  value={settings.data.scheduler.retryBackoffMultiplier}
                  onChange={(e) => updateNestedSetting('scheduler', 'retryBackoffMultiplier', e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 px-3 py-1.5 text-secondary font-mono text-sm focus:border-primary focus:ring-0 outline-none transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-mono text-[11px] text-on-surface-variant/80 uppercase tracking-wider mb-1">Max Execution Window (ms)</label>
                <input 
                  type="number" 
                  value={settings.data.scheduler.maxExecutionWindow}
                  onChange={(e) => updateNestedSetting('scheduler', 'maxExecutionWindow', parseInt(e.target.value))}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 px-3 py-1.5 text-secondary font-mono text-sm focus:border-primary focus:ring-0 outline-none transition-colors"
                />
              </div>
            </div>
          </section>

          {/* Section 02: Cluster */}
          <section>
            <div className="font-mono text-xs font-bold text-primary mb-4 border-b border-outline-variant/20 pb-1 flex items-center gap-2 uppercase tracking-wider">
              <Network size={14} /> 02. CLUSTER_INTERCONNECT_PROTOCOLS
            </div>
            <div className="space-y-6 bg-surface-container-low/30 p-6 border border-outline-variant/10">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block font-mono text-[11px] text-on-surface-variant/80 uppercase tracking-wider mb-1">Node Status Broadcast Frequency</label>
                  <span className="text-secondary text-[10px]">CURRENT: {settings.data.cluster.broadcastFrequency}ms</span>
                </div>
                <input 
                  type="range"
                  min="100"
                  max="5000"
                  step="100"
                  value={settings.data.cluster.broadcastFrequency}
                  onChange={(e) => updateNestedSetting('cluster', 'broadcastFrequency', parseInt(e.target.value))}
                  className="w-full h-1 bg-surface-container-highest appearance-none cursor-pointer accent-secondary"
                />
                <div className="flex justify-between text-[9px] text-outline font-mono">
                  <span>MIN_LATENCY (100ms)</span>
                  <span>POWER_SAVE (5000ms)</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-mono text-[11px] text-on-surface-variant/80 uppercase tracking-wider mb-1">Default LLM Provider</label>
                  <select 
                    value={settings.data.cluster.defaultLlmProvider}
                    onChange={(e) => updateNestedSetting('cluster', 'defaultLlmProvider', e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 px-3 py-1.5 text-secondary font-mono text-sm focus:border-primary focus:ring-0 outline-none transition-colors appearance-none"
                  >
                    <option>GPT-4o</option>
                    <option>Claude 3.5</option>
                    <option>Gemini Pro</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block font-mono text-[11px] text-on-surface-variant/80 uppercase tracking-wider mb-1">System Alias ID</label>
                  <input 
                    type="text" 
                    value={settings.data.cluster.systemAliasId}
                    onChange={(e) => updateNestedSetting('cluster', 'systemAliasId', e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 px-3 py-1.5 text-secondary font-mono text-sm focus:border-primary focus:ring-0 outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 03: Persistence */}
          <section>
            <div className="font-mono text-xs font-bold text-primary mb-4 border-b border-outline-variant/20 pb-1 flex items-center gap-2 uppercase tracking-wider">
              <Database size={14} /> 03. PERSISTENCE_STORAGE_POLICY
            </div>
            <div className="bg-surface-container-low/30 p-6 border border-outline-variant/10">
              <div className="flex flex-wrap gap-2">
                {[30, 90, 365].map((days) => (
                  <label key={days} className="flex-1 min-w-[120px] cursor-pointer group">
                    <input 
                      type="radio" 
                      name="retention" 
                      className="peer sr-only"
                      checked={settings.data.persistence.retentionDays === days}
                      onChange={() => updateNestedSetting('persistence', 'retentionDays', days)}
                    />
                    <div className="p-3 border border-outline-variant/30 peer-checked:border-secondary peer-checked:bg-secondary/5 transition-all text-center">
                      <p className="text-lg font-bold">{days}D</p>
                      <p className="text-[9px] text-outline uppercase">TTL_VALUE</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="mt-4 p-3 bg-primary-container/10 border-l-2 border-primary/40">
                <p className="text-[11px] text-primary leading-relaxed opacity-80">
                  <span className="font-bold">[SYSTEM_INFO]:</span> Logs exceeding retention thresholds are automatically purged by 'Garbage Collector' process at 04:00 UTC daily.
                </p>
              </div>
            </div>
          </section>

          {/* Section 04: UI Runtime */}
          <section>
            <div className="font-mono text-xs font-bold text-primary mb-4 border-b border-outline-variant/20 pb-1 flex items-center gap-2 uppercase tracking-wider">
              <Palette size={14} /> 04. UI_RUNTIME_STYLE_SPEC
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-surface-container-low/30 p-6 border border-outline-variant/10">
              <div className="space-y-6">
                <div className="flex items-center justify-between py-2 border-b border-outline-variant/10">
                  <span className="text-xs uppercase tracking-widest text-on-surface-variant">Dark_Mode_Enabled</span>
                  <button 
                    onClick={() => updateNestedSetting('ui', 'darkModeEnabled', !settings.data.ui.darkModeEnabled)}
                    className={`w-8 h-4 relative flex items-center px-0.5 transition-colors ${settings.data.ui.darkModeEnabled ? 'bg-primary' : 'bg-outline-variant'}`}
                  >
                    <div className={`w-3 h-3 bg-on-primary transition-all ${settings.data.ui.darkModeEnabled ? 'ml-auto' : 'ml-0'}`}></div>
                  </button>
                </div>
                <div className="space-y-3">
                  <label className="block font-mono text-[11px] text-on-surface-variant/80 uppercase tracking-wider mb-1">Primary_Hex_Accent</label>
                  <div className="flex gap-2">
                    {['#adc6ff', '#4edea3', '#ddb7ff', '#ffb4ab'].map(color => (
                      <div 
                        key={color}
                        onClick={() => updateNestedSetting('ui', 'primaryHexAccent', color)}
                        className={`w-6 h-6 border cursor-pointer transition-all ${settings.data.ui.primaryHexAccent === color ? 'border-white scale-110' : 'border-transparent opacity-40 hover:opacity-100'}`}
                        style={{ backgroundColor: color }}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="relative aspect-video border border-outline-variant/20 overflow-hidden group">
                <div className="w-full h-full bg-surface-container flex items-center justify-center text-outline text-[10px] uppercase">
                  Visual_Buffer_Preview.raw
                </div>
                <div className="absolute bottom-0 left-0 w-full p-2 bg-surface/80 text-[8px] font-mono border-t border-outline-variant/20 uppercase">
                  Buffer Source: Internal
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Settings;
