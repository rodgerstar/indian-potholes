import mongoose from 'mongoose';

const potholeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Made optional for guest submissions
  },
  submittedBy: {
    type: String,
    enum: ['user', 'guest'],
    required: true,
    default: 'user'
  },
  guestEmail: {
    type: String,
    trim: true,
    maxlength: [200, 'Email cannot exceed 200 characters'],
    validate: {
      validator: function(v) {
        // Only validate if value is present
        if (!v) return true;
        // Simple email regex
        return /^([a-zA-Z0-9_\-.+]+)@([a-zA-Z0-9_\-.]+)\.([a-zA-Z]{2,5})$/.test(v);
      },
      message: 'Invalid email format'
    }
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  location: {
    name: {
      type: String,
      required: [true, 'Location name is required'],
      trim: true,
      maxlength: [200, 'Location name cannot exceed 200 characters']
    },
    coordinates: {
      latitude: {
        type: Number,
        required: [true, 'Latitude is required'],
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      longitude: {
        type: Number,
        required: [true, 'Longitude is required'],
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      }
    }
  },
  state: {
    type: String,
    required: false,
    default: 'Pending Assignment',
    trim: true,
    maxlength: [100, 'State name cannot exceed 100 characters']
  },
  constituency: {
    type: String,
    required: false,
    default: 'Pending Assignment',
    trim: true,
    maxlength: [100, 'Constituency name cannot exceed 100 characters']
  },
  parliamentaryConstituency: {
    type: String,
    required: false,
    default: 'Pending Assignment',
    trim: true,
    maxlength: [100, 'Parliamentary constituency name cannot exceed 100 characters']
  },
  constituencyStatus: {
    type: String,
    enum: ['auto_assigned', 'pending_manual', 'manually_assigned'],
    default: 'pending_manual'
  },
  media: [{
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true
    },
    url: {
      type: String,
      required: [true, 'Media URL is required']
    },
    publicId: {
      type: String,
      required: true
    }
  }],
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: [true, 'Severity is required']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  authorities: {
    contractor: {
      type: String,
      trim: true,
      maxlength: [100, 'Contractor name cannot exceed 100 characters']
    },
    engineer: {
      type: String,
      trim: true,
      maxlength: [100, 'Engineer name cannot exceed 100 characters']
    },
    corporator: {
      type: String,
      trim: true,
      maxlength: [100, 'Corporator name cannot exceed 100 characters']
    },
    mla: {
      type: String,
      trim: true,
      maxlength: [100, 'MLA name cannot exceed 100 characters']
    },
    mp: {
      type: String,
      trim: true,
      maxlength: [100, 'MP name cannot exceed 100 characters']
    }
  },
  status: {
    type: String,
    enum: ['reported', 'acknowledged', 'in_progress', 'resolved'],
    default: 'reported'
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  },
  upvotes: {
    type: Number,
    default: 0
  },
  upvotedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  adminComment: {
    type: String,
    trim: true,
    maxlength: [1000, 'Admin comment cannot exceed 1000 characters']
  },
  adminCommentAt: {
    type: Date
  },
  reportId: {
    type: String,
    required: true,
    unique: true,
    length: 10,
    index: true
  }
}, {
  timestamps: true
});

// Pre-save middleware to generate a 10-digit reportId if not present
potholeSchema.pre('save', async function(next) {
  if (!this.reportId) {
    let unique = false;
    let newId;
    while (!unique) {
      newId = Math.floor(1000000000 + Math.random() * 9000000000).toString(); // 10-digit
      const existing = await mongoose.models.Pothole.findOne({ reportId: newId });
      if (!existing) unique = true;
    }
    this.reportId = newId;
  }
  next();
});

// Index for geolocation queries
potholeSchema.index({ 'location.coordinates': '2dsphere' });

// Index for efficient queries
potholeSchema.index({ createdAt: -1 });
potholeSchema.index({ upvotes: -1 });

// Add missing indexes for performance
potholeSchema.index({ userId: 1 });
potholeSchema.index({ status: 1 });
potholeSchema.index({ state: 1 });
potholeSchema.index({ constituency: 1 });
potholeSchema.index({ approvalStatus: 1 });
potholeSchema.index({ constituencyStatus: 1 });

// Compound indexes for common query patterns
potholeSchema.index({ state: 1, constituency: 1 });
potholeSchema.index({ status: 1, createdAt: -1 });
potholeSchema.index({ userId: 1, createdAt: -1 });
potholeSchema.index({ approvalStatus: 1, createdAt: -1 });

export default mongoose.model('Pothole', potholeSchema);
