import mongoose from 'mongoose';

const constituencySchema = new mongoose.Schema({
  state: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  constituency: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  mla: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  party: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: [{ type: String, trim: true, lowercase: true }],
  twitterHandle: { type: String, trim: true }
}, {
  timestamps: true
});

// Ensure unique MLA per constituency per state
constituencySchema.index({ state: 1, constituency: 1 }, { unique: true });

export default mongoose.model('Constituency', constituencySchema); 