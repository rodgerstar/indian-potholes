// IMPORTANT: Make sure to import `instrument.js` at the top of your file.
import "./instrument.js";

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import mongoose from 'mongoose'; // Added for health check
import passport from 'passport';
import * as Sentry from "@sentry/node";
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import inside from 'point-in-polygon';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import authRoutes from './routes/auth.js';
import potholeRoutes from './routes/potholes.js';
import r2Routes from './routes/r2.js';
import constituenciesRoutes from './routes/constituencies.js';
import bugReportRoutes from './routes/bugReports.js';
import feedbackRoutes from './routes/feedback.js';
import notificationRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';
import trafficRoutes from './routes/traffic.js';
import mpMlaContributionRoutes from './routes/mpMlaContribution.js';
import contactRoutes from './routes/contact.js';
import validationRoutes from './routes/validation.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'MONGODB_URI',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_ENDPOINT',
  'R2_BUCKET_NAME',
  'CLOUDFLARE_WORKER_URL',
  'RECAPTCHA_SECRET_KEY',
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASS',
  'FRONTEND_URL',
  'GA_CLIENT_EMAIL',
  'GA_PRIVATE_KEY',
  'GA_PROPERTY_ID'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('🚨 Missing required environment variables:');
  missingEnvVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\n💡 Please set these environment variables in your .env file or environment configuration.');
  console.error('   Example .env file should include:');
  console.error('   JWT_SECRET=your_secure_random_string_here');
  console.error('   MONGODB_URI=mongodb://localhost:27017/pothole_db');
  console.error('   R2_ACCESS_KEY_ID=your_r2_access_key');
  console.error('   ... (and other required variables)');
  process.exit(1);
}

// Validate JWT_SECRET strength
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  console.error('🚨 JWT_SECRET is too weak!');
  console.error('   JWT_SECRET must be at least 32 characters long for security.');
  console.error('   Current length:', process.env.JWT_SECRET.length);
  console.error('\n💡 Generate a secure JWT secret with:');
  console.error('   node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
  process.exit(1);
}

// Validate R2 configuration on startup
try {
  const { validateR2Config } = await import('./config/r2.js');
  if (!validateR2Config()) {
    console.error('🚨 R2 (Cloudflare Object Storage) configuration is invalid!');
    console.error('   Please check that all R2 environment variables are set:');
    console.error('   - R2_ACCESS_KEY_ID');
    console.error('   - R2_SECRET_ACCESS_KEY');
    console.error('   - R2_ENDPOINT');
    console.error('   - R2_BUCKET_NAME');
    console.error('   - CLOUDFLARE_WORKER_URL');
    console.error('\n💡 Verify your R2 credentials and bucket configuration in Cloudflare dashboard.');
    process.exit(1);
  }
} catch (error) {
  console.error('🚨 Failed to load R2 configuration:', error.message);
  console.error('   Stack:', error.stack);
  console.error('\n💡 Check that ./config/r2.js exists and is properly configured.');
  process.exit(1);
}

// Enhanced error handlers with memory leak prevention
const rejectedPromises = new WeakSet();
const maxRejections = 100; // Maximum number of rejections to track
let rejectionCount = 0;

process.on('unhandledRejection', (reason, promise) => {
  // Prevent memory leaks by not storing too many rejected promises
  if (rejectionCount >= maxRejections) {
    console.warn('🚨 Too many unhandled rejections. Resetting counter to prevent memory leak.');
    rejectionCount = 0;
  }
  
  // Track unique promises to prevent duplicate logging
  if (!rejectedPromises.has(promise)) {
    rejectedPromises.add(promise);
    rejectionCount++;
    
    console.error(`🚨 Unhandled Promise Rejection [${rejectionCount}]:`, {
      reason: reason instanceof Error ? reason.message : reason,
      stack: reason instanceof Error ? reason.stack : 'No stack trace',
      timestamp: new Date().toISOString(),
      processMemory: process.memoryUsage()
    });
    
    // Log to Sentry if available
    if (typeof Sentry !== 'undefined') {
      Sentry.captureException(reason);
    }
    
    // Clean up the promise reference after logging
    setTimeout(() => {
      if (rejectedPromises.has(promise)) {
        rejectedPromises.delete(promise);
      }
    }, 60000); // Clean up after 1 minute
  }
  
  // Don't exit the process, but monitor memory usage
  const memUsage = process.memoryUsage();
  if (memUsage.heapUsed > 512 * 1024 * 1024) { // 512MB threshold
    console.warn('⚠️ High memory usage detected. Consider restarting the application.');
  }
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  console.error('Stack trace:', error.stack);
  // Log to Sentry if available
  if (typeof Sentry !== 'undefined') {
    Sentry.captureException(error);
  }
  // Gracefully shutdown the server
  process.exit(1);
});

// Connect to database
connectDB();

// Add MongoDB connection event listeners
mongoose.connection.once('open', () => {
  console.log('🗄️  MongoDB: ✅ Connected');
});

mongoose.connection.on('error', (err) => {
  console.log('🗄️  MongoDB: ❌ Connection Error');
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🗄️  MongoDB: ❌ Disconnected');
});

// Initialize Express app
const app = express();

// MongoDB connection check middleware - Add this after app creation but before routes
app.use((req, res, next) => {
  // Skip health check endpoint
  if (req.path === '/health') {
    return next();
  }
  
  // Check if MongoDB is connected
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database connection not ready. Please try again in a moment.',
      retryAfter: 5
    });
  }
  
  next();
});

// Trust proxy for rate limiting behind reverse proxy (Render, Vercel, etc.)
app.set('trust proxy', 1);

// CORS configuration
const corsOptions = {
  origin: [
    'https://indian-potholes-fe.vercel.app',
    'http://localhost:5173',
    'https://localhost:5173',
    'https://www.indianpotholes.com'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(passport.initialize());

// Add request timeout middleware
app.use((req, res, next) => {
  req.setTimeout(30000); // 30 seconds timeout
  res.setTimeout(30000);
  next();
});

// Body parsing with better limits and error handling
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      throw new Error('Invalid JSON payload');
    }
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 1000 // Limit number of parameters
}));

// Security headers
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://www.google-analytics.com https://analytics.google.com;");
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// Health check endpoint with comprehensive checks
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Check memory usage
    const memUsage = process.memoryUsage();
    const memStatus = memUsage.heapUsed < 100 * 1024 * 1024 ? 'healthy' : 'high'; // 100MB threshold
    
    // Removed ImageKit configuration and status variables

    // Check R2 configuration and connectivity
    let r2Status = 'unknown';
    let r2Error = null;
    
    try {
      const { validateR2Config } = await import('./config/r2.js');
      if (validateR2Config()) {
        // Test connectivity by trying to list objects
        const { s3Client } = await import('./config/r2.js');
        const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
        
        const listCommand = new ListObjectsV2Command({
          Bucket: process.env.R2_BUCKET_NAME,
          MaxKeys: 1
        });
        
        await s3Client.send(listCommand);
        r2Status = 'connected';
      } else {
        r2Status = 'misconfigured';
      }
    } catch (error) {
      r2Status = 'error';
      r2Error = error.message;
    }
    
    res.json({
      success: true,
      message: 'Pothole Reporting API is running!',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      status: {
        database: dbStatus,
        memory: memStatus,
        r2: r2Status,
        uptime: process.uptime()
      },
      r2: {
        status: r2Status,
        error: r2Error
      },
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
        external: Math.round(memUsage.external / 1024 / 1024) + 'MB'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/potholes', potholeRoutes);

app.use('/api/r2', r2Routes);
app.use('/api/constituencies', constituenciesRoutes);
app.use('/api/bug-reports', bugReportRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/traffic', trafficRoutes);
app.use('/api/contribute-mp-mla', mpMlaContributionRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/validation', validationRoutes);

// Serve large static geojson/json files for frontend
app.get('/api/geo/india-ac', (req, res) => {
  res.type('application/json');
  res.sendFile(path.resolve(__dirname, 'data', 'India_AC.json'));
});

app.get('/api/geo/india-pc', (req, res) => {
  res.type('application/json');
  res.sendFile(path.resolve(__dirname, 'data', 'india_pc_2019_simplified.geojson'));
});

// Point-in-polygon lookup for assembly constituency
app.get('/api/geo/india-ac/lookup', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ success: false, message: 'Invalid lat/lng' });
  }
  try {
    const filePath = path.resolve(__dirname, 'data', 'India_AC.json');
    const geojson = JSON.parse(await fs.readFile(filePath, 'utf8'));
    const point = [lng, lat]; // GeoJSON uses [lng, lat]
    for (const feature of geojson.features) {
      if (!feature.geometry) continue;
      if (feature.geometry.type === 'Polygon') {
        if (inside(point, feature.geometry.coordinates[0])) {
          return res.json({ success: true, feature });
        }
      } else if (feature.geometry.type === 'MultiPolygon') {
        for (const polygon of feature.geometry.coordinates) {
          if (inside(point, polygon[0])) {
            return res.json({ success: true, feature });
          }
        }
      }
    }
    return res.status(404).json({ success: false, message: 'No constituency found for this location' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', details: err.message });
  }
});

// Debug endpoint for Sentry testing
app.get("/debug-sentry", function mainHandler(req, res) {
  throw new Error("My first Sentry error!");
});

// Handle 404 - Route not found
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// The error handler must be registered before any other error middleware and after all controllers
Sentry.setupExpressErrorHandler(app);

// Centralized error handling middleware
app.use((error, req, res, next) => {
  // Standardize error response format
  const errorResponse = {
    success: false,
    message: 'Internal server error'
  };

  // Only include detailed error information in development AND if explicitly enabled
  const isDevelopment = process.env.NODE_ENV === 'development';
  const debugEnabled = process.env.DEBUG_ERRORS === 'true';
  
  if (isDevelopment && debugEnabled) {
    // Only expose minimal debug info even in development
    errorResponse.errorId = Date.now().toString(36); // Unique error ID for tracking
    errorResponse.type = error.name || 'UnknownError';
    // Never expose full stack traces or sensitive details
  }
  
  // Log the full error details on the server side for debugging
  console.error(`Error ${errorResponse.errorId || 'UNKNOWN'}:`, {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Handle specific error types with sanitized messages
  if (error.code === 'LIMIT_FILE_SIZE') {
    errorResponse.message = 'File size too large. Maximum size is 50MB.';
    return res.status(400).json(errorResponse);
  }
  
  if (error.message && error.message.includes('Only images')) {
    errorResponse.message = 'Invalid file type. Only images and videos are allowed.';
    return res.status(400).json(errorResponse);
  }

  if (error.name === 'ValidationError') {
    errorResponse.message = 'Validation failed';
    errorResponse.errors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message
    }));
    return res.status(400).json(errorResponse);
  }

  if (error.name === 'CastError') {
    errorResponse.message = 'Invalid ID format';
    return res.status(400).json(errorResponse);
  }

  if (error.name === 'MongoError' && error.code === 11000) {
    errorResponse.message = 'Duplicate entry found';
    return res.status(400).json(errorResponse);
  }

  // Handle ImageKit errors - removed as ImageKit is no longer used

  // Handle database connection errors
  if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
    errorResponse.message = 'Database service temporarily unavailable';
    return res.status(503).json(errorResponse);
  }

  // Handle memory errors
  if (error.code === 'ENOMEM' || error.message.includes('memory')) {
    errorResponse.message = 'Server is experiencing high load, please try again later';
    return res.status(503).json(errorResponse);
  }

  // Handle timeout errors
  if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
    errorResponse.message = 'Request timed out, please try again';
    return res.status(408).json(errorResponse);
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    errorResponse.message = 'Authentication failed';
    return res.status(401).json(errorResponse);
  }

  // Handle rate limiting errors
  if (error.status === 429) {
    errorResponse.message = 'Too many requests, please try again later';
    return res.status(429).json(errorResponse);
  }

  // Default error response
  res.status(error.status || 500).json(errorResponse);
});

// Optional fallthrough error handler for Sentry
app.use(function onError(err, req, res, next) {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500;
  res.end(res.sentry + "\n");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
  
  // Check MongoDB connection status after a brief delay to allow connection to establish
  setTimeout(() => {
    const dbStatus = mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected';
    console.log(`🗄️  MongoDB: ${dbStatus}`);
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️  Warning: MongoDB is not connected. Some features may not work properly.');
    }
  }, 1000); // Wait 1 second for connection to establish
});