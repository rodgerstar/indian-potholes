/**
 * Cloudflare Worker for serving pothole images from R2
 * 
 * Features:
 * - Serves images from R2 bucket with proper headers
 * - Optimized caching (1 year cache for images)
 * - Automatic content-type detection
 * - 404 handling for missing images
 * - CORS support for cross-origin requests
 * - Security headers
 * - Image optimization via Cloudflare's CDN
 */

export default {
  async fetch(request, env, ctx) {
    try {
      // Parse the URL to get the file path
      const url = new URL(request.url);
      const path = url.pathname;
      
      // Remove leading slash and get the file key
      const fileKey = path.startsWith('/') ? path.slice(1) : path;
      
      // Handle root path
      if (!fileKey || fileKey === '') {
        return new Response('Pothole Images CDN', {
          status: 200,
          headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'public, max-age=3600'
          }
        });
      }

      // Get the object from R2
      const object = await env.R2_BUCKET.get(fileKey);
      
      if (!object) {
        return new Response('Image not found', {
          status: 404,
          headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'public, max-age=3600'
          }
        });
      }

      // Determine content type based on file extension
      const contentType = getContentType(fileKey);
      
      // Get object headers
      const headers = new Headers();
      
      // Set content type
      headers.set('Content-Type', contentType);
      
      // Set cache control headers for optimal performance
      if (isImage(fileKey)) {
        // Images: 1 year cache
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        headers.set('Expires', new Date(Date.now() + 31536000 * 1000).toUTCString());
      } else if (isVideo(fileKey)) {
        // Videos: 1 month cache
        headers.set('Cache-Control', 'public, max-age=2592000');
        headers.set('Expires', new Date(Date.now() + 2592000 * 1000).toUTCString());
      } else {
        // Other files: 1 hour cache
        headers.set('Cache-Control', 'public, max-age=3600');
        headers.set('Expires', new Date(Date.now() + 3600 * 1000).toUTCString());
      }
      
      // Set security headers
      headers.set('X-Content-Type-Options', 'nosniff');
      headers.set('X-Frame-Options', 'DENY');
      headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // Set CORS headers for cross-origin requests
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type, Range');
      headers.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range');
      headers.set('Access-Control-Max-Age', '86400');
      headers.set('Timing-Allow-Origin', '*');
      
      // Always advertise range support for media
      headers.set('Accept-Ranges', 'bytes');

      // Add CORP to allow embedding on cross-origin pages that use COEP
      headers.set('Cross-Origin-Resource-Policy', 'cross-origin');

      // Ensure inline disposition so browsers try to play rather than download
      const filename = fileKey.split('/').pop() || 'file';
      headers.set('Content-Disposition', `inline; filename="${filename}"`);

      // Handle range requests for video streaming using R2 partial reads
      const range = request.headers.get('range');
      if (range && isVideo(fileKey)) {
        const size = object.size;
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : size - 1;
        const chunksize = (end - start) + 1;

        // Fetch only the requested byte range from R2
        const rangedObject = await env.R2_BUCKET.get(fileKey, {
          range: { offset: start, length: chunksize }
        });

        if (!rangedObject || !rangedObject.body) {
          return new Response('Range Not Satisfiable', {
            status: 416,
            headers: {
              'Content-Range': `bytes */${size}`
            }
          });
        }

        headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
        headers.set('Content-Length', chunksize.toString());

        return new Response(rangedObject.body, {
          status: 206,
          headers
        });
      }
      
      // Set content length for full response
      headers.set('Content-Length', object.size.toString());
      
      // Handle HEAD requests
      if (request.method === 'HEAD') {
        return new Response(null, {
          status: 200,
          headers
        });
      }
      
      // Handle OPTIONS requests
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 200,
          headers
        });
      }
      
      // Return the object with headers
      return new Response(object.body, {
        status: 200,
        headers
      });
      
    } catch (error) {
      return new Response('Internal Server Error', {
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache'
        }
      });
    }
  }
};

/**
 * Get content type based on file extension
 */
function getContentType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  
  const contentTypes = {
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'bmp': 'image/bmp',
    'tiff': 'image/tiff',
    'tif': 'image/tiff',
    
    // Videos
    'mp4': 'video/mp4',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    'wmv': 'video/x-ms-wmv',
    'flv': 'video/x-flv',
    'webm': 'video/webm',
    'mkv': 'video/x-matroska',
    '3gp': 'video/3gpp',
    'm4v': 'video/x-m4v',
    
    // Audio
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'm4a': 'audio/mp4',
    'aac': 'audio/aac',
    
    // Documents
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'xml': 'application/xml',
    
    // Archives
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    'tar': 'application/x-tar',
    'gz': 'application/gzip'
  };
  
  return contentTypes[ext] || 'application/octet-stream';
}

/**
 * Check if file is an image
 */
function isImage(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'bmp', 'tiff', 'tif'].includes(ext);
}

/**
 * Check if file is a video
 */
function isVideo(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  return ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', '3gp', 'm4v'].includes(ext);
} 
