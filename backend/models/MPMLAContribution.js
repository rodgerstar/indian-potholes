import mongoose from 'mongoose';

const mpMlaContributionSchema = new mongoose.Schema({
  // Submission details
  type: {
    type: String,
    enum: ['MP', 'MLA'],
    required: true
  },
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
  
  // Representative details
  representativeName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 100
  },
  twitterHandle: {
    type: String,
    trim: true,
    maxlength: 50
  },
  
  // Submission metadata
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  submittedBy: {
    ip: { type: String },
    userAgent: { type: String }
  },
  moderatedBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, enum: ['approved', 'rejected'] },
    notes: { type: String, maxlength: 500 },
    moderatedAt: { type: Date }
  }
}, {
  timestamps: true
});

// Index for efficient querying
mpMlaContributionSchema.index({ status: 1, createdAt: -1 });
mpMlaContributionSchema.index({ state: 1, constituency: 1, type: 1 });

export default mongoose.model('MPMLAContribution', mpMlaContributionSchema);