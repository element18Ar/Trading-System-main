import express from 'express';
import { createMessage, getMessages, markMessagesRead } from '../controllers/messageController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyToken);

router.post('/', createMessage);
router.get('/:tradeId', getMessages);
router.patch('/:tradeId/read', markMessagesRead);

export default router;
