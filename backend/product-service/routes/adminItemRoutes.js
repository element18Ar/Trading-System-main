import express from 'express';
import Item from '../models/Item.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Simple admin guard: reuse token then check role
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

// GET /api/admin/items - list all items
router.get('/', async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch items', error: err.message });
  }
});

// GET /api/admin/items/pending - list items awaiting approval
router.get('/pending', async (req, res) => {
  try {
    const items = await Item.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch pending items', error: err.message });
  }
});

// POST /api/admin/items/:id/approve - approve item and list it
router.post('/:id/approve', async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', isListed: true, reviewNote: null },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Item approved', item });
  } catch (err) {
    res.status(500).json({ message: 'Failed to approve item', error: err.message });
  }
});

// POST /api/admin/items/:id/reject - reject item with optional note
router.post('/:id/reject', async (req, res) => {
  try {
    const { note } = req.body || {};
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', isListed: false, reviewNote: note || null },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Item rejected', item });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reject item', error: err.message });
  }
});

export default router;
