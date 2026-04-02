import { useCallback, useMemo, useState } from 'react';
import type { Provider } from '../../api/providers';
import { useProviderModelsQuery, useProvidersQuery } from './useProviderQueries';

export const useProvidersPage = () => {
  const [isRegisterProviderModalOpen, setIsRegisterProviderModalOpen] = useState(false);
  const [isCreateModelModalOpen, setIsCreateModelModalOpen] = useState(false);
  const [requestedProviderId, setRequestedProviderId] = useState<string | null>(null);

  const {
    data: providers = [],
    isPending: isLoadingProviders,
    isFetching: isFetchingProviders,
    refetch: refetchProviders,
  } = useProvidersQuery();
  const selectedProviderId =
    providers.find((provider) => provider.id === requestedProviderId)?.id ??
    providers[0]?.id ??
    null;
  const modelsQuery = useProviderModelsQuery(selectedProviderId);

  const selectedProvider = useMemo<Provider | null>(
    () => providers.find((provider) => provider.id === selectedProviderId) ?? null,
    [providers, selectedProviderId],
  );

  const refreshProviders = useCallback(async () => {
    await Promise.all([
      refetchProviders(),
      selectedProviderId ? modelsQuery.refetch() : Promise.resolve(undefined),
    ]);
  }, [modelsQuery, refetchProviders, selectedProviderId]);

  return {
    providers,
    selectedProvider,
    selectedProviderId,
    setSelectedProviderId: setRequestedProviderId,
    models: modelsQuery.data ?? [],
    isLoadingProviders,
    isFetchingProviders,
    isLoadingModels: modelsQuery.isPending || modelsQuery.isFetching,
    isRegisterProviderModalOpen,
    setIsRegisterProviderModalOpen,
    isCreateModelModalOpen,
    setIsCreateModelModalOpen,
    refreshProviders,
  };
};
