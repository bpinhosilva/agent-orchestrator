import {
  Activity,
  ChevronRight,
  Clock,
  Plus,
  RefreshCcw,
  Server,
  TrendingUp,
} from 'lucide-react';
import CreateModelModal from '../components/CreateModelModal';
import RegisterProviderModal from '../components/RegisterProviderModal';
import ProviderDetail from '../components/providers/ProviderDetail';
import ProviderList from '../components/providers/ProviderList';
import { useProvidersPage } from '../hooks/providers/useProvidersPage';
import { cn } from '../lib/cn';

const Providers = () => {
  const {
    providers,
    selectedProvider,
    selectedProviderId,
    setSelectedProviderId,
    models,
    isLoadingProviders,
    isFetchingProviders,
    isLoadingModels,
    isRegisterProviderModalOpen,
    setIsRegisterProviderModalOpen,
    isCreateModelModalOpen,
    setIsCreateModelModalOpen,
    refreshProviders,
  } = useProvidersPage();

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <nav className="flex items-center gap-2 mb-2 text-[10px] uppercase tracking-widest text-primary font-bold">
              <span className="opacity-60">Infrastructure</span>
              <ChevronRight size={12} className="opacity-40" />
              <span>Model Providers</span>
            </nav>
            <h1 className="text-4xl font-extrabold font-headline tracking-tighter text-white">
              Provider Core
            </h1>
            <p className="text-on-surface-variant text-sm mt-1">
              Manage global LLM integrations and endpoint health.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                void refreshProviders();
              }}
              disabled={isFetchingProviders}
              className="px-5 py-2.5 bg-surface-container-high text-on-surface rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-surface-container-highest transition-all ring-1 ring-outline-variant/10 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Refresh provider status"
            >
              <RefreshCcw size={14} className={cn(isFetchingProviders && 'animate-spin')} />
              {isFetchingProviders ? 'Refreshing...' : 'Refresh Status'}
            </button>
            <button
              type="button"
              onClick={() => setIsRegisterProviderModalOpen(true)}
              className="px-6 py-2.5 bg-primary text-on-primary rounded-lg text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
              aria-label="Open register provider modal"
            >
              <Plus size={16} />
              Register Provider
            </button>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-2 bg-surface-container-low p-7 rounded-2xl border border-outline-variant/5 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
            <Activity size={80} strokeWidth={1} />
          </div>
          <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-on-surface-variant/50 mb-6">
            Total Request Volume
          </h3>
          <div className="flex items-end gap-5">
            <span className="text-5xl font-headline font-black text-white tracking-tighter">2.4M</span>
            <span className="text-secondary text-xs font-bold mb-2 flex items-center gap-1 bg-secondary/10 px-2 py-0.5 rounded-full">
              <TrendingUp size={14} /> +12%
            </span>
          </div>
          <div className="mt-8 flex gap-1.5 h-12 items-end opacity-40">
            {[30, 50, 20, 70, 40, 90, 60, 45, 80, 55, 30, 40].map((height, index) => (
              <div
                key={index}
                className="w-full bg-secondary rounded-t-sm transition-all duration-1000"
                style={{ height: `${height}%`, opacity: (index + 1) / 12 }}
              />
            ))}
          </div>
        </div>

        <div className="bg-surface-container-low p-7 rounded-2xl border border-outline-variant/5 shadow-xl flex flex-col justify-between group hover:border-secondary/20 transition-all">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary mb-4 group-hover:scale-110 transition-transform">
            <Activity size={20} />
          </div>
          <div>
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-on-surface-variant/50">
              Global Uptime
            </h3>
            <div className="mt-2">
              <span className="text-3xl font-headline font-black text-secondary">99.98%</span>
              <p className="text-[9px] text-on-surface-variant/40 mt-1 uppercase font-bold tracking-widest">
                Aggregated Network Score
              </p>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-low p-7 rounded-2xl border border-outline-variant/5 shadow-xl flex flex-col justify-between group hover:border-tertiary/20 transition-all">
          <div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary mb-4 group-hover:scale-110 transition-transform">
            <Clock size={20} />
          </div>
          <div>
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-on-surface-variant/50">
              Avg. Latency
            </h3>
            <div className="mt-2">
              <span className="text-3xl font-headline font-black text-tertiary">342ms</span>
              <p className="text-[9px] text-on-surface-variant/40 mt-1 uppercase font-bold tracking-widest">
                P95 Response Time
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-5">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/40 flex items-center gap-3">
            <Server size={14} className="text-primary" /> Active Providers
          </h2>

          <ProviderList
            providers={providers}
            selectedProviderId={selectedProviderId}
            selectedProviderModelCount={selectedProviderId === selectedProvider?.id ? models.length : 0}
            isLoading={isLoadingProviders}
            onSelect={setSelectedProviderId}
          />
        </div>

        <div className="lg:col-span-8 space-y-8">
          <ProviderDetail
            provider={selectedProvider}
            models={models}
            isLoadingModels={isLoadingModels}
            isRefreshing={isFetchingProviders}
            onRefresh={() => {
              void refreshProviders();
            }}
            onOpenCreateModel={() => setIsCreateModelModalOpen(true)}
          />
        </div>
      </div>

      <RegisterProviderModal
        isOpen={isRegisterProviderModalOpen}
        onClose={() => setIsRegisterProviderModalOpen(false)}
        onCreated={(providerId) => {
          setSelectedProviderId(providerId);
          setIsRegisterProviderModalOpen(false);
        }}
      />

      <CreateModelModal
        isOpen={isCreateModelModalOpen}
        onClose={() => setIsCreateModelModalOpen(false)}
        onCreated={() => setIsCreateModelModalOpen(false)}
        providerId={selectedProvider?.id ?? ''}
        providerName={selectedProvider?.name ?? ''}
      />
    </div>
  );
};

export default Providers;
