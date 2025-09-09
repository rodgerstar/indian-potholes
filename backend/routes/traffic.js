import express from 'express';
import { getTrafficOverview } from '../services/analyticsService.js';
import { apiLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// GET /api/traffic
router.get('/', apiLimiter, async (req, res) => {
  try {
    const days = parseInt(req.query.days, 10) || 30;
    const data = await getTrafficOverview(days);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching traffic analytics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics data.' });
  }
});

export default router; 