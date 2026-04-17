import { useEffect, useRef, useState } from 'react';
import {
  Clock,
  Monitor,
  MoreVertical,
  Plus,
  RefreshCcw,
  Trash2,
} from 'lucide-react';
import type { Model } from '../../api/models';
import type { Provider } from '../../api/providers';
import { cn } from '../../lib/cn';

interface ProviderDetailProps {
  provider: Provider | null;
  models: Model[];
  isLoadingModels: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onOpenCreateModel: () => void;
  onDeleteModel: (model: Model) => void;
}


const ModelActionMenu = ({
  model,
  onDelete,
}: {
  model: Model;
  onDelete: (model: Model) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handler);
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Actions for model ${model.name}`}
        title={`Actions for model ${model.name}`}
        className="text-on-surface-variant/40 hover:text-white transition-colors p-1 rounded"
      >
        <MoreVertical size={14} />
      </button>
      {open && (
        <div className="absolute right-0 bottom-full mb-1 z-50 w-36 bg-surface-container-high rounded-xl shadow-2xl ring-1 ring-outline-variant/10 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete(model);
            }}
            className="w-full px-4 py-3 text-left text-xs font-bold text-error hover:bg-error/10 transition-colors flex items-center gap-2"
            aria-label={`Remove model ${model.name}`}
          >
            <Trash2 size={12} />
            Remove
          </button>
        </div>
      )}
    </div>
  );
};

const ProviderDetail = ({
  provider,
  models,
  isLoadingModels,
  isRefreshing,
  onRefresh,
  onOpenCreateModel,
  onDeleteModel,
}: ProviderDetailProps) => {
  if (!provider) {
    return (
      <div className="h-[600px] bg-surface-container-low/50 rounded-3xl border border-dashed border-outline-variant/10 flex flex-col items-center justify-center text-on-surface-variant gap-4 opacity-40">
        <div className="w-20 h-20 rounded-2xl bg-surface-container flex items-center justify-center shadow-inner">
          <Monitor size={40} className="text-primary/50" />
        </div>
        <div className="text-center">
          <h3 className="text-sm font-headline font-black text-white uppercase tracking-widest mb-1">
            Infrastructure Hub
          </h3>
          <p className="text-[10px] font-medium opacity-60">
            Select a provider on the left to view active node details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-low rounded-3xl overflow-hidden ring-1 ring-outline-variant/10 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
      <div className="p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start justify-between gap-8 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-surface rounded-2xl flex items-center justify-center ring-1 ring-primary/20 shadow-inner group transition-all duration-500 hover:ring-primary/40">
              <Monitor size={40} className="text-primary group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-headline font-black text-white tracking-tight">
                  {provider.name}
                </h2>
                <div className="flex gap-2">
                  <span className="px-2.5 py-0.5 bg-secondary/10 text-secondary text-[9px] font-black uppercase tracking-widest rounded ring-1 ring-secondary/20 font-headline">
                    Primary
                  </span>
                </div>
              </div>
              <p className="text-on-surface-variant/60 text-sm mt-2">
                {provider.description || 'Infrastructure gateway for agentic cognition & reasoning.'}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-label={`Refresh ${provider.name} data`}
              title={`Refresh ${provider.name} data`}
              className="p-2.5 rounded-xl bg-surface-container-high text-on-surface-variant hover:text-white hover:bg-surface-container-highest transition-all ring-1 ring-outline-variant/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCcw size={18} className={cn(isRefreshing && 'animate-spin')} />
            </button>
            <button
              type="button"
              disabled
              aria-label="More provider actions unavailable"
              title="More provider actions unavailable"
              className="p-2.5 rounded-xl bg-surface-container-high text-on-surface-variant/40 transition-all ring-1 ring-outline-variant/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MoreVertical size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-10 border-t border-outline-variant/5">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <h3 className="font-headline font-black text-lg text-white">Registered Models</h3>
            <span className="px-2 py-0.5 rounded bg-surface-container-high text-[10px] font-bold text-on-surface-variant">
              {models.length} Models
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenCreateModel}
            disabled={!provider.id}
            className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Register models for ${provider.name}`}
          >
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus size={12} />
            </div>
            Register New Model
          </button>
        </div>

        <div className="rounded-2xl border border-outline-variant/5 overflow-visible">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-container-high/30 text-on-surface-variant/40 font-black uppercase tracking-[0.2em]">
                <th className="py-5 px-6">Model ID</th>
                <th className="py-5 px-6 text-right">Status</th>
                <th className="py-5 px-6 w-12 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {isLoadingModels ? (
                <tr>
                  <td colSpan={3} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4 opacity-40">
                      <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <p className="text-[10px] uppercase font-black tracking-widest text-primary animate-pulse">
                        Hydrating Model Registry...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : models.length > 0 ? (
                models.map((model) => (
                  <tr key={model.id} className="group hover:bg-primary/5 transition-all">
                    <td className="py-5 px-6 font-mono text-on-surface font-medium">{model.name}</td>
                    <td className="py-5 px-6 text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded font-black text-[8px] uppercase tracking-widest bg-secondary/10 text-secondary">
                        Active
                      </span>
                    </td>
                    <td className="py-5 px-6 text-center">
                      <ModelActionMenu model={model} onDelete={onDeleteModel} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-on-surface-variant/20 italic font-medium">
                    No models registered for this provider gate.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="ui-helper-text p-8 border-t border-outline-variant/5 bg-surface-container-lowest/20 flex items-center gap-3">
        <Clock size={14} className="text-tertiary" />
        Model registry updates propagate automatically after provider and model changes.
      </div>
    </div>
  );
};

export default ProviderDetail;
