import express from 'express';
import User from '../models/user.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.use(requireAdmin);

// GET /api/admin/users - list all users (basic fields)
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}, 'username email role createdAt isSuspended suspendedUntil');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
});

// GET /api/admin/users/:id - get single user detail
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id, 'username email role createdAt isSuspended suspendedUntil suspensionReason');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user', error: err.message });
  }
});

// POST /api/admin/users/:id/suspend
// body options:
//   - { amount: number, unit: 'minutes' | 'hours' | 'days', reason?: string }
//   - { until: string (ISO datetime), reason?: string }
router.post('/:id/suspend', async (req, res) => {
  try {
    const { amount, unit, reason, until } = req.body || {};
    const now = new Date();
    let suspendedUntil;

    if (until) {
      const parsed = new Date(until);
      if (Number.isNaN(parsed.getTime()) || parsed <= now) {
        return res.status(400).json({ message: 'Invalid suspension end date' });
      }
      suspendedUntil = parsed;
    } else {
      const validUnits = ['minutes', 'hours', 'days'];
      if (!amount || amount <= 0 || !validUnits.includes(unit)) {
        return res.status(400).json({ message: 'Invalid suspension duration' });
      }

      let ms = 0;
      if (unit === 'minutes') ms = amount * 60 * 1000;
      if (unit === 'hours') ms = amount * 60 * 60 * 1000;
      if (unit === 'days') ms = amount * 24 * 60 * 60 * 1000;

      suspendedUntil = new Date(now.getTime() + ms);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        isSuspended: true,
        suspendedUntil,
        suspensionReason: reason || null,
      },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      message: 'User suspended successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isSuspended: user.isSuspended,
        suspendedUntil: user.suspendedUntil,
        suspensionReason: user.suspensionReason,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to suspend user', error: err.message });
  }
});

// POST /api/admin/users/:id/unsuspend
router.post('/:id/unsuspend', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        isSuspended: false,
        suspendedUntil: null,
        suspensionReason: null,
      },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      message: 'User suspension cancelled',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isSuspended: user.isSuspended,
        suspendedUntil: user.suspendedUntil,
        suspensionReason: user.suspensionReason,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to unsuspend user', error: err.message });
  }
});

export default router;
