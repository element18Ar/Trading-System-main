import jwt from 'jsonwebtoken'

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access Denied: No Token Provided' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const accessSecret = process.env.ACCESS_TOKEN_SECRET || 'dev_secret_key'
    const serviceSecret = process.env.JWT_SECRET || 'dev_secret_key'
    let verified
    if (accessSecret) {
      try { verified = jwt.verify(token, accessSecret) } catch {}
    }
    if (!verified && serviceSecret) {
      try { verified = jwt.verify(token, serviceSecret) } catch {}
    }
    if (!verified) {
      return res.status(403).json({ message: 'Invalid or expired token' })
    }
    req.user = verified
    next()
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' })
  }
}