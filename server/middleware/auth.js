import jwt from 'jsonwebtoken';
import User from '../models/User.js';
export const protect = (req,res,next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if(!token) return res.status(401).json({message: 'No token'});
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({message: 'Invalid token'});
  }
}

export const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('role');
    if (!user) return res.status(401).json({ message: 'Account no longer exists.' });
    if (user.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' });
    req.adminUser = user;
    return next();
  } catch (error) {
    return next(error);
  }
};