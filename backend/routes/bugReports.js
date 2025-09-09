import express from 'express';
import { body, validationResult } from 'express-validator';
import BugReport from '../models/BugReport.js';
import { authenticateToken } from '../middleware/auth.js';
import { sanitizeInput } from '../middleware/sanitize.js';
import { apiLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// Submit a new bug report
router.post('/', apiLimiter, authenticateToken, sanitizeInput, [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('imageUrl')
    .optional()
    .custom((value) => {
      if (value === '' || value === null || value === undefined) {
        return true; // Allow empty values
      }
      // Check if it's a valid URL
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    })
    .withMessage('Image URL must be a valid URL')
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

    const { title, description, imageUrl } = req.body;
    const bugReport = new BugReport({
      user: req.user._id,
      title,
      description,
      imageUrl: imageUrl || null
    });
    await bugReport.save();
    res.status(201).json({ success: true, bugReport });
      } catch (err) {
      res.status(500).json({ 
      success: false, 
      message: 'Failed to submit bug report' 
    });
  }
});

// Get all bug reports for the logged-in user
router.get('/', apiLimiter, authenticateToken, sanitizeInput, async (req, res) => {
  try {
    const bugReports = await BugReport.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('-__v');
    res.json({ success: true, bugReports });
      } catch (err) {
      res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch bug reports' 
    });
  }
});

export default router; 