import { authAPI } from './api';
import secureStorage from '../utils/secureStorage';

class AuthService {
  constructor() {
    this.refreshTimeout = null;
    this.setupTokenRefresh();
  }

  // Setup automatic token refresh
  async setupTokenRefresh() {
    const token = await this.getToken();
    if (token) {
      this.scheduleTokenRefresh();
    }
  }

  // Get token from secureStorage
  async getToken() {
    try {
      const tokenResult = secureStorage.getItem('token');
      // Handle both sync and async token retrieval
      const token = tokenResult instanceof Promise ? await tokenResult : tokenResult;
      return token;
    } catch (error) {
      console.error('Failed to retrieve token:', error);
      return null;
    }
  }

  // Set token and schedule refresh
  async setToken(token) {
    const result = secureStorage.setItem('token', token);
    if (result instanceof Promise) {
      await result;
    }
    this.scheduleTokenRefresh();
  }

  // Remove token and clear refresh timeout
  removeToken() {
    secureStorage.removeItem('token');
    secureStorage.removeItem('user');
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
  }

  // Schedule token refresh (7 days - 1 hour before expiry)
  scheduleTokenRefresh() {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }

    // Refresh token 1 hour before expiry (7 days = 168 hours)
    const refreshTime = 7 * 24 * 60 * 60 * 1000 - 60 * 60 * 1000; // 7 days - 1 hour
    this.refreshTimeout = setTimeout(() => {
      this.refreshToken();
    }, refreshTime);
  }

  // Refresh token
  async refreshToken() {
    try {
      const response = await authAPI.refreshToken();
      if (response.success) {
        await this.setToken(response.data.token);
        return response.data;
      }
    } catch (error) {
      this.removeToken();
      window.location.href = '/login';
    }
  }

  // Check if token is expired
  async isTokenExpired() {
    const token = await this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  // Get token payload
  async getTokenPayload() {
    const token = await this.getToken();
    if (!token) return null;

    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
      return null;
    }
  }

  // Check if user is authenticated
  async isAuthenticated() {
    return !(await this.isTokenExpired());
  }

  // Get user data
  async getUser() {
    try {
      const userDataResult = secureStorage.getItem('user');
      // Handle both sync and async user data retrieval
      const userData = userDataResult instanceof Promise ? await userDataResult : userDataResult;
      return userData ? userData : null;
    } catch (error) {
      console.error('Failed to retrieve user data:', error);
      return null;
    }
  }

  // Set user data
  async setUser(user) {
    const result = secureStorage.setItem('user', user);
    if (result instanceof Promise) {
      await result;
    }
  }

  // Login
  async login(credentials) {
    const response = await authAPI.login(credentials);
    if (response.success) {
      await this.setToken(response.data.token);
      await this.setUser(response.data.user);
    }
    return response;
  }

  // Register
  async register(userData) {
    const response = await authAPI.register(userData);
    if (response.success) {
      await this.setToken(response.data.token);
      await this.setUser(response.data.user);
    }
    return response;
  }

  // Logout
  logout() {
    this.removeToken();
  }

  // Get current user from API
  async getCurrentUser() {
    try {
      const response = await authAPI.getCurrentUser();
      if (response.success) {
        await this.setUser(response.data.user);
        return response.data.user;
      }
    } catch (error) {
      this.removeToken();
      throw error;
    }
  }
}

export default new AuthService(); 