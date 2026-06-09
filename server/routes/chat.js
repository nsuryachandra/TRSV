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
    return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
  }
};

/**
 * GET /history/:channel_id
 * Fetches the last 50 messages for a specific channel
 */
router.get('/history/:channel_id', authenticateChatUser, async (req, res) => {
  const { channel_id } = req.params;
  const user = req.user;

  // Authorization Check:
  // - Students can ONLY access their own Social Sector Lounge: 'Social-Sector-[TheirHubName]'
  // - 'dev' and 'supreme_admin' roles have access to ALL channels
  // - Leaders can access all Social Sector Lounges
  // - Leaders can access 'GH-Global' and their constituency-specific admin channels
  let isAuthorized = false;

  if (user.role === 'dev' || user.role === 'supreme_admin') {
    isAuthorized = true;
  } else if (user.role === 'student') {
    isAuthorized = channel_id === `Social-Sector-${user.hub_name}`;
  } else {
    // Leader roles
    if (channel_id.startsWith('Social-Sector-')) {
      isAuthorized = true;
    } else if (channel_id === 'GH-Global') {
      isAuthorized = true;
    } else if (channel_id.startsWith('GH-Constituency-')) {
      const constituencyName = channel_id.replace('GH-Constituency-', '');
      if (
        user.constituency_name && 
        (user.constituency_name.toLowerCase() === constituencyName.toLowerCase() ||
         user.parent_name && user.parent_name.toLowerCase() === constituencyName.toLowerCase())
      ) {
        isAuthorized = true;
      } else {
        try {
          const hierarchyCheck = await query(`
            SELECT 1 
            FROM constituencies child
            JOIN constituencies parent ON child.parent_id = parent.id
            WHERE LOWER(child.constituency_name) = LOWER($1)
              AND LOWER(parent.constituency_name) = LOWER($2)
          `, [constituencyName, user.constituency_name]);
          
          if (hierarchyCheck.rows.length > 0) {
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
