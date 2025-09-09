import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { 
  RiNotification3Line, 
  RiNotification3Fill,
  RiCloseLine,
  RiCheckLine,
  RiDeleteBin6Line,
  RiMoreLine,
  RiArrowRightLine
} from 'react-icons/ri';
import '../styles/components/notification-bell.css';

const NotificationBell = () => {
  const { isAuthenticated } = useAuth();
  const { 
    unreadCount, 
    notifications, 
    loading,
    error,
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAllNotifications,
    retryFetch
  } = useNotifications();
  
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown when navigating
  useEffect(() => {
    setShowDropdown(false);
  }, [window.location.pathname]);

  // Close dropdown on window resize (mobile check)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setShowDropdown(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleBellClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // On mobile, navigate to notifications page instead of dropdown
    if (window.innerWidth <= 768) {
      navigate('/notifications');
      return;
    }
    
    setShowDropdown(!showDropdown);
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    // Navigate to action URL if available
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }

    setShowDropdown(false);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleClearAll = async () => {
    await clearAllNotifications();
  };

  const handleDeleteNotification = async (e, notificationId) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'pothole_status':
        return '🛣️';
      case 'feedback_response':
        return '💬';
      case 'bug_response':
        return '🐛';
      case 'system_announcement':
        return '📢';
      case 'area_update':
        return '📍';
      default:
        return '📌';
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return 'priority-medium';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - notificationTime) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  if (!isAuthenticated) {
    return (
      <button 
        className="navbar-link notification-bell guest"
        onClick={handleBellClick}
        aria-label="Login to view notifications"
      >
        <RiNotification3Line className="nav-icon" />
        <span className="notification-text">Notifications</span>
      </button>
    );
  }

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button 
        className={`navbar-link notification-bell ${unreadCount > 0 ? 'has-notifications' : ''}`}
        onClick={handleBellClick}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        {unreadCount > 0 ? (
          <RiNotification3Fill className="nav-icon" />
        ) : (
          <RiNotification3Line className="nav-icon" />
        )}
        <span className="notification-text">Notifications</span>
        
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>
              <RiNotification3Line className="header-icon" />
              Notifications
            </h3>
            <div className="notification-actions">
              {unreadCount > 0 && (
                <button 
                  className="action-btn"
                  onClick={handleMarkAllRead}
                  title="Mark all as read"
                >
                  <RiCheckLine />
                </button>
              )}
              {notifications.length > 0 && (
                <button 
                  className="action-btn"
                  onClick={handleClearAll}
                  title="Clear all"
                >
                  <RiDeleteBin6Line />
                </button>
              )}
              <button 
                className="action-btn"
                onClick={() => setShowDropdown(false)}
                title="Close"
              >
                <RiCloseLine />
              </button>
            </div>
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">
                <div className="loading-spinner"></div>
                <p>Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="notification-error">
                <RiNotification3Line className="error-icon" />
                <p>Failed to load notifications</p>
                <span>{error}</span>
                <button 
                  className="retry-btn"
                  onClick={retryFetch}
                >
                  Retry
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <RiNotification3Line className="empty-icon" />
                <p>No notifications yet</p>
                <span>We'll notify you when there are updates</span>
              </div>
            ) : (
              notifications.slice(0, 5).map((notification) => (
                <div 
                  key={notification._id}
                  className={`notification-item ${!notification.isRead ? 'unread' : ''} ${getPriorityClass(notification.priority)}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="notification-content">
                    <div className="notification-title">
                      {notification.title}
                      {!notification.isRead && (
                        <span className="unread-indicator"></span>
                      )}
                    </div>
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    <div className="notification-time">
                      {formatTimeAgo(notification.createdAt)}
                    </div>
                  </div>

                  <button
                    className="delete-notification-btn"
                    onClick={(e) => handleDeleteNotification(e, notification._id)}
                    title="Delete notification"
                  >
                    <RiDeleteBin6Line />
                  </button>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-footer">
              <button 
                className="view-all-btn"
                onClick={() => {
                  navigate('/notifications');
                  setShowDropdown(false);
                }}
              >
                <span>View All Notifications</span>
                <RiArrowRightLine className="arrow-icon" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell; 