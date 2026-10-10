import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  opportunityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity', required: true },
  applicant: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    resume: { type: String, required: true, trim: true },
    coverLetter: { type: String, trim: true, default: '' }
  },
  status: { type: String, enum: ['submitted','reviewing','accepted','rejected'], default: 'submitted' }
}, { timestamps: true });

applicationSchema.index({ opportunityId: 1, 'applicant.userId': 1 }, { unique: true });

export default mongoose.model('Application', applicationSchema);
