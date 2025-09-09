import xss from 'xss';
import indiaBoundaryService from '../services/indiaBoundaryService.js';

// Enhanced sanitize middleware to prevent XSS and other injection attacks
export const sanitizeInput = (req, res, next) => {
  try {
    // Deep sanitization function for nested objects
    const deepSanitize = (obj, depth = 0) => {
      // Prevent deeply nested object attacks
      if (depth > 10) {
        throw new Error('Object nesting too deep');
      }
      
      if (Array.isArray(obj)) {
        return obj.map(item => deepSanitize(item, depth + 1));
      }
      
      if (obj !== null && typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
          // Validate property names
          if (typeof key === 'string' && key.length > 0 && key.length < 100) {
            const sanitizedKey = xss(key.trim());
            sanitized[sanitizedKey] = deepSanitize(value, depth + 1);
          }
        }
        return sanitized;
      }
      
      if (typeof obj === 'string') {
        // Enhanced string validation
        if (obj.length > 10000) { // Prevent extremely large strings
          throw new Error('String too long');
        }
        
        // Remove null bytes and other dangerous characters
        const cleaned = obj.replace(/\0/g, '').trim();
        return xss(cleaned);
      }
      
      return obj;
    };

    // Sanitize body with enhanced validation
    if (req.body) {
      req.body = deepSanitize(req.body);
    }

    // Sanitize query parameters with length limits
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        if (typeof req.query[key] === 'string') {
          if (req.query[key].length > 1000) {
            throw new Error('Query parameter too long');
          }
          req.query[key] = xss(req.query[key].trim());
        }
      });
    }

    // Sanitize URL parameters with validation
    if (req.params) {
      Object.keys(req.params).forEach(key => {
        if (typeof req.params[key] === 'string') {
          if (req.params[key].length > 100) {
            throw new Error('URL parameter too long');
          }
          req.params[key] = xss(req.params[key].trim());
        }
      });
    }

    next();
  } catch (error) {
    console.warn('Input sanitization error:', error.message);
    return res.status(400).json({
      success: false,
      message: 'Invalid input data format'
    });
  }
};

// Validate ObjectId format
export const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  
  // Check if id is a valid MongoDB ObjectId format
  const objectIdPattern = /^[0-9a-fA-F]{24}$/;
  
  if (!objectIdPattern.test(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  
  next();
};

// Validate file upload
export const validateFileUpload = (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded'
    });
  }
  
  next();
};

// Validate coordinates and ensure they are within India
export const validateCoordinates = async (req, res, next) => {
  const { latitude, longitude } = req.body;
  
  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Latitude and longitude are required'
    });
  }
  
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  
  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid coordinates format'
    });
  }
  
  if (lat < -90 || lat > 90) {
    return res.status(400).json({
      success: false,
      message: 'Latitude must be between -90 and 90'
    });
  }
  
  if (lng < -180 || lng > 180) {
    return res.status(400).json({
      success: false,
      message: 'Longitude must be between -180 and 180'
    });
  }

  // Check if coordinates are within India's boundaries
  try {
    const isWithinIndia = await indiaBoundaryService.isWithinIndia(lat, lng);
    
    if (!isWithinIndia) {
      return res.status(400).json({
        success: false,
        message: 'Pothole reporting is only available within India\'s boundaries'
      });
    }
  } catch (error) {
    console.error('Error validating India boundary:', error);
    // If boundary service fails, still allow the request but log the error
    console.warn('India boundary validation failed, allowing request');
  }
  
  next();
};

// Database query validation middleware
export const validateDatabaseQuery = (req, res, next) => {
  // Validate query parameters for database operations
  const { page, limit, sortBy, order } = req.query;
  
  // Validate pagination parameters
  if (page !== undefined) {
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid page number'
      });
    }
  }
  
  if (limit !== undefined) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid limit. Must be between 1 and 100'
      });
    }
  }
  
  // Validate sort parameters
  if (sortBy !== undefined) {
    const allowedSortFields = ['createdAt', 'updatedAt', 'upvotes', 'status'];
    if (!allowedSortFields.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sort field'
      });
    }
  }
  
  if (order !== undefined && !['asc', 'desc'].includes(order)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid sort order. Must be "asc" or "desc"'
    });
  }
  
  next();
};

// Input length validation middleware
export const validateInputLength = (maxLength = 1000) => {
  return (req, res, next) => {
    const bodyLength = JSON.stringify(req.body).length;
    const queryLength = JSON.stringify(req.query).length;
    const paramsLength = JSON.stringify(req.params).length;
    
    const totalLength = bodyLength + queryLength + paramsLength;
    
    if (totalLength > maxLength) {
      return res.status(400).json({
        success: false,
        message: 'Input data too large'
      });
    }
    
    next();
  };
};

// Validate JSON payload size
export const validateJsonSize = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'], 10);
  const maxSize = 10 * 1024 * 1024; // 10MB for JSON payloads
  
  if (contentLength > maxSize) {
    return res.status(413).json({
      success: false,
      message: 'Request payload too large'
    });
  }
  
  next();
};

// Specific sanitization for different data types
export const sanitizeText = (text) => {
  if (typeof text !== 'string') return text;
  return xss(text.trim());
};

export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return email;
  return xss(email.toLowerCase().trim());
};

export const sanitizeLocation = (location) => {
  if (typeof location !== 'string') return location;
  return xss(location.trim());
};

// Sanitize regex input to prevent ReDoS and injection attacks
export const sanitizeRegexInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove or escape dangerous regex characters that could cause ReDoS
  const dangerousChars = /[.*+?^${}()|[\]\\]/g;
  
  // Escape the dangerous characters
  return input.replace(dangerousChars, '\\$&').trim();
};

// Validate and sanitize search terms for database queries
export const validateSearchTerm = (searchTerm, maxLength = 100) => {
  if (!searchTerm || typeof searchTerm !== 'string') {
    return '';
  }
  
  // Trim and limit length
  const trimmed = searchTerm.trim();
  if (trimmed.length === 0) {
    return '';
  }
  
  if (trimmed.length > maxLength) {
    return trimmed.substring(0, maxLength);
  }
  
  // Sanitize for XSS
  const xssSanitized = xss(trimmed);
  
  // Sanitize for regex
  return sanitizeRegexInput(xssSanitized);
}; 