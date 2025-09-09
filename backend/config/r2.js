import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

dotenv.config();

// Validate R2 configuration
const validateR2Config = () => {
  const requiredKeys = [
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_ENDPOINT',
    'R2_BUCKET_NAME',
    'CLOUDFLARE_WORKER_URL'
  ];
  
  const missingKeys = requiredKeys.filter(key => !process.env[key]);
  
  if (missingKeys.length > 0) {
    return false;
  }
  
  return true;
};

// Configure S3 client for Cloudflare R2
const s3Client = new S3Client({
  region: process.env.R2_REGION || 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, // Required for R2
});

// File signature validation for better security
const fileSignatures = {
  // Images
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/jpg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/gif': [0x47, 0x49, 0x46],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
  'image/heic': [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63], // HEIC signature
  'image/heif': [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x66], // HEIF signature
  // Videos - MP4 can have multiple valid signatures
  'video/mp4': [
    [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], // Standard MP4
    [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70], // Alternative MP4
    [0x00, 0x00, 0x00, 0x1C, 0x66, 0x74, 0x79, 0x70], // Another MP4 variant
    [0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70], // Yet another MP4 variant
    [0x00, 0x00, 0x00, 0x24, 0x66, 0x74, 0x79, 0x70]  // Another common MP4 variant
  ],
  'video/avi': [0x52, 0x49, 0x46, 0x46],
  'video/x-msvideo': [0x52, 0x49, 0x46, 0x46],
  'video/mov': [0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70], // legacy mov MIME sometimes reported
  'video/quicktime': [0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70],
  'video/webm': [0x1A, 0x45, 0xDF, 0xA3],
  'video/x-matroska': [0x1A, 0x45, 0xDF, 0xA3],
  'video/x-m4v': [
    [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70],
    [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70]
  ],
  'video/3gpp': [
    [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70],
  ],
  'video/hevc': [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x76, 0x63] // HEVC signature
};

// Validate file signature
const validateFileSignature = (buffer, expectedMimeType) => {
  if (!buffer) return false;

  // Normalize common alias MIME types
  let mime = expectedMimeType;
  if (mime === 'image/jpg' || mime === 'image/pjpeg' || mime === 'image/jfif') mime = 'image/jpeg';
  if (mime === 'video/mov') mime = 'video/quicktime';

  // Minimal length checks (JPEG needs only first 3 bytes, others need >= 8)
  const minLen = mime === 'image/jpeg' ? 3 : 8;
  if (buffer.length < minLen) return false;

  const signature = fileSignatures[mime];
  if (!signature) return false;
  
  // For JPEG files, check for the standard JPEG signature
  if (mime === 'image/jpeg') {
    return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  }
  
  // For MP4-like files (ISO BMFF), check multiple possible signatures
  if (mime === 'video/mp4' || mime === 'video/quicktime' || mime === 'video/x-m4v' || mime === 'video/3gpp') {
    // MP4 files can have different signatures, so we check multiple possibilities
    for (const mp4Signature of signature) {
      let isValid = true;
      for (let i = 0; i < mp4Signature.length; i++) {
        if (buffer[i] !== mp4Signature[i]) {
          isValid = false;
          break;
        }
      }
      if (isValid) return true;
    }
    return false;
  }
  
  // For HEIC/HEIF files, check for the HEIC signature
  if (expectedMimeType === 'image/heic' || expectedMimeType === 'image/heif') {
    // HEIC files have a specific signature pattern
    return buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0x00 && 
           buffer[3] === 0x18 && buffer[4] === 0x66 && buffer[5] === 0x74 && 
           buffer[6] === 0x79 && buffer[7] === 0x70;
  }
  
  // For HEVC files, check for the HEVC signature
  if (expectedMimeType === 'video/hevc') {
    // HEVC files have a specific signature pattern
    return buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0x00 && 
           buffer[3] === 0x18 && buffer[4] === 0x66 && buffer[5] === 0x74 && 
           buffer[6] === 0x79 && buffer[7] === 0x70;
  }
  
  // For other file types, signature may be a list or a flat array
  if (Array.isArray(signature[0])) {
    // Choose any matching signature pattern
    for (const sig of signature) {
      let ok = true;
      for (let i = 0; i < sig.length; i++) {
        if (buffer[i] !== sig[i]) { ok = false; break; }
      }
      if (ok) return true;
    }
    return false;
  } else {
    for (let i = 0; i < signature.length; i++) {
      if (buffer[i] !== signature[i]) return false;
    }
  }
  return true;
};

// Enhanced file filter with content validation
const fileFilter = (req, file, cb) => {
  // Check if file object is valid and has required properties
  if (!file || !file.originalname || !file.mimetype) {
    return cb(new Error('Invalid file data received. Please ensure you are uploading files using multipart/form-data format.'));
  }

  // Check file type
  const allowedTypes = /jpeg|jpg|pjpeg|jfif|png|gif|webp|heic|heif|mp4|avi|mov|webm|hevc|quicktime|x-msvideo|x-m4v|x-matroska|3gpp|mkv|m4v|3gp/;
  const extname = allowedTypes.test(file.originalname.toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (!mimetype || !extname) {
    return cb(new Error('Only images (JPEG, JPG, PNG, GIF, WEBP, HEIC, HEIF) and videos (MP4, AVI, MOV, WEBM, HEVC) are allowed!'));
  }

  // Store file info for later validation
  req.fileInfo = {
    originalname: file.originalname,
    mimetype: file.mimetype
  };

  cb(null, true);
};

// Configure multer for memory storage with cleanup
const storage = multer.memoryStorage();

// Create multer upload middleware with better error handling
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 5, // Allow up to 5 files for multiple uploads
  },
  fileFilter: fileFilter
});

// Enhanced file validation middleware
const validateUploadedFile = (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded'
    });
  }

  // Validate each file
  for (const file of req.files) {
    const { buffer, mimetype, originalname } = file;

    // Validate file size
    if (buffer.length > 50 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 50MB.'
      });
    }

    // Validate file signature
    if (!validateFileSignature(buffer, mimetype)) {
      try {
        const head = Array.from(buffer.subarray(0, 12)).map(b => b.toString(16).padStart(2, '0')).join(' ');
        console.warn('Upload signature mismatch', { mimetype, originalname, head });
      } catch (_) { /* no-op */ }
      return res.status(400).json({
        success: false,
        message: 'Invalid file content. File appears to be corrupted or of wrong type.'
      });
    }

    // Additional security checks
    const fileName = originalname.toLowerCase();
    
    // Check for potentially dangerous file extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'];
    const hasDangerousExtension = dangerousExtensions.some(ext => fileName.endsWith(ext));
    
    if (hasDangerousExtension) {
      return res.status(400).json({
        success: false,
        message: 'File type not allowed for security reasons.'
      });
    }
  }

  next();
};

// Function to upload file to R2 with retry logic
const uploadToR2 = async (file, folder = 'pothole-reports', retries = 3) => {
  // Validate file object
  if (!file || !file.buffer || !file.originalname) {
    throw new Error('Invalid file object provided for upload');
  }

  // Validate R2 configuration
  if (!validateR2Config()) {
    throw new Error('R2 configuration is invalid');
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Generate a unique base filename
      const timestamp = Date.now();
      const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const originalExt = (safeOriginalName.split('.').pop() || '').toLowerCase();
      const uniqueId = uuidv4();

      // Optimize images before upload (rotate, resize, compress)
      let uploadBody = file.buffer;
      let contentType = file.mimetype || 'application/octet-stream';
      let finalExt = originalExt;
      let optimizationMeta = {};

      try {
        const isImage = contentType.startsWith('image/');
        const isGif = contentType === 'image/gif' || originalExt === 'gif';
        if (isImage && !isGif) {
          // Build base pipeline
          const base = sharp(file.buffer, { failOn: 'none' })
            .rotate()
            .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true });

          const meta = await base.metadata();
          const candidates = [];

          // Same-format candidate when JPEG/PNG
          if (contentType === 'image/jpeg' || originalExt === 'jpg' || originalExt === 'jpeg') {
            const jpegBuf = await base.clone().jpeg({ quality: 82, mozjpeg: true }).toBuffer();
            candidates.push({ name: 'same-jpeg', buf: jpegBuf, ext: 'jpg', mime: 'image/jpeg' });
          } else if (contentType === 'image/png' || originalExt === 'png') {
            const pngBuf = await base.clone().png({ compressionLevel: 9, palette: true }).toBuffer();
            candidates.push({ name: 'same-png', buf: pngBuf, ext: 'png', mime: 'image/png' });
          }

          // WebP candidate(s)
          if (meta && meta.hasAlpha) {
            const webpLossless = await base.clone().webp({ lossless: true, effort: 4 }).toBuffer();
            candidates.push({ name: 'webp-lossless', buf: webpLossless, ext: 'webp', mime: 'image/webp' });
          } else {
            const webpLossy = await base.clone().webp({ quality: 80, effort: 4 }).toBuffer();
            candidates.push({ name: 'webp-lossy', buf: webpLossy, ext: 'webp', mime: 'image/webp' });
          }

          // Choose smallest candidate that is smaller than original
          const originalSize = file.buffer.length;
          let best = null;
          for (const c of candidates) {
            const size = c.buf.length;
            if (!best || size < best.size) best = { ...c, size };
          }
          if (best && best.size < originalSize) {
            uploadBody = best.buf;
            contentType = best.mime;
            finalExt = best.ext;
            optimizationMeta = {
              'optimized': 'true',
              'optimized-variant': best.name,
              'original-size': originalSize.toString(),
              'new-size': best.size.toString(),
            };
          }
        }
      } catch (optError) {
        // If optimization fails, fall back to original buffer
        console.warn('Image optimization failed, using original file:', optError.message);
      }

      const fileName = `${folder}/${timestamp}-${uniqueId}.${finalExt}`;

      // Upload to R2
      const uploadCommand = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileName,
        Body: uploadBody,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000', // 1 year cache
        Metadata: {
          'original-name': file.originalname,
          'upload-timestamp': timestamp.toString(),
          'file-size': uploadBody.length.toString(),
          ...optimizationMeta
        }
      });

      await s3Client.send(uploadCommand);
      
      // Clear the buffer to free memory properly
      if (file.buffer) {
        file.buffer = Buffer.alloc(0); // More explicit memory deallocation
      }
      
      // Return the public URL via Cloudflare Worker
      const publicUrl = `${process.env.CLOUDFLARE_WORKER_URL}/${fileName}`;
      
      const result = {
        url: publicUrl,
        fileId: fileName, // Use the full path as fileId for consistency
        fileName: fileName,
        size: uploadBody.length,
        contentType: contentType
      };
      
      return result;
    } catch (error) {
      if (attempt === retries) {
        throw new Error(`Failed to upload file after ${retries} attempts: ${error.message}`);
      }
      
      // Wait before retrying (exponential backoff)
      const waitTime = 1000 * attempt;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};

// Function to delete file from R2 with retry logic
const deleteFromR2 = async (fileId, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileId
      });

      const result = await s3Client.send(deleteCommand);
      return result;
    } catch (error) {
      if (attempt === retries) {
        throw new Error(`Failed to delete file after ${retries} attempts: ${error.message}`);
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

// Function to check if file exists in R2
const fileExistsInR2 = async (fileId) => {
  try {
    const headCommand = new HeadObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileId
    });

    await s3Client.send(headCommand);
    return true;
  } catch (error) {
    if (error.name === 'NotFound') {
      return false;
    }
    throw error;
  }
};

// Cleanup function for file buffers
const cleanupFileBuffer = (file) => {
  if (file && file.buffer) {
    file.buffer = Buffer.alloc(0); // More explicit memory deallocation
  }
};

export { 
  s3Client, 
  upload, 
  uploadToR2, 
  deleteFromR2, 
  fileExistsInR2,
  cleanupFileBuffer,
  validateUploadedFile,
  validateR2Config
}; 
