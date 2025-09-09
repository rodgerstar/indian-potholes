// Input sanitization utilities

/**
 * Sanitizes user input to prevent XSS attacks
 * @param {string} input - The input string to sanitize
 * @returns {string} - The sanitized string
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .trim(); // Only trim leading/trailing whitespace, do not remove internal spaces
};

/**
 * Sanitizes email input
 * @param {string} email - The email to sanitize
 * @returns {string} - The sanitized email
 */
export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return '';
  
  return email
    .toLowerCase()
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

/**
 * Sanitizes file name
 * @param {string} fileName - The file name to sanitize
 * @returns {string} - The sanitized file name
 */
export const sanitizeFileName = (fileName) => {
  if (typeof fileName !== 'string') return '';
  
  return fileName
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
    .replace(/\.\./g, '') // Remove directory traversal
    .trim();
};

/**
 * Validates and sanitizes form data
 * @param {Object} formData - The form data object
 * @returns {Object} - The sanitized form data
 */
export const sanitizeFormData = (formData) => {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(formData)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}; 