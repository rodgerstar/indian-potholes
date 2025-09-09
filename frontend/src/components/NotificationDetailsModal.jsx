import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/adminApi';
import LoadingSpinner from './LoadingSpinner';
import AccessibleButton from './AccessibleButton';
import { 
  RiCloseLine, 
  RiUserLine, 
  RiCheckLine, 
  RiCloseCircleLine,
  RiTimeLine,
  RiEyeLine,
  RiEyeOffLine,
  RiFilterLine,
  RiSearchLine,
  RiDownloadLine,
  RiMailLine,
  RiSettings3Line,
  RiBarChartLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiRefreshLine,
  RiDeleteBinLine,
  RiNotificationLine,
  RiGroupLine,
  RiSendPlaneLine
} from 'react-icons/ri';
import '../styles/components/notification-details-modal.css';

const NotificationDetailsModal = ({ 
  isOpen, 
  onClose, 
  notificationId, 
  notification 
}) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const itemsPerPage = 10;

  useEffect(() => {
    if (isOpen && notificationId) {
      fetchNotificationDetails();
    }
  }, [isOpen, notificationId]);

  const fetchNotificationDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getNotificationDetails(notificationId);
      setDetails(response.data);
    } catch (error) {
      setError('Failed to load notification details');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user._id));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
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

  const getNotificationTypeColor = (type) => {
    switch (type) {
      case 'system_announcement':
        return 'type-system';
      case 'pothole_status':
        return 'type-status';
      case 'feedback_response':
        return 'type-feedback';
      case 'bug_response':
        return 'type-bug';
      case 'area_update':
        return 'type-area';
      default:
        return 'type-default';
    }
  };

  const exportData = () => {
    if (!details) return;
    
    const csvData = [
      ['User Name', 'Email', 'Status', 'Sent Time', 'Read Time'],
      ...details.individualNotifications.map(notif => [
        notif.user?.name || 'Unknown User',
        notif.user?.email || 'No email',
        notif.isRead ? 'Read' : 'Unread',
        formatDate(notif.createdAt),
        notif.readAt ? formatDate(notif.readAt) : 'Not read'
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notification-${notificationId}-report.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  // Filter users based on search and status
  const filteredUsers = details?.individualNotifications?.filter(notif => {
    const matchesSearch = !searchTerm || 
      (notif.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       notif.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'read' && notif.isRead) ||
      (filterStatus === 'unread' && !notif.isRead);
    return matchesSearch && matchesStatus;
  }) || [];

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="modal-overlay notification-details-overlay">
      <div className="modal-content notification-details-modal">
        <div className="modal-header">
          <div className="header-content">
            <div className="header-main">
              <h3>
                <RiNotificationLine className="header-icon" />
                Notification Analytics
              </h3>
              <div className="header-subtitle">
                {details?.notification?.isGrouped ? (
                  <span className="broadcast-indicator">
                    <RiGroupLine />
                    Broadcast Notification
                  </span>
                ) : (
                  <span className="direct-indicator">
                    <RiSendPlaneLine />
                    Direct Notification
                  </span>
                )}
              </div>
            </div>
            <div className="header-actions">
              <AccessibleButton
                onClick={exportData}
                className="header-btn"
                title="Export data"
                disabled={!details}
              >
                <RiDownloadLine />
              </AccessibleButton>
              <AccessibleButton
                onClick={fetchNotificationDetails}
                className="header-btn"
                title="Refresh data"
              >
                <RiRefreshLine />
              </AccessibleButton>
            </div>
          </div>
          <button
            onClick={onClose}
            className="modal-close"
            aria-label="Close modal"
          >
            <RiCloseLine />
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-container">
              <LoadingSpinner size="lg" />
              <p>Loading notification analytics...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p className="error-message">{error}</p>
              <AccessibleButton
                onClick={fetchNotificationDetails}
                className="retry-btn"
              >
                <RiRefreshLine />
                Retry
              </AccessibleButton>
            </div>
          ) : details ? (
            <div className="notification-details">
              {/* Notification Summary */}
              <div className="notification-summary">
                <div className="summary-header">
                  <h4>
                    <RiBarChartLine className="section-icon" />
                    Notification Summary
                  </h4>
                </div>
                
                <div className="summary-grid">
                  <div className="summary-item">
                    <label>Title:</label>
                    <span className="summary-value">{details.notification.title}</span>
                  </div>
                  <div className="summary-item">
                    <label>Message:</label>
                    <span className="summary-value">{details.notification.message}</span>
                  </div>
                  <div className="summary-item">
                    <label>Type:</label>
                    <span className={`notification-type-badge ${getNotificationTypeColor(details.notification.type)}`}>
                      {details.notification.type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="summary-item">
                    <label>Sent:</label>
                    <span className="summary-value">{formatDate(details.notification.createdAt)}</span>
                  </div>
                </div>

                {/* Statistics */}
                {details.notification.isGrouped && (
                  <div className="statistics">
                    <div className="stat-card">
                      <div className="stat-icon total">
                        <RiGroupLine />
                      </div>
                      <div className="stat-content">
                        <div className="stat-number">{details.notification.totalCount}</div>
                        <div className="stat-label">Total Recipients</div>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon read">
                        <RiCheckLine />
                      </div>
                      <div className="stat-content">
                        <div className="stat-number">{details.notification.readCount}</div>
                        <div className="stat-label">Read</div>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon unread">
                        <RiEyeOffLine />
                      </div>
                      <div className="stat-content">
                        <div className="stat-number">{details.notification.unreadCount}</div>
                        <div className="stat-label">Unread</div>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon percentage">
                        <RiBarChartLine />
                      </div>
                      <div className="stat-content">
                        <div className="stat-number">{details.notification.readPercentage}%</div>
                        <div className="stat-label">Read Rate</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Individual Notifications */}
              <div className="individual-notifications">
                <div className="recipients-header">
                  <h4>
                    <RiUserLine className="section-icon" />
                    Recipients ({filteredUsers.length})
                  </h4>
                  <div className="recipients-controls">
                    <div className="search-wrapper">
                      <RiSearchLine className="search-icon" />
                      <input
                        type="text"
                        placeholder="Search recipients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                      />
                    </div>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">All Status</option>
                      <option value="read">Read</option>
                      <option value="unread">Unread</option>
                    </select>
                    <AccessibleButton
                      onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                      className="view-toggle-btn"
                      title={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
                    >
                      <RiSettings3Line />
                    </AccessibleButton>
                  </div>
                </div>

                {filteredUsers.length > 0 && (
                  <div className="bulk-actions">
                    <label className="select-all-label">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === filteredUsers.length}
                        onChange={handleSelectAll}
                      />
                      Select All ({filteredUsers.length})
                    </label>
                    {selectedUsers.length > 0 && (
                      <span className="selected-count">
                        {selectedUsers.length} selected
                      </span>
                    )}
                  </div>
                )}

                <div className={`recipients-list ${viewMode}`}>
                  {paginatedUsers.map((notification) => (
                    <div 
                      key={notification._id}
                      className={`recipient-item ${notification.isRead ? 'read' : 'unread'} ${selectedUsers.includes(notification._id) ? 'selected' : ''}`}
                    >
                      <div className="recipient-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(notification._id)}
                          onChange={() => handleUserSelect(notification._id)}
                        />
                      </div>
                      
                      <div className="user-info">
                        <div className="user-avatar">
                          <RiUserLine />
                        </div>
                        <div className="user-details">
                          <div className="user-name">
                            {notification.user?.name || 'Unknown User'}
                          </div>
                          <div className="user-email">
                            {notification.user?.email || 'No email'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="notification-status">
                        <div className="status-indicator">
                          {notification.isRead ? (
                            <div className="status-read">
                              <RiCheckLine className="status-icon" />
                              <span className="status-text">Read</span>
                            </div>
                          ) : (
                            <div className="status-unread">
                              <RiEyeOffLine className="status-icon" />
                              <span className="status-text">Unread</span>
                            </div>
                          )}
                        </div>
                        <div className="timestamps">
                          <div className="timestamp sent">
                            <RiTimeLine />
                            <span>Sent: {formatTimeAgo(notification.createdAt)}</span>
                          </div>
                          {notification.readAt && (
                            <div className="timestamp read">
                              <RiEyeLine />
                              <span>Read: {formatTimeAgo(notification.readAt)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="recipient-actions">
                        <AccessibleButton
                          onClick={() => window.open(`mailto:${notification.user?.email}`)}
                          className="action-btn email"
                          title="Send email"
                          disabled={!notification.user?.email}
                        >
                          <RiMailLine />
                        </AccessibleButton>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <div className="pagination-info">
                      Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} recipients
                    </div>
                    <div className="pagination-controls">
                      <AccessibleButton
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="pagination-btn"
                      >
                        <RiArrowLeftLine />
                      </AccessibleButton>
                      <span className="page-info">
                        {currentPage} of {totalPages}
                      </span>
                      <AccessibleButton
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="pagination-btn"
                      >
                        <RiArrowRightLine />
                      </AccessibleButton>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="modal-footer">
          <AccessibleButton
            onClick={onClose}
            className="btn btn-secondary"
          >
            Close
          </AccessibleButton>
        </div>
      </div>
    </div>
  );
};

export default NotificationDetailsModal; 