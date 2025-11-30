// 1. Import Express and router using ES Module syntax
import express from 'express';
import multer from 'multer';

// 2. Import the *specific named exports* from the controller
import { listItem, getAllItems } from '../controllers/itemController.js'; 
import Item from '../models/Item.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();


const upload = multer({ dest: "uploads/" });

router.post("/", verifyToken, upload.single("itemImage"), listItem);
router.get("/", getAllItems);

// Get items for the currently authenticated user (all statuses)
router.get("/mine", verifyToken, async (req, res) => {
  try {
    const items = await Item.find({ seller: req.user.id }).sort({ createdAt: -1 });
    res.json({ status: 'success', results: items.length, data: { items } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Could not fetch your items.' });
  }
});

export default router;
