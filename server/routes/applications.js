import express from 'express';
import mongoose from 'mongoose';
import Application from '../models/Application.js';
import Opportunity from '../models/Opportunity.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, async (req, res, next) => {
  try {
    const { opportunityId, name, email, phone, resume, coverLetter = '' } = req.body;
    if (!mongoose.isValidObjectId(opportunityId)) {
      return res.status(400).json({ message: 'A valid opportunity is required.' });
    }
    if (![name, email, phone, resume].every(value => typeof value === 'string' && value.trim())) {
      return res.status(400).json({ message: 'Name, email, phone, and resume link are required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ message: 'Enter a valid email address.' });
    }
    if (!/^https?:\/\/\S+$/i.test(resume.trim())) {
      return res.status(400).json({ message: 'Resume must be a valid http or https link.' });
    }

    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity) return res.status(404).json({ message: 'This opportunity no longer exists.' });

    const application = await Application.create({
      opportunityId: opportunity._id,
      applicant: {
        userId: req.user.id,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        resume: resume.trim(),
        coverLetter: typeof coverLetter === 'string' ? coverLetter.trim() : ''
      }
    });
    return res.status(201).json({ message: 'Application submitted.', applicationId: application._id });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'You have already applied to this opportunity.' });
    }
    return next(error);
  }
});

export default router;