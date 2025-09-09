import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { notificationAPI } from '../services/api';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

// Notification reducer
const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload.notifications,
        pagination: action.payload.pagination,
        loading: false
      };
    case 'SET_UNREAD_COUNT':
      return {
        ...state,
        unreadCount: action.payload
      };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };
    case 'MARK_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification._id === action.payload
            ? { ...notification, isRead: true }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      };
    case 'MARK_ALL_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification => ({
          ...notification,
          isRead: true
        })),
        unreadCount: 0
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification._id !== action.payload
        )
      };
    case 'CLEAR_ALL':
      return {
        ...state,
        notifications: [],
        unreadCount: 0
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    default:
      return state;
  }
};

// Initial state
const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  pagination: null
};

// Notification provider component
export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { isAuthenticated } = useAuth();

  // Fetch notifications
  const fetchNotifications = useCallback(async (page = 1, limit = 20) => {
    if (!isAuthenticated) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await notificationAPI.getAll({ page, limit });
      
      dispatch({
        type: 'SET_NOTIFICATIONS',
        payload: {
          notifications: response.data.notifications,
          pagination: response.data.pagination
        }
      });
    } catch (error) {
      const errorMessage = error.message || 'Failed to load notifications';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [isAuthenticated]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await notificationAPI.getUnreadCount();
      dispatch({ type: 'SET_UNREAD_COUNT', payload: response.data.count });
    } catch (error) {
    }
  }, [isAuthenticated]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    if (!isAuthenticated) return;

    try {
      await notificationAPI.markAsRead(notificationId);
      dispatch({ type: 'MARK_AS_READ', payload: notificationId });
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  }, [isAuthenticated]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      await notificationAPI.markAllAsRead();
      dispatch({ type: 'MARK_ALL_AS_READ' });
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all notifications as read');
    }
  }, [isAuthenticated]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    if (!isAuthenticated) return;

    try {
      await notificationAPI.delete(notificationId);
      dispatch({ type: 'REMOVE_NOTIFICATION', payload: notificationId });
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  }, [isAuthenticated]);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      await notificationAPI.clearAll();
      dispatch({ type: 'CLEAR_ALL' });
      toast.success('All notifications cleared');
    } catch (error) {
      toast.error('Failed to clear notifications');
    }
  }, [isAuthenticated]);

  // Add notification (for real-time updates)
  const addNotification = useCallback((notification) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
    
    // Show toast for high priority notifications
    if (notification.priority === 'high') {
      toast.success(notification.title, {
        description: notification.message,
        duration: 5000
      });
    }
  }, []);

  // Retry fetching notifications
  const retryFetch = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  // Initialize notifications when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      fetchUnreadCount();
    } else {
      // Clear notifications when user logs out
      dispatch({ type: 'CLEAR_ALL' });
    }
  }, [isAuthenticated, fetchNotifications, fetchUnreadCount]);

  // Poll for new notifications every 30 seconds when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchUnreadCount]);

  const value = {
    ...state,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    addNotification,
    retryFetch
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}; 