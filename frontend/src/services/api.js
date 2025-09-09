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

// Standardized error handling utility
const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.message || 'Request failed';
    const status = error.response.status;
    
    // Handle specific status codes
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
      case 413:
        throw new ApiError('File too large', 'file_size', status, error);
      case 422:
        throw new ApiError('Invalid data provided', 'validation', status, error);
      case 429:
        throw new ApiError('Too many requests. Please try again later.', 'rate_limit', status, error);
      case 500:
        throw new ApiError('Server error. Please try again later.', 'server', status, error);
      default:
        throw new ApiError(message, 'unknown', status, error);
    }
  } else if (error.request) {
    // Network error
    throw new ApiError('Network error. Please check your connection.', 'network', null, error);
  } else {
    // Other error
    throw new ApiError(error.message || 'An unexpected error occurred', 'unknown', null, error);
  }
};

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Slightly higher default to reduce spurious timeouts on mobile networks
  timeout: 20000,
  transitional: { clarifyTimeoutError: true },
});

// Log API configuration in development
if (import.meta.env.DEV) {
  
}

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const tokenResult = secureStorage.getItem('token');
      // Handle both sync and async token retrieval
      const token = tokenResult instanceof Promise ? await tokenResult : tokenResult;
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Add CSRF token if available
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Automatic retry for transient network errors on idempotent requests
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
          const baseDelay = 300; // ms
          const delay = Math.min(8000, baseDelay * Math.pow(2, config.__retryCount)) + Math.random() * 200;
          await new Promise((r) => setTimeout(r, delay));
          return api.request(config);
        }
      }
    } catch (_) {
      // fallthrough to normal handling
    }

    if (error.response?.status === 401) {
      // Check if it's not a login/register request that failed
      const isAuthEndpoint = error.config?.url?.includes('/auth/login') || 
                           error.config?.url?.includes('/auth/register');
      
      if (!isAuthEndpoint) {
        // Token expired or invalid - preserve current location
        const currentPath = window.location.pathname;
        secureStorage.removeItem('token');
        secureStorage.removeItem('user');
        
        // Only redirect if not already on login/register pages
        if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
          await secureStorage.setItem('redirectAfterLogin', currentPath);
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  getCurrentUser: async (token) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const response = await api.get('/auth/me', { headers });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  refreshToken: async () => {
    try {
      const response = await api.post('/auth/refresh');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

// User API calls
export const userAPI = {
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getStats: async () => {
    try {
      const response = await api.get('/auth/stats');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

// Pothole API calls
export const potholeAPI = {
  create: async (formData, onProgress) => {
    try {
      // For file uploads, we need a separate axios instance without the JSON Content-Type
      // so the browser can set multipart/form-data automatically. Use the top-level axios import
      // to avoid dynamic import chunk-loading failures and stray unhandled rejections.
      const tokenResult = secureStorage.getItem('token');
      const token = tokenResult instanceof Promise ? await tokenResult : tokenResult;
      
      const uploadAxios = axios.create({
        baseURL: API_URL,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        // Add a generous timeout for mobile uploads; backend should support this as well
        timeout: 180000, // 3 minutes
      });
      
      // Add progress interceptor if callback is provided
      if (onProgress) {
        uploadAxios.interceptors.request.use((config) => {
          config.onUploadProgress = (progressEvent) => {
            const { loaded, total } = progressEvent || {};
            if (typeof total === 'number' && total > 0) {
              const percentCompleted = Math.round((loaded * 100) / total);
              onProgress(Math.min(100, Math.max(0, percentCompleted)));
            }
          };
          return config;
        });
      }
      
      const response = await uploadAxios.post('/potholes', formData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/potholes', { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  getConstituencies: async (state) => {
    const url = state ? `/constituencies?state=${encodeURIComponent(state)}` : '/constituencies';
    const response = await api.get(url);
    return response.data.data; // Extract data from { success: true, data: [...] }
  },
  getParliamentaryConstituencies: async (state) => {
    const url = `/constituencies/parliamentary?state=${encodeURIComponent(state)}`;
    const response = await api.get(url);
    return response.data.data; // Extract data from { success: true, data: [...] }
  },
  getMLAAndParty: async (state, constituency) => {
    const url = `/constituencies?state=${encodeURIComponent(state)}&constituency=${encodeURIComponent(constituency)}`;
    const response = await api.get(url);
    return response.data.data; // Extract data from { success: true, data: {...} }
  },
  getMPByPC: async (pc_name, state) => {
    const url = `/constituencies/mp?state=${encodeURIComponent(state)}&pc_name=${encodeURIComponent(pc_name)}`;
    const response = await api.get(url);
    return response.data.data;
  },
  
  getById: async (id) => {
    try {
      const response = await api.get(`/potholes/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  getStats: async () => {
    try {
      const response = await api.get('/potholes/stats');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  getMyReports: async (params = {}) => {
    try {
      const response = await api.get('/potholes/my-reports', { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  upvote: async (id) => {
    try {
      const response = await api.put(`/potholes/${id}/upvote`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  delete: async (id) => {
    try {
      const response = await api.delete(`/potholes/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

// Notification API calls
export const notificationAPI = {
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/notifications', { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getUnreadCount: async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  markAsRead: async (id) => {
    try {
      const response = await api.patch(`/notifications/${id}/read`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await api.patch('/notifications/mark-all-read');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/notifications/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  clearAll: async () => {
    try {
      const response = await api.delete('/notifications/clear-all');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

export const bugReportAPI = {
  submit: async (data) => {
    try {
      const response = await api.post('/bug-reports', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  getMyReports: async () => {
    try {
      const response = await api.get('/bug-reports');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

export const feedbackAPI = {
  submit: async (data) => {
    try {
      const response = await api.post('/feedback', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  getMyFeedback: async () => {
    try {
      const response = await api.get('/feedback');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

export const trafficAPI = {
  getOverview: async (days = 30) => {
    try {
      const response = await api.get('/traffic', { params: { days } });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export const contactAPI = {
  submit: async (data) => {
    try {
      const response = await api.post('/contact', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

export const validationAPI = {
  validateCoordinates: async (latitude, longitude) => {
    try {
      const response = await api.post('/validation/coordinates', {
        latitude,
        longitude
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  getBoundaryStats: async () => {
    try {
      const response = await api.get('/validation/boundary-stats');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

export { handleApiError, ApiError };
export default api;
