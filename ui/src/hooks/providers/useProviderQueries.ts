import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { modelsApi } from '../../api/models';
import { providersApi, type Provider } from '../../api/providers';
import { useNotification } from '../useNotification';

export const providerQueryKeys = {
  all: ['providers'] as const,
  models: (providerId: string) => ['providers', providerId, 'models'] as const,
};

interface RegisterProviderInput {
  providerName: string;
  models: string[];
}

interface CreateModelsInput {
  providerId: string;
  models: string[];
}

export const useProvidersQuery = () =>
  useQuery({
    queryKey: providerQueryKeys.all,
    queryFn: async () => {
      const response = await providersApi.findAll();
      return response.data;
    },
  });

export const useProviderModelsQuery = (providerId: string | null) =>
  useQuery({
    queryKey: providerId
      ? providerQueryKeys.models(providerId)
      : ['providers', 'unselected', 'models'],
    queryFn: async () => {
      if (!providerId) {
        return [];
      }

      const response = await providersApi.findModels(providerId);
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: Boolean(providerId),
  });

export const useRegisterProviderMutation = (
  options?: {
    onSuccess?: (provider: Provider) => void;
  },
) => {
  const queryClient = useQueryClient();
  const { notifyApiError } = useNotification();

  return useMutation({
    mutationFn: async ({ providerName, models }: RegisterProviderInput) => {
      const providerResponse = await providersApi.create({ name: providerName.trim() });
      const provider = providerResponse.data;
      const activeModels = models
        .map((model) => model.trim())
        .filter(Boolean);

      if (activeModels.length > 0) {
        await Promise.all(
          activeModels.map((name) => modelsApi.create({ name, providerId: provider.id })),
        );
      }

      return provider;
    },
    onSuccess: async (provider) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: providerQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: providerQueryKeys.models(provider.id) }),
      ]);
      options?.onSuccess?.(provider);
    },
    onError: (error) => {
      notifyApiError(error, 'Registration Failed');
    },
  });
};

export const useCreateModelsMutation = (
  options?: {
    onSuccess?: () => void;
  },
) => {
  const queryClient = useQueryClient();
  const { notifyApiError } = useNotification();

  return useMutation({
    mutationFn: async ({ providerId, models }: CreateModelsInput) => {
      const activeModels = models
        .map((model) => model.trim())
        .filter(Boolean);

      await Promise.all(
        activeModels.map((name) => modelsApi.create({ name, providerId })),
      );
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: providerQueryKeys.models(variables.providerId),
      });
      options?.onSuccess?.();
    },
    onError: (error) => {
      notifyApiError(error, 'Registration Failed');
    },
  });
};

export const useDeleteModelMutation = (providerId: string) => {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyApiError } = useNotification();

  return useMutation({
    mutationFn: (modelId: string) => modelsApi.delete(modelId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: providerQueryKeys.models(providerId),
      });
      notifySuccess('Model Removed', 'The model has been successfully deleted from the registry.');
    },
    onError: (error) => {
      notifyApiError(error, 'Cannot Delete Model');
    },
  });
};

