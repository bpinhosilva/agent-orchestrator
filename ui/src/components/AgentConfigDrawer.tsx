import React, { useEffect, useState } from 'react';
import { X, Edit2, ChevronDown, Check, Copy, Loader2 } from 'lucide-react';
import { useNotification } from '../hooks/useNotification';
import MarkdownField from './MarkdownField';
import { agentsApi, type Agent } from '../api/agents';
import { type Model } from '../api/models';
import { providersApi } from '../api/providers';

interface AgentConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
  agent: Agent | null;
}

const AgentConfigDrawer: React.FC<AgentConfigDrawerProps> = ({ isOpen, onClose, onUpdated, agent }) => {
  const { notifyError, notifySuccess } = useNotification();
  const [saving, setSaving] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [name, setName] = useState(agent?.name || '');
  const [description, setDescription] = useState(agent?.description || '');
  const [systemInstructions, setSystemInstructions] = useState(agent?.systemInstructions || '');
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [selectedModelId, setSelectedModelId] = useState(agent?.model?.id || '');

  useEffect(() => {
    if (isOpen && agent?.model?.provider?.id) {
      fetchModels(agent.model.provider.id);
    }
  }, [isOpen, agent?.model?.provider?.id]);

  useEffect(() => {
    if (isOpen) {
      setName(agent?.name || '');
      setDescription(agent?.description || '');
      setSystemInstructions(agent?.systemInstructions || '');
      setSelectedModelId(agent?.model?.id || '');
    }
  }, [isOpen, agent]);

  const fetchModels = async (providerId: string) => {
    try {
      setLoadingModels(true);
      const { data } = await providersApi.findModels(providerId);
      setAvailableModels(data);
    } catch (error) {
      console.error('Failed to fetch models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleCopyId = () => {
    if (!agent?.id) return;
    navigator.clipboard.writeText(agent.id);
    setCopied(true);
    notifySuccess('Copied', 'Agent ID copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!agent?.id) return;
    try {
      setSaving(true);
      await agentsApi.update(agent.id, {
        name,
        description,
        systemInstructions,
        modelId: selectedModelId
      });
      onUpdated?.();
      onClose();
    } catch {
      notifyError('Update Failed', 'An error occurred while saving the configuration.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-surface-container-low shadow-2xl z-[60] flex flex-col ring-1 ring-outline-variant/10 animate-in slide-in-from-right duration-300">
      <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold font-headline text-white">Agent Configuration</h3>
          <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-0.5">
            Edit Profile: {agent?.name || 'Logic Specialist'}
          </p>
        </div>
        <button onClick={onClose} className="text-on-surface-variant hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
        {/* Identity Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-2xl bg-surface-container-high ring-1 ring-outline-variant/50 flex items-center justify-center overflow-hidden">
              <span className="text-4xl text-secondary">🧠</span>
              <button className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Edit2 size={16} />
              </button>
            </div>
            <div className="flex-1 space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-tight text-on-surface-variant/60">Agent Name</label>
                <input 
                  className="w-full bg-surface-container-lowest border-none rounded-md text-sm text-on-surface focus:ring-1 focus:ring-primary h-9 px-3" 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-tight text-on-surface-variant/60">Agent ID</label>
                <div className="flex gap-2">
                  <input 
                    className="flex-1 bg-surface-container-lowest/50 border-none rounded-md text-[10px] font-mono text-on-surface-variant focus:ring-0 h-8 px-3 cursor-default" 
                    type="text" 
                    value={agent?.id || ''} 
                    readOnly
                  />
                  <button 
                    onClick={handleCopyId}
                    className="p-1.5 rounded bg-surface-container-highest hover:bg-surface-container-highest/80 text-on-surface-variant transition-colors flex items-center justify-center aspect-square h-8"
                    title="Copy ID"
                  >
                    {copied ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Description Section */}
        <MarkdownField 
          label="Description"
          value={description}
          onChange={setDescription}
          placeholder="Detailed agent profile..."
          height="h-32"
          maxLength={1000}
        />

        {/* Model Selection */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-tight text-on-surface-variant/60">Model Engine</label>
            {loadingModels && <Loader2 size={12} className="animate-spin text-primary" />}
          </div>
          <div className="relative">
            <select 
              className="w-full bg-surface-container-lowest border-none rounded-md text-sm text-on-surface focus:ring-1 focus:ring-primary h-11 appearance-none px-4 disabled:opacity-50"
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              disabled={loadingModels}
            >
              {availableModels.length === 0 && !loadingModels && (
                <option value="">No models available for this provider</option>
              )}
              {availableModels.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 pointer-events-none text-on-surface-variant/60" size={18} />
          </div>
        </section>

        {/* Personality Matrix */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-tight text-on-surface-variant/60">Personality Matrix</label>
            <span className="text-[10px] text-tertiary px-2 py-0.5 rounded bg-tertiary/10">AI Optimized</span>
          </div>
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant">Creativity</span>
                <span className="text-primary font-mono font-bold">0.42</span>
              </div>
              <input type="range" className="w-full accent-primary h-1 bg-surface-container-highest rounded-full appearance-none cursor-pointer" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant">Strictness</span>
                <span className="text-secondary font-mono font-bold">0.85</span>
              </div>
              <input type="range" className="w-full accent-secondary h-1 bg-surface-container-highest rounded-full appearance-none cursor-pointer" />
            </div>
          </div>
        </section>

        {/* System Instructions */}
        <MarkdownField 
          label="System Instructions"
          value={systemInstructions}
          onChange={setSystemInstructions}
          placeholder="Define operational logic..."
          height="h-64"
          maxLength={2000}
        />
      </div>

      <div className="p-6 bg-surface-container-high border-t border-outline-variant/10 flex gap-3">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-primary text-on-primary py-2.5 rounded font-bold text-sm shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
        >
          {saving ? (
            <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
          ) : (
            <>
              <Check size={16} />
              Save Changes
            </>
          )}
        </button>
        <button onClick={onClose} className="px-4 py-2.5 rounded border border-outline-variant text-on-surface-variant hover:text-white transition-all">
          Reset
        </button>
      </div>
    </div>
  );
};

export default AgentConfigDrawer;
