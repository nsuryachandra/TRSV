import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import crypto from 'crypto';
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
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split('Bearer ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authorization header or query token required.' });
  }

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
    // If token expired, attempt a safe auto-refresh using refresh cookie (preferred),
    // otherwise fall back to issuing a refreshed token (expanded grace) so clients
    // do not suddenly lose admin/leader access.
    try {
      if (error.name === 'TokenExpiredError') {
        const decoded = jwt.decode(token);
        if (decoded && decoded.uid) {
          // First try refresh cookie validation
          try {
            const cookieHeader = req.headers.cookie || '';
            const cookies = cookie.parse(cookieHeader || '');
            const provided = cookies.trsv_refresh || (req.cookies && req.cookies.trsv_refresh);
            if (provided) {
              const rtRow = await query('SELECT token, user_id, expires_at FROM refresh_tokens WHERE token = $1', [provided]);
              if (rtRow.rows.length > 0) {
                const row = rtRow.rows[0];
                if (new Date(row.expires_at) > new Date()) {
                  const userQuery = await query('SELECT id, role, full_name, email, constituency_id, college_id FROM users WHERE id = $1', [decoded.uid]);
                  if (userQuery.rows.length > 0) {
                    const user = userQuery.rows[0];
                    const newToken = jwt.sign({ uid: user.id, email: user.email, role: user.role, name: user.full_name }, JWT_SECRET, { expiresIn: '7d' });
                    // rotate refresh token server-side
                    try {
                      const newRefresh = crypto.randomBytes(40).toString('hex');
                      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                      await query('DELETE FROM refresh_tokens WHERE token = $1', [provided]);
                      await query('INSERT INTO refresh_tokens(token, user_id, expires_at) VALUES ($1, $2, $3)', [newRefresh, user.id, expiresAt]);
                      res.cookie('trsv_refresh', newRefresh, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000 });
                    } catch (rotErr) {
                      console.warn('⚠️ [Auth Grace Refresh] Failed to rotate refresh token:', rotErr.message);
                    }
                    res.setHeader('X-New-Auth-Token', newToken);
                    req.user = {
                      uid: user.id,
                      email: user.email,
                      role: user.role === 'dev' ? 'supreme_admin' : user.role,
                      actualRole: user.role,
                      full_name: user.full_name,
                      constituency_id: user.constituency_id,
                      college_id: user.college_id
                    };
                    return next();
                  }
                }
              }
            }
          } catch (cookieErr) {
            console.warn('⚠️ [Auth Grace Refresh] Cookie validation failed:', cookieErr.message);
          }

          // As a fallback, expand grace to all roles: issue a new access token and proceed
          const userQuery = await query('SELECT id, role, full_name, email, constituency_id, college_id FROM users WHERE id = $1', [decoded.uid]);
          if (userQuery.rows.length > 0) {
            const user = userQuery.rows[0];
            const newToken = jwt.sign({ uid: user.id, email: user.email, role: user.role, name: user.full_name }, JWT_SECRET, { expiresIn: '7d' });
            res.setHeader('X-New-Auth-Token', newToken);
            req.user = {
              uid: user.id,
              email: user.email,
              role: user.role === 'dev' ? 'supreme_admin' : user.role,
              actualRole: user.role,
              full_name: user.full_name,
              constituency_id: user.constituency_id,
              college_id: user.college_id
            };
            return next();
          }
        }
      }
    } catch (innerErr) {
      console.warn('⚠️ [Auth Grace Refresh] Internal check failed:', innerErr.message);
    }

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
