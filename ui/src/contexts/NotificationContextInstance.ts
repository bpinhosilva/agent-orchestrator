import { createContext } from 'react';

export type NotificationType = 'success' | 'error' | 'info';

export interface NotificationState {
  isOpen: boolean;
  type: NotificationType;
  title: string;
  message: string;
}

export interface NotificationContextType {
  notifySuccess: (title: string, message: string) => void;
  notifyError: (title: string, message: string) => void;
  notifyApiError: (error: unknown, customTitle?: string) => void;
  notifyInfo: (title: string, message: string) => void;
  closeNotification: () => void;
  state: NotificationState;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
