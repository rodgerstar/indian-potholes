import axios from 'axios';
import { getApiBaseUrl } from '../config/environment.js';
import secureStorage from '../utils/secureStorage';

const API_URL = getApiBaseUrl();

// Custom ApiError class that extends Error
class ApiError extends Error {
  constructor(message, type, status = null, originalError = null) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.status = status;
    this.originalError = originalError;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

// Create axios instance for admin API
const adminApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  transitional: { clarifyTimeoutError: true },
});

// Request interceptor to add auth token
adminApi.interceptors.request.use(
  async (config) => {
    try {
      const tokenResult = secureStorage.getItem('token');
      // Handle both sync and async token retrieval
      const token = tokenResult instanceof Promise ? await tokenResult : tokenResult;
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error('Failed to retrieve token:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Retry transient network errors for idempotent requests
adminApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    try {
      const config = error.config || {};
      const method = (config.method || 'get').toLowerCase();
      const isIdempotent = ['get', 'head', 'options'].includes(method);
      const isNetworkError = !error.response && (
        error.code === 'ECONNABORTED' ||
        (typeof error.message === 'string' && error.message.toLowerCase().includes('network error'))
      );

      if (isIdempotent && isNetworkError) {
        config.__retryCount = (config.__retryCount || 0) + 1;
        const maxRetries = 3;
        if (config.__retryCount <= maxRetries) {
          const baseDelay = 300;
          const delay = Math.min(8000, baseDelay * Math.pow(2, config.__retryCount)) + Math.random() * 200;
          await new Promise((r) => setTimeout(r, delay));
          return adminApi.request(config);
        }
      }
    } catch (_) {
      // fallthrough
    }
    return Promise.reject(error);
  }
);

// Standardized error handling utility
const handleApiError = (error) => {
  if (error.response) {
    const message = error.response.data?.message || 'Request failed';
    const status = error.response.status;
    
    switch (status) {
      case 400:
        throw new ApiError(message, 'validation', status, error);
      case 401:
        // Preserve the original message for better error handling
        throw new ApiError(message, 'auth', status, error);
      case 403:
        throw new ApiError('Access denied', 'permission', status, error);
      case 404:
        throw new ApiError('Resource not found', 'not_found', status, error);
      case 500:
        throw new ApiError('Server error. Please try again later.', 'server', status, error);
      default:
        throw new ApiError(message, 'unknown', status, error);
    }
  } else if (error.request) {
    throw new ApiError('Network error. Please check your connection.', 'network', null, error);
  } else {
    throw new ApiError(error.message || 'An unexpected error occurred', 'unknown', null, error);
  }
};

// Admin API service
export const adminAPI = {
  // ==================== USER MANAGEMENT ====================
  
  // Get all users with filtering and pagination
  getUsers: async (params = {}) => {
    try {
      const response = await adminApi.get('/admin/users', { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Update user role
  updateUserRole: async (userId, role) => {
    try {
      const response = await adminApi.put(`/admin/users/${userId}/role`, { role });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Update user status (activate/deactivate)
  updateUserStatus: async (userId, isActive) => {
    try {
      const response = await adminApi.put(`/admin/users/${userId}/status`, { isActive });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Delete user
  deleteUser: async (userId) => {
    try {
      const response = await adminApi.delete(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // ==================== REPORT MANAGEMENT ====================
  
  // Get all reports with filtering and pagination
  getReports: async (params = {}) => {
    try {
      const response = await adminApi.get('/admin/reports', { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Update report status
  updateReportStatus: async (reportId, status) => {
    try {
      const response = await adminApi.put(`/admin/reports/${reportId}/status`, { status });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Update admin comment for a report
  updateReportComment: async (reportId, comment) => {
    try {
      const response = await adminApi.put(`/admin/reports/${reportId}/comment`, { comment });
      return response.data; // includes adminComment and adminCommentAt
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Update location name and severity for a report
  updateReportDetails: async (reportId, details) => {
    try {
      const response = await adminApi.put(`/admin/reports/${reportId}/details`, details);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Delete report
  deleteReport: async (reportId) => {
    try {
      const response = await adminApi.delete(`/admin/reports/${reportId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get pending reports for moderation
  getPendingReports: async (params = {}) => {
    try {
      const response = await adminApi.get('/admin/reports/pending', { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get rejected reports for review
  getRejectedReports: async (params = {}) => {
    try {
      const response = await adminApi.get('/admin/reports/rejected', { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Approve a report
  approveReport: async (reportId) => {
    try {
      const response = await adminApi.put(`/admin/reports/${reportId}/approve`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Reject a report
  rejectReport: async (reportId, reason) => {
    try {
      const response = await adminApi.put(`/admin/reports/${reportId}/reject`, { reason });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // ==================== NOTIFICATION MANAGEMENT ====================
  
  // Get all notifications with filtering and pagination
  getNotifications: async (params = {}) => {
    try {
      const response = await adminApi.get('/admin/notifications', { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get grouped notifications for admin view (groups broadcast notifications)
  getGroupedNotifications: async (params = {}) => {
    try {
      const response = await adminApi.get('/admin/notifications/grouped', { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get detailed view of a notification (shows individual notifications for broadcasts)
  getNotificationDetails: async (notificationId) => {
    try {
      const response = await adminApi.get(`/admin/notifications/${notificationId}/details`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    try {
      const response = await adminApi.delete(`/admin/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Send broadcast notification
  sendBroadcastNotification: async (notificationData) => {
    try {
      const response = await adminApi.post('/admin/notifications/broadcast', notificationData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // ==================== BUG REPORT MANAGEMENT ====================
  
  // Get all bug reports with filtering and pagination
  getBugReports: async (params = {}) => {
    try {
      const response = await adminApi.get('/admin/bug-reports', { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Update bug report status
  updateBugReportStatus: async (bugReportId, status) => {
    try {
      const response = await adminApi.put(`/admin/bug-reports/${bugReportId}/status`, { status });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Delete bug report
  deleteBugReport: async (bugReportId) => {
    try {
      const response = await adminApi.delete(`/admin/bug-reports/${bugReportId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // ==================== FEEDBACK MANAGEMENT ====================
  
  // Get all feedback with filtering and pagination
  getFeedback: async (params = {}) => {
    try {
      const response = await adminApi.get('/admin/feedback', { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Update feedback status
  updateFeedbackStatus: async (feedbackId, status) => {
    try {
      const response = await adminApi.put(`/admin/feedback/${feedbackId}/status`, { status });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Delete feedback
  deleteFeedback: async (feedbackId) => {
    try {
      const response = await adminApi.delete(`/admin/feedback/${feedbackId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // ==================== ADMIN DASHBOARD STATS ====================
  
  // Get admin dashboard statistics
  getStats: async () => {
    try {
      const response = await adminApi.get('/admin/stats');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // ==================== CONSTITUENCY ASSIGNMENT ====================
  
  // Get pending constituency assignments
  getPendingAssignments: async () => {
    try {
      const response = await adminApi.get('/admin/assignments/pending');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Assign constituency to a report
  assignConstituency: async (reportId, assignmentData) => {
    try {
      const response = await adminApi.put(`/admin/assignments/${reportId}`, assignmentData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // ==================== CONSTITUENCY DATA ====================
  
  // Get all states
  getStates: async () => {
    try {
      const response = await adminApi.get('/constituencies');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get constituencies by state
  getConstituenciesByState: async (state) => {
    try {
      const response = await adminApi.get('/constituencies', { 
        params: { state } 
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get parliamentary constituencies by state
  getParliamentaryConstituenciesByState: async (state) => {
    try {
      const response = await adminApi.get('/constituencies/parliamentary', { 
        params: { state } 
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get MP by parliamentary constituency
  getMPByPC: async (state, pc_name) => {
    try {
      const response = await adminApi.get('/constituencies/mp', { 
        params: { state, pc_name } 
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

export { ApiError };
