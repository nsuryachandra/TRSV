import express from 'express';
import { query } from '../../config/db.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(['supreme_admin']));

router.get('/audit-logs', async (req, res) => {
  try {
    const result = await query(`
      SELECT al.*, u.full_name, u.email, u.role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 100
    `);
    res.json({ success: true, logs: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/security-logs', async (req, res) => {
  try {
    const result = await query(`
      SELECT asl.*, u.full_name AS actor_name
      FROM audit_security_logs asl
      LEFT JOIN users u ON asl.actor_id = u.id
      ORDER BY asl.created_at DESC
      LIMIT 100
    `);
    res.json({ success: true, logs: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/activity-logs', async (req, res) => {
  try {
    const result = await query(`
      SELECT ral.*, u.full_name, u.email
      FROM realtime_activity_logs ral
      LEFT JOIN users u ON ral.user_id = u.id
      ORDER BY ral.created_at DESC
      LIMIT 100
    `);
    res.json({ success: true, logs: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default {
  id: 'security',
  name: 'Security Settings',
  description: 'View immutable audit logs, real-time activity streams, and monitor privilege compliance.',
  permissions: ['manage_security'],
  router
};
