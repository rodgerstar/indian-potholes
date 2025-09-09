// Environment configuration
const ENV = import.meta.env.VITE_ENV || (import.meta.env.DEV ? 'development' : 'production');

// API URL configuration
const getApiUrl = () => {
  if (ENV === 'development' || import.meta.env.DEV) {
    return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  } else {
    return import.meta.env.VITE_PROD_API_URL || 'https://api.indianpotholes.com/api';
  }
};

// Frontend URL configuration
const getFrontendUrl = () => {
  if (ENV === 'development') {
    return 'http://localhost:5173';
  } else {
    return import.meta.env.VITE_FRONTEND_URL || 'https://indianpotholes.com';
  }
};

// Environment utilities
export const isDevelopment = () => ENV === 'development';
export const isProduction = () => ENV === 'production';
export const getEnvironment = () => ENV;
export const getApiBaseUrl = getApiUrl;
export const getFrontendBaseUrl = getFrontendUrl;

// Log environment info in development
if (isDevelopment()) {
  console.log('Environment Debug:', {
    ENV,
    VITE_ENV: import.meta.env.VITE_ENV,
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_PROD_API_URL: import.meta.env.VITE_PROD_API_URL,
    DEV: import.meta.env.DEV,
    getApiUrl: getApiUrl()
  });
} 