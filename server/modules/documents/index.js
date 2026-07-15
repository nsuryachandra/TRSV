import express from 'express';
import crypto from 'crypto';
import { query } from '../../config/db.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { getClientIP } from '../../utils/ip.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(['supreme_admin']));

router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT d.*, u.full_name AS recipient_name, creator.full_name AS creator_name
      FROM documents d
      LEFT JOIN users u ON d.recipient_id = u.id
      LEFT JOIN users creator ON d.created_by = creator.id
      ORDER BY d.created_at DESC
    `);
    res.json({ success: true, documents: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/generate', async (req, res) => {
  const { doc_type, recipient_id, recipient_name, content } = req.body;
  if (!doc_type || !recipient_name || !content) {
    return res.status(400).json({ success: false, message: 'Document type, recipient name, and content are required.' });
  }

  try {
    const year = new Date().getFullYear();
    const prefixMap = {
      'Appointment': 'APP',
      'Promotion': 'PRO',
      'Appreciation': 'APR',
      'Official': 'OFF',
      'Circular': 'CIR',
      'Authorization': 'AUTH'
    };
    const prefix = prefixMap[doc_type] || 'DOC';
    
    const countRes = await query("SELECT COUNT(*) FROM documents WHERE doc_type = $1", [doc_type]);
    const sequence = String(parseInt(countRes.rows[0].count) + 1).padStart(4, '0');
    const doc_number = `TVRS/${prefix}/${year}/${sequence}`;

    const qr_token = 'doc_' + crypto.randomBytes(16).toString('hex');

    const result = await query(`
      INSERT INTO documents (doc_type, doc_number, recipient_id, recipient_name, content, qr_token, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [doc_type, doc_number, recipient_id || null, recipient_name, content, qr_token, req.user.uid]);

    await query(`
      INSERT INTO audit_logs (user_id, action_context, previous_state, new_state, ip_address)
      VALUES ($1, $2, $3, $4, $5)
    `, [req.user.uid, 'GENERATE_DOCUMENT', null, JSON.stringify(result.rows[0]), getClientIP(req)]);

    res.status(201).json({ success: true, message: 'Document generated successfully.', document: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/verify/:qr_token', async (req, res) => {
  const { qr_token } = req.params;
  try {
    const result = await query(`
      SELECT d.*, creator.full_name AS created_by_name
      FROM documents d
      LEFT JOIN users creator ON d.created_by = creator.id
      WHERE d.qr_token = $1
    `, [qr_token]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Official TVRS document record not found.' });
    }
    res.json({ success: true, verified: true, document: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default {
  id: 'documents',
  name: 'Document Engine',
  description: 'Generate, verify and print official TVRS credentials and authorization letters.',
  permissions: ['manage_documents'],
  router
};
