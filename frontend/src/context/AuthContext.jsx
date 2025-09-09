import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI, handleApiError } from '../services/api';
import toast from 'react-hot-toast';
import secureStorage from '../utils/secureStorage';

const AuthContext = createContext();

// Input validation functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // Match backend requirements - at least 8 characters
  return password && password.length >= 8;
};

const getPasswordStrength = (password) => {
  if (!password) return { strength: 'none', message: 'Password is required' };
  
  let score = 0;
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password)
  };
  
  score = Object.values(checks).filter(Boolean).length;
  
  if (password.length < 8) {
    return { strength: 'weak', message: 'Password must be at least 8 characters long' };
  } else if (score < 2) {
    return { strength: 'weak', message: 'Password is weak. Consider adding numbers or special characters' };
  } else if (score < 4) {
    return { strength: 'medium', message: 'Password strength is good' };
  } else {
    return { strength: 'strong', message: 'Password is strong' };
  }
};

const validateName = (name) => {
  return name && name.trim().length >= 2 && name.trim().length <= 100;
};

// Sanitize input to prevent XSS
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
    case 'REGISTER_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        error: null,
      };
    case 'LOGIN_FAILURE':
    case 'REGISTER_FAILURE':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        error: null,
      };
    case 'SET_USER':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        loading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    default:
      return state;
  }
};

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Secure token storage and retrieval using secureStorage
  const getSecureToken = async () => {
    try {
      const tokenResult = secureStorage.getItem('token');
      // Handle both sync and async token retrieval
      const token = tokenResult instanceof Promise ? await tokenResult : tokenResult;
      
      if (!token) return null;
      
      // Enhanced token format validation
      if (typeof token !== 'string' || token.length < 10) {
        secureStorage.removeItem('token');
        return null;
      }
      
      // Basic JWT format validation (should have 3 parts separated by dots)
      const parts = token.split('.');
      if (parts.length !== 3) {
        secureStorage.removeItem('token');
        return null;
      }
      
      // Check if token is expired (basic check for JWT)
      try {
        const payload = JSON.parse(atob(parts[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          secureStorage.removeItem('token');
          return null;
        }
      } catch (tokenError) {
        // If we can't parse the token, it's likely invalid
        secureStorage.removeItem('token');
        return null;
      }
      
      return token;
    } catch (error) {
      return null;
    }
  };

  const setSecureToken = async (token) => {
    try {
      if (!token || typeof token !== 'string') {
        throw new Error('Invalid token format');
      }
      
      // Calculate token expiration time (24 hours from now)
      const expiresAt = Date.now() + (24 * 60 * 60 * 1000);
      
      const result = secureStorage.setItem('token', token, { expiresAt });
      // Handle both sync and async setItem
      if (result instanceof Promise) {
        await result;
      }
    } catch (error) {
      throw error;
    }
  };

  const clearSecureToken = () => {
    try {
      secureStorage.removeItem('token');
      secureStorage.removeItem('user');
    } catch (error) {
      throw error;
    }
  };

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      const token = await getSecureToken();
      const userDataResult = secureStorage.getItem('user');
      // Handle both sync and async user data retrieval
      const userData = userDataResult instanceof Promise ? await userDataResult : userDataResult;

      if (token && userData) {
        try {
          // Verify token is still valid
          const response = await authAPI.getCurrentUser();
          dispatch({
            type: 'SET_USER',
            payload: response.data.user,
          });
        } catch (error) {
          // Token is invalid, clear storage
          clearSecureToken();
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuth();
  }, []);

  // Login function with validation
  const login = async (credentials) => {
    try {
      // Validate input
      const { email, password } = credentials;
      
      if (!email || !validateEmail(email)) {
        throw new Error('Please provide a valid email address');
      }
      
      if (!password || password.length < 1) {
        throw new Error('Password is required');
      }

      // Sanitize input
      const sanitizedCredentials = {
        email: sanitizeInput(email),
        password: password // Don't sanitize password
      };

      dispatch({ type: 'LOGIN_START' });
      const response = await authAPI.login(sanitizedCredentials);
      
      // Store token and user data securely
      await setSecureToken(response.data.token);
      const userResult = secureStorage.setItem('user', response.data.user);
      if (userResult instanceof Promise) {
        await userResult;
      }
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: response.data,
      });
      
      toast.success('Login successful!');
      return response.data;
    } catch (error) {
      try {
        handleApiError(error);
      } catch (apiError) {
        dispatch({
          type: 'LOGIN_FAILURE',
          payload: apiError.message,
        });
        toast.error(apiError.message);
        throw apiError;
      }
    }
  };

  // Direct login with token and user (for use after registration or Google OAuth)
  const loginWithToken = async (token, user) => {
    try {
      await setSecureToken(token);
      let userData = user;
      if (!userData) {
        // Fetch user info from backend
        const response = await authAPI.getCurrentUser(token);
        userData = response.data.user;
      }
      const userResult = secureStorage.setItem('user', userData);
      if (userResult instanceof Promise) {
        await userResult;
      }
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { token, user: userData },
      });
    } catch (error) {
      clearSecureToken();
      dispatch({ type: 'LOGOUT' });
      throw error;
    }
  };

  // Register function with validation
  const register = async (userData) => {
    try {
      // Validate input
      const { name, email, password } = userData;
      
      if (!validateName(name)) {
        throw new Error('Name must be between 2 and 100 characters');
      }
      
      if (!validateEmail(email)) {
        throw new Error('Please provide a valid email address');
      }
      
      if (!validatePassword(password)) {
        throw new Error('Password must be at least 8 characters long');
      }
      
      // Give user feedback about password strength
      const passwordStrength = getPasswordStrength(password);
      if (passwordStrength.strength === 'weak' && password.length >= 6) {
        toast.warning(passwordStrength.message);
      }

      // Sanitize input
      const sanitizedUserData = {
        name: sanitizeInput(name),
        email: sanitizeInput(email),
        password: password // Don't sanitize password
      };

      dispatch({ type: 'REGISTER_START' });
      const response = await authAPI.register(sanitizedUserData);
      
      // Store token and user data securely
      await setSecureToken(response.data.token);
      const userResult = secureStorage.setItem('user', response.data.user);
      if (userResult instanceof Promise) {
        await userResult;
      }
      
      dispatch({
        type: 'REGISTER_SUCCESS',
        payload: response.data,
      });
      
      toast.success('Registration successful!');
      return response.data;
    } catch (error) {
      try {
        handleApiError(error);
      } catch (apiError) {
        dispatch({
          type: 'REGISTER_FAILURE',
          payload: apiError.message,
        });
        toast.error(apiError.message);
        throw apiError;
      }
    }
  };

  // Update user data in context (for profile updates)
  const updateUserData = async (updatedUser) => {
    try {
      // Validate and sanitize user data
      const sanitizedUser = {
        ...updatedUser,
        name: sanitizeInput(updatedUser.name),
        email: sanitizeInput(updatedUser.email)
      };
      
      const result = secureStorage.setItem('user', sanitizedUser);
      if (result instanceof Promise) {
        await result;
      }
      dispatch({
        type: 'SET_USER',
        payload: sanitizedUser,
      });
    } catch (error) {
      throw error;
    }
  };

  // Logout function with server notification
  const logout = async () => {
    try {
      // Call logout endpoint to invalidate token on server
      const token = await getSecureToken();
      if (token) {
        try {
          await authAPI.logout();
        } catch (error) {
          // Continue with local logout even if server logout fails
        }
      }
      
      clearSecureToken();
      dispatch({ type: 'LOGOUT' });
      toast.success('Logged out successfully');
    } catch (error) {
      // Force logout even if there's an error
      clearSecureToken();
      dispatch({ type: 'LOGOUT' });
    }
  };

  const value = {
    ...state,
    login,
    loginWithToken,
    register,
    updateUserData,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export validation functions for use in other components
export { validateEmail, validatePassword, validateName, getPasswordStrength };
