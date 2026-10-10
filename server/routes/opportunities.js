import express from 'express';
import Opportunity from '../models/Opportunity.js';
import Application from '../models/Application.js';
import { protect, requireAdmin } from '../middleware/auth.js';
const router = express.Router();

router.get('/mine', protect, async (req,res,next) => {
  try {
    const opps = await Opportunity.find({ postedBy: req.user.id }).sort({ createdAt: -1 });
    return res.json(opps);
  } catch (error) {
    return next(error);
  }
});

router.get('/', async (req,res) => {
  const opps = await Opportunity.find().sort({createdAt: -1});
  res.json(opps);
});

router.post('/', protect, requireAdmin, async (req,res,next) => {
  try {
    const { title, company, description, type, location, link, tags = [] } = req.body;
    const allowedTypes = ['job','internship','hackathon','scholarship','open-source'];
    if (typeof title !== 'string' || !title.trim() || !allowedTypes.includes(type)) {
      return res.status(400).json({ message: 'A title and valid opportunity type are required.' });
    }
    if (!Array.isArray(tags) || tags.some(tag => typeof tag !== 'string')) {
      return res.status(400).json({ message: 'Tags must be a list of text values.' });
    }
    const opp = await Opportunity.create({
      title: title.trim(),
      company: typeof company === 'string' ? company.trim() : '',
      description: typeof description === 'string' ? description.trim() : '',
      type,
      location: typeof location === 'string' ? location.trim() : '',
      link: typeof link === 'string' ? link.trim() : '',
      tags: tags.map(tag => tag.trim()).filter(Boolean),
      postedBy: req.user.id
    });
    return res.status(201).json(opp);
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', protect, async (req,res,next) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
      return res.status(400).json({ message: 'Invalid opportunity id.' });
    }
    const opp = await Opportunity.findOneAndDelete({ _id: req.params.id, postedBy: req.user.id });
    if (!opp) return res.status(404).json({ message: 'Opportunity not found or you cannot delete it.' });
    await Application.deleteMany({ opportunityId: opp._id });
    return res.json({ message: 'Opportunity deleted.' });
  } catch (error) {
    return next(error);
  }
});

export default router;