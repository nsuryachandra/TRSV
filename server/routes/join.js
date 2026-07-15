import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { requireRole } from './constituencies.js';
import { getClientIP } from '../utils/ip.js';
import { requireAuth, JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

// 1a. Fetch Logged-in User's Active Application
router.get('/my', requireAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT jr.*, con.constituency_name, COALESCE(jr.district, con.district) AS district 
       FROM join_requests jr
       LEFT JOIN constituencies con ON jr.constituency_id = con.id
       WHERE jr.user_id = $1 OR jr.email = $2
       ORDER BY jr.created_at DESC
       LIMIT 1`,
      [req.user.uid, req.user.email]
    );
    res.json({ success: true, request: result.rows[0] || null });
  } catch (error) {
    console.error('🚨 [Fetch My Join Request Error]:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 1b. Fetch all active/approved leaders for Team page
router.get('/leaders', requireAuth, async (req, res) => {
  try {
    const result = await query(`
      SELECT u.id, u.full_name, u.role, u.profile_image, u.phone, con.constituency_name, con.district
      FROM users u
      LEFT JOIN constituencies con ON u.constituency_id = con.id
      WHERE u.role IN ('supreme_admin', 'state_president', 'vice_president', 'general_secretary', 'secretary', 'president')
      ORDER BY 
        CASE u.role
          WHEN 'supreme_admin' THEN 1
          WHEN 'state_president' THEN 2
          WHEN 'vice_president' THEN 3
          WHEN 'general_secretary' THEN 4
          WHEN 'secretary' THEN 5
          WHEN 'president' THEN 6
          ELSE 7
        END ASC,
        u.created_at DESC
    `);
    res.json({ success: true, leaders: result.rows });
  } catch (err) {
    console.error('🚨 [Fetch Leaders Error]:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1. Submit Join Request (Public endpoint)
router.post('/', async (req, res) => {
  const { fullName, email, phone, memberType, collegeName, locality, district, constituencyId, reason, dateOfBirth, gender } = req.body;

  if (!fullName || !phone || !memberType || !district || !constituencyId || !reason || !dateOfBirth || !gender) {
    return res.status(400).json({ success: false, message: 'All required application fields are required.' });
  }

  let userId = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.uid;
    } catch (e) {
      console.warn('⚠️ [Join Request] Token verification failed for submission:', e.message);
    }
  }

  try {
    const result = await query(
      `INSERT INTO join_requests (full_name, email, phone, member_type, college_name, locality, district, constituency_id, reason, date_of_birth, gender, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [fullName, email || '', phone, memberType, memberType === 'Student' ? collegeName : null, locality || null, district, parseInt(constituencyId), reason, dateOfBirth || null, gender || null, userId]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Your application to join TRSV has been registered successfully! Our regional committee will review it shortly.', 
      request: result.rows[0] 
    });

    await query(
      'INSERT INTO realtime_activity_logs (user_id, activity_type, details, ip_address) VALUES ($1, $2, $3, $4)',
      [null, 'SUBMIT_JOIN_REQUEST', `Public application submitted by ${fullName} to join TRSV`, getClientIP(req)]
    );
  } catch (error) {
    console.error('🚨 [Join Request Submit Error]:', error.message);
    res.status(500).json({ success: false, message: 'Failed to submit application. Please try again.', error: error.message });
  }
});

// 2. Fetch Join Requests (Accessible to Admins and Regional Leaders)
router.get('/', requireRole(['supreme_admin', 'president', 'state_president', 'vice_president', 'general_secretary', 'secretary', 'dev']), async (req, res) => {
  const { role, constituency_id } = req.user;

  try {
    let result;
    const isStatewide = role === 'supreme_admin' || role === 'dev' || !constituency_id;

    if (isStatewide) {
      result = await query(
        `SELECT jr.*, con.constituency_name, COALESCE(jr.district, con.district) AS district 
         FROM join_requests jr
         LEFT JOIN constituencies con ON jr.constituency_id = con.id
         ORDER BY jr.created_at DESC`
      );
    } else {
      result = await query(
        `SELECT jr.*, con.constituency_name, COALESCE(jr.district, con.district) AS district 
         FROM join_requests jr
         LEFT JOIN constituencies con ON jr.constituency_id = con.id
         WHERE jr.constituency_id = $1
         ORDER BY jr.created_at DESC`,
        [constituency_id]
      );
    }
    res.json({ success: true, requests: result.rows });
  } catch (error) {
    console.error('🚨 [Fetch Join Requests Error]:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Update Join Request Status (Accessible to Admins and Regional Leaders)
router.patch('/:id', requireRole(['supreme_admin', 'president', 'state_president', 'vice_president', 'general_secretary', 'secretary', 'dev']), async (req, res) => {
  const { id } = req.params;
  const { status, role: assignedRole } = req.body;
  const { role: callerRole, constituency_id } = req.user;

  if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status update value.' });
  }

  try {
    const check = await query('SELECT * FROM join_requests WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application request not found.' });
    }

    const request = check.rows[0];
    const isStatewide = callerRole === 'supreme_admin' || callerRole === 'dev' || !constituency_id;

    // Security check: Regional leaders can only moderate requests within their constituency
    if (!isStatewide && request.constituency_id !== constituency_id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You are not authorized to moderate this application.' });
    }

    const result = await query(
      `UPDATE join_requests 
       SET status = $1 
       WHERE id = $2 
       RETURNING *`,
      [status, id]
    );

    // If approving, create/update user profile, member identity, and metrics
    if (status === 'Approved') {
      const finalRole = assignedRole || 'student';
      let uid;

      let checkUser = null;
      if (request.user_id) {
        const checkUserRes = await query('SELECT * FROM users WHERE id = $1', [request.user_id]);
        if (checkUserRes.rows.length > 0) checkUser = checkUserRes.rows[0];
      }
      if (!checkUser && request.email) {
        const checkEmailRes = await query('SELECT * FROM users WHERE email = $1', [request.email]);
        if (checkEmailRes.rows.length > 0) checkUser = checkEmailRes.rows[0];
      }

      if (checkUser) {
        uid = checkUser.id;
        await query(
          `UPDATE users 
           SET role = $1, constituency_id = $2, verified = TRUE,
               full_name = COALESCE(NULLIF($3, ''), full_name),
               email = COALESCE(NULLIF($4, ''), email),
               phone = COALESCE(NULLIF($5, ''), phone)
           WHERE id = $6`,
          [finalRole, request.constituency_id, request.full_name, request.email, request.phone, uid]
        );
      } else {
        uid = 'tvrs-usr-' + crypto.randomBytes(6).toString('hex');
        await query(
          'INSERT INTO users (id, full_name, email, phone, role, constituency_id, verified) VALUES ($1, $2, $3, $4, $5, $6, TRUE)',
          [uid, request.full_name, request.email || '', request.phone, finalRole, request.constituency_id]
        );
      }

      // Create or activate member identity (scanner ID)
      const checkIdentity = await query('SELECT * FROM member_identities WHERE user_id = $1', [uid]);
      
      let conName = 'STATE';
      if (request.constituency_id) {
        const conRes = await query('SELECT constituency_name FROM constituencies WHERE id = $1', [request.constituency_id]);
        if (conRes.rows.length > 0) {
          conName = conRes.rows[0].constituency_name;
        }
      }
      const conCode = conName.toUpperCase().replace(/[^A-Z0-9]/g, '');
      
      const trsv_member_id = checkIdentity.rows.length > 0
        ? checkIdentity.rows[0].trsv_member_id
        : `TVRS-${conCode}-${Math.floor(100000 + Math.random() * 900000)}`;
      const qr_token = checkIdentity.rows.length > 0
        ? checkIdentity.rows[0].qr_token
        : 'qr_' + crypto.randomBytes(16).toString('hex');

      if (checkIdentity.rows.length > 0) {
        await query(
          "UPDATE member_identities SET verification_status = 'Verified', active = TRUE WHERE user_id = $1",
          [uid]
        );
      } else {
        await query(
          "INSERT INTO member_identities (user_id, trsv_member_id, qr_token, verification_status, active) VALUES ($1, $2, $3, 'Verified', TRUE)",
          [uid, trsv_member_id, qr_token]
        );
      }

      // Create or update member profile metrics with timeline
      const checkMetrics = await query('SELECT * FROM member_profile_metrics WHERE user_id = $1', [uid]);
      const defaultTimeline = JSON.stringify([
        { date: new Date().toISOString().split('T')[0], event: `Application approved. Role assigned: ${finalRole.replace(/_/g, ' ').toUpperCase()} for constituency.` }
      ]);

      if (checkMetrics.rows.length === 0) {
        await query(
          'INSERT INTO member_profile_metrics (user_id, issues_resolved, issues_pending, rating, timeline) VALUES ($1, 0, 0, 5.00, $2::jsonb)',
          [uid, defaultTimeline]
        );
      } else {
        await query(
          'UPDATE member_profile_metrics SET timeline = timeline || $1::jsonb WHERE user_id = $2',
          [defaultTimeline, uid]
        );
      }
    }

    // Insert audit log
    await query(
      'INSERT INTO realtime_activity_logs (user_id, activity_type, details, ip_address) VALUES ($1, $2, $3, $4)',
      [req.user.uid, 'UPDATE_JOIN_REQUEST_STATUS', `Application request #${id} status changed to '${status}'${status === 'Approved' ? ` with role '${assignedRole || 'student'}'` : ''}`, getClientIP(req)]
    );

    res.json({ success: true, message: `Application status updated to ${status}${status === 'Approved' ? ` with role '${assignedRole || 'student'}' assigned.` : '.'}`, request: result.rows[0] });
  } catch (error) {
    console.error('🚨 [Update Join Request Status Error]:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
