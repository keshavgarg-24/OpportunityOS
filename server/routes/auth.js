import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
const router = express.Router();

const isConfiguredAdmin = (email) => new Set(
  (process.env.ADMIN_EMAILS || '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean)
).has(email.trim().toLowerCase());

router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('name email role');
    if (!user) return res.status(401).json({ message: 'Account no longer exists.' });
    if (isConfiguredAdmin(user.email) && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }
    return res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    return next(error);
  }
});

router.post('/register', async (req,res) => {
  const {name,email,password} = req.body;
  if (![name, email, password].every(value => typeof value === 'string' && value.trim())) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }
  const hash = await bcrypt.hash(password, 10);
  try {
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hash,
      role: isConfiguredAdmin(email) ? 'admin' : 'user',
    });
    res.json({message: 'User created', role: user.role});
  } catch { res.status(400).json({message: 'Email already exists'}); }
});

router.post('/login', async (req,res) => {
  const {email,password} = req.body;
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({email: normalizedEmail});
  if(!user) return res.status(400).json({message: 'User not found'});
  const ok = await bcrypt.compare(password, user.password);
  if(!ok) return res.status(400).json({message: 'Wrong password'});
  if (isConfiguredAdmin(normalizedEmail) && user.role !== 'admin') {
    user.role = 'admin';
    await user.save();
  }
  const token = jwt.sign({id:user._id}, process.env.JWT_SECRET, {expiresIn: '7d'});
  res.json({token, user: {id:user._id, name:user.name, email:user.email, role:user.role}});
});

export default router;