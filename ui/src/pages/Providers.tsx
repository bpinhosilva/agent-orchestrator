import {
  ChevronRight,
  Plus,
  RefreshCcw,
  Server,
} from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
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
    modelPendingDelete,
    setModelPendingDelete,
    deleteModel,
    isDeletingModel,
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
            onDeleteModel={setModelPendingDelete}
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

      <ConfirmDialog
        isOpen={modelPendingDelete !== null}
        onClose={() => setModelPendingDelete(null)}
        onConfirm={() => {
          if (modelPendingDelete) {
            deleteModel(modelPendingDelete.id, {
              onSettled: () => setModelPendingDelete(null),
            });
          }
        }}
        title="Remove Model"
        message={`Are you sure you want to remove "${modelPendingDelete?.name ?? ''}"? This action cannot be undone.`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
        loading={isDeletingModel}
      />
    </div>
  );
};

export default Providers;
