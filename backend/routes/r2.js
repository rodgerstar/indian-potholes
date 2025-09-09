import express from 'express';
import { upload, uploadToR2, deleteFromR2, fileExistsInR2, validateUploadedFile, validateR2Config } from '../config/r2.js';
import { sanitizeInput } from '../middleware/sanitize.js';
import { apiLimiter, uploadLimiter } from '../middleware/rateLimit.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/r2/upload
// @desc    Upload files to Cloudflare R2
// @access  Public (but you might want to make it private)
router.post('/upload', uploadLimiter, upload.array('files', 5), validateUploadedFile, sanitizeInput, async (req, res) => {
  try {
    // Validate R2 configuration
    if (!validateR2Config()) {
      return res.status(500).json({
        success: false,
        message: 'R2 configuration is invalid'
      });
    }

    const uploadedFiles = [];
    const errors = [];

    // Upload each file
    for (const file of req.files) {
      try {
        const uploadResult = await uploadToR2(file, 'pothole-reports');
        uploadedFiles.push({
          originalName: file.originalname,
          fileName: uploadResult.fileName,
          url: uploadResult.url,
          fileId: uploadResult.fileId,
          size: uploadResult.size,
          contentType: uploadResult.contentType
        });
      } catch (error) {
        errors.push({
          fileName: file.originalname,
          error: error.message
        });
      }
    }

    // Return results
    res.json({
      success: true,
      message: `Successfully uploaded ${uploadedFiles.length} files`,
      data: {
        uploadedFiles,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to upload files'
    });
  }
});

// @route   DELETE /api/r2/delete/:fileId
// @desc    Delete a file from Cloudflare R2
// @access  Private (requires authentication)
router.delete('/delete/:fileId', apiLimiter, authenticateToken, sanitizeInput, async (req, res) => {
  try {
    const { fileId } = req.params;

    // Validate fileId
    if (!fileId || fileId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'File ID is required'
      });
    }

    // Check if file exists
    const exists = await fileExistsInR2(fileId);
    if (!exists) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Delete file
    await deleteFromR2(fileId);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete file'
    });
  }
});

// @route   GET /api/r2/exists/:fileId
// @desc    Check if a file exists in Cloudflare R2
// @access  Public
router.get('/exists/:fileId', apiLimiter, sanitizeInput, async (req, res) => {
  try {
    const { fileId } = req.params;

    // Validate fileId
    if (!fileId || fileId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'File ID is required'
      });
    }

    // Check if file exists
    const exists = await fileExistsInR2(fileId);

    res.json({
      success: true,
      data: {
        exists,
        fileId
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check file existence'
    });
  }
});

// @route   GET /api/r2/health
// @desc    Check R2 configuration and connectivity
// @access  Public
router.get('/health', apiLimiter, async (req, res) => {
  try {
    const configValid = validateR2Config();
    
    if (!configValid) {
      return res.status(500).json({
        success: false,
        message: 'R2 configuration is invalid',
        data: {
          status: 'misconfigured'
        }
      });
    }

    // Test connectivity by trying to list objects (this will fail if credentials are wrong)
    const { s3Client } = await import('../config/r2.js');
    const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
    
    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET_NAME,
        MaxKeys: 1
      });
      
      await s3Client.send(listCommand);
      
      res.json({
        success: true,
        message: 'R2 is healthy and accessible',
        data: {
          status: 'healthy',
          bucket: process.env.R2_BUCKET_NAME,
          workerUrl: process.env.CLOUDFLARE_WORKER_URL
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'R2 connectivity test failed',
        data: {
          status: 'connection_error',
          error: error.message
        }
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check R2 health',
      data: {
        status: 'error',
        error: error.message
      }
    });
  }
});

export default router; 