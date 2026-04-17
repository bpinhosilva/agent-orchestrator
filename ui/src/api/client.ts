import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuthRefresh?: boolean;
  }

  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
    skipAuthRefresh?: boolean;
  }
}

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  skipAuthRefresh?: boolean;
};

let unauthorizedHandler: (() => void) | null = null;
let interceptorId: number | null = null;
let refreshPromise: Promise<void> | null = null;

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

const shouldSkipRefresh = (config?: RetryableRequestConfig) =>
  config?.skipAuthRefresh === true ||
  config?.url === '/auth/refresh' ||
  config?.url === '/auth/login';

const refreshSession = async () => {
  await client.post('/auth/refresh', undefined, {
    skipAuthRefresh: true,
  });
};

export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  unauthorizedHandler = handler;
};

export const setupInterceptors = (
  notifyError: (title: string, message: string) => void,
) => {
  if (interceptorId !== null) {
    client.interceptors.response.eject(interceptorId);
  }

  interceptorId = client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<{ error?: string; message?: string | string[] }>) => {
      const config = error.config as RetryableRequestConfig | undefined;
      const status = error.response?.status;

      if (status === 401 && config && !config._retry && !shouldSkipRefresh(config)) {
        config._retry = true;

        try {
          refreshPromise ??= refreshSession().finally(() => {
            refreshPromise = null;
          });

          await refreshPromise;
          return client(config);
        } catch (refreshError) {
          unauthorizedHandler?.();
          return Promise.reject(refreshError);
        }
      }

      if (status === 401) {
        unauthorizedHandler?.();
        return Promise.reject(error);
      }

      let message =
        error.response?.data?.message ||
        error.message ||
        'An unexpected error occurred';
      if (Array.isArray(message)) {
        message = message.join('. ');
      }

      const title =
        error.response?.data?.error ||
        error.response?.statusText ||
        'Backend Error';

      notifyError(title, message);
      return Promise.reject(error);
    },
  );
};

export default client;
