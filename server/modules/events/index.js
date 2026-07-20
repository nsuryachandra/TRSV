import express from 'express';
import { query } from '../../config/db.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

// Public GET endpoint for all authenticated users
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM events ORDER BY event_date DESC');
    res.json({ success: true, events: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin management endpoints
router.use(requireRole(['supreme_admin', 'dev']));

router.post('/', async (req, res) => {
  const { 
    title, 
    description, 
    location, 
    venue,
    event_date, 
    event_time,
    time,
    organizer, 
    status, 
    banner_url, 
    images, 
    capacity 
  } = req.body;

  if (!title || !description || !(location || venue) || !event_date) {
    return res.status(400).json({ success: false, message: 'Title, description, venue/location, and date are required.' });
  }

  const finalVenue = venue || location;
  const finalTime = event_time || time || '10:00 AM';
  const finalOrganizer = organizer || 'TRSV Executive Body';
  const finalStatus = status || 'Upcoming';

  try {
    const result = await query(`
      INSERT INTO events (
        title, description, location, event_date, time, organizer, status, banner_url, images, capacity
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      title, 
      description, 
      finalVenue, 
      event_date, 
      finalTime, 
      finalOrganizer, 
      finalStatus, 
      banner_url || '', 
      JSON.stringify(images || []), 
      capacity || 100
    ]);
    res.status(201).json({ success: true, event: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { 
    title, 
    description, 
    location, 
    venue,
    event_date, 
    event_time,
    time,
    organizer, 
    status, 
    banner_url, 
    images, 
    capacity 
  } = req.body;

  try {
    const result = await query(`
      UPDATE events
      SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        location = COALESCE($3, location),
        event_date = COALESCE($4, event_date),
        time = COALESCE($5, time),
        organizer = COALESCE($6, organizer),
        status = COALESCE($7, status),
        banner_url = COALESCE($8, banner_url),
        images = COALESCE($9, images),
        capacity = COALESCE($10, capacity)
      WHERE id = $11
      RETURNING *
    `, [
      title, 
      description, 
      venue || location, 
      event_date, 
      event_time || time, 
      organizer, 
      status, 
      banner_url, 
      images ? JSON.stringify(images) : null, 
      capacity, 
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    res.json({ success: true, event: result.rows[0] });
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
