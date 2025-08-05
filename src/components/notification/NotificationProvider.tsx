'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { notification } from 'antd';
import { NotificationInstance } from 'antd/es/notification/interface';

interface NotificationContextType {
  api: NotificationInstance;
  contextHolder: React.ReactElement;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [api, contextHolder] = notification.useNotification({
    placement: 'bottomRight',
  });

  return (
    <NotificationContext.Provider value={{ api, contextHolder }}>
      {contextHolder}
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context.api;
};
