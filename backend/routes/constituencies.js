import express from 'express';
import { query } from 'express-validator';
import constituencyService from '../services/constituencyService.js';
import { sanitizeInput } from '../middleware/sanitize.js';
import { apiLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// GET /api/constituencies?state=&constituency=
router.get('/', apiLimiter, sanitizeInput, [
  query('state')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('State must be between 1 and 100 characters'),
  query('constituency')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Constituency must be between 1 and 100 characters')
], async (req, res) => {
  try {
    const { state, constituency } = req.query;
    
    if (!state) {
      // Return all states
      const states = await constituencyService.getStates();
      return res.json({ success: true, data: states });
    }
    
    if (state && !constituency) {
      // Return all constituencies for the state
      const constituencies = await constituencyService.getConstituencies(state);
      return res.json({ success: true, data: constituencies });
    }
    
    if (state && constituency) {
      // Return MLA and party for the state and constituency
      const result = await constituencyService.getMLAAndParty(state, constituency);
      if (!result) {
        return res.status(404).json({ 
          success: false, 
          message: 'Constituency not found' 
        });
      }
      return res.json({ success: true, data: result });
    }
    
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid query parameters' 
    });
      } catch (err) {
      res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Add parliamentary constituencies endpoint
router.get('/parliamentary', apiLimiter, sanitizeInput, [
  query('state')
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('State must be between 1 and 100 characters')
], async (req, res) => {
  try {
    const { state } = req.query;
    if (!state) {
      return res.status(400).json({ success: false, message: 'State is required' });
    }
    const constituencies = await constituencyService.getParliamentaryConstituencies(state);
    return res.json({ success: true, data: constituencies });
      } catch (err) {
      res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Add MP lookup endpoint
router.get('/mp', apiLimiter, sanitizeInput, [
  query('state')
    .notEmpty()
    .trim(),
  query('pc_name')
    .notEmpty()
    .trim()
], async (req, res) => {
  try {
    const { state, pc_name } = req.query;
    if (!state || !pc_name) {
      return res.status(400).json({ success: false, message: 'State and pc_name are required' });
    }
    const result = await constituencyService.getMPByPC(state, pc_name);
    if (!result) {
      return res.status(404).json({ success: false, message: 'MP not found' });
    }
    return res.json({ success: true, data: result });
      } catch (err) {
      res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router; 