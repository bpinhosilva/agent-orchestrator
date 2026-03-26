import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Code,
  Shield,
  Layers,
  Box,
  ChevronDown
} from 'lucide-react';
import MarkdownField from './MarkdownField';
import { agentsApi } from '../api/agents';
import { providersApi, type Provider } from '../api/providers';
import { type Model } from '../api/models';
import { useNotification } from '../hooks/useNotification';

interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const CreateAgentModal: React.FC<CreateAgentModalProps> = ({ isOpen, onClose, onCreated }) => {
  const { notifyApiError, notifyError } = useNotification();
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Data State
  const [providers, setProviders] = useState<Provider[]>([]);
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [fetchingData, setFetchingData] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState(`# ROLE DEFINITION
Act as a high-level quantitative researcher.
Prioritize source credibility and peer-reviewed data.

# OUTPUT FORMAT
Return all results in Markdown tables with clear citations.`);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      fetchProviders();
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const fetchProviders = async () => {
    try {
      setFetchingData(true);
      const res = await providersApi.findAll();
      setProviders(res.data);
      if (res.data.length > 0) {
        setSelectedProviderId(res.data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    } finally {
      setFetchingData(false);
    }
  };

  useEffect(() => {
    if (selectedProviderId) {
      fetchModels(selectedProviderId);
    } else {
      setAvailableModels([]);
    }
  }, [selectedProviderId]);

  const fetchModels = async (providerId: string) => {
    try {
      setFetchingData(true);
      const res = await providersApi.findModels(providerId);
      setAvailableModels(res.data);
      if (res.data.length > 0) {
        setSelectedModelId(res.data[0].id);
      } else {
        setSelectedModelId('');
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
    } finally {
      setFetchingData(false);
    }
  };

  const steps = [
    { id: 1, title: 'Essential Config', subtitle: 'ID, ROLE & MODEL' },
    { id: 2, title: 'Intelligence Tuning', subtitle: 'COGNITIVE MATRIX' },
    { id: 3, title: 'Instructions', subtitle: 'KNOWLEDGE BASE' },
  ];

  const handleDeploy = async () => {
    if (!name || !role || !selectedProviderId || !selectedModelId) {
      notifyError('Validation Error', 'Please fill in Name, Role, Provider and Model');
      return;
    }

    try {
      setLoading(true);
      await agentsApi.create({
        name,
        role,
        description,
        systemInstructions: instructions,
        providerId: selectedProviderId,
        modelId: selectedModelId,
        status: 'active',
      });

      // notifySuccess('Agent Deployed', `Successfully commissioned ${name} into the fleet.`);
      onCreated?.();
      onClose();
      // Reset form
      setName('');
      setRole('');
      setDescription('');
      setInstructions('');
      setSelectedProviderId('');
      setSelectedModelId('');
    } catch (error) {
      console.error('Failed to deploy agent:', error);
      notifyApiError(error, 'Deployment Failed');
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
          className="relative w-full max-w-5xl h-full max-h-[850px] bg-surface-container-low rounded-2xl shadow-2xl overflow-hidden flex flex-col ring-1 ring-outline-variant/10"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-low/50 backdrop-blur-md sticky top-0 z-10">
            <div>
              <h2 className="text-2xl font-black font-headline text-white tracking-tight">Create New Agent</h2>
              <p className="text-sm text-on-surface-variant/80 mt-1">Configure a specialized AI persona to handle specific nodes in your automation flows.</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-md text-sm font-bold text-on-surface-variant hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeploy}
                disabled={loading}
                className="px-8 py-2.5 rounded-md bg-primary text-on-primary text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
              >
                {loading ? 'Deploying...' : 'Deploy Agent'}
              </button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar / Stepper */}
            <div className="w-72 bg-surface-container-low/30 border-r border-outline-variant/5 p-8 flex flex-col gap-10">
              <div className="space-y-8">
                {steps.map((step) => (
                  <div key={step.id} className="flex gap-4 group cursor-pointer" onClick={() => setActiveStep(step.id)}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${activeStep === step.id
                      ? 'bg-secondary text-surface'
                      : 'bg-surface-container-highest text-on-surface-variant'
                      }`}>
                      {step.id.toString().padStart(2, '0')}
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold font-headline transition-colors ${activeStep === step.id ? 'text-white' : 'text-on-surface-variant'
                        }`}>
                        {step.title}
                      </h4>
                      <p className="text-[9px] font-bold tracking-widest text-on-surface-variant/50 mt-0.5">{step.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Suggestion Box */}
              <div className="mt-auto bg-tertiary/10 rounded-xl p-5 ring-1 ring-tertiary/20 backdrop-blur-sm relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-tertiary/10 rounded-full blur-2xl group-hover:bg-tertiary/20 transition-all duration-700" />
                <div className="flex items-center gap-2 mb-3 text-tertiary">
                  <Sparkles size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">AI Suggestion</span>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed italic">
                  "Try selecting <span className="text-tertiary font-bold">Researcher</span> role for high-depth data synthesis tasks."
                </p>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
              {/* Section 1: Basic Configuration */}
              <section className="space-y-8">
                <div className="flex items-center gap-3">
                  <div className="w-1 bg-secondary h-6 rounded-full" />
                  <h3 className="text-lg font-bold font-headline text-white">Basic Configuration</h3>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Agent Name</label>
                    <div className="bg-surface-container-highest/30 rounded-lg p-0.5 ring-1 ring-outline-variant/10 focus-within:ring-primary/40 transition-all">
                      <input
                        type="text"
                        placeholder="e.g. Researcher-X"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-transparent border-none text-sm text-on-surface h-10 px-3 focus:outline-none placeholder:text-on-surface-variant/30"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Primary Role</label>
                    <div className="bg-surface-container-highest/30 rounded-lg p-0.5 ring-1 ring-outline-variant/10 focus-within:ring-primary/40 transition-all text-on-surface">
                      <input
                        type="text"
                        placeholder="e.g. Researcher"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full bg-transparent border-none text-sm text-on-surface h-10 px-4 focus:outline-none placeholder:text-on-surface-variant/30"
                      />
                    </div>
                  </div>
                </div>

                <MarkdownField
                  label="Description"
                  value={description}
                  onChange={setDescription}
                  placeholder="Define what this agent aims to achieve... You can use markdown for formatting."
                  height="h-32"
                  maxLength={1000}
                />

                <div className="pt-4 space-y-8 border-t border-outline-variant/10">
                  {/* Provider Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Select Provider</label>
                      {fetchingData && <span className="text-[10px] text-primary animate-pulse font-bold uppercase tracking-widest">Updating...</span>}
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      {providers.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setSelectedProviderId(p.id)}
                          className={`p-4 rounded-xl flex flex-col items-center gap-3 transition-all ${selectedProviderId === p.id
                            ? 'bg-primary/10 ring-2 ring-primary shadow-[0_0_20px_rgba(173,198,255,0.15)]'
                            : 'bg-surface-container-highest/30 ring-1 ring-outline-variant/10 hover:bg-surface-container-highest/50'
                            }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${selectedProviderId === p.id ? 'bg-primary text-surface' : 'bg-surface-container-high text-on-surface-variant'
                            }`}>
                            <Box size={20} />
                          </div>
                          <div className="text-center">
                            <h4 className={`text-xs font-black uppercase tracking-wider ${selectedProviderId === p.id ? 'text-white' : 'text-on-surface-variant'}`}>
                              {p.name}
                            </h4>
                          </div>
                        </button>
                      ))}
                      {providers.length === 0 && !fetchingData && (
                        <div className="col-span-4 py-8 border-2 border-dashed border-outline-variant/10 rounded-xl flex flex-col items-center justify-center text-on-surface-variant/40 gap-2">
                          <Layers size={24} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">No providers registered</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Model Selection */}
                  <AnimatePresence mode="wait">
                    {selectedProviderId && (
                      <motion.div
                        key={selectedProviderId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4 pt-4 border-t border-outline-variant/5"
                      >
                        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Model Variant Selection</label>
                        <div className="bg-surface-container-highest/30 rounded-lg p-0.5 ring-1 ring-outline-variant/10 focus-within:ring-primary/40 transition-all relative">
                          <select
                            value={selectedModelId}
                            onChange={(e) => setSelectedModelId(e.target.value)}
                            className="w-full bg-transparent border-none text-sm text-on-surface h-10 px-3 focus:outline-none appearance-none cursor-pointer"
                          >
                            <option value="" disabled className="bg-surface-container-low text-on-surface">Select a model...</option>
                            {availableModels.map((model) => (
                              <option key={model.id} value={model.id} className="bg-surface-container-low text-on-surface">
                                {model.name}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/60">
                            <ChevronDown size={18} />
                          </div>
                        </div>
                        {availableModels.length === 0 && !fetchingData && (
                          <div className="py-6 text-center bg-error/5 rounded-xl border border-error/10">
                            <span className="text-[10px] font-bold text-error uppercase tracking-widest opacity-60">No model variants found for this provider</span>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </section>

              {/* Section 2: Intelligence Tuning */}
              <section className="space-y-10">
                <div className="flex items-center gap-3">
                  <div className="w-1 bg-primary h-6 rounded-full" />
                  <h3 className="text-lg font-bold font-headline text-white">Intelligence Tuning</h3>
                </div>

                <div className="space-y-8">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Personality Matrix</label>

                  {[
                    { label: 'Precision', min: '0.00', max: '1.00', value: 0.72, color: 'accent-secondary' },
                    { label: 'Lement', min: '0.00', max: '1.00', value: 0.45, color: 'accent-primary' },
                    { label: 'Casual', min: '0.00', max: '1.00', value: 0.90, color: 'accent-tertiary' }
                  ].map((slider, i) => (
                    <div key={i} className="space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-bold tracking-tighter uppercase">
                        <span className="text-on-surface-variant/50">{slider.label} ({slider.min})</span>
                        <span className="text-white font-mono text-xs">{slider.value.toFixed(2)}</span>
                        <span className="text-on-surface-variant/50">Creativity ({slider.max})</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        defaultValue={slider.value * 100}
                        className={`w-full h-1 bg-surface-container-highest rounded-full appearance-none cursor-pointer ${slider.color}`}
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* Section 3: Operational Directives */}
              <section className="space-y-8">
                <div className="flex items-center gap-3">
                  <div className="w-1 bg-tertiary h-6 rounded-full" />
                  <h3 className="text-lg font-bold font-headline text-white">Operational Directives</h3>
                </div>

                <MarkdownField
                  label="System Instructions"
                  value={instructions}
                  onChange={setInstructions}
                  height="h-64"
                  helperText="Prompt Engineering Active"
                  maxLength={1000}
                />

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Knowledge Integration</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border-2 border-dashed border-outline-variant/10 rounded-xl p-6 flex flex-col items-center justify-center gap-2 group cursor-pointer hover:border-primary/30 transition-all">
                      <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors">
                        <Code size={18} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Connect Repo</span>
                    </div>
                    <div className="border-2 border-dashed border-outline-variant/10 rounded-xl p-6 flex flex-col items-center justify-center gap-2 group cursor-pointer hover:border-primary/30 transition-all">
                      <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors">
                        <Shield size={18} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Access Policies</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CreateAgentModal;
