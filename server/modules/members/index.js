import express from 'express';
import crypto from 'crypto';
import { query } from '../../config/db.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { getClientIP } from '../../utils/ip.js';
import eventHub from '../../services/eventEmitter.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(['supreme_admin']));

router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT u.*, con.constituency_name, col.college_name, mi.trsv_member_id, mi.verification_status
      FROM users u
      LEFT JOIN constituencies con ON u.constituency_id = con.id
      LEFT JOIN colleges col ON u.college_id = col.id
      LEFT JOIN member_identities mi ON u.id = mi.user_id
      ORDER BY u.created_at DESC
    `);
    res.json({ success: true, members: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { full_name, email, phone, role, constituency_id, college_id } = req.body;
  if (!full_name || !email) {
    return res.status(400).json({ success: false, message: 'Full name and email are required.' });
  }

  try {
    const check = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (check.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    const uid = 'tvrs-usr-' + crypto.randomBytes(6).toString('hex');
    await query(`
      INSERT INTO users (id, full_name, email, phone, role, constituency_id, college_id, verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)
    `, [uid, full_name, email, phone || null, role || 'student', constituency_id || null, college_id || null]);

    eventHub.publish('member.created', { uid, full_name, email, constituency_id });

    res.status(201).json({ success: true, message: 'Member created successfully.', uid });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { full_name, role, constituency_id, college_id, phone } = req.body;

  try {
    const userResult = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    const prev = userResult.rows[0];

    await query(`
      UPDATE users
      SET full_name = COALESCE($1, full_name),
          role = COALESCE($2, role),
          constituency_id = $3,
          college_id = $4,
          phone = COALESCE($5, phone),
          updated_at = NOW()
      WHERE id = $6
    `, [full_name, role, constituency_id || null, college_id || null, phone, id]);

    const details = [];
    if (role && role !== prev.role) details.push(`role changed from ${prev.role} to ${role}`);
    if (constituency_id !== prev.constituency_id) details.push(`constituency changed`);
    
    if (details.length > 0) {
      const timelineMsg = `Profile details updated: ${details.join(', ')}`;
      await query(`
        UPDATE member_profile_metrics
        SET timeline = timeline || $1::jsonb
        WHERE user_id = $2
      `, [JSON.stringify([{ date: new Date().toISOString().split('T')[0], event: timelineMsg }]), id]);
    }

    await query(`
      INSERT INTO audit_logs (user_id, action_context, previous_state, new_state, ip_address)
      VALUES ($1, $2, $3, $4, $5)
    `, [req.user.uid, 'EDIT_MEMBER', JSON.stringify(prev), JSON.stringify({ full_name, role, constituency_id, college_id, phone }), getClientIP(req)]);

    res.json({ success: true, message: 'Member updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const userResult = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }
    await query('DELETE FROM users WHERE id = $1', [id]);

    await query(`
      INSERT INTO audit_logs (user_id, action_context, previous_state, new_state, ip_address)
      VALUES ($1, $2, $3, $4, $5)
    `, [req.user.uid, 'DELETE_MEMBER', JSON.stringify(userResult.rows[0]), null, getClientIP(req)]);

    res.json({ success: true, message: 'Member deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/applications/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { role } = req.body; // e.g. 'president', 'vice_president', 'general_secretary', 'secretary', 'student'
  try {
    const requestResult = await query('SELECT * FROM join_requests WHERE id = $1', [id]);
    if (requestResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Join application not found.' });
    }
    const app = requestResult.rows[0];

    const assignedRole = role || 'student';

    await query('UPDATE join_requests SET status = \'Approved\' WHERE id = $1', [id]);

    const checkEmail = await query('SELECT * FROM users WHERE email = $1', [app.email]);
    let uid;
    
    if (checkEmail.rows.length > 0) {
      // User already exists, update their role and constituency!
      uid = checkEmail.rows[0].id;
      await query(`
        UPDATE users
        SET role = $1, constituency_id = $2, verified = TRUE
        WHERE id = $3
      `, [assignedRole, app.constituency_id, uid]);
    } else {
      // Create new user
      uid = 'tvrs-usr-' + crypto.randomBytes(6).toString('hex');
      await query(`
        INSERT INTO users (id, full_name, email, phone, role, constituency_id, verified)
        VALUES ($1, $2, $3, $4, $5, $6, TRUE)
      `, [uid, app.full_name, app.email, app.phone, assignedRole, app.constituency_id]);
    }

    // Check if member identity already exists
    const checkIdentity = await query('SELECT * FROM member_identities WHERE user_id = $1', [uid]);
    const trsv_member_id = checkIdentity.rows.length > 0 
      ? checkIdentity.rows[0].trsv_member_id 
      : 'TVRS-MEM-' + Math.floor(100000 + Math.random() * 900000);
    const qr_token = checkIdentity.rows.length > 0 
      ? checkIdentity.rows[0].qr_token 
      : 'qr_' + crypto.randomBytes(16).toString('hex');

    if (checkIdentity.rows.length > 0) {
      await query(`
        UPDATE member_identities
        SET verification_status = 'Verified', active = TRUE
        WHERE user_id = $1
      `, [uid]);
    } else {
      await query(`
        INSERT INTO member_identities (user_id, trsv_member_id, qr_token, verification_status, active)
        VALUES ($1, $2, $3, 'Verified', TRUE)
      `, [uid, trsv_member_id, qr_token]);
    }

    // Check if metrics already exist
    const checkMetrics = await query('SELECT * FROM member_profile_metrics WHERE user_id = $1', [uid]);
    const defaultTimeline = JSON.stringify([
      { date: new Date().toISOString().split('T')[0], event: `Application approved. Role assigned: ${assignedRole.replace(/_/g, ' ').toUpperCase()} for constituency.` }
    ]);
    
    if (checkMetrics.rows.length === 0) {
      await query(`
        INSERT INTO member_profile_metrics (user_id, issues_resolved, issues_pending, rating, timeline)
        VALUES ($1, 0, 0, 5.00, $2::jsonb)
      `, [uid, defaultTimeline]);
    } else {
      await query(`
        UPDATE member_profile_metrics
        SET timeline = timeline || $1::jsonb
        WHERE user_id = $2
      `, [defaultTimeline, uid]);
    }

    await query(`
      INSERT INTO audit_logs (user_id, action_context, previous_state, new_state, ip_address)
      VALUES ($1, $2, $3, $4, $5)
    `, [req.user.uid, 'APPROVE_APPLICATION', JSON.stringify(app), JSON.stringify({ uid, trsv_member_id, status: 'APPROVED' }), getClientIP(req)]);

    eventHub.publish('application.approved', { uid, email: app.email, full_name: app.full_name });

    res.json({ success: true, message: `Application approved. Role '${assignedRole}' assigned and member verified successfully.`, uid });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/:id/verify', async (req, res) => {
  const { id } = req.params;
  try {
    const userResult = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Member profile not found.' });
    }

    await query('UPDATE users SET verified = TRUE WHERE id = $1', [id]);

    await query(`
      UPDATE member_identities
      SET verification_status = 'Verified', active = TRUE
      WHERE user_id = $1
    `, [id]);

    const vhash = crypto.createHash('sha256').update(`${id}_${req.user.uid}_${Date.now()}`).digest('hex');
    await query(`
      INSERT INTO verification_logs (verified_by, target_type, target_id, verification_hash)
      VALUES ($1, 'user_profile', $2, $3)
    `, [req.user.uid, 1, vhash]);

    await query(`
      UPDATE member_profile_metrics
      SET timeline = timeline || $1::jsonb
      WHERE user_id = $2
    `, [JSON.stringify([{ date: new Date().toISOString().split('T')[0], event: `Membership verified by Supreme Admin: ${req.user.full_name}` }]), id]);

    await query(`
      INSERT INTO audit_logs (user_id, action_context, previous_state, new_state, ip_address)
      VALUES ($1, $2, $3, $4, $5)
    `, [req.user.uid, 'VERIFY_MEMBER', JSON.stringify(userResult.rows[0]), JSON.stringify({ verified: true, verification_hash: vhash }), getClientIP(req)]);

    eventHub.publish('member.verified', { id, verified_by: req.user.uid });

    res.json({ success: true, message: 'Member verified successfully. Verified badge applied and Digital ID updated.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ success: false, message: 'Status is required.' });
  }

  try {
    const userResult = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Member profile not found.' });
    }

    await query(`
      UPDATE member_identities
      SET verification_status = $1, revoked = $2
      WHERE user_id = $3
    `, [status, status === 'Revoked', id]);

    await query(`
      UPDATE member_profile_metrics
      SET timeline = timeline || $1::jsonb
      WHERE user_id = $2
    `, [JSON.stringify([{ date: new Date().toISOString().split('T')[0], event: `Membership status updated to: ${status}` }]), id]);

    res.json({ success: true, message: `Member status updated to ${status}.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id/timeline', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('SELECT timeline FROM member_profile_metrics WHERE user_id = $1', [id]);
    if (result.rows.length === 0) {
      return res.json({ success: true, timeline: [] });
    }
    res.json({ success: true, timeline: result.rows[0].timeline || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default {
  id: 'members',
  name: 'Member Management',
  description: 'Manage TVRS members, approve applications, handle promotions and status audits.',
  permissions: ['manage_members'],
  router
};
