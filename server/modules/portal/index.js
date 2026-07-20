import express from 'express';
import { query } from '../../config/db.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

const router = express.Router();

router.get('/branding', async (req, res) => {
  try {
    const result = await query('SELECT * FROM portal_branding');
    const branding = {};
    result.rows.forEach(row => {
      branding[row.key] = row.value;
    });
    res.json({ success: true, branding });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/branding', requireAuth, requireRole(['supreme_admin', 'dev']), async (req, res) => {
  const settings = req.body;
  try {
    for (const [key, value] of Object.entries(settings)) {
      await query(`
        INSERT INTO portal_branding (key, value)
        VALUES ($1, $2)
        ON CONFLICT (key) DO UPDATE SET value = $2
      `, [key, String(value)]);
    }
    res.json({ success: true, message: 'Portal branding updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default {
  id: 'portal',
  name: 'Portal Configuration',
  description: 'Manage homepage text, customizable header flags, footer alerts, and themes.',
  permissions: ['manage_portal'],
  router
};
