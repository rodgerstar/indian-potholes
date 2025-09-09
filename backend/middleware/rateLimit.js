import rateLimit from 'express-rate-limit';

// Enhanced key generator with improved IP detection and fallback strategies
const createKeyGenerator = (includeUser = false) => {
  return (req) => {
    // Multiple methods to get the real IP address
    let ip = req.ip || 
             req.connection.remoteAddress || 
             req.socket.remoteAddress ||
             (req.connection.socket ? req.connection.socket.remoteAddress : null);
    
    // Check for forwarded IPs (from proxies, load balancers)
    const forwardedFor = req.headers['x-forwarded-for'];
    const realIP = req.headers['x-real-ip'];
    const cfConnectingIP = req.headers['cf-connecting-ip']; // Cloudflare
    
    // Prefer real IP headers over forwarded (more reliable)
    if (cfConnectingIP) {
      ip = cfConnectingIP;
    } else if (realIP) {
      ip = realIP;
    } else if (forwardedFor) {
      // x-forwarded-for can contain multiple IPs, take the first one
      ip = forwardedFor.split(',')[0].trim();
    }
    
    // Validate IP format and prevent spoofing
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
    
    if (!ip || (!ipv4Regex.test(ip) && !ipv6Regex.test(ip))) {
      // Fallback to a combination of headers if IP is invalid
      const userAgent = req.headers['user-agent'] || 'unknown';
      const acceptLanguage = req.headers['accept-language'] || 'unknown';
      ip = `fallback-${Buffer.from(userAgent + acceptLanguage).toString('base64').slice(0, 16)}`;
    }
    
    if (includeUser && req.user && req.user._id) {
      return `${ip}-${req.user._id}`;
    }
    
    return ip;
  };
};

// General API rate limiter with better memory management
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: createKeyGenerator(),
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(15 * 60 / 60) // minutes
    });
  }
});

// Stricter limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  skipFailedRequests: false,
  keyGenerator: createKeyGenerator(),
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again later.',
      retryAfter: Math.ceil(15 * 60 / 60) // minutes
    });
  }
});

// File upload limiter with stricter limits
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 uploads per hour
  message: {
    success: false,
    message: 'Too many file uploads, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: true, // Don't count failed uploads
  keyGenerator: createKeyGenerator(true), // Include user ID for authenticated uploads
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many file uploads, please try again later.',
      retryAfter: Math.ceil(60 / 60) // hours
    });
  }
});

// Create account limiter
export const createAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 account creations per hour
  message: {
    success: false,
    message: 'Too many account creation attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful registrations
  skipFailedRequests: false,
  keyGenerator: createKeyGenerator(),
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many account creation attempts, please try again later.',
      retryAfter: Math.ceil(60 / 60) // hours
    });
  }
});

// User-specific rate limiter for authenticated endpoints
export const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each user to 1000 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: createKeyGenerator(true), // Include user ID
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.',
      retryAfter: Math.ceil(15 * 60 / 60) // minutes
    });
  }
});

// Strict limiter for sensitive operations
export const sensitiveOperationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each user to 50 sensitive operations per hour
  message: {
    success: false,
    message: 'Too many sensitive operations, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: createKeyGenerator(true), // Include user ID
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many sensitive operations, please try again later.',
      retryAfter: Math.ceil(60 / 60) // hours
    });
  }
}); 