import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: 'info',
      duration: 5000,
      ...notification,
    };

    setNotifications(prev => [...prev, newNotification]);

    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const success = useCallback((message, options = {}) => {
    return addNotification({
      type: 'success',
      message,
      ...options,
    });
  }, [addNotification]);

  const error = useCallback((message, options = {}) => {
    return addNotification({
      type: 'error',
      message,
      duration: 8000,
      ...options,
    });
  }, [addNotification]);

  const warning = useCallback((message, options = {}) => {
    return addNotification({
      type: 'warning',
      message,
      ...options,
    });
  }, [addNotification]);

  const info = useCallback((message, options = {}) => {
    return addNotification({
      type: 'info',
      message,
      ...options,
    });
  }, [addNotification]);

  const clear = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    warning,
    info,
    clear,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

const NotificationItem = ({ notification, onClose }) => {
  const { type, message, title } = notification;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-success-700" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-5 h-5 text-danger-700" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-warning-700" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-primary-700" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return 'bg-success-100 border-success-300 text-success-900';
      case 'error':
        return 'bg-danger-100 border-danger-300 text-danger-900';
      case 'warning':
        return 'bg-warning-100 border-warning-300 text-warning-900';
      default:
        return 'bg-primary-100 border-primary-300 text-primary-900';
    }
  };

  return (
    <div
      className={`
        w-96 shadow-lg rounded-lg border pointer-events-auto
        ${getColors()}
        transform transition-all duration-300 ease-in-out
        animate-in slide-in-from-right-full
      `}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 w-0 flex-1">
            {title && (
              <p className="text-sm font-medium">
                {title}
              </p>
            )}
            <p className={`text-sm ${title ? 'mt-1' : ''}`}>
              {message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="inline-flex text-gray-500 hover:text-gray-700 focus:outline-none"
              onClick={onClose}
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const useTrackerNotifications = () => {
  const notifications = useNotifications();

  return {
    started: () => notifications.success('⏱️ Timer started'),
    paused: () => notifications.info('⏸️ Timer paused'),
    resumed: () => notifications.success('▶️ Timer resumed'),
    reset: () => notifications.warning('🔄 Timer reset'),
    booked: (duration) => notifications.success(`✅ Time booked: ${duration}`),
    error: (message) => notifications.error(`❌ ${message}`),
  };
};

export default NotificationProvider;