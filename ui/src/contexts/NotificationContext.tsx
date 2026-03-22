import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

type NotificationType = 'success' | 'error' | 'info';

interface NotificationState {
  isOpen: boolean;
  type: NotificationType;
  title: string;
  message: string;
}

interface NotificationContextType {
  notifySuccess: (title: string, message: string) => void;
  notifyError: (title: string, message: string) => void;
  notifyInfo: (title: string, message: string) => void;
  closeNotification: () => void;
  state: NotificationState;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

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

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
