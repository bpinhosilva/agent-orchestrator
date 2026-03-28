import axios from 'axios';

const client = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const setupInterceptors = (notifyError: (title: string, message: string) => void) => {
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      let message = error.response?.data?.message || error.message || 'An unexpected error occurred';
      if (Array.isArray(message)) {
        message = message.join('. ');
      }
      
      const title = error.response?.data?.error || error.response?.statusText || 'Backend Error';
      const status = error.response?.status;

      // Do not notify for 401s as they are handled by the auth workflow
      if (status !== 401) {
        notifyError(title, message);
      }
      
      return Promise.reject(error);
    }
  );
};

export default client;
