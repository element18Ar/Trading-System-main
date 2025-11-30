import express from 'express';
import { Register, Login, RefreshToken } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', Register);
router.post('/login', Login);
router.post('/refresh', RefreshToken); // uses cookie
//router.post('/logout', Logout);

export default router;
