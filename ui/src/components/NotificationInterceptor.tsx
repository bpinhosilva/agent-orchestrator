import React, { useEffect } from 'react';
import { useNotification } from '../hooks/useNotification';
import { setupInterceptors } from '../api/client';

const NotificationInterceptor: React.FC = () => {
  const { notifyError } = useNotification();

  useEffect(() => {
    setupInterceptors(notifyError);
  }, [notifyError]);

  return null;
};

export default NotificationInterceptor;
