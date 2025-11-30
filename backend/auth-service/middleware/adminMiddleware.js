import { verifyToken } from './authMiddleware.js';

export const requireAdmin = (req, res, next) => {
  // First ensure token is valid and req.user is populated
  verifyToken(req, res, (err) => {
    if (err) return; // verifyToken already sent response
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  });
};
