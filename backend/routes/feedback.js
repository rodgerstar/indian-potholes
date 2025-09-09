import express from 'express';
import { body, validationResult } from 'express-validator';
import Feedback from '../models/Feedback.js';
import { authenticateToken } from '../middleware/auth.js';
import { sanitizeInput } from '../middleware/sanitize.js';
import { apiLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// Submit feedback
router.post('/', apiLimiter, authenticateToken, sanitizeInput, [
  body('message')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters'),
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

    const { message, imageUrl } = req.body;
    const feedback = new Feedback({
      user: req.user._id,
      message,
      imageUrl: imageUrl || null
    });
    await feedback.save();
    res.status(201).json({ success: true, feedback });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit feedback' 
    });
  }
});

// Get all feedback for the logged-in user
router.get('/', apiLimiter, authenticateToken, sanitizeInput, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('-__v');
    res.json({ success: true, feedbacks });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch feedback' 
    });
  }
});

export default router; 