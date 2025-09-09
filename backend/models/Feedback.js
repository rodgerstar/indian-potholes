import mongoose from 'mongoose';

const FeedbackSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  imageUrl: { type: String },
  status: { type: String, enum: ['pending', 'reviewed', 'actioned', 'closed'], default: 'pending' },
}, { timestamps: true });

const Feedback = mongoose.model('Feedback', FeedbackSchema);
export default Feedback; 