import express from 'express';
import { body, validationResult } from 'express-validator';
import Notification from '../models/Notification.js';
import { authenticateToken } from '../middleware/auth.js';
import { sanitizeInput } from '../middleware/sanitize.js';
import { apiLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// Get all notifications for the logged-in user
router.get('/', apiLimiter, authenticateToken, sanitizeInput, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    const filter = { user: req.user._id };
    if (unreadOnly === 'true') {
      filter.isRead = false;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Notification.countDocuments(filter)
    ]);

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
      message: 'Failed to fetch notifications'
    });
  }
});

// Get unread notification count
router.get('/unread-count', apiLimiter, authenticateToken, sanitizeInput, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user._id,
      isRead: false
    });

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count'
    });
  }
});

// Mark notification as read
router.patch('/:id/read', apiLimiter, authenticateToken, sanitizeInput, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      data: { notification }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', apiLimiter, authenticateToken, sanitizeInput, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      data: { updatedCount: result.modifiedCount }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
});

// Delete notification
router.delete('/:id', apiLimiter, authenticateToken, sanitizeInput, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
});

// Clear all notifications
router.delete('/clear-all', apiLimiter, authenticateToken, sanitizeInput, async (req, res) => {
  try {
    const result = await Notification.deleteMany({ user: req.user._id });

    res.json({
      success: true,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to clear notifications'
    });
  }
});

export default router; 