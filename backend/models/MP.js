import mongoose from 'mongoose';

const mpSchema = new mongoose.Schema({
  mp_election_index: { type: String, required: true, unique: true },
  mp_name: { type: String, required: true },
  nature_membership: { type: String },
  term_start_date: { type: String },
  term_end_date: { type: String },
  term: { type: String },
  pc_name: { type: String, required: true },
  state: { type: String, required: true },
  mp_political_party: { type: String },
  mp_gender: { type: String },
  educational_qualification: { type: String },
  educational_qualification_details: { type: String },
  mp_age: { type: String },
  debates: { type: String },
  private_member_bills: { type: String },
  questions: { type: String },
  attendance: { type: String },
  mp_note: { type: String },
  mp_house: { type: String },
  email: [{ type: String, trim: true, lowercase: true }],
  twitterHandle: { type: String, trim: true }
}, {
  timestamps: true
});

export default mongoose.model('MP', mpSchema); 