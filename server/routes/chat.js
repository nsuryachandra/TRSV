import express from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Mid-tier authorization middleware supporting students and leaders
const authenticateChatUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Authorization header required.' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Query user profile from database to get live role, constituency, and hub name
    const userQuery = await query(`
      SELECT u.id, u.role, u.full_name, u.email, u.constituency_id,
             c.constituency_name,
             p.constituency_name as parent_name,
             COALESCE(p.constituency_name, c.constituency_name, 'Upcoming Area') as hub_name
      FROM users u
      LEFT JOIN constituencies c ON u.constituency_id = c.id
      LEFT JOIN constituencies p ON c.parent_id = p.id
      WHERE u.id = $1
    `, [decoded.uid]);

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Governance profile not found.' });
    }

    const user = userQuery.rows[0];
    req.user = user;
    next();
  } catch (err) {
    console.warn('⚠️ [Chat Auth] Token verification failed:', err.message);
    // Attempt safe auto-refresh for leadership/admin roles when token expired
    try {
      if (err.name === 'TokenExpiredError') {
        const decoded = jwt.decode(token);
        if (decoded && decoded.uid) {
          const userQuery = await query('SELECT id, role, full_name, email, constituency_id FROM users WHERE id = $1', [decoded.uid]);
          if (userQuery.rows.length > 0) {
            const user = userQuery.rows[0];
            const leadershipRoles = ['dev','supreme_admin','president','state_president','vice_president','general_secretary','secretary','president_of_state'];
            if (leadershipRoles.includes(user.role)) {
              const newToken = jwt.sign({ uid: user.id, email: user.email, role: user.role, name: user.full_name }, JWT_SECRET, { expiresIn: '7d' });
              // Provide the new token as header so client can pick it up
              res.setHeader('X-New-Auth-Token', newToken);
              req.user = user;
              return next();
            }
          }
        }
      }
    } catch (innerErr) {
      console.warn('⚠️ [Chat Auth Grace Refresh] Internal check failed:', innerErr.message);
    }

    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

/**
 * GET /history/:channel_id
 * Fetches the last 50 messages for a specific channel
 */
router.get('/history/:channel_id', authenticateChatUser, async (req, res) => {
  const { channel_id } = req.params;
  const user = req.user;

  /**
   * Chat Channel Authorization — 3-Tier Rules
   *
   * TIER 1 – Full Access (state leaders + devs): any channel, no restriction.
   * TIER 2 – Students: only their own Social-Sector-[hub] channel.
   * TIER 3 – Constituency-level leaders (secretary etc.):
   *   • All Social-Sector channels → open.
   *   • GH-Global → open.
   *   • GH-Constituency-X where X == their constituency → open.
   *   • GH-Constituency-X where X is a CHILD of their area → open.
   *     (e.g. GH admin can see Jubilee Hills, Banjara Hills, etc.)
   *   • GH-Constituency-X where X == their PARENT area → open.
   *     (e.g. Jubilee Hills member can peek at GH parent channel.)
   */
  const FULL_ACCESS_ROLES = [
    'dev', 'supreme_admin', 'president', 'state_president',
    'vice_president', 'general_secretary', 'president_of_state'
  ];
  let isAuthorized = false;

  if (FULL_ACCESS_ROLES.includes(user.role)) {
    // Tier 1 — unrestricted access to every channel
    isAuthorized = true;

  } else if (user.role === 'student') {
    // Tier 2 — students locked to their own Social Sector only
    isAuthorized = channel_id === `Social-Sector-${user.hub_name}`;

  } else {
    // Tier 3 — constituency-level leaders
    if (channel_id.startsWith('Social-Sector-')) {
      isAuthorized = true; // All social lounges open to leaders

    } else if (channel_id === 'GH-Global') {
      isAuthorized = true; // Global lounge open to all leaders

    } else if (channel_id.startsWith('GH-Constituency-')) {
      const requestedArea = channel_id.replace('GH-Constituency-', '').toLowerCase();
      const userArea      = (user.constituency_name || '').toLowerCase();
      const userParent    = (user.parent_name || '').toLowerCase();

      if (userArea && userArea === requestedArea) {
        // Rule A: Their own constituency channel
        isAuthorized = true;

      } else if (userParent && userParent === requestedArea) {
        // Rule B: The channel belongs to their parent constituency
        isAuthorized = true;

      } else if (userArea) {
        try {
          // Rule C: The requested channel is a CHILD of the user's constituency.
          //         (e.g. user is from GH → can access Jubilee Hills, Banjara Hills, etc.)
          const childCheck = await query(`
            SELECT 1
            FROM constituencies child
            JOIN constituencies parent ON child.parent_id = parent.id
            WHERE LOWER(child.constituency_name) = $1
              AND LOWER(parent.constituency_name) = $2
            LIMIT 1
          `, [requestedArea, userArea]);

          if (childCheck.rows.length > 0) {
            isAuthorized = true;
          }
        } catch (err) {
          console.error('🚨 [Chat Hierarchy Check Error]:', err.message);
        }
      }
    }
  }

  if (!isAuthorized) {
    return res.status(403).json({ 
      success: false, 
      message: `Access denied. You do not have permissions to view chat room: ${channel_id}` 
    });
  }

  try {
    // Fetch last 50 messages, ordered ascending by time so they render top-to-bottom
    const messagesQuery = await query(`
      SELECT 
        m.id, 
        m.channel_id, 
        m.message_text, 
        m.created_at, 
        m.sender_id, 
        m.is_edited,
        u.full_name as sender_name, 
        u.role as sender_role
      FROM chat_messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.channel_id = $1
      ORDER BY m.created_at ASC
      LIMIT 50
    `, [channel_id]);

    res.json({ success: true, messages: messagesQuery.rows });
  } catch (err) {
    console.error('🚨 [Chat API Error]:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /active-channels
 * Fetches all channels that currently contain chat history along with active participant profiles (Dev/Supreme only)
 */
router.get('/active-channels', authenticateChatUser, async (req, res) => {
  const user = req.user;
  if (user.role !== 'dev' && user.role !== 'supreme_admin') {
    return res.status(403).json({ success: false, message: 'Access restricted to developers and supreme administrators.' });
  }

  try {
    const result = await query(`
      SELECT 
        m.channel_id,
        json_agg(json_build_object('name', u.full_name, 'role', u.role)) as participants
      FROM (
        SELECT DISTINCT ON (channel_id, sender_id) channel_id, sender_id
        FROM chat_messages
      ) m
      JOIN users u ON u.id = m.sender_id
      GROUP BY m.channel_id
    `);
    res.json({ success: true, channels: result.rows });
  } catch (err) {
    console.error('🚨 [Chat API Active Channels Error]:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
