import express from 'express';
import { query } from '../../config/db.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { getClientIP } from '../../utils/ip.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(['supreme_admin']));

router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM notices ORDER BY created_at DESC');
    res.json({ success: true, notices: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { title, content, target_audience, priority, status, scheduled_time } = req.body;
  if (!title || !content) {
    return res.status(400).json({ success: false, message: 'Title and content are required.' });
  }

  try {
    const result = await query(`
      INSERT INTO notices (title, content, target_audience, priority, status, scheduled_time)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [title, content, target_audience || 'all', priority || 'Normal', status || 'Active', scheduled_time || null]);

    await query(`
      INSERT INTO announcements (author_id, title, content, target_audience, priority)
      VALUES ($1, $2, $3, $4, $5)
    `, [req.user.uid, title, content, target_audience || 'all', priority || 'Normal']);

    res.status(201).json({ success: true, notice: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content, target_audience, priority, status, scheduled_time } = req.body;

  try {
    const result = await query(`
      UPDATE notices
      SET title = COALESCE($1, title),
          content = COALESCE($2, content),
          target_audience = COALESCE($3, target_audience),
          priority = COALESCE($4, priority),
          status = COALESCE($5, status),
          scheduled_time = $6,
          updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `, [title, content, target_audience, priority, status, scheduled_time || null, id]);

    res.json({ success: true, notice: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM notices WHERE id = $1', [id]);
    res.json({ success: true, message: 'Notice deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default {
  id: 'notices',
  name: 'Notice Management',
  description: 'Broadcast and schedule statewide student announcements and alerts.',
  permissions: ['manage_notices'],
  router
};
