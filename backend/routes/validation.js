import express from 'express';
import { body, validationResult } from 'express-validator';
import { apiLimiter } from '../middleware/rateLimit.js';
import { sanitizeInput } from '../middleware/sanitize.js';
import indiaBoundaryService from '../services/indiaBoundaryService.js';

const router = express.Router();

// @route   POST /api/validation/coordinates
// @desc    Validate if coordinates are within India's boundaries
// @access  Public (rate limited)
router.post('/coordinates', apiLimiter, sanitizeInput, [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates format',
        errors: errors.array()
      });
    }

    const { latitude, longitude } = req.body;
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // Validate coordinates are within India's boundaries
    const isWithinIndia = await indiaBoundaryService.isWithinIndia(lat, lng);
    
    if (isWithinIndia) {
      res.json({
        success: true,
        message: 'Coordinates are within India',
        data: {
          isValid: true,
          latitude: lat,
          longitude: lng,
          location: 'India'
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Pothole reporting is only available within India\'s boundaries',
        data: {
          isValid: false,
          latitude: lat,
          longitude: lng,
          location: 'Outside India'
        }
      });
    }
  } catch (error) {
    console.error('Error validating coordinates:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating coordinates. Please try again.'
    });
  }
});

// @route   GET /api/validation/boundary-stats
// @desc    Get India boundary service statistics
// @access  Public
router.get('/boundary-stats', apiLimiter, async (req, res) => {
  try {
    const stats = indiaBoundaryService.getBoundaryStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving boundary statistics'
    });
  }
});

export default router;