import express from 'express';
import { body, validationResult } from 'express-validator';
import { sendContactEmail } from '../services/emailService.js';
import { sanitizeInput } from '../middleware/sanitize.js';
import { apiLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// POST /api/contact
router.post('/', apiLimiter, sanitizeInput, [
  body('name').trim().notEmpty().isLength({ max: 100 }).withMessage('Name is required and must be less than 100 characters'),
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('message').trim().isLength({ min: 10, max: 2000 }).withMessage('Message must be between 10 and 2000 characters'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  const { name, email, message } = req.body;
  try {
    await sendContactEmail({ name, email, message });
    res.status(200).json({ success: true, message: 'Your message has been sent!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send your message. Please try again later.' });
  }
});

export default router; 