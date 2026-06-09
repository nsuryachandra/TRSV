import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../config/db.js';

const router = express.Router();

// GET /api/auth/sessions - list active refresh sessions for current user
router.get('/sessions', requireAuth, async (req, res) => {
  try {
    const uid = req.user.uid;
    const rows = await query(`SELECT id, expires_at, revoked, created_at, last_used_at, replaced_by_hash FROM refresh_tokens WHERE user_id = $1 ORDER BY created_at DESC`, [uid]);
    return res.json({ success: true, sessions: rows.rows });
  } catch (err) {
    console.error('🚨 [Sessions] Failed to fetch sessions:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch sessions.' });
  }
});

export default router;
