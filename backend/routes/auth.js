import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Pothole from '../models/Pothole.js';
import { authenticateToken } from '../middleware/auth.js';
import { sanitizeInput } from '../middleware/sanitize.js';
import { authLimiter, createAccountLimiter, userLimiter } from '../middleware/rateLimit.js';
import { blacklistToken, isTokenBlacklisted } from '../services/tokenBlacklist.js';
import { sendWelcomeEmail, sendVerificationEmail, sendPasswordResetEmail, verifyToken } from '../services/emailService.js';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { OAuth2Client } from 'google-auth-library';

const router = express.Router();

// Feature flags for Google auth based on env presence
const hasGoogleOAuth = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const googleAudience = process.env.GOOGLE_MOBILE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';

// Initialize Google OAuth2 client for mobile token verification (only if configured)
const googleClient = googleAudience ? new OAuth2Client(googleAudience) : null;

// Generate JWT token with better security
const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET, 
    { 
      expiresIn: '7d',
      issuer: 'pothole-api',
      audience: 'pothole-users'
    }
  );
};

// Google OAuth Strategy (only when configured)
if (hasGoogleOAuth) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback',
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      let user = await User.findOne({ email });
      if (!user) {
        user = new User({
          name: profile.displayName,
          email,
          googleId: profile.id,
          provider: 'google',
          isVerified: true,
          password: crypto.randomBytes(32).toString('hex') // secure dummy password for OAuth users
        });
        await user.save();
      } else if (!user.googleId) {
        user.googleId = profile.id;
        user.provider = 'google';
        user.isVerified = true;
        await user.save();
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
} else {
  console.warn('Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable.');
}

// Google OAuth login endpoint
router.get('/google', (req, res, next) => {
  if (!hasGoogleOAuth) {
    return res.status(503).json({ success: false, message: 'Google OAuth is not configured on this server.' });
  }
  return passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});

// Google OAuth callback endpoint
router.get('/google/callback', (req, res, next) => {
  if (!hasGoogleOAuth) {
    const param = encodeURIComponent('oauth_unavailable');
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=${param}`);
  }
  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err || !user) {
      // Normalize error code for frontend display
      const code = (err && (err.name || err.message)) || (info && (info.message || info.code)) || 'oauth_error';
      const param = encodeURIComponent(String(code));
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=${param}`);
    }
    try {
      const token = generateToken(user._id);
      return res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}`);
    } catch (e) {
      const param = encodeURIComponent('token_generation_failed');
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=${param}`);
    }
  })(req, res, next);
});

// @route   POST /api/auth/google
// @desc    Mobile Google Sign-In with ID token
// @access  Public
router.post('/google', authLimiter, sanitizeInput, [
  body('idToken')
    .notEmpty()
    .withMessage('ID token is required')
], async (req, res) => {
  try {
    if (!googleClient) {
      return res.status(503).json({ success: false, message: 'Google Sign-In is not configured on this server.' });
    }
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { idToken } = req.body;

    // Verify the ID token with Google
    // Accept both mobile and web client IDs as valid audiences
    const ticket = await googleClient.verifyIdToken({
      idToken: idToken,
      audience: [process.env.GOOGLE_MOBILE_CLIENT_ID, process.env.GOOGLE_CLIENT_ID]
    });

    const payload = ticket.getPayload();

    // Extract user information from the token
    const googleId = payload['sub'];
    const email = payload['email'];
    const name = payload['name'];
    const picture = payload['picture'];
    const emailVerified = payload['email_verified'];

    if (!email || !emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email not verified with Google'
      });
    }

    // Check if user exists in database
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user
      user = new User({
        name,
        email,
        googleId,
        provider: 'google',
        isVerified: true,
        password: crypto.randomBytes(32).toString('hex') // secure dummy password for OAuth users
      });
      await user.save();

      // Send welcome email
      try {
        await sendWelcomeEmail(user);
      } catch (error) {
        // Silent error handling
      }
    } else if (!user.googleId) {
      // Update existing user with Google data
      user.googleId = googleId;
      user.provider = 'google';
      user.isVerified = true;
      await user.save();
    }

    // Generate JWT token for the user
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Google Sign-In successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          hasSeenTour: user.hasSeenTour
        }
      }
    });

  } catch (error) {
    console.error('Mobile Google Sign-In error:', error);

    // Handle specific Google token errors
    if (error.message.includes('Token used too late') ||
        error.message.includes('Token used too early') ||
        error.message.includes('Invalid token')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired Google token'
      });
    }

    if (error.message.includes('Wrong number of segments')) {
      return res.status(400).json({
        success: false,
        message: 'Malformed Google token'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to authenticate with Google'
    });
  }
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', createAccountLimiter, sanitizeInput, [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .custom((value) => {
      const hasLower = /[a-z]/.test(value);
      const hasUpper = /[A-Z]/.test(value);
      const hasNumber = /\d/.test(value);
      const hasSpecial = /[@$!%*?&]/.test(value);
      if (!hasLower || !hasUpper || !hasNumber || !hasSpecial) {
        throw new Error('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
      }
      return true;
    })
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    // Send welcome email
    try {
      await sendWelcomeEmail(user);
    } catch (error) {
      // Silent error handling
    }

    // Send verification email
    try {
      await sendVerificationEmail(user);
    } catch (error) {
      // Silent error handling
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          hasSeenTour: user.hasSeenTour
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authLimiter, sanitizeInput, [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Account not verified. Please check your email and verify your account before logging in.',
        requiresVerification: true
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          hasSeenTour: user.hasSeenTour
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh', authenticateToken, sanitizeInput, async (req, res) => {
  try {
    // Generate new token
    const token = generateToken(req.user._id);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token,
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          isVerified: req.user.isVerified,
          hasSeenTour: req.user.hasSeenTour
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during token refresh'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', userLimiter, authenticateToken, sanitizeInput, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          isVerified: req.user.isVerified,
          hasSeenTour: req.user.hasSeenTour
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, sanitizeInput, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email } = req.body;
    const updateData = {};
    let emailChanged = false;
    let originalEmail = null;

    if (name) updateData.name = name;
    if (email) {
      // Check if email is being changed
      if (email !== req.user.email) {
        emailChanged = true;
        originalEmail = req.user.email;
      }

      // Check if email is already taken by another user
      const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken by another user'
        });
      }
      updateData.email = email;
    }

    // Allow updating hasSeenTour
    if (typeof req.body.hasSeenTour !== 'undefined') {
      updateData.hasSeenTour = req.body.hasSeenTour;
    }

    // If email is being changed, set verification status to false and clear tokens
    if (emailChanged) {
      updateData.isVerified = false;
      updateData.verificationToken = null;
      updateData.verificationTokenExpires = null;
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    // If email was changed, send verification email to new email
    if (emailChanged) {
      try {
        await sendVerificationEmail(updatedUser);
      } catch (error) {
        // Continue with the response even if email sending fails
      }
    }

    res.json({
      success: true,
      message: emailChanged 
        ? 'Profile updated successfully. Please check your new email address for verification.'
        : 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          isVerified: updatedUser.isVerified,
          hasSeenTour: updatedUser.hasSeenTour
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during profile update'
    });
  }
});

// @route   GET /api/auth/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', userLimiter, authenticateToken, sanitizeInput, async (req, res) => {
  try {
    // Get user's reports
    const totalReports = await Pothole.countDocuments({ userId: req.user._id });
    const resolvedReports = await Pothole.countDocuments({ 
      userId: req.user._id, 
      status: 'resolved' 
    });
    
    // Get total upvotes received
    const userReports = await Pothole.find({ userId: req.user._id });
    const totalUpvotes = userReports.reduce((sum, report) => sum + report.upvotes, 0);

    res.json({
      success: true,
      data: {
        totalReports,
        resolvedReports,
        totalUpvotes,
        joinDate: req.user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user statistics'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user and invalidate token
// @access  Private
router.post('/logout', authenticateToken, sanitizeInput, async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      // Add token to blacklist with user ID and reason
      await blacklistToken(token, req.user._id, 'logout');
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
});

// @route   POST /api/auth/verify-email
// @desc    Verify email address
// @access  Public
router.post('/verify-email', sanitizeInput, [
  body('token')
    .notEmpty()
    .withMessage('Verification token is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { token } = req.body;

    // Verify token
    const decoded = verifyToken(token, 'email-verification');
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token'
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Mark as verified
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Invalid or expired verification token'
    });
  }
});

// @route   POST /api/auth/resend-verification
// @desc    Resend verification email (authenticated users)
// @access  Private
router.post('/resend-verification', authenticateToken, sanitizeInput, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Send verification email
    await sendVerificationEmail(user);

    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send verification email'
    });
  }
});

// @route   POST /api/auth/send-verification
// @desc    Send verification email by email address (public)
// @access  Public
router.post('/send-verification', sanitizeInput, [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message: 'If an account with this email exists, a verification link has been sent'
      });
    }

    if (user.isVerified) {
      return res.json({
        success: true,
        message: 'If an account with this email exists, a verification link has been sent'
      });
    }

    // Send verification email
    await sendVerificationEmail(user);

    res.json({
      success: true,
      message: 'If an account with this email exists, a verification link has been sent'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send verification email'
    });
  }
});

// @route   POST /api/auth/verify-email-from-profile
// @desc    Verify email address from profile section
// @access  Private
router.post('/verify-email-from-profile', authenticateToken, sanitizeInput, [
  body('token')
    .notEmpty()
    .withMessage('Verification token is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { token } = req.body;

    // Verify token
    const decoded = verifyToken(token, 'email-verification');
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token'
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Mark as verified
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    // Generate new token with updated verification status
    const newToken = generateToken(user._id);

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        token: newToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          hasSeenTour: user.hasSeenTour
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Invalid or expired verification token'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', sanitizeInput, [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent'
      });
    }

    // Send password reset email
    await sendPasswordResetEmail(user);

    res.json({
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send password reset email'
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password using token
// @access  Public
router.post('/reset-password', sanitizeInput, [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .custom((value) => {
      const hasLower = /[a-z]/.test(value);
      const hasUpper = /[A-Z]/.test(value);
      const hasNumber = /\d/.test(value);
      const hasSpecial = /[@$!%*?&]/.test(value);
      if (!hasLower || !hasUpper || !hasNumber || !hasSpecial) {
        throw new Error('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
      }
      return true;
    })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { token, password } = req.body;

    // Verify token
    const decoded = verifyToken(token, 'password-reset');
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset token'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update password and clear reset token
    user.password = hashedPassword;
    user.passwordResetToken = null;
    user.passwordResetTokenExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Invalid or expired reset token'
    });
  }
});

export default router;
