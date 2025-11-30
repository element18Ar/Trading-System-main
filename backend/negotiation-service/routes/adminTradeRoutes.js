import express from 'express';
import Trade from '../models/trade.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

const requireAdmin = (req, res, next) => {
  verifyToken(req, res, (err) => {
    if (err) return;
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  });
};

router.use(requireAdmin);

// GET /api/admin/trades - list trades with basic info
router.get('/', async (req, res) => {
  try {
    const trades = await Trade.find()
      .sort({ lastActivity: -1 })
      .populate('initiator receiver', 'username email')
      .select('initiator receiver status lastActivity');
    res.json(trades);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch trades', error: err.message });
  }
});

// GET /api/admin/trades/:id - single trade detail
router.get('/:id', async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id)
      .populate('initiator receiver', 'username email')
      .populate('initiatorItems receiverItems');
    if (!trade) return res.status(404).json({ message: 'Trade not found' });
    res.json(trade);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch trade', error: err.message });
  }
});

export default router;
