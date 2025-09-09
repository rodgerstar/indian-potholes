import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import Pothole from '../models/Pothole.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload, uploadToR2, deleteFromR2, cleanupFileBuffer, validateUploadedFile } from '../config/r2.js';
import { sanitizeInput, validateObjectId, validateFileUpload, validateCoordinates } from '../middleware/sanitize.js';
import { uploadLimiter, apiLimiter, userLimiter, sensitiveOperationLimiter } from '../middleware/rateLimit.js';
import constituencyService from '../services/constituencyService.js';
import NotificationService from '../services/notificationService.js';
import constituencyAssignmentService from '../services/constituencyAssignmentService.js';
import indiaBoundaryService from '../services/indiaBoundaryService.js';

const router = express.Router();

// @route   POST /api/potholes/guest
// @desc    Create a new pothole report for guests without reCAPTCHA
// @access  Public (guests only, no reCAPTCHA required)
router.post('/guest', uploadLimiter, sanitizeInput, upload.array('media', 5), validateUploadedFile, validateFileUpload, [
  body('locationName')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Location name must be between 3 and 200 characters'),
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('state').optional().trim().isLength({ max: 100 }),
  body('constituency').optional().trim().isLength({ max: 100 }),
  body('parliamentaryConstituency').optional().trim().isLength({ max: 100 }),
  body('contractor').optional().trim().isLength({ max: 100 }),
  body('engineer').optional().trim().isLength({ max: 100 }),
  body('corporator').optional().trim().isLength({ max: 100 }),
  body('mla').optional().trim().isLength({ max: 100 }),
  body('mp').optional().trim().isLength({ max: 100 }),
  body('severity')
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Severity must be one of: low, medium, high, critical'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 0, max: 500 })
    .withMessage('Description must be between 0 and 500 characters'),
  body('isAnonymous').optional().isBoolean().withMessage('isAnonymous must be a boolean'),
  body('guestEmail').optional().isEmail().withMessage('Invalid email format')
], async (req, res) => {
  let uploadedFileIds = [];

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

    const {
      locationName,
      latitude,
      longitude,
      state,
      constituency,
      contractor,
      engineer,
      corporator,
      mla,
      mp,
      severity,
      description,
      isAnonymous,
      guestEmail
    } = req.body;

    // Handle multiple file uploads
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one photo or video is required.' });
    }

    // Validate coordinates are within India's boundaries
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    // Basic coordinate validation
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates provided'
      });
    }

    try {
      const isWithinIndia = await indiaBoundaryService.isWithinIndia(lat, lng);
      if (!isWithinIndia) {
        return res.status(400).json({
          success: false,
          message: 'Pothole reporting is only available within India\'s boundaries. Please select a location within India.'
        });
      }
    } catch (error) {
      console.error('India boundary validation error during guest submission:', error);
      // Continue with submission if validation service fails (for robustness)
    }

    const mediaArray = [];
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      
      try {
        const uploadResult = await uploadToR2(file, 'pothole-reports');
        
        uploadedFileIds.push(uploadResult.fileId);
        const mediaType = file.mimetype.startsWith('video/') ? 'video' : 'image';
        const mediaUrl = uploadResult.url;
        mediaArray.push({
          type: mediaType,
          url: mediaUrl,
          publicId: uploadResult.fileId
        });
        cleanupFileBuffer(file);
      } catch (uploadError) {
        throw uploadError;
      }
    }

    // Create pothole report as guest submission
    const potholeData = {
      isAnonymous: isAnonymous === 'true' || isAnonymous === true,
      location: {
        name: locationName,
        coordinates: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        }
      },
      state: state,
      constituency: constituency,
      severity: severity,
      description: description,
      media: mediaArray,
      authorities: {
        contractor: contractor || '',
        engineer: engineer || '',
        corporator: corporator || '',
        mla: mla || '',
        mp: mp || ''
      },
      submittedBy: 'guest'
    };
    
    if (guestEmail) {
      potholeData.guestEmail = guestEmail;
    }

    const pothole = new Pothole(potholeData);
    
    // Ensure reportId is generated if not present
    if (!pothole.reportId) {
      let unique = false;
      let newId;
      while (!unique) {
        newId = Math.floor(1000000000 + Math.random() * 9000000000).toString(); // 10-digit
        const existing = await Pothole.findOne({ reportId: newId });
        if (!existing) unique = true;
      }
      pothole.reportId = newId;
    }
    
    await pothole.save();
    
    // Try to auto-assign constituencies in background
    const { latitude: potholeLatitude, longitude: potholeLongitude } = pothole.location.coordinates;
    try {
      await constituencyAssignmentService.tryAutoAssignment(pothole._id, potholeLatitude, potholeLongitude);
    } catch (error) {
      console.log('Background constituency assignment failed, will be handled by admin');
    }
    
    res.status(201).json({
      success: true,
      message: 'Pothole report created successfully',
      data: { pothole, reportId: pothole.reportId }
    });
  } catch (error) {
    // Cleanup file buffers and uploaded files on error
    // Use Promise.all to handle cleanup concurrently and avoid blocking the response
    const cleanupPromises = [];
    
    if (req.files) {
      req.files.forEach(cleanupFileBuffer);
    }
    
    if (uploadedFileIds.length > 0) {
      // Clean up uploaded files asynchronously
      cleanupPromises.push(
        Promise.allSettled(
          uploadedFileIds.map(async (fileId) => {
            try {
              await deleteFromR2(fileId);
              console.log(`✅ Cleaned up file: ${fileId}`);
            } catch (deleteError) {
              console.error(`❌ Failed to cleanup file ${fileId}:`, deleteError.message);
              // Log for monitoring but don't fail the request
            }
          })
        )
      );
    }
    
    // Start cleanup asynchronously - don't await to avoid blocking response
    if (cleanupPromises.length > 0) {
      Promise.all(cleanupPromises).catch(cleanupError => {
        console.error('Error during async cleanup:', cleanupError);
      });
    }
    
    // Return more specific error messages based on the error type
    let errorMessage = 'Server error while creating pothole report';
    
    if (error.message && error.message.includes('R2 configuration is invalid')) {
      errorMessage = 'File upload service is not properly configured';
    } else if (error.message && error.message.includes('Failed to upload file')) {
      errorMessage = 'Failed to upload files. Please try again.';
    } else if (error.name === 'ValidationError') {
      errorMessage = 'Invalid data provided';
    } else if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      errorMessage = 'Database error occurred';
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
});

// @route   POST /api/potholes
// @desc    Create a new pothole report
// @access  Public (guests allowed)
router.post('/', uploadLimiter, sanitizeInput, upload.array('media', 5), validateUploadedFile, validateFileUpload, [
  body('locationName')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Location name must be between 3 and 200 characters'),
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('state').optional().trim().isLength({ max: 100 }),
  body('constituency').optional().trim().isLength({ max: 100 }),
  body('parliamentaryConstituency').optional().trim().isLength({ max: 100 }),
  body('contractor').optional().trim().isLength({ max: 100 }),
  body('engineer').optional().trim().isLength({ max: 100 }),
  body('corporator').optional().trim().isLength({ max: 100 }),
  body('mla').optional().trim().isLength({ max: 100 }),
  body('mp').optional().trim().isLength({ max: 100 }),
  body('severity')
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Severity must be one of: low, medium, high, critical'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 0, max: 500 })
    .withMessage('Description must be between 0 and 500 characters'),
  body('isAnonymous').optional().isBoolean().withMessage('isAnonymous must be a boolean'),
  body('guestEmail').optional().isEmail().withMessage('Invalid email format'),
  body('recaptchaToken').optional().isString().withMessage('reCAPTCHA token is required for guests')
], async (req, res) => {
  let uploadedFileIds = [];

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

    // Check authentication (token in header)
    let user = null;
    let isAuthenticated = false;
    const authHeader = req.headers['authorization'];
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const User = (await import('../models/User.js')).default;
        user = await User.findById(decoded.userId).select('_id');
        isAuthenticated = !!user;
      } catch (err) {
        // Invalid token, treat as guest
        isAuthenticated = false;
        // Clear the auth header for guest processing
        req.headers['authorization'] = null;
      }
    }

    const {
      locationName,
      latitude,
      longitude,
      state,
      constituency,
      contractor,
      engineer,
      corporator,
      mla,
      mp,
      severity,
      description,
      isAnonymous,
      guestEmail,
      recaptchaToken
    } = req.body;

    // Handle multiple file uploads
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one photo or video is required.' });
    }

    // Validate coordinates are within India's boundaries
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    // Basic coordinate validation
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates provided'
      });
    }

    try {
      const isWithinIndia = await indiaBoundaryService.isWithinIndia(lat, lng);
      if (!isWithinIndia) {
        return res.status(400).json({
          success: false,
          message: 'Pothole reporting is only available within India\'s boundaries. Please select a location within India.'
        });
      }
    } catch (error) {
      console.error('India boundary validation error during submission:', error);
      // Continue with submission if validation service fails (for robustness)
    }

    // For guests, require recaptchaToken and verify it
    if (!isAuthenticated) {
      if (!recaptchaToken) {
        return res.status(400).json({ success: false, message: 'reCAPTCHA token is required for guest submissions.' });
      }
      
      try {
        // Verify reCAPTCHA
        const axios = (await import('axios')).default;
        const secretKey = process.env.RECAPTCHA_SECRET_KEY;
        
        if (!secretKey) {
          return res.status(500).json({ success: false, message: 'reCAPTCHA configuration error.' });
        }
        
        const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken}`;
        
        const recaptchaRes = await axios.post(verifyUrl, {}, { 
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 10000 // 10 second timeout
        });
        
        if (!recaptchaRes.data.success) {
          return res.status(400).json({ success: false, message: 'reCAPTCHA verification failed.' });
        }
      } catch (recaptchaError) {
        return res.status(400).json({ success: false, message: 'reCAPTCHA verification failed.' });
      }
    }

    const mediaArray = [];
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      
      try {
        const uploadResult = await uploadToR2(file, 'pothole-reports');
        
        uploadedFileIds.push(uploadResult.fileId);
        const mediaType = file.mimetype.startsWith('video/') ? 'video' : 'image';
        const mediaUrl = uploadResult.url;
        mediaArray.push({
          type: mediaType,
          url: mediaUrl,
          publicId: uploadResult.fileId
        });
        cleanupFileBuffer(file);
      } catch (uploadError) {
        throw uploadError;
      }
    }

    // Create pothole report
    const potholeData = {
      isAnonymous: isAnonymous === 'true' || isAnonymous === true,
      location: {
        name: locationName,
        coordinates: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        }
      },
      state: state,
      constituency: constituency,
      severity: severity,
      description: description,
      media: mediaArray,
      authorities: {
        contractor: contractor || '',
        engineer: engineer || '',
        corporator: corporator || '',
        mla: mla || '',
        mp: mp || ''
      }
    };
    
    if (isAuthenticated) {
      potholeData.userId = user._id;
      potholeData.submittedBy = 'user';
    } else {
      potholeData.submittedBy = 'guest';
      if (guestEmail) potholeData.guestEmail = guestEmail;
    }

    const pothole = new Pothole(potholeData);
    
    // Ensure reportId is generated if not present
    if (!pothole.reportId) {
      let unique = false;
      let newId;
      while (!unique) {
        newId = Math.floor(1000000000 + Math.random() * 9000000000).toString(); // 10-digit
        const existing = await Pothole.findOne({ reportId: newId });
        if (!existing) unique = true;
      }
      pothole.reportId = newId;
    }
    
    await pothole.save();
    
    // Try to auto-assign constituencies in background
    const { latitude: potholeLatitude, longitude: potholeLongitude } = pothole.location.coordinates;
    try {
      await constituencyAssignmentService.tryAutoAssignment(pothole._id, potholeLatitude, potholeLongitude);
    } catch (error) {
      console.log('Background constituency assignment failed, will be handled by admin');
    }
    
    if (isAuthenticated) {
      await pothole.populate('userId', 'name');
    }
    res.status(201).json({
      success: true,
      message: 'Pothole report created successfully',
      data: { pothole, reportId: pothole.reportId }
    });
  } catch (error) {
    // Cleanup file buffers and uploaded files on error
    // Use Promise.all to handle cleanup concurrently and avoid blocking the response
    const cleanupPromises = [];
    
    if (req.files) {
      req.files.forEach(cleanupFileBuffer);
    }
    
    if (uploadedFileIds.length > 0) {
      // Clean up uploaded files asynchronously
      cleanupPromises.push(
        Promise.allSettled(
          uploadedFileIds.map(async (fileId) => {
            try {
              await deleteFromR2(fileId);
              console.log(`✅ Cleaned up file: ${fileId}`);
            } catch (deleteError) {
              console.error(`❌ Failed to cleanup file ${fileId}:`, deleteError.message);
              // Log for monitoring but don't fail the request
            }
          })
        )
      );
    }
    
    // Start cleanup asynchronously - don't await to avoid blocking response
    if (cleanupPromises.length > 0) {
      Promise.all(cleanupPromises).catch(cleanupError => {
        console.error('Error during async cleanup:', cleanupError);
      });
    }
    
    // Return more specific error messages based on the error type
    let errorMessage = 'Server error while creating pothole report';
    
    if (error.message && error.message.includes('R2 configuration is invalid')) {
      errorMessage = 'File upload service is not properly configured';
    } else if (error.message && error.message.includes('Failed to upload file')) {
      errorMessage = 'Failed to upload files. Please try again.';
    } else if (error.name === 'ValidationError') {
      errorMessage = 'Invalid data provided';
    } else if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      errorMessage = 'Database error occurred';
    } else if (error.message && error.message.includes('RECAPTCHA')) {
      errorMessage = 'Verification failed. Please try again.';
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
});

// @route   GET /api/potholes
// @desc    Get all pothole reports
// @access  Public (with optional auth)
router.get('/', apiLimiter, sanitizeInput, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc',
      city,
      status
    } = req.query;

    // Build filter object
    const filter = {};
    if (city) {
      filter['location.name'] = { $regex: city, $options: 'i' };
    }
    if (status) {
      filter.status = status;
    }
    
    // Only show approved potholes to public
    filter.approvalStatus = 'approved';

    // Build sort object
    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const total = await Pothole.countDocuments(filter);

    // Get potholes with pagination
    const potholes = await Pothole.find(filter)
      .populate('userId', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Check if user is authenticated (optional auth)
    let currentUser = null;
    try {
      const authHeader = req.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const User = (await import('../models/User.js')).default;
        currentUser = await User.findById(decoded.userId).select('_id');
      }
    } catch (authError) {
      // User is not authenticated, continue without user info
    }

    // Process potholes and add upvote information for authenticated users
    const sanitizedPotholes = potholes.map(pothole => {
      let processedPothole = { ...pothole };
      
      // Remove user information for anonymous reports
      if (pothole.isAnonymous) {
        const { userId, ...potholeWithoutUser } = pothole;
        processedPothole = potholeWithoutUser;
      }
      
      // Add upvote information for authenticated users
      if (currentUser && pothole.upvotedBy) {
        // Convert both to strings for comparison
        const currentUserIdStr = currentUser._id.toString();
        const upvotedByStr = pothole.upvotedBy.map(id => id.toString());
        const userUpvoted = upvotedByStr.includes(currentUserIdStr);
        
        processedPothole.hasUpvoted = userUpvoted;
      } else {
        processedPothole.hasUpvoted = false;
      }
      
      return processedPothole;
    });

    res.json({
      success: true,
      data: {
        potholes: sanitizedPotholes,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          itemsPerPage: limitNum
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching potholes'
    });
  }
});

// @route   GET /api/potholes/my-reports
// @desc    Get current user's pothole reports
// @access  Private
router.get('/my-reports', userLimiter, authenticateToken, sanitizeInput, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc',
      status,
      search
    } = req.query;

    // Build filter object
    const filter = { userId: req.user._id };
    
    if (status) {
      filter.status = status;
    }
    
    if (search) {
      filter['location.name'] = { $regex: search, $options: 'i' };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const total = await Pothole.countDocuments(filter);

    // Get potholes with pagination
    const potholes = await Pothole.find(filter)
      .populate('userId', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.json({
      success: true,
      data: {
        potholes,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          itemsPerPage: limitNum
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching your reports'
    });
  }
});

// @route   GET /api/potholes/stats
// @desc    Get pothole statistics
// @access  Public
router.get('/stats', apiLimiter, async (req, res) => {
  try {
    // Only count approved potholes for public stats
    const approvedFilter = { approvalStatus: 'approved' };
    
    // Get total potholes
    const totalPotholes = await Pothole.countDocuments(approvedFilter);
    
    // Get unique cities (using location name as city)
    const cities = await Pothole.distinct('location.name', approvedFilter);
    const uniqueCities = cities.length;
    
    // Get total registered users (all users in the system)
    const User = (await import('../models/User.js')).default;
    const totalUsers = await User.countDocuments();
    
    // Get resolved potholes
    const resolvedPotholes = await Pothole.countDocuments({ ...approvedFilter, status: 'resolved' });
    
    // Get potholes by status
    const statusStats = await Pothole.aggregate([
      {
        $match: approvedFilter
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentReports = await Pothole.countDocuments({
      ...approvedFilter,
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    // Get total upvotes across all potholes
    const totalUpvotes = await Pothole.aggregate([
      {
        $match: approvedFilter
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$upvotes' }
        }
      }
    ]);

    // Get top cities
    const topCities = await Pothole.aggregate([
      {
        $match: approvedFilter
      },
      {
        $group: {
          _id: '$location.name',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);

    res.json({
      success: true,
      data: {
        totalPotholes,
        uniqueCities,
        totalUsers,
        resolvedPotholes,
        recentReports,
        totalUpvotes: totalUpvotes[0]?.total || 0,
        statusStats,
        topCities
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics'
    });
  }
});

// @route   GET /api/potholes/leaderboard
// @desc    Get leaderboard of MPs and MLAs by complaints received in their constituency, grouped by status
// @access  Public
router.get('/leaderboard', apiLimiter, async (req, res) => {
  try {
    // Aggregate complaints by constituency, MP, MLA, and status
    const leaderboard = await Pothole.aggregate([
      {
        $match: { approvalStatus: 'approved' }
      },
      {
        $group: {
          _id: {
            state: "$state",
            constituency: "$constituency",
            mp: "$authorities.mp",
            mla: "$authorities.mla",
            status: "$status"
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: {
            state: "$_id.state",
            constituency: "$_id.constituency",
            mp: "$_id.mp",
            mla: "$_id.mla"
          },
          statusCounts: {
            $push: {
              status: "$_id.status",
              count: "$count"
            }
          },
          total: { $sum: "$count" }
        }
      },
      {
        $project: {
          _id: 0,
          state: "$_id.state",
          constituency: "$_id.constituency",
          mp: "$_id.mp",
          mla: "$_id.mla",
          total: 1,
          statusCounts: 1
        }
      },
      { $sort: { total: -1 } }
    ]);
    res.json({ success: true, data: leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while fetching leaderboard' });
  }
});

// @route   GET /api/potholes/:id
// @desc    Get single pothole report
// @access  Public
router.get('/:id', apiLimiter, sanitizeInput, validateObjectId, async (req, res) => {
  try {
    const pothole = await Pothole.findById(req.params.id)
      .populate('userId', 'name')
      .lean();

    if (!pothole) {
      return res.status(404).json({
        success: false,
        message: 'Pothole report not found'
      });
    }
    
    // Only show approved potholes to public
    if (pothole.approvalStatus !== 'approved') {
      return res.status(404).json({
        success: false,
        message: 'Pothole report not found'
      });
    }

    // Remove user information for anonymous reports
    let sanitizedPothole = pothole;
    if (pothole.isAnonymous) {
      const { userId, ...potholeWithoutUser } = pothole;
      sanitizedPothole = potholeWithoutUser;
    }

    res.json({
      success: true,
      data: { pothole: sanitizedPothole }
    });
  } catch (error) {
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid pothole ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching pothole'
    });
  }
});

// @route   PUT /api/potholes/:id/upvote
// @desc    Upvote a pothole report
// @access  Private
router.put('/:id/upvote', sensitiveOperationLimiter, authenticateToken, sanitizeInput, validateObjectId, async (req, res) => {
  try {
    const pothole = await Pothole.findById(req.params.id);

    if (!pothole) {
      return res.status(404).json({
        success: false,
        message: 'Pothole report not found'
      });
    }

    // Check if user already upvoted
    const alreadyUpvoted = pothole.upvotedBy.includes(req.user._id);

    let updateOperation;
    if (alreadyUpvoted) {
      // Remove upvote
      updateOperation = {
        $pull: { upvotedBy: req.user._id },
        $inc: { upvotes: -1 }
      };
    } else {
      // Add upvote
      updateOperation = {
        $addToSet: { upvotedBy: req.user._id },
        $inc: { upvotes: 1 }
      };
    }

    // Use findByIdAndUpdate to avoid triggering full document validation
    const updatedPothole = await Pothole.findByIdAndUpdate(
      req.params.id,
      updateOperation,
      { new: true, runValidators: false }
    );

    res.json({
      success: true,
      message: alreadyUpvoted ? 'Upvote removed' : 'Upvote added',
      data: {
        upvotes: updatedPothole.upvotes,
        isUpvoted: !alreadyUpvoted
      }
    });
  } catch (error) {
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid pothole ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while processing upvote'
    });
  }
});

// @route   PUT /api/potholes/:id/status
// @desc    Update pothole status (admin only)
// @access  Private
router.put('/:id/status', sensitiveOperationLimiter, authenticateToken, sanitizeInput, validateObjectId, [
  body('status')
    .isIn(['reported', 'acknowledged', 'in_progress', 'resolved'])
    .withMessage('Status must be one of: reported, acknowledged, in_progress, resolved')
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

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can update pothole status'
      });
    }

    const pothole = await Pothole.findById(req.params.id);

    if (!pothole) {
      return res.status(404).json({
        success: false,
        message: 'Pothole report not found'
      });
    }

    const oldStatus = pothole.status;
    const newStatus = req.body.status;

    // Only update if status is actually changing
    if (oldStatus === newStatus) {
      return res.status(400).json({
        success: false,
        message: 'Status is already set to the requested value'
      });
    }

    // Update the status
    pothole.status = newStatus;
    await pothole.save();

    // Create notification for the pothole owner
    try {
      await NotificationService.createPotholeStatusNotification(
        pothole.userId,
        pothole._id,
        oldStatus,
        newStatus,
        pothole.location.name
      );
    } catch (notificationError) {
      // Don't fail the request if notification creation fails
    }

    res.json({
      success: true,
      message: 'Pothole status updated successfully',
      data: {
        status: newStatus,
        oldStatus: oldStatus
      }
    });
  } catch (error) {
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid pothole ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating pothole status'
    });
  }
});

// @route   DELETE /api/potholes/:id
// @desc    Delete a pothole report (only by owner or admin)
// @access  Private
router.delete('/:id', sensitiveOperationLimiter, authenticateToken, sanitizeInput, validateObjectId, async (req, res) => {
  try {
    const pothole = await Pothole.findById(req.params.id);

    if (!pothole) {
      return res.status(404).json({
        success: false,
        message: 'Pothole report not found'
      });
    }

    // Check if user is owner or admin
    if (pothole.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this report'
      });
    }

    // Delete media from R2 first
    if (pothole.media && pothole.media.length > 0) {
      const r2Errors = [];
      
      for (const mediaItem of pothole.media) {
        if (mediaItem.publicId) {
          try {
            await deleteFromR2(mediaItem.publicId);
          } catch (deleteError) {
            r2Errors.push({
              publicId: mediaItem.publicId,
              error: deleteError.message
            });
          }
        } else {
          r2Errors.push({
            publicId: 'missing',
            error: 'Missing publicId'
          });
        }
      }
      
      // If any R2 deletions failed, don't proceed with database deletion
      if (r2Errors.length > 0) {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete media files from storage. Please try again.',
          errors: r2Errors
        });
      }
    }

    // Only delete from database if media deletion from storage was successful
    await Pothole.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Pothole report deleted successfully'
    });
  } catch (error) {
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid pothole ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while deleting pothole'
    });
  }
});

export default router;

