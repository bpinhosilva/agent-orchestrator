import axios from 'axios';

const client = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setupInterceptors = (notifyError: (title: string, message: string) => void) => {
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
      const title = error.response?.statusText || 'Backend Error';
      notifyError(title, message);
      return Promise.reject(error);
    }
  );
};

export default client;
