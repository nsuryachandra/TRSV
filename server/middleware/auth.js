import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('🚨 FATAL: JWT_SECRET environment variable is not set. Server cannot start securely.');
  process.exit(1);
}

/**
 * requireAuth — Verifies the JWT and attaches user data to req.user.
 * Does NOT check roles — use requireRole for that.
 */
export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authorization header required.' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const userQuery = await query(
      'SELECT id, role, full_name, email, constituency_id, college_id FROM users WHERE id = $1',
      [decoded.uid]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    const user = userQuery.rows[0];
    req.user = {
      uid: user.id,
      email: user.email,
      role: user.role === 'dev' ? 'supreme_admin' : user.role,
      actualRole: user.role,
      full_name: user.full_name,
      constituency_id: user.constituency_id,
      college_id: user.college_id
    };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Authentication session expired or invalid.' });
  }
};

/**
 * requireRole — Checks that the authenticated user has one of the allowed roles.
 * Must be used AFTER requireAuth in the middleware chain.
 */
export const requireRole = (allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  const effectiveRole = req.user.role === 'digital_operations_president' ? 'general_secretary' : req.user.role;

  if (!allowedRoles.includes(effectiveRole)) {
    return res.status(403).json({ success: false, message: 'Forbidden: Insufficient access level.' });
  }

  next();
};

export { JWT_SECRET };
