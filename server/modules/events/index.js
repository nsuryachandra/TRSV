import express from 'express';
import { query } from '../../config/db.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(['supreme_admin']));

router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM events ORDER BY event_date DESC');
    res.json({ success: true, events: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { title, description, location, event_date, capacity } = req.body;
  if (!title || !description || !location || !event_date) {
    return res.status(400).json({ success: false, message: 'All details are required.' });
  }

  try {
    const result = await query(`
      INSERT INTO events (title, description, location, event_date, capacity)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [title, description, location, event_date, capacity || 100]);
    res.status(201).json({ success: true, event: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM events WHERE id = $1', [id]);
    res.json({ success: true, message: 'Event deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/:id/attendance', async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;
  if (!user_id) {
    return res.status(400).json({ success: false, message: 'User ID is required.' });
  }

  try {
    await query(`
      INSERT INTO event_attendance (event_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [id, user_id]);

    await query(`
      UPDATE events
      SET attendance_count = (SELECT COUNT(*) FROM event_attendance WHERE event_id = $1)
      WHERE id = $1
    `, [id]);

    res.json({ success: true, message: 'Attendee checked in successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id/attendance', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(`
      SELECT ea.*, u.full_name, u.email, u.phone
      FROM event_attendance ea
      JOIN users u ON ea.user_id = u.id
      WHERE ea.event_id = $1
    `, [id]);
    res.json({ success: true, attendance: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default {
  id: 'events',
  name: 'Event Management',
  description: 'Schedule campus outreach events, log digital check-ins, and compile attendance sheets.',
  permissions: ['manage_events'],
  router
};
