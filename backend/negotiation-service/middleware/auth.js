// backend/negotiation-service/middleware/auth.js
import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  // 1. Get token from header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Access Denied: No Token Provided" });
  }

  const token = authHeader.split(' ')[1];

  const accessSecret = process.env.ACCESS_TOKEN_SECRET;
  const serviceSecret = process.env.JWT_SECRET || accessSecret;

  try {
    let verified;
    // Try verify with access token secret first (raw auth tokens)
    if (accessSecret) {
      try {
        verified = jwt.verify(token, accessSecret);
      } catch (_) {
        // fall through to service secret
      }
    }
    // If not verified yet, try the service secret (exchanged tokens)
    if (!verified) {
      verified = jwt.verify(token, serviceSecret);
    }

    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ message: "Invalid or expired token" });
  }
};
