import express from 'express';
import { 
    createOrUpdateProfile, 
    getProfile 
} from '../controllers/userProfileController.js'; 

// Import a middleware function to verify the JWT token
import { verifyToken } from '../middleware/authMiddleware.js'; 

const router = express.Router();

// Route to create a profile (first time) or update an existing one
router.post('/', verifyToken, createOrUpdateProfile); 

// Route to get the currently logged-in user's profile
router.get('/me', verifyToken, getProfile);

export default router;