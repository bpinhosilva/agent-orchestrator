import React, { useState, useCallback } from 'react';
import type { ReactNode } from 'react';

import { NotificationContext } from './NotificationContextInstance';
import type { NotificationState } from './NotificationContextInstance';

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<NotificationState>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });

  const notifySuccess = useCallback((title: string, message: string) => {
    setState({ isOpen: true, type: 'success', title, message });
  }, []);

  const notifyError = useCallback((title: string, message: string) => {
    setState({ isOpen: true, type: 'error', title, message });
  }, []);

  const notifyApiError = useCallback((error: unknown, customTitle?: string) => {
    const err = error as { response?: { data?: { message?: string; errors?: string[] }, statusText?: string }, message?: string };
    const errorData = err.response?.data;
    const errors = errorData?.errors;
    const message = errors?.length
      ? errors.join('\n')
      : errorData?.message || err.message || 'An unexpected error occurred';
    const title = customTitle || err.response?.statusText || 'Backend Error';
    setState({ isOpen: true, type: 'error', title, message });
  }, []);

  const notifyInfo = useCallback((title: string, message: string) => {
    setState({ isOpen: true, type: 'info', title, message });
  }, []);

  const closeNotification = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifySuccess, notifyError, notifyApiError, notifyInfo, closeNotification, state }}>
      {children}
    </NotificationContext.Provider>
  );
};

