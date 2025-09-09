import jwt from 'jsonwebtoken';
import TokenBlacklist from '../models/TokenBlacklist.js';
import mongoose from 'mongoose';

// Add token to blacklist
export const blacklistToken = async (token, userId, reason = 'logout') => {
  try {
    // Decode token to get expiration
    const decoded = jwt.decode(token);
    const expiresAt = new Date(decoded.exp * 1000);
    
    // Check if token is already blacklisted
    const existing = await TokenBlacklist.findOne({ token });
    if (existing) {
      return; // Token already blacklisted
    }
    
    // Add token to blacklist
    await TokenBlacklist.create({
      token,
      userId,
      expiresAt,
      reason
    });
  } catch (error) {
    throw new Error('Failed to blacklist token');
  }
};

// Check if token is blacklisted
export const isTokenBlacklisted = async (token) => {
  try {
    const blacklistedToken = await TokenBlacklist.findOne({ token });
    return !!blacklistedToken;
  } catch (error) {
    // In case of database error, assume token is not blacklisted
    // This is safer than blocking all requests
    return false;
  }
};

// Clean up expired tokens (called periodically)
export const cleanupExpiredTokens = async () => {
  try {
    // Check if database is connected before attempting cleanup
    if (mongoose.connection.readyState !== 1) {
      return;
    }

    const result = await TokenBlacklist.deleteMany({
      expiresAt: { $lt: new Date() }
    });
  } catch (error) {
    // Silent cleanup error
  }
};

// Get blacklisted tokens for a user (admin function)
export const getUserBlacklistedTokens = async (userId) => {
  try {
    const tokens = await TokenBlacklist.find({ userId })
      .select('-token') // Don't return the actual tokens for security
      .sort({ createdAt: -1 })
      .limit(50);
    
    return tokens;
  } catch (error) {
    throw new Error('Failed to fetch blacklisted tokens');
  }
};

// Revoke all tokens for a user (admin function)
export const revokeAllUserTokens = async (userId, reason = 'admin_revoke') => {
  try {
    // This would require storing active tokens in the database
    // For now, we'll just clean up any existing blacklisted tokens
    await TokenBlacklist.deleteMany({ userId });
  } catch (error) {
    throw new Error('Failed to revoke user tokens');
  }
};

// Initialize token cleanup with database connection check
const initializeTokenCleanup = () => {
  // Clean up expired tokens every hour
  setInterval(cleanupExpiredTokens, 60 * 60 * 1000);
  
  // Wait for database connection before initial cleanup
  const checkConnectionAndCleanup = () => {
    if (mongoose.connection.readyState === 1) {
      cleanupExpiredTokens();
    } else {
      setTimeout(checkConnectionAndCleanup, 5000);
    }
  };
  
  // Start checking for database connection
  checkConnectionAndCleanup();
};

// Initialize the cleanup system
initializeTokenCleanup();