import UserProfile from '../models/userprofile.js';

// Controller to create a new profile or update an existing one
export const createOrUpdateProfile = async (req, res) => {
    try {
        // The user ID comes from the token payload (req.user is set by verifyToken)
        const userId = req.user.id; 
        const { fullName, address, phoneNumber } = req.body;

        // Find and update the profile, or create it if it doesn't exist
        const profile = await UserProfile.findOneAndUpdate(
            { userId: userId },
            { fullName, address, phoneNumber },
            { new: true, upsert: true, runValidators: true } // upsert: true creates if not found
        );

        res.status(200).json({ message: "Profile saved successfully", profile });

    } catch (error) {
        res.status(500).json({ message: 'Failed to create or update profile', error: error.message });
    }
};

// Controller to fetch the profile of the logged-in user
export const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Find the profile and populate the 'userId' field with username/email if needed
        const profile = await UserProfile.findOne({ userId }).populate('userId', 'username email'); 

        if (!profile) {
            return res.status(404).json({ message: 'User profile not found' });
        }

        res.status(200).json(profile);

    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
    }
};