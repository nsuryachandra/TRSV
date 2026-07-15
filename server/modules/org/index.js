import express from 'express';
import { query } from '../../config/db.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(['supreme_admin']));

router.get('/hierarchy', async (req, res) => {
  try {
    const districtsRes = await query('SELECT DISTINCT district FROM constituencies ORDER BY district');
    const constituenciesRes = await query('SELECT * FROM constituencies ORDER BY constituency_name');
    const collegesRes = await query('SELECT * FROM colleges ORDER BY college_name');

    res.json({
      success: true,
      districts: districtsRes.rows.map(r => r.district),
      constituencies: constituenciesRes.rows,
      colleges: collegesRes.rows
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/constituencies', async (req, res) => {
  const { constituency_name, district, parent_id } = req.body;
  if (!constituency_name || !district) {
    return res.status(400).json({ success: false, message: 'Name and district are required.' });
  }

  try {
    const result = await query(`
      INSERT INTO constituencies (constituency_name, district, parent_id, status)
      VALUES ($1, $2, $3, 'active')
      RETURNING *
    `, [constituency_name, district, parent_id || null]);
    res.status(201).json({ success: true, constituency: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/colleges', async (req, res) => {
  const { college_name, constituency_id } = req.body;
  if (!college_name || !constituency_id) {
    return res.status(400).json({ success: false, message: 'College name and constituency ID are required.' });
  }

  try {
    const result = await query(`
      INSERT INTO colleges (college_name, constituency_id)
      VALUES ($1, $2)
      RETURNING *
    `, [college_name, constituency_id]);
    res.status(201).json({ success: true, college: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default {
  id: 'org',
  name: 'Organization Management',
  description: 'Manage constituencies, district coordination nodes, and college listings.',
  permissions: ['manage_org'],
  router
};
