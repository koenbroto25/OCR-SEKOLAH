// api/_lib/auth.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.VITE_JWT_SECRET || 'fallback_secret_change_me';

export function signToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function extractToken(req) {
  return req.headers.authorization?.split(' ')[1] || null;
}

export function requireAuth(req, res, role) {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ message: 'Unauthorized' });
    return null;
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ message: 'Token invalid' });
    return null;
  }
  if (role && decoded.role !== role) {
    res.status(403).json({ message: `Requires role: ${role}` });
    return null;
  }
  return decoded;
}