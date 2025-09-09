import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import ResponsiveContainer from '../components/ResponsiveContainer';
import LoadingSpinner from '../components/LoadingSpinner';
import AccessibleButton from '../components/AccessibleButton';
import { 
  RiNotification3Line, 
  RiNotification3Fill,
  RiCheckLine, 
  RiDeleteBin6Line, 
  RiFilterLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiCloseLine,
  RiSearchLine,
  RiRefreshLine,
  RiSettings3Line,
  RiEyeLine,
  RiEyeOffLine,
  RiInboxArchiveLine,
  RiStarLine,
  RiTimeLine
} from 'react-icons/ri';
import '../styles/pages/notifications.css';

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    notifications, 
    loading, 
    error,
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAllNotifications,
    fetchNotifications,
    retryFetch
  } = useNotifications();

  const [filters, setFilters] = useState({
    type: '',
    read: '',
    priority: '',
    search: ''
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 20,
    totalPages: 1
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'compact'

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
    } catch (error) {
      // console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      // console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      // console.error('Error deleting notification:', error);
    }
  };

  const handleClearAll = async () => {
    setConfirmAction({
      type: 'clearAll',
      message: 'Are you sure you want to clear all notifications? This action cannot be undone.'
    });
    setShowConfirmModal(true);
  };

  const handleBulkAction = async (action) => {
    if (selectedNotifications.length === 0) return;

    if (action === 'delete') {
      setConfirmAction({
        type: 'bulkDelete',
        message: `Are you sure you want to delete ${selectedNotifications.length} selected notifications?`
      });
      setShowConfirmModal(true);
    } else if (action === 'markRead') {
      for (const notificationId of selectedNotifications) {
        await handleMarkAsRead(notificationId);
      }
      setSelectedNotifications([]);
    }
  };

  const handleConfirmAction = async () => {
    if (confirmAction?.type === 'clearAll') {
      try {
        await clearAllNotifications();
      } catch (error) {
        // console.error('Error clearing all notifications:', error);
      }
    } else if (confirmAction?.type === 'delete') {
      await handleDeleteNotification(confirmAction.id);
    } else if (confirmAction?.type === 'bulkDelete') {
      for (const notificationId of selectedNotifications) {
        await handleDeleteNotification(notificationId);
      }
      setSelectedNotifications([]);
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  const handleSelectNotification = (notificationId) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId) 
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n._id));
    }
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

  const getTypeLabel = (type) => {
    switch (type) {
      case 'pothole_status':
        return 'Pothole Status';
      case 'feedback_response':
        return 'Feedback Response';
      case 'bug_response':
        return 'Bug Report';
      case 'system_announcement':
        return 'System Announcement';
      case 'area_update':
        return 'Area Update';
      default:
        return type;
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  // Filter notifications based on current filters
  const filteredNotifications = notifications.filter(notification => {
    if (filters.type && notification.type !== filters.type) return false;
    if (filters.read === 'read' && !notification.isRead) return false;
    if (filters.read === 'unread' && notification.isRead) return false;
    if (filters.priority && notification.priority !== filters.priority) return false;
    if (filters.search && !notification.title.toLowerCase().includes(filters.search.toLowerCase()) && 
        !notification.message.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  // Calculate pagination
  const totalItems = filteredNotifications.length;
  const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);
  const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
  const endIndex = startIndex + pagination.itemsPerPage;
  const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!user) {
    return (
      <ResponsiveContainer>
        <div className="notifications-access-denied">
          <div className="access-denied-content">
            <RiNotification3Line className="access-denied-icon" />
            <h1>Access Denied</h1>
            <p>Please log in to view your notifications.</p>
            <AccessibleButton
              onClick={() => window.location.href = '/login'}
              className="btn btn-primary"
            >
              Login to Continue
            </AccessibleButton>
          </div>
        </div>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer>
      <div className="notifications-page">
        <div className="notifications-header">
          <div className="header-content">
            <div className="header-main">
              <h1 className="notifications-title">
                <RiNotification3Line className="notifications-icon" />
                Notifications
              </h1>
              <div className="header-stats">
                <div className="stat-item">
                  <span className="stat-number">{notifications.length}</span>
                  <span className="stat-label">Total</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{unreadCount}</span>
                  <span className="stat-label">Unread</span>
                </div>
              </div>
            </div>
            <div className="header-actions">
              <AccessibleButton
                onClick={() => fetchNotifications()}
                className="action-btn refresh-btn"
                title="Refresh notifications"
              >
                <RiRefreshLine />
              </AccessibleButton>
              <AccessibleButton
                onClick={() => setShowFilters(!showFilters)}
                className={`action-btn filter-btn ${showFilters ? 'active' : ''}`}
                title="Toggle filters"
              >
                <RiFilterLine />
              </AccessibleButton>
              <AccessibleButton
                onClick={() => setViewMode(viewMode === 'list' ? 'compact' : 'list')}
                className="action-btn view-btn"
                title={`Switch to ${viewMode === 'list' ? 'compact' : 'list'} view`}
              >
                <RiTimeLine />
              </AccessibleButton>
            </div>
          </div>
          <p className="notifications-subtitle">
            {unreadCount > 0 
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up! 🎉'
            }
          </p>
        </div>

        {/* Filters and Actions */}
        <div className={`notifications-controls ${showFilters ? 'expanded' : ''}`}>
          <div className="filters-section">
            <div className="search-group">
              <div className="search-input-wrapper">
                <RiSearchLine className="search-icon" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="search-input"
                />
              </div>
            </div>
            
            {showFilters && (
              <div className="filter-groups">
                <div className="filter-group">
                  <label>Type:</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                    className="filter-select"
                  >
                    <option value="">All Types</option>
                    <option value="pothole_status">Pothole Status</option>
                    <option value="feedback_response">Feedback Response</option>
                    <option value="bug_response">Bug Report</option>
                    <option value="system_announcement">System Announcement</option>
                    <option value="area_update">Area Update</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Status:</label>
                  <select
                    value={filters.read}
                    onChange={(e) => setFilters(prev => ({ ...prev, read: e.target.value }))}
                    className="filter-select"
                  >
                    <option value="">All</option>
                    <option value="unread">Unread</option>
                    <option value="read">Read</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Priority:</label>
                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                    className="filter-select"
                  >
                    <option value="">All Priorities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="actions-section">
            {selectedNotifications.length > 0 && (
              <div className="bulk-actions">
                <span className="selected-count">
                  {selectedNotifications.length} selected
                </span>
                <AccessibleButton
                  onClick={() => handleBulkAction('markRead')}
                  className="bulk-action-btn"
                  title="Mark selected as read"
                >
                  <RiCheckLine />
                </AccessibleButton>
                <AccessibleButton
                  onClick={() => handleBulkAction('delete')}
                  className="bulk-action-btn delete"
                  title="Delete selected"
                >
                  <RiDeleteBin6Line />
                </AccessibleButton>
              </div>
            )}
            
            {unreadCount > 0 && (
              <AccessibleButton
                onClick={handleMarkAllAsRead}
                className="action-btn mark-all-read"
              >
                <RiCheckLine />
                Mark All Read
              </AccessibleButton>
            )}
            {notifications.length > 0 && (
              <AccessibleButton
                onClick={handleClearAll}
                className="action-btn clear-all"
              >
                <RiInboxArchiveLine />
                Clear All
              </AccessibleButton>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="notifications-content">
          {loading ? (
            <div className="loading-state">
              <LoadingSpinner size="lg" />
              <p>Loading your notifications...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <RiNotification3Line className="error-icon" />
              <h3>Failed to load notifications</h3>
              <p>{error}</p>
              <AccessibleButton
                onClick={retryFetch}
                className="btn btn-primary"
              >
                <RiRefreshLine />
                Try Again
              </AccessibleButton>
            </div>
          ) : notifications.length === 0 ? (
            <div className="empty-state">
              <RiNotification3Line className="empty-icon" />
              <h3>No notifications yet</h3>
              <p>We'll notify you when there are updates about your reports or system announcements.</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="empty-state">
              <RiFilterLine className="empty-icon" />
              <h3>No notifications match your filters</h3>
              <p>Try adjusting your filters to see more notifications.</p>
              <AccessibleButton
                onClick={() => setFilters({ type: '', read: '', priority: '', search: '' })}
                className="btn btn-secondary"
              >
                Clear Filters
              </AccessibleButton>
            </div>
          ) : (
            <>
              {/* Select All Option */}
              {filteredNotifications.length > 0 && (
                <div className="select-all-bar">
                  <label className="select-all-label">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.length === filteredNotifications.length}
                      onChange={handleSelectAll}
                      className="select-all-checkbox"
                    />
                    Select All ({filteredNotifications.length})
                  </label>
                </div>
              )}

              <div className={`notifications-list ${viewMode}`}>
                {paginatedNotifications.map((notification) => (
                  <div 
                    key={notification._id}
                    className={`notification-item ${!notification.isRead ? 'unread' : ''} ${getPriorityClass(notification.priority)} ${selectedNotifications.includes(notification._id) ? 'selected' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="notification-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(notification._id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectNotification(notification._id);
                        }}
                      />
                    </div>
                    
                    <div className="notification-icon">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="notification-content">
                      <div className="notification-header">
                        <div className="notification-title">
                          {notification.title}
                          {!notification.isRead && (
                            <span className="unread-indicator" title="Unread"></span>
                          )}
                        </div>
                        <div className="notification-meta">
                          <span className="notification-type">
                            {getTypeLabel(notification.type)}
                          </span>
                          <span className="notification-time">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="notification-message">
                        {notification.message}
                      </div>
                      
                      <div className="notification-footer">
                        <span className="notification-date">
                          {formatDate(notification.createdAt)}
                        </span>
                        <div className="notification-actions">
                          {!notification.isRead && (
                            <AccessibleButton
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification._id);
                              }}
                              className="action-btn mark-read"
                              title="Mark as read"
                            >
                              <RiEyeLine />
                            </AccessibleButton>
                          )}
                          <AccessibleButton
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmAction({
                                type: 'delete',
                                id: notification._id,
                                message: 'Are you sure you want to delete this notification?'
                              });
                              setShowConfirmModal(true);
                            }}
                            className="action-btn delete"
                            title="Delete notification"
                          >
                            <RiDeleteBin6Line />
                          </AccessibleButton>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <div className="pagination-info">
                    Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} notifications
                  </div>
                  <div className="pagination-controls">
                    <AccessibleButton
                      onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                      disabled={pagination.currentPage === 1}
                      className="pagination-btn"
                      title="Previous page"
                    >
                      <RiArrowLeftLine />
                    </AccessibleButton>
                    <span className="pagination-current">
                      {pagination.currentPage} of {totalPages}
                    </span>
                    <AccessibleButton
                      onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                      disabled={pagination.currentPage === totalPages}
                      className="pagination-btn"
                      title="Next page"
                    >
                      <RiArrowRightLine />
                    </AccessibleButton>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && confirmAction && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Confirm Action</h3>
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setConfirmAction(null);
                  }}
                  className="modal-close"
                >
                  <RiCloseLine />
                </button>
              </div>
              <div className="modal-body">
                <p>{confirmAction.message}</p>
              </div>
              <div className="modal-footer">
                <AccessibleButton
                  onClick={() => {
                    setShowConfirmModal(false);
                    setConfirmAction(null);
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </AccessibleButton>
                <AccessibleButton
                  onClick={handleConfirmAction}
                  className="btn btn-primary"
                >
                  Confirm
                </AccessibleButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </ResponsiveContainer>
  );
};

export default Notifications; 