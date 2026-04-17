import { Database, Server } from 'lucide-react';
import type { Provider } from '../../api/providers';
import { cn } from '../../lib/cn';

interface ProviderListProps {
  providers: Provider[];
  selectedProviderId: string | null;
  selectedProviderModelCount: number;
  isLoading: boolean;
  onSelect: (providerId: string) => void;
}

const ProviderList = ({
  providers,
  selectedProviderId,
  selectedProviderModelCount,
  isLoading,
  onSelect,
}: ProviderListProps) => {
  if (isLoading && providers.length === 0) {
    return (
      <div className="space-y-3" aria-live="polite">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-28 rounded-2xl border border-outline-variant/10 bg-surface-container-low animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="p-8 border-2 border-dashed border-outline-variant/10 rounded-2xl flex flex-col items-center justify-center text-center opacity-40">
        <Server size={24} className="mb-4" />
        <span className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">
          No providers registered yet.
          <br />
          Establish logical gateways in the infrastructure hub.
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {providers.map((provider) => {
        const isSelected = selectedProviderId === provider.id;
        const modelStatusText = isSelected
          ? `${selectedProviderModelCount} Models Active`
          : 'Select to inspect';

        return (
          <button
            key={provider.id}
            type="button"
            onClick={() => onSelect(provider.id)}
            className={cn(
              'w-full p-5 rounded-2xl border text-left transition-all duration-300 group',
              isSelected
                ? 'bg-surface-container-high border-secondary/20 shadow-lg shadow-secondary/5 ring-1 ring-secondary/10 text-white'
                : 'bg-surface-container-low border-transparent hover:bg-surface-container-high/50 text-on-surface-variant',
            )}
            aria-pressed={isSelected}
            aria-label={`Select provider ${provider.name}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center transition-colors',
                    isSelected ? 'text-primary' : 'text-on-surface-variant',
                  )}
                >
                  <Database size={20} />
                </div>
                <div>
                  <span
                    className={cn(
                      'font-bold text-sm block transition-colors',
                      isSelected ? 'text-white' : 'group-hover:text-white',
                    )}
                  >
                    {provider.name}
                  </span>
                  <span className="text-[9px] font-bold text-on-surface-variant/40 uppercase tracking-widest leading-none mt-1 block">
                    {modelStatusText}
                  </span>
                </div>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse shadow-[0_0_10px_rgba(78,222,163,0.5)]" />
            </div>
            <div className="flex justify-start">
              <span className="text-[9px] font-black uppercase tracking-widest text-secondary">
                Healthy
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ProviderList;
