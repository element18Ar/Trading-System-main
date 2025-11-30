// Referenced screenshot: /mnt/data/Screenshot 2025-11-24 170705.png
// File: auth-service/utils/authUtils.js
// CommonJS module - works with Node.js (Express)

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_in_production';

/**
 * Generate a JWT token
 * @param {Object} payload - data to embed in token (e.g. { user_id, role })
 * @param {string} expiresIn - token TTL (e.g. '1h', '7d')
 * @returns {string} token
 */
function generateToken(payload, expiresIn = '1h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verify a JWT token (throws on invalid/expired)
 * @param {string} token
 * @returns {Object} decoded payload
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Hash a plaintext password
 * @param {string} password
 * @returns {Promise<string>} hashed password
 */
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Compare plaintext password with hash
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Express middleware: requireAuth
 * - reads `Authorization: Bearer <token>` header
 * - verifies token
 * - attaches decoded payload to req.user
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    req.user = decoded; // { user_id, role, iat, exp }
    return next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
}

/**
 * Role-based guard middleware
 * @param {string[]} allowedRoles
 */
function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden - insufficient role' });
    }
    next();
  };
}

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  requireAuth,
  requireRole,
};

// -----------------------------
// Example usage (not part of module):
// -----------------------------
// In auth-service/controllers/authController.js
// const { generateToken, hashPassword, comparePassword } = require('../utils/authUtils');
//
// async function register(req, res) {
//   const { username, password } = req.body;
//   const hashed = await hashPassword(password);
//   // save user with hashed password
// }
//
// async function login(req, res) {
//   const { username, password } = req.body;
//   const user = await User.findOne({ username });
//   const ok = await comparePassword(password, user.passwordHash);
//   if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
//
//   const token = generateToken({ user_id: user._id, role: user.role }, '2h');
//   return res.json({ token });
// }
//
// In product-service routes: const { requireAuth, requireRole } = require('../utils/authUtils');
// router.post('/products', requireAuth, requireRole(['seller','admin']), createProductHandler);
