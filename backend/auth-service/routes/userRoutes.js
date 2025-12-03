import express from 'express';
import { getUsers, getUserById } from '../controllers/userController.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const access = process.env.ACCESS_TOKEN_SECRET;
    const service = process.env.JWT_SECRET;
    const refresh = process.env.REFRESH_TOKEN_SECRET;
    let decoded;
    if (access) { try { decoded = jwt.verify(token, access); } catch {} }
    if (!decoded && service) { try { decoded = jwt.verify(token, service); } catch {} }
    if (!decoded && refresh) { try { decoded = jwt.verify(token, refresh); } catch {} }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
}

router.get('/', verifyToken, getUsers);
router.get('/:id', verifyToken, getUserById);

export default router;
