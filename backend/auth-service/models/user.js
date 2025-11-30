import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },

  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  // ⭐ Add this to support refresh token storage
  refreshTokens: {
    type: [String],
    default: [],
  },

  // Suspension fields (admin-controlled)
  isSuspended: {
    type: Boolean,
    default: false,
  },
  suspendedUntil: {
    type: Date,
    default: null,
  },
  suspensionReason: {
    type: String,
    default: null,
  },

  avatar: {
    type: String,
    default: null,
  },

}, {
  timestamps: true,
});

/* 🔐 Hash password before saving */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

/* 🔑 Compare raw password with hashed password */
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
