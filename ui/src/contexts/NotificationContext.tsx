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

  const notifyInfo = useCallback((title: string, message: string) => {
    setState({ isOpen: true, type: 'info', title, message });
  }, []);

  const closeNotification = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifySuccess, notifyError, notifyInfo, closeNotification, state }}>
      {children}
    </NotificationContext.Provider>
  );
};

