import React from 'react';
import { X, Edit2, ChevronDown } from 'lucide-react';

interface AgentConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  agent: any;
}

const AgentConfigDrawer: React.FC<AgentConfigDrawerProps> = ({ isOpen, onClose, agent }) => {
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
                  defaultValue={agent?.name || 'Logic Specialist'}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-tight text-on-surface-variant/60">Expertise</label>
                <input 
                  className="w-full bg-surface-container-lowest border-none rounded-md text-sm text-on-surface focus:ring-1 focus:ring-primary h-9 px-3" 
                  type="text" 
                  defaultValue={agent?.expertise || 'Logic Specialist'}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Model Selection */}
        <section className="space-y-3">
          <label className="text-[10px] font-bold uppercase tracking-tight text-on-surface-variant/60">Model Engine</label>
          <div className="relative">
            <select className="w-full bg-surface-container-lowest border-none rounded-md text-sm text-on-surface focus:ring-1 focus:ring-primary h-11 appearance-none px-4">
              <option>GPT-4o (Omni Reasoning)</option>
              <option>Claude 3.5 Sonnet</option>
              <option>Gemini 1.5 Pro</option>
              <option>Llama 3 (70B)</option>
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
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-tight text-on-surface-variant/60">System Instructions</label>
            <button className="text-[10px] text-primary hover:underline">Insert Template</button>
          </div>
          <textarea 
            className="w-full bg-surface-container-lowest border-none rounded-md text-xs text-on-surface focus:ring-1 focus:ring-primary h-40 font-mono leading-relaxed resize-none p-4" 
            spellCheck="false"
            defaultValue={`You are the Logic Specialist for the Orchestrator Network. 

Your core objective is to analyze technical inputs with 100% precision. 
1. Use chain-of-thought reasoning for all complex queries.
2. Flag any logical inconsistencies in user prompts.`}
          />
        </section>
      </div>

      <div className="p-6 bg-surface-container-high border-t border-outline-variant/10 flex gap-3">
        <button className="flex-1 bg-primary text-on-primary py-2.5 rounded font-bold text-sm shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all">
          Save Changes
        </button>
        <button onClick={onClose} className="px-4 py-2.5 rounded border border-outline-variant text-on-surface-variant hover:text-white transition-all">
          Reset
        </button>
      </div>
    </div>
  );
};

export default AgentConfigDrawer;
