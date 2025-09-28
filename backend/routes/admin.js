import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { sanitizeInput, validateObjectId, validateSearchTerm } from '../middleware/sanitize.js';
import { apiLimiter, userLimiter, sensitiveOperationLimiter } from '../middleware/rateLimit.js';
import User from '../models/User.js';
import Pothole from '../models/Pothole.js';
import Notification from '../models/Notification.js';
import BugReport from '../models/BugReport.js';
import Feedback from '../models/Feedback.js';
import Constituency from '../models/Constituency.js';
import MP from '../models/MP.js';
import NotificationService from '../services/notificationService.js';
import constituencyAssignmentService from '../services/constituencyAssignmentService.js';

const router = express.Router();

// Apply admin middleware to all routes
router.use(authenticateToken, requireAdmin);

// ==================== USER MANAGEMENT ====================

// @route   GET /api/admin/users
// @desc    Get all users with pagination and filtering
// @access  Admin only
router.get('/users', apiLimiter, sanitizeInput, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      role = '',
      status = '',
      provider = '',
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (search) {
      // Sanitize search input to prevent NoSQL injection and ReDoS
      const sanitizedSearch = validateSearchTerm(search, 50);
      if (sanitizedSearch) {
        filter.$or = [
          { name: { $regex: sanitizedSearch, $options: 'i' } },
          { email: { $regex: sanitizedSearch, $options: 'i' } }
        ];
      }
    }
    if (role) {
      filter.role = role;
    }
    if (status !== '') {
      filter.isActive = status === 'true';
    }
    if (provider) {
      filter.provider = provider;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await User.countDocuments(filter);

    // Get users with pagination
    const users = await User.find(filter)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get additional stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const reportCount = await Pothole.countDocuments({ userId: user._id });
        const resolvedCount = await Pothole.countDocuments({ 
          userId: user._id, 
          status: 'resolved' 
        });
        const totalUpvotes = await Pothole.aggregate([
          { $match: { userId: user._id } },
          { $group: { _id: null, total: { $sum: '$upvotes' } } }
        ]);

        return {
          ...user,
          hasSeenTour: user.hasSeenTour,
          provider: user.provider, // Add provider field for admin view
          stats: {
            totalReports: reportCount,
            resolvedReports: resolvedCount,
            totalUpvotes: totalUpvotes[0]?.total || 0
          }
        };
      })
    );

    res.json({
      success: true,
      data: {
        users: usersWithStats,
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
      message: 'Server error while fetching users'
    });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Admin only
router.put('/users/:id/role', sensitiveOperationLimiter, sanitizeInput, [
  body('role')
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin')
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

    const { role } = req.body;
    const userId = req.params.id;

    // Prevent admin from demoting themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating user role'
    });
  }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Deactivate or reactivate user account
// @access  Admin only
router.put('/users/:id/status', sensitiveOperationLimiter, sanitizeInput, [
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean value')
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

    const { isActive } = req.body;
    const userId = req.params.id;

    // Prevent admin from deactivating themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User account ${isActive ? 'reactivated' : 'deactivated'} successfully`,
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating user status'
    });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user (and all their reports)
// @access  Admin only
router.delete('/users/:id', sensitiveOperationLimiter, sanitizeInput, async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent admin from deleting themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete all user's pothole reports and their media
    const userReports = await Pothole.find({ userId });
    
    // Delete media from R2 for all user reports
    const { deleteFromR2 } = await import('../config/r2.js');
    for (const report of userReports) {
      if (report.media && report.media.length > 0) {
        for (const mediaItem of report.media) {
          if (mediaItem.publicId) {
            try {
              await deleteFromR2(mediaItem.publicId);
            } catch (deleteError) {
              // Continue with deletion
            }
          }
        }
      }
    }

    // Delete all user's reports
    await Pothole.deleteMany({ userId });
    
    // Delete all user's notifications
    await Notification.deleteMany({ userId });
    
    // Delete the user
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'User and all associated data deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while deleting user'
    });
  }
});

// ==================== REPORT MANAGEMENT ====================

// @route   GET /api/admin/reports
// @desc    Get all pothole reports with admin filtering
// @access  Admin only
router.get('/reports', apiLimiter, sanitizeInput, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = '',
      city = '',
      userId = '',
      reportId = '', // Add reportId to destructure
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (city) {
      const sanitizedCity = validateSearchTerm(city, 100);
      if (sanitizedCity) {
        filter['location.name'] = { $regex: sanitizedCity, $options: 'i' };
      }
    }
    if (userId) filter.userId = userId;
    // Support searching by either Mongo _id (24-hex) or 10-digit reportId string
    if (reportId) {
      const objectIdPattern = /^[0-9a-fA-F]{24}$/;
      const tenDigitPattern = /^\d{10}$/;
      if (objectIdPattern.test(reportId)) {
        filter._id = reportId;
      } else if (tenDigitPattern.test(reportId)) {
        filter.reportId = reportId;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid reportId format'
        });
      }
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Pothole.countDocuments(filter);

    // Get reports with pagination
    const reports = await Pothole.find(filter)
      .populate('userId', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.json({
      success: true,
      data: {
        reports,
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
      message: 'Server error while fetching reports'
    });
  }
});

// @route   PUT /api/admin/reports/:id/status
// @desc    Update pothole status (admin version)
// @access  Admin only
router.put('/reports/:id/status', sensitiveOperationLimiter, sanitizeInput, [
  body('status')
    .isIn(['reported', 'acknowledged', 'in_progress', 'resolved'])
    .withMessage('Status must be one of: reported, acknowledged, in_progress, resolved')
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

  const pothole = await Pothole.findById(req.params.id).populate('userId', 'name email');
    if (!pothole) {
      return res.status(404).json({
        success: false,
        message: 'Pothole report not found'
      });
    }

    const oldStatus = pothole.status;
    const newStatus = req.body.status;

    if (oldStatus === newStatus) {
      return res.status(400).json({
        success: false,
        message: 'Status is already set to the requested value'
      });
    }

    pothole.status = newStatus;
    await pothole.save();

    // Create notification for the pothole owner
    try {
      const NotificationService = (await import('../services/notificationService.js')).default;
      await NotificationService.createPotholeStatusNotification(
        pothole.userId._id,
        pothole._id,
        oldStatus,
        newStatus,
        pothole.location.name
      );
    } catch (notificationError) {
      // Continue without notification
    }

    res.json({
      success: true,
      message: 'Report status updated successfully',
      data: { pothole }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating report status'
    });
  }
});

// @route   PUT /api/admin/reports/:id/comment
// @desc    Add or update admin comment for a pothole report
// @access  Admin only
router.put('/reports/:id/comment', sensitiveOperationLimiter, sanitizeInput, async (req, res) => {
  try {
    const { comment } = req.body;
    if (typeof comment !== 'string' || comment.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Comment must be a string up to 1000 characters.'
      });
    }
    const pothole = await Pothole.findById(req.params.id);
    if (!pothole) {
      return res.status(404).json({
        success: false,
        message: 'Pothole report not found'
      });
    }
    pothole.adminComment = comment;
    pothole.adminCommentAt = new Date();
    await pothole.save();
    res.json({
      success: true,
      message: 'Admin comment updated successfully',
      data: { adminComment: pothole.adminComment, adminCommentAt: pothole.adminCommentAt }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating admin comment'
    });
  }
});

// @route   PUT /api/admin/reports/:id/details
// @desc    Update location name and severity for a pothole report
// @access  Admin only
router.put('/reports/:id/details', sensitiveOperationLimiter, sanitizeInput, [
  body('locationName')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Location name must be between 3 and 200 characters'),
  body('severity')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Severity must be one of: low, medium, high, critical')
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
    const { locationName, severity } = req.body;
    const pothole = await Pothole.findById(req.params.id);
    if (!pothole) {
      return res.status(404).json({
        success: false,
        message: 'Pothole report not found'
      });
    }
    let updated = false;
    if (locationName && pothole.location?.name !== locationName) {
      pothole.location.name = locationName;
      updated = true;
    }
    if (severity && pothole.severity !== severity) {
      pothole.severity = severity;
      updated = true;
    }
    if (!updated) {
      return res.status(400).json({
        success: false,
        message: 'No changes to update'
      });
    }
    await pothole.save();
    res.json({
      success: true,
      message: 'Report details updated successfully',
      data: { pothole }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating report details'
    });
  }
});

// @route   DELETE /api/admin/reports/:id
// @desc    Delete pothole report (admin version)
// @access  Admin only
router.delete('/reports/:id', sensitiveOperationLimiter, sanitizeInput, async (req, res) => {
  try {
    const pothole = await Pothole.findById(req.params.id);
    if (!pothole) {
      return res.status(404).json({
        success: false,
        message: 'Pothole report not found'
      });
    }

    // Delete media from R2 first; abort DB deletion on any failure
    const { deleteFromR2 } = await import('../config/r2.js');
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
      if (r2Errors.length > 0) {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete media files from storage. Please try again.',
          errors: r2Errors
        });
      }
    }

    await Pothole.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while deleting report'
    });
  }
});

// @route   GET /api/admin/reports/pending
// @desc    Get all pending approval pothole reports
// @access  Admin only
router.get('/reports/pending', apiLimiter, sanitizeInput, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const filter = { approvalStatus: 'pending' };

    // Build sort object
    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Pothole.countDocuments(filter);

    // Get reports with pagination
    const reports = await Pothole.find(filter)
      .populate('userId', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.json({
      success: true,
      data: {
        reports,
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
      message: 'Server error while fetching pending reports'
    });
  }
});

// @route   GET /api/admin/reports/rejected
// @desc    Get all rejected pothole reports
// @access  Admin only
router.get('/reports/rejected', apiLimiter, sanitizeInput, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const filter = { approvalStatus: 'rejected' };

    // Build sort object
    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Pothole.countDocuments(filter);

    // Get reports with pagination
    const reports = await Pothole.find(filter)
      .populate('userId', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.json({
      success: true,
      data: {
        reports,
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
      message: 'Server error while fetching rejected reports'
    });
  }
});

// @route   PUT /api/admin/reports/:id/approve
// @desc    Approve a pothole report
// @access  Admin only
router.put('/reports/:id/approve', sensitiveOperationLimiter, sanitizeInput, validateObjectId, async (req, res) => {
  try {
    const pothole = await Pothole.findById(req.params.id).populate('userId', 'name email');
    
    if (!pothole) {
      return res.status(404).json({
        success: false,
        message: 'Pothole report not found'
      });
    }

    if (pothole.approvalStatus === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Report is already approved'
      });
    }

    // Check if constituency assignment is still pending
    if (pothole.constituencyStatus === 'pending_manual') {
      return res.status(400).json({
        success: false,
        message: 'Cannot approve report: Constituency assignment must be completed first. Please assign constituencies in the Assignments tab before approving.'
      });
    }

    pothole.approvalStatus = 'approved';
    pothole.approvedBy = req.user._id;
    pothole.approvedAt = new Date();
    pothole.rejectionReason = null;
    
    await pothole.save();

    // Create notification for the pothole owner if not anonymous
    if (!pothole.isAnonymous && pothole.userId) {
      try {
        await NotificationService.createNotification(
          pothole.userId._id,
          'report_approved',
          'Your pothole report has been approved',
          `Your report for ${pothole.location.name} has been approved and is now visible to the public.`,
          pothole._id
        );
      } catch (notificationError) {
        // Continue without notification
      }
    }

    res.json({
      success: true,
      message: 'Report approved successfully',
      data: { pothole }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while approving report'
    });
  }
});

// @route   PUT /api/admin/reports/:id/reject
// @desc    Reject a pothole report
// @access  Admin only
router.put('/reports/:id/reject', sensitiveOperationLimiter, sanitizeInput, validateObjectId, [
  body('reason')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Rejection reason must be between 10 and 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const pothole = await Pothole.findById(req.params.id).populate('userId', 'name email');
    
    if (!pothole) {
      return res.status(404).json({
        success: false,
        message: 'Pothole report not found'
      });
    }

    if (pothole.approvalStatus === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Report is already rejected'
      });
    }

    // Treat rejection as deletion of heavy assets
    try {
      if (pothole.media && pothole.media.length > 0) {
        const { deleteFromR2 } = await import('../config/r2.js');
        for (const mediaItem of pothole.media) {
          if (mediaItem.publicId) {
            try {
              await deleteFromR2(mediaItem.publicId);
            } catch (_) {
              // Continue even if a particular media deletion fails
            }
          }
        }
        // Clear media array after deletion
        pothole.media = [];
      }
    } catch (_) {
      // Non-fatal: proceed with rejection metadata
    }

    pothole.approvalStatus = 'rejected';
    pothole.rejectionReason = req.body.reason;
    pothole.approvedBy = req.user._id;
    pothole.approvedAt = new Date();

    await pothole.save();

    // Create notification for the pothole owner if not anonymous
    if (!pothole.isAnonymous && pothole.userId) {
      try {
        await NotificationService.createNotification(
          pothole.userId._id,
          'report_rejected',
          'Your pothole report has been rejected',
          `Your report for ${pothole.location.name} has been rejected. Reason: ${req.body.reason}`,
          pothole._id
        );
      } catch (notificationError) {
        // Continue without notification
      }
    }

    res.json({
      success: true,
      message: 'Report rejected successfully',
      data: { pothole }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting report'
    });
  }
});

// ==================== NOTIFICATION MANAGEMENT ====================

// @route   GET /api/admin/notifications/grouped
// @desc    Get grouped notifications for admin view (groups broadcast notifications)
// @access  Admin only
router.get('/notifications/grouped', apiLimiter, sanitizeInput, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type = '',
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (type) filter.type = type;

    // Build sort object
    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get all notifications
    const allNotifications = await Notification.find(filter)
      .populate('user', 'name email')
      .sort(sort)
      .lean();

    // Group notifications by content for broadcast notifications
    const groupedNotifications = [];
    const processedIds = new Set();

    for (const notification of allNotifications) {
      if (processedIds.has(notification._id.toString())) continue;

      if (notification.type === 'system_announcement') {
        // Group broadcast notifications by title, message, and creation time (within 1 minute)
        const similarNotifications = allNotifications.filter(n => 
          n.type === 'system_announcement' &&
          n.title === notification.title &&
          n.message === notification.message &&
          Math.abs(new Date(n.createdAt) - new Date(notification.createdAt)) < 60000 // 1 minute
        );

        // Mark all similar notifications as processed
        similarNotifications.forEach(n => processedIds.add(n._id.toString()));

        // Calculate read/unread statistics
        const totalCount = similarNotifications.length;
        const readCount = similarNotifications.filter(n => n.isRead).length;
        const unreadCount = totalCount - readCount;

        groupedNotifications.push({
          _id: notification._id, // Use first notification's ID as group ID
          title: notification.title,
          message: notification.message,
          type: notification.type,
          createdAt: notification.createdAt,
          priority: notification.priority,
          isGrouped: true,
          totalCount,
          readCount,
          unreadCount,
          readPercentage: Math.round((readCount / totalCount) * 100),
          notifications: similarNotifications // Include all individual notifications for detailed view
        });
      } else {
        // For non-broadcast notifications, keep them as individual items
        processedIds.add(notification._id.toString());
        groupedNotifications.push({
          ...notification,
          isGrouped: false,
          totalCount: 1,
          readCount: notification.isRead ? 1 : 0,
          unreadCount: notification.isRead ? 0 : 1,
          readPercentage: notification.isRead ? 100 : 0
        });
      }
    }

    // Apply pagination to grouped results
    const total = groupedNotifications.length;
    const paginatedNotifications = groupedNotifications.slice(skip, skip + limitNum);

    res.json({
      success: true,
      data: {
        notifications: paginatedNotifications,
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
      message: 'Server error while fetching grouped notifications'
    });
  }
});

// @route   GET /api/admin/notifications/:id/details
// @desc    Get detailed view of a grouped notification (shows all individual notifications)
// @access  Admin only
router.get('/notifications/:id/details', apiLimiter, sanitizeInput, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate('user', 'name email')
      .lean();

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // If it's a broadcast notification, find all similar notifications
    if (notification.type === 'system_announcement') {
      const similarNotifications = await Notification.find({
        type: 'system_announcement',
        title: notification.title,
        message: notification.message,
        createdAt: {
          $gte: new Date(notification.createdAt.getTime() - 60000), // 1 minute before
          $lte: new Date(notification.createdAt.getTime() + 60000)  // 1 minute after
        }
      })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .lean();

      const totalCount = similarNotifications.length;
      const readCount = similarNotifications.filter(n => n.isRead).length;
      const unreadCount = totalCount - readCount;

      res.json({
        success: true,
        data: {
          notification: {
            ...notification,
            isGrouped: true,
            totalCount,
            readCount,
            unreadCount,
            readPercentage: Math.round((readCount / totalCount) * 100)
          },
          individualNotifications: similarNotifications
        }
      });
    } else {
      // For non-broadcast notifications, return as individual
      res.json({
        success: true,
        data: {
          notification: {
            ...notification,
            isGrouped: false,
            totalCount: 1,
            readCount: notification.isRead ? 1 : 0,
            unreadCount: notification.isRead ? 0 : 1,
            readPercentage: notification.isRead ? 100 : 0
          },
          individualNotifications: [notification]
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notification details'
    });
  }
});

// @route   GET /api/admin/notifications
// @desc    Get all notifications with filtering
// @access  Admin only
router.get('/notifications', apiLimiter, sanitizeInput, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type = '',
      userId = '',
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (type) filter.type = type;
    if (userId) filter.user = userId;

    // Build sort object
    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Notification.countDocuments(filter);

    // Get notifications with pagination
    const notifications = await Notification.find(filter)
      .populate('user', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.json({
      success: true,
      data: {
        notifications,
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
      message: 'Server error while fetching notifications'
    });
  }
});

// @route   DELETE /api/admin/notifications/:id
// @desc    Delete notification (for broadcast notifications, deletes all instances)
// @access  Admin only
router.delete('/notifications/:id', sensitiveOperationLimiter, sanitizeInput, async (req, res) => {
  try {
    
    // First, find the notification to check if it's a broadcast
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    let deletedCount = 0;

    // If it's a system announcement (broadcast), delete all similar notifications
    if (notification.type === 'system_announcement') {
      
      // Find all notifications with the same title, message, and created within 1 minute
      const similarNotifications = await Notification.find({
        type: 'system_announcement',
        title: notification.title,
        message: notification.message,
        createdAt: {
          $gte: new Date(notification.createdAt.getTime() - 60000), // 1 minute before
          $lte: new Date(notification.createdAt.getTime() + 60000)  // 1 minute after
        }
      });

      // Delete all similar notifications
      const deleteResult = await Notification.deleteMany({
        _id: { $in: similarNotifications.map(n => n._id) }
      });

      deletedCount = deleteResult.deletedCount;
    } else {
      // For non-broadcast notifications, delete just the one
      await Notification.findByIdAndDelete(req.params.id);
      deletedCount = 1;
    }

    res.json({
      success: true,
      message: deletedCount > 1 
        ? `Broadcast notification deleted successfully (${deletedCount} instances removed)`
        : 'Notification deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while deleting notification'
    });
  }
});

// @route   POST /api/admin/notifications/broadcast
// @desc    Send broadcast notification to all users
// @access  Admin only
router.post('/notifications/broadcast', sensitiveOperationLimiter, sanitizeInput, [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  body('type')
    .isIn(['system_announcement'])
    .withMessage('Type must be system_announcement for broadcast notifications')
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

    const { title, message, type } = req.body;

    // Get all users
    const users = await User.find({});
    
    // Create notifications for all users
    const notifications = users.map(user => ({
      user: user._id,
      title,
      message,
      type: 'system_announcement',
      isRead: false
    }));

    await Notification.insertMany(notifications);

    res.json({
      success: true,
      message: `Broadcast notification sent to ${users.length} users`,
      data: { sentCount: users.length }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while sending broadcast notification'
    });
  }
});

// ==================== BUG REPORT MANAGEMENT ====================

// @route   GET /api/admin/bug-reports
// @desc    Get all bug reports with pagination and filtering
// @access  Admin only
router.get('/bug-reports', apiLimiter, sanitizeInput, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = '',
      search = '',
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (search) {
      // Sanitize search input to prevent NoSQL injection and ReDoS
      const sanitizedSearch = validateSearchTerm(search, 100);
      if (sanitizedSearch) {
        filter.$or = [
          { title: { $regex: sanitizedSearch, $options: 'i' } },
          { description: { $regex: sanitizedSearch, $options: 'i' } }
        ];
      }
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await BugReport.countDocuments(filter);

    // Get bug reports with pagination
    const bugReports = await BugReport.find(filter)
      .populate('user', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.json({
      success: true,
      data: {
        bugReports,
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
      message: 'Server error while fetching bug reports'
    });
  }
});

// @route   PUT /api/admin/bug-reports/:id/status
// @desc    Update bug report status
// @access  Admin only
router.put('/bug-reports/:id/status', sensitiveOperationLimiter, sanitizeInput, [
  body('status')
    .isIn(['pending', 'in_progress', 'resolved', 'closed'])
    .withMessage('Status must be pending, in_progress, resolved, or closed')
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

    const { status } = req.body;
    const bugReportId = req.params.id;

    // Get the current bug report to check if status is actually changing
    const currentBugReport = await BugReport.findById(bugReportId).populate('user', 'name email');
    if (!currentBugReport) {
      return res.status(404).json({
        success: false,
        message: 'Bug report not found'
      });
    }

    const oldStatus = currentBugReport.status;

    const bugReport = await BugReport.findByIdAndUpdate(
      bugReportId,
      { status },
      { new: true, runValidators: true }
    ).populate('user', 'name email');

    // Send notification if status changed
    if (oldStatus !== status && bugReport.user) {
      try {
        await NotificationService.createBugReportStatusNotification(
          bugReport.user._id,
          bugReportId,
          oldStatus,
          status,
          bugReport.title
        );
      } catch (notificationError) {
        // Don't fail the request if notification fails
      }
    }

    res.json({
      success: true,
      message: 'Bug report status updated successfully',
      data: { bugReport }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating bug report status'
    });
  }
});

// @route   DELETE /api/admin/bug-reports/:id
// @desc    Delete bug report
// @access  Admin only
router.delete('/bug-reports/:id', sensitiveOperationLimiter, sanitizeInput, async (req, res) => {
  try {
    const bugReportId = req.params.id;

    const bugReport = await BugReport.findByIdAndDelete(bugReportId);
    if (!bugReport) {
      return res.status(404).json({
        success: false,
        message: 'Bug report not found'
      });
    }

    res.json({
      success: true,
      message: 'Bug report deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while deleting bug report'
    });
  }
});

// ==================== FEEDBACK MANAGEMENT ====================

// @route   GET /api/admin/feedback
// @desc    Get all feedback with pagination and filtering
// @access  Admin only
router.get('/feedback', apiLimiter, sanitizeInput, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = '',
      search = '',
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (search) {
      // Sanitize search input to prevent NoSQL injection and ReDoS
      const sanitizedSearch = validateSearchTerm(search, 100);
      if (sanitizedSearch) {
        filter.message = { $regex: sanitizedSearch, $options: 'i' };
      }
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Feedback.countDocuments(filter);

    // Get feedback with pagination
    const feedbacks = await Feedback.find(filter)
      .populate('user', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.json({
      success: true,
      data: {
        feedbacks,
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
      message: 'Server error while fetching feedback'
    });
  }
});

// @route   PUT /api/admin/feedback/:id/status
// @desc    Update feedback status
// @access  Admin only
router.put('/feedback/:id/status', sensitiveOperationLimiter, sanitizeInput, [
  body('status')
    .isIn(['pending', 'reviewed', 'actioned', 'closed'])
    .withMessage('Status must be pending, reviewed, actioned, or closed')
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

    const { status } = req.body;
    const feedbackId = req.params.id;

    // Get the current feedback to check if status is actually changing
    const currentFeedback = await Feedback.findById(feedbackId).populate('user', 'name email');
    if (!currentFeedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    const oldStatus = currentFeedback.status;

    const feedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      { status },
      { new: true, runValidators: true }
    ).populate('user', 'name email');

    // Send notification if status changed
    if (oldStatus !== status && feedback.user) {
      try {
        await NotificationService.createFeedbackStatusNotification(
          feedback.user._id,
          feedbackId,
          oldStatus,
          status,
          feedback.message
        );
      } catch (notificationError) {
        // Don't fail the request if notification fails
      }
    }

    res.json({
      success: true,
      message: 'Feedback status updated successfully',
      data: { feedback }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating feedback status'
    });
  }
});

// @route   DELETE /api/admin/feedback/:id
// @desc    Delete feedback
// @access  Admin only
router.delete('/feedback/:id', sensitiveOperationLimiter, sanitizeInput, async (req, res) => {
  try {
    const feedbackId = req.params.id;

    const feedback = await Feedback.findByIdAndDelete(feedbackId);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while deleting feedback'
    });
  }
});

// ==================== ADMIN DASHBOARD STATS ====================

// @route   GET /api/admin/stats
// @desc    Get admin dashboard statistics
// @access  Admin only
router.get('/stats', apiLimiter, async (req, res) => {
  try {
    // User statistics
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    });

    // Report statistics
    const totalReports = await Pothole.countDocuments();
    const reportsByStatus = await Pothole.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const reportsByApprovalStatus = await Pothole.aggregate([
      { $group: { _id: '$approvalStatus', count: { $sum: 1 } } }
    ]);
    const pendingApproval = await Pothole.countDocuments({ approvalStatus: 'pending' });
    const reportsThisMonth = await Pothole.countDocuments({
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    });

    // Notification statistics
    const totalNotifications = await Notification.countDocuments();
    const unreadNotifications = await Notification.countDocuments({ isRead: false });

    // Top cities
    const topCities = await Pothole.aggregate([
      { $group: { _id: '$location.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Recent activity
    const recentReports = await Pothole.find()
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const recentUsers = await User.find()
      .select('name email role createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          admins: adminUsers,
          newThisMonth: newUsersThisMonth
        },
        reports: {
          total: totalReports,
          byStatus: reportsByStatus,
          byApprovalStatus: reportsByApprovalStatus,
          pendingApproval: pendingApproval,
          newThisMonth: reportsThisMonth
        },
        notifications: {
          total: totalNotifications,
          unread: unreadNotifications
        },
        topCities,
        recentReports,
        recentUsers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching admin statistics'
    });
  }
});

// ==================== CONSTITUENCY ASSIGNMENT ====================

// @route   GET /api/admin/assignments/pending
// @desc    Get all reports pending constituency assignment
// @access  Admin only
router.get('/assignments/pending', apiLimiter, async (req, res) => {
  try {
    const pendingPotholes = await Pothole.find({
      constituencyStatus: 'pending_manual',
      approvalStatus: { $ne: 'rejected' }
    })
    .select('reportId location createdAt state constituency parliamentaryConstituency')
    .sort({ createdAt: -1 })
    .lean();

    const stats = await constituencyAssignmentService.getAssignmentStats();

    res.json({
      success: true,
      data: {
        potholes: pendingPotholes,
        stats: stats
      }
    });
  } catch (error) {
    console.error('Error fetching pending assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pending assignments'
    });
  }
});

// @route   PUT /api/admin/assignments/:id
// @desc    Assign constituency to a report
// @access  Admin only
router.put('/assignments/:id', apiLimiter, sanitizeInput, validateObjectId, [
  body('state').trim().isLength({ min: 1, max: 100 }).withMessage('State is required'),
  body('constituency').trim().isLength({ min: 1, max: 100 }).withMessage('Constituency is required'),
  body('parliamentaryConstituency').optional().trim().isLength({ max: 100 })
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

    const { id: reportId } = req.params;
    const { state, constituency, parliamentaryConstituency } = req.body;

    const pothole = await Pothole.findById(reportId);
    if (!pothole) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Update the pothole with constituency information
    pothole.state = state;
    pothole.constituency = constituency;
    pothole.parliamentaryConstituency = parliamentaryConstituency || '';
    pothole.constituencyStatus = 'manually_assigned';

    // Look up and assign MLA from Constituency collection
    try {
      const sanitizedState = validateSearchTerm(state, 100);
      const sanitizedConstituency = validateSearchTerm(constituency, 100);

      const mlaRecord = await Constituency.findOne({
        state: { $regex: new RegExp(`^${sanitizedState}$`, 'i') },
        constituency: { $regex: new RegExp(`^${sanitizedConstituency}$`, 'i') }
      });
      if (mlaRecord && mlaRecord.mla) {
        pothole.authorities = pothole.authorities || {};
        pothole.authorities.mla = mlaRecord.mla;
      }
    } catch (mlaError) {
      console.warn(`Could not find MLA for ${constituency}, ${state}`);
    }

    // Look up and assign MP from MP collection
    if (parliamentaryConstituency) {
      try {
        const sanitizedParliamentaryConstituency = validateSearchTerm(parliamentaryConstituency, 100);

        const mpRecord = await MP.findOne({
          pc_name: { $regex: new RegExp(`^${sanitizedParliamentaryConstituency}$`, 'i') },
          state: { $regex: new RegExp(`^${sanitizedState}$`, 'i') }
        });
        if (mpRecord && mpRecord.mp_name) {
          pothole.authorities = pothole.authorities || {};
          pothole.authorities.mp = mpRecord.mp_name;
        }
      } catch (mpError) {
        console.warn(`Could not find MP for ${parliamentaryConstituency}, ${state}`);
      }
    }

    await pothole.save();

    res.json({
      success: true,
      message: 'Constituency assigned successfully',
      data: {
        reportId: pothole.reportId,
        state,
        constituency,
        parliamentaryConstituency
      }
    });

  } catch (error) {
    console.error('Error assigning constituency:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while assigning constituency'
    });
  }
});

export default router; 
