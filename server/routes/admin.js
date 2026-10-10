import express from 'express';
import Application from '../models/Application.js';
import Opportunity from '../models/Opportunity.js';
import User from '../models/User.js';
import { protect, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', protect, requireAdmin, async (req, res, next) => {
  try {
    const [users, opportunities, applications, applicationCounts, opportunityCounts] = await Promise.all([
      User.find().select('name email role createdAt').sort({ createdAt: -1 }).limit(50).lean(),
      Opportunity.find().populate('postedBy', 'name email').sort({ createdAt: -1 }).limit(50).lean(),
      Application.find()
        .populate('opportunityId', 'title type company')
        .populate('applicant.userId', 'name email')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      Application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Opportunity.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
    ]);
    const [userCount, adminCount, opportunityCount, applicationCount] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      Opportunity.countDocuments(),
      Application.countDocuments(),
    ]);

    return res.json({
      stats: {
        users: userCount,
        opportunities: opportunityCount,
        applications: applicationCount,
        admins: adminCount,
      },
      applicationCounts: Object.fromEntries(applicationCounts.map(item => [item._id, item.count])),
      opportunityCounts: Object.fromEntries(opportunityCounts.map(item => [item._id, item.count])),
      users,
      opportunities,
      applications,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
