import mongoose from 'mongoose';

const tokenBlacklistSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  reason: {
    type: String,
    enum: ['logout', 'password_change', 'admin_revoke', 'security_breach'],
    default: 'logout'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 24 * 60 * 60 // Automatically delete documents after 24 hours
  }
}, {
  timestamps: true
});

// Index for efficient queries
tokenBlacklistSchema.index({ userId: 1 });

export default mongoose.model('TokenBlacklist', tokenBlacklistSchema); 