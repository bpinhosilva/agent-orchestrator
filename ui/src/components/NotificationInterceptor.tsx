import React, { useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { setupInterceptors } from '../api/client';

const NotificationInterceptor: React.FC = () => {
  const { notifyError } = useNotification();

  useEffect(() => {
    setupInterceptors(notifyError);
  }, [notifyError]);

  return null;
};

export default NotificationInterceptor;
