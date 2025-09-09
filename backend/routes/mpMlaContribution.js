import express from 'express';
import { body, validationResult } from 'express-validator';
import { sanitizeInput } from '../middleware/sanitize.js';
import { apiLimiter, userLimiter } from '../middleware/rateLimit.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import MPMLAContribution from '../models/MPMLAContribution.js';
import MP from '../models/MP.js';
import Constituency from '../models/Constituency.js';
import xss from 'xss';

const router = express.Router();

// @route   POST /api/contribute-mp-mla
// @desc    Submit MP/MLA contribution data
// @access  Public (with rate limiting)
router.post('/', userLimiter, sanitizeInput, [
  body('type')
    .isIn(['MP', 'MLA'])
    .withMessage('Type must be either MP or MLA'),
  body('state')
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('State is required and must be between 1-100 characters'),
  body('constituency')
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Constituency is required and must be between 1-100 characters'),
  body('representativeName')
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Representative name is required and must be between 1-100 characters'),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail()
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('Email must be valid and max 100 characters'),
  body('twitterHandle')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Twitter handle must be max 50 characters')
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

    const { type, state, constituency, representativeName, email, twitterHandle } = req.body;

    // Check that at least one contact method is provided
    if ((!email || !email.trim()) && (!twitterHandle || !twitterHandle.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either an email address or Twitter handle'
      });
    }

    // Sanitize inputs
    const sanitizedData = {
      type: xss(type),
      state: xss(state),
      constituency: xss(constituency),
      representativeName: xss(representativeName),
      email: email ? xss(email) : undefined,
      twitterHandle: twitterHandle ? xss(twitterHandle.replace('@', '')) : undefined
    };

    // Check for duplicate pending submissions (prevent spam)
    const existingSubmission = await MPMLAContribution.findOne({
      type: sanitizedData.type,
      state: sanitizedData.state,
      constituency: sanitizedData.constituency,
      status: 'pending',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    });

    if (existingSubmission) {
      return res.status(409).json({
        success: false,
        message: 'A contribution for this constituency has already been submitted recently and is pending review. Please wait 24 hours before submitting again or try a different constituency.'
      });
    }

    // Get IP and user agent for tracking
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Create new contribution
    const contribution = new MPMLAContribution({
      ...sanitizedData,
      submittedBy: {
        ip,
        userAgent
      }
    });

    await contribution.save();

    res.status(201).json({
      success: true,
      message: 'Thank you for your contribution! It will be reviewed by our moderators.',
      submissionId: contribution._id
    });

  } catch (error) {
    console.error('Contribution submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit contribution. Please try again.'
    });
  }
});

// @route   GET /api/contribute-mp-mla/pending
// @desc    Get pending contributions for admin moderation
// @access  Admin only
router.get('/pending', authenticateToken, requireAdmin, apiLimiter, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, state } = req.query;
    
    const filter = { status: 'pending' };
    if (type) filter.type = type;
    if (state) filter.state = state;

    const contributions = await MPMLAContribution.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await MPMLAContribution.countDocuments(filter);

    // Get current data for comparison
    const enrichedContributions = await Promise.all(contributions.map(async (contribution) => {
      let currentData = null;
      
      if (contribution.type === 'MP') {
        currentData = await MP.findOne({
          state: contribution.state,
          pc_name: contribution.constituency
        }).lean();
      } else {
        currentData = await Constituency.findOne({
          state: contribution.state,
          constituency: contribution.constituency
        }).lean();
      }

      return {
        ...contribution,
        currentData
      };
    }));

    res.json({
      success: true,
      data: {
        contributions: enrichedContributions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get pending contributions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending contributions'
    });
  }
});

// @route   GET /api/contribute-mp-mla/all
// @desc    Get all contributions with optional status filter
// @access  Admin only
router.get('/all', authenticateToken, requireAdmin, apiLimiter, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, state, status } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (state) filter.state = state;
    if (status) filter.status = status;

    const contributions = await MPMLAContribution.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await MPMLAContribution.countDocuments(filter);

    // Get current data for comparison
    const enrichedContributions = await Promise.all(contributions.map(async (contribution) => {
      let currentData = null;
      if (contribution.type === 'MP') {
        currentData = await MP.findOne({
          state: contribution.state,
          pc_name: contribution.constituency
        }).lean();
      } else {
        currentData = await Constituency.findOne({
          state: contribution.state,
          constituency: contribution.constituency
        }).lean();
      }
      return {
        ...contribution,
        currentData
      };
    }));

    res.json({
      success: true,
      data: {
        contributions: enrichedContributions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get all contributions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contributions'
    });
  }
});

// @route   GET /api/contribute-mp-mla/stats
// @desc    Get stats on MP/MLA contributions (public)
// @access  Public
router.get('/stats', apiLimiter, async (req, res) => {
  try {
    // Get counts by status
    const [total, approved, rejected, pending] = await Promise.all([
      MPMLAContribution.countDocuments(),
      MPMLAContribution.countDocuments({ status: 'approved' }),
      MPMLAContribution.countDocuments({ status: 'rejected' }),
      MPMLAContribution.countDocuments({ status: 'pending' })
    ]);

    // MLA coverage - percentage of MLAs who have at least an email or X handle
    const totalMLAConstituencies = await Constituency.countDocuments();
    const mlaWithContact = await Constituency.countDocuments({
      $or: [
        { email: { $exists: true, $ne: null, $ne: [] } },
        { twitterHandle: { $exists: true, $ne: null, $ne: '' } }
      ]
    });
    const mlaCoverage = totalMLAConstituencies > 0 ? ((mlaWithContact / totalMLAConstituencies) * 100).toFixed(2) : '0.00';

    // MP coverage - percentage of MPs who have at least an email or X handle
    const totalMPConstituencies = await MP.countDocuments();
    const mpWithContact = await MP.countDocuments({
      $or: [
        { email: { $exists: true, $ne: null, $ne: [] } },
        { twitterHandle: { $exists: true, $ne: null, $ne: '' } }
      ]
    });
    const mpCoverage = totalMPConstituencies > 0 ? ((mpWithContact / totalMPConstituencies) * 100).toFixed(2) : '0.00';

    res.json({
      success: true,
      data: {
        total,
        approved,
        rejected,
        pending,
        mlaCoverage,
        mpCoverage
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

// @route   POST /api/contribute-mp-mla/moderate/:id
// @desc    Moderate a contribution (approve/reject)
// @access  Admin only
router.post('/moderate/:id', authenticateToken, requireAdmin, userLimiter, [
  body('action')
    .isIn(['approved', 'rejected'])
    .withMessage('Action must be either approved or rejected'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be max 500 characters')
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

    const { id } = req.params;
    const { action, notes } = req.body;

    const contribution = await MPMLAContribution.findById(id);
    if (!contribution) {
      return res.status(404).json({
        success: false,
        message: 'Contribution not found'
      });
    }

    if (contribution.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Contribution has already been moderated'
      });
    }

    // Update contribution status
    contribution.status = action;
    contribution.moderatedBy = {
      userId: req.user.userId,
      action,
      notes: notes ? xss(notes) : undefined,
      moderatedAt: new Date()
    };

    if (action === 'approved') {
      // Update the main dataset
      if (contribution.type === 'MP') {
        const updateData = {
          mp_name: contribution.representativeName
        };
        
        if (contribution.email) {
          updateData.email = [contribution.email];
        }
        
        if (contribution.twitterHandle) {
          updateData.twitterHandle = contribution.twitterHandle;
        }
        
        await MP.findOneAndUpdate(
          { state: contribution.state, pc_name: contribution.constituency },
          { $set: updateData },
          { upsert: true }
        );
      } else {
        const updateData = {
          mla: contribution.representativeName
        };
        
        if (contribution.email) {
          updateData.email = [contribution.email];
        }
        
        if (contribution.twitterHandle) {
          updateData.twitterHandle = contribution.twitterHandle;
        }
        
        await Constituency.findOneAndUpdate(
          { state: contribution.state, constituency: contribution.constituency },
          { $set: updateData },
          { upsert: true }
        );
      }
    }

    await contribution.save();

    res.json({
      success: true,
      message: `Contribution ${action} successfully`,
      data: contribution
    });

  } catch (error) {
    console.error('Moderation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to moderate contribution'
    });
  }
});

// @route   PATCH /api/contribute-mp-mla/:id
// @desc    Edit a rejected contribution (admin only)
// @access  Admin only
router.patch('/:id', authenticateToken, requireAdmin, userLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = {};
    const allowedFields = ['representativeName', 'email', 'twitterHandle'];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateFields[field] = req.body[field];
      }
    }
    const contribution = await MPMLAContribution.findById(id);
    if (!contribution) {
      return res.status(404).json({ success: false, message: 'Contribution not found' });
    }
    if (contribution.status !== 'rejected') {
      return res.status(400).json({ success: false, message: 'Only rejected contributions can be edited' });
    }
    Object.assign(contribution, updateFields);
    await contribution.save();
    res.json({ success: true, message: 'Contribution updated', data: contribution });
  } catch (error) {
    console.error('Edit rejected contribution error:', error);
    res.status(500).json({ success: false, message: 'Failed to update contribution' });
  }
});

// @route   DELETE /api/contribute-mp-mla/:id
// @desc    Delete a contribution (admin only)
// @access  Admin only
router.delete('/:id', authenticateToken, requireAdmin, userLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const contribution = await MPMLAContribution.findByIdAndDelete(id);
    if (!contribution) {
      return res.status(404).json({ success: false, message: 'Contribution not found' });
    }
    res.json({ success: true, message: 'Contribution deleted' });
  } catch (error) {
    console.error('Delete contribution error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete contribution' });
  }
});

export default router;