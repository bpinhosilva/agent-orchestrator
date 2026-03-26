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

  const notifyApiError = useCallback((error: any, customTitle?: string) => {
    const errorData = error.response?.data;
    const message = errorData?.message || error.message || 'An unexpected error occurred';
    const title = customTitle || error.response?.statusText || 'Backend Error';
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

