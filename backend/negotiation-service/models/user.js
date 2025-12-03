import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String },
  email: { type: String },
  avatar: { type: String },
}, { strict: false, timestamps: false });

const User = mongoose.model('User', UserSchema);
export default User;

