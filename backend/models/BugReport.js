import mongoose from 'mongoose';

const BugReportSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String },
  status: { type: String, enum: ['pending', 'in_progress', 'resolved', 'closed'], default: 'pending' },
}, { timestamps: true });

const BugReport = mongoose.model('BugReport', BugReportSchema);
export default BugReport; 