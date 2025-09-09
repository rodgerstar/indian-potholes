/**
 * R2 Utilities
 * 
 * Utility functions for working with Cloudflare R2 images and URLs
 */

/**
 * Get the R2 Worker URL from environment variables
 * @returns {string} The R2 Worker URL
 */
export const getR2WorkerUrl = () => {
  return import.meta.env.VITE_CLOUDFLARE_WORKER_URL || 
         'https://pothole-images.your-account-id.workers.dev';
};

/**
 * Build a complete R2 image URL
 * @param {string} filePath - The file path in R2 (e.g., 'pothole-reports/1234567890-abc123.jpg')
 * @returns {string} Complete R2 image URL
 */
export const buildR2Url = (filePath) => {
  if (!filePath) return '';
  
  const workerUrl = getR2WorkerUrl();
  return `${workerUrl}/${filePath}`;
};

/**
 * Extract file path from R2 URL
 * @param {string} url - Full R2 URL
 * @returns {string} File path in R2
 */
export const extractR2Path = (url) => {
  if (!url) return '';
  
  const workerUrl = getR2WorkerUrl();
  if (url.startsWith(workerUrl)) {
    return url.replace(workerUrl, '').replace(/^\//, '');
  }
  
  return url;
};

/**
 * Check if a URL is an R2 URL
 * @param {string} url - URL to check
 * @returns {boolean} True if it's an R2 URL
 */
export const isR2Url = (url) => {
  if (!url) return false;
  
  const workerUrl = getR2WorkerUrl();
  return url.startsWith(workerUrl);
};

/**
 * Get image dimensions from URL (if available in metadata)
 * @param {string} url - R2 image URL
 * @returns {Promise<{width: number, height: number} | null>}
 */
export const getImageDimensions = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) return null;
    
    const width = response.headers.get('x-image-width');
    const height = response.headers.get('x-image-height');
    
    if (width && height) {
      return {
        width: parseInt(width, 10),
        height: parseInt(height, 10)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting image dimensions:', error);
    return null;
  }
};

/**
 * Preload an image
 * @param {string} url - Image URL to preload
 * @returns {Promise<HTMLImageElement>}
 */
export const preloadImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

/**
 * Get optimized image URL with size parameters
 * @param {string} url - Original R2 URL
 * @param {Object} options - Optimization options
 * @param {number} options.width - Target width
 * @param {number} options.height - Target height
 * @param {string} options.format - Output format (webp, jpeg, png)
 * @param {number} options.quality - Quality (1-100)
 * @returns {string} Optimized URL
 */
export const getOptimizedImageUrl = (url, options = {}) => {
  if (!url || !isR2Url(url)) return url;
  
  const { width, height, format, quality } = options;
  const params = new URLSearchParams();
  
  if (width) params.append('w', width);
  if (height) params.append('h', height);
  if (format) params.append('f', format);
  if (quality) params.append('q', quality);
  
  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
};

/**
 * Generate thumbnail URL
 * @param {string} url - Original R2 URL
 * @param {number} size - Thumbnail size (default: 200)
 * @returns {string} Thumbnail URL
 */
export const getThumbnailUrl = (url, size = 200) => {
  return getOptimizedImageUrl(url, {
    width: size,
    height: size,
    format: 'webp',
    quality: 80
  });
};

/**
 * Generate responsive image URLs for different screen sizes
 * @param {string} url - Original R2 URL
 * @param {Object} sizes - Size configurations
 * @returns {Object} Responsive image URLs
 */
export const getResponsiveImageUrls = (url, sizes = {}) => {
  const defaultSizes = {
    thumbnail: 150,
    small: 300,
    medium: 600,
    large: 900,
    xlarge: 1200
  };
  
  const finalSizes = { ...defaultSizes, ...sizes };
  const responsiveUrls = {};
  
  Object.entries(finalSizes).forEach(([size, width]) => {
    responsiveUrls[size] = getOptimizedImageUrl(url, {
      width,
      format: 'webp',
      quality: 85
    });
  });
  
  return responsiveUrls;
};

/**
 * Check if image exists
 * @param {string} url - Image URL to check
 * @returns {Promise<boolean>}
 */
export const imageExists = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('Error checking image existence:', error);
    return false;
  }
};

/**
 * Get file extension from URL
 * @param {string} url - Image URL
 * @returns {string} File extension
 */
export const getFileExtension = (url) => {
  if (!url) return '';
  
  const path = url.split('?')[0]; // Remove query parameters
  const extension = path.split('.').pop().toLowerCase();
  
  return extension;
};

/**
 * Check if file is an image
 * @param {string} url - File URL
 * @returns {boolean} True if it's an image
 */
export const isImageFile = (url) => {
  const extension = getFileExtension(url);
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'bmp', 'tiff', 'tif'];
  
  return imageExtensions.includes(extension);
};

/**
 * Check if file is a video
 * @param {string} url - File URL
 * @returns {boolean} True if it's a video
 */
export const isVideoFile = (url) => {
  const extension = getFileExtension(url);
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', '3gp', 'm4v'];
  
  return videoExtensions.includes(extension);
};

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Generate a unique filename
 * @param {string} originalName - Original filename
 * @param {string} extension - File extension
 * @returns {string} Unique filename
 */
export const generateUniqueFilename = (originalName, extension) => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const safeName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  return `${timestamp}-${randomId}-${safeName}.${extension}`;
};

/**
 * Validate R2 URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid R2 URL
 */
export const validateR2Url = (url) => {
  if (!url) return false;
  
  try {
    const parsedUrl = new URL(url);
    const workerUrl = getR2WorkerUrl();
    const parsedWorkerUrl = new URL(workerUrl);
    
    return parsedUrl.hostname === parsedWorkerUrl.hostname;
  } catch (error) {
    return false;
  }
}; 