import mongoose from 'mongoose';
const oppSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: String,
  description: String,
  type: { type: String, enum: ['job','internship','hackathon','scholarship','open-source'], required: true },
  tags: { type: [String], default: [] },
  location: String,
  link: String,
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
export default mongoose.model('Opportunity', oppSchema);