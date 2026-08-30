// api/middleware/auth.js
import { verifyToken, extractToken } from '../_lib/auth.js';

export function withAuth(handler, role) {
  return async (req, res) => {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Token invalid' });
    }

    if (role && decoded.role !== role) {
      return res.status(403).json({ message: `Requires role: ${role}` });
    }

    req.user = decoded;
    return handler(req, res);
  };
}

export default withAuth;