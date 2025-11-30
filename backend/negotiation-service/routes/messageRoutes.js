import express from 'express';
import { createMessage, getMessages } from '../controllers/messageController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyToken);

router.post('/', createMessage);
router.get('/:tradeId', getMessages);

export default router;
