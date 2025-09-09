import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { isTokenBlacklisted } from '../services/tokenBlacklist.js';

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token is required' 
      });
    }

    // Check if token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token has been invalidated' 
      });
    }

    // Verify token with additional options and proper claim validation
    // The jwt.verify method automatically handles expiration, so we don't need manual checks
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'pothole-api',
      audience: 'pothole-users',
      // The following options are automatically checked by jwt.verify:
      // - exp (expiration time)
      // - nbf (not before)
      // - iat (issued at)
      maxAge: '24h' // Additional safety check for maximum token age
    });
    
    // Additional claim validation (issuer and audience are already validated by options above)
    if (!decoded.userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token: missing user ID' 
      });
    }
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account has been deactivated' 
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account not verified. Please check your email and verify your account before logging in.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    // All authentication errors should return 401
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    } else if (error.name === 'NotBeforeError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token not active' 
      });
    } else {
      return res.status(401).json({ 
        success: false, 
        message: 'Token verification failed' 
      });
    }
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      success: false, 
      message: 'Admin access required' 
    });
  }
};

export { authenticateToken, requireAdmin };
