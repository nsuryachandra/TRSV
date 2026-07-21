import express from 'express';
import crypto from 'crypto';
import pool from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from './constituencies.js';
import { getClientIP } from '../utils/ip.js';
import { initLeadersTable } from '../db/migrations_leaders.js';

const router = express.Router();

// PBKDF2/SHA-512 Secure Salting & Password Hashing Engine (matches auth.js)
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

const ensureLeadersSeeded = async () => {
  try {
    const checkCount = await pool.query('SELECT COUNT(*) FROM leaders');
    if (parseInt(checkCount.rows[0].count, 10) === 0) {
      console.log('⚡ [Leaders API] Auto-triggering initLeadersTable sync...');
      await initLeadersTable();
    }
  } catch (e) {
    try {
      await initLeadersTable();
    } catch (err) {
      console.error('🚨 [Leaders API] Auto-sync failed:', err.message);
    }
  }
};

// Map leader designation to system user role
const mapDesignationToRole = (designation = '') => {
  const desigLower = designation.toLowerCase();
  if (desigLower.includes('founder') || desigLower.includes('patron')) return 'supreme_admin';
  if (desigLower.includes('state president')) return 'state_president';
  if (desigLower.includes('vice president')) return 'vice_president';
  if (desigLower.includes('general secretary')) return 'general_secretary';
  if (desigLower.includes('secretary')) return 'secretary';
  if (desigLower.includes('developer') || desigLower.includes('digital')) return 'dev';
  return 'president';
};

// Generate Location Prefix Code for Organization ID (e.g., STATE, GH, GHSN, GHJB, WGL)
const getLocationTag = (district = '', constituencyName = '') => {
  const distClean = (district || '').trim();
  const constClean = (constituencyName || '').trim();
  const full = `${distClean} ${constClean}`.trim().toLowerCase();

  if (!full || full === 'state' || full === 'telangana' || full.includes('statewide') || full.includes('central') || full.includes('all')) {
    return 'STATE';
  }

  const getAbbr = (text) => {
    const words = text.replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return '';
    if (words.length === 1) {
      const w = words[0].toUpperCase();
      if (w.length <= 2) return w;
      const consonants = w.replace(/[AEIOU]/g, '');
      return consonants.length >= 2 ? consonants.substring(0, 2) : w.substring(0, 2);
    }
    return words.map(w => w[0].toUpperCase()).join('').substring(0, 2);
  };

  const isGH = distClean.toLowerCase().includes('greater hyd') || distClean.toLowerCase() === 'gh' || (distClean.toLowerCase().includes('hyderabad') && !constClean);

  if (isGH) {
    if (!constClean || constClean.toLowerCase() === 'greater hyderabad' || constClean.toLowerCase() === 'hyderabad') {
      return 'GH';
    }
    const cLower = constClean.toLowerCase();
    if (cLower.includes('sanath') || cLower.includes('sn')) return 'GHSN';
    if (cLower.includes('jubilee')) return 'GHJB';
    if (cLower.includes('khairatabad')) return 'GHKT';
    if (cLower.includes('secunderabad')) return 'GHSC';
    if (cLower.includes('amberpet')) return 'GHAP';
    if (cLower.includes('musheerabad')) return 'GHMB';
    if (cLower.includes('malakpet')) return 'GHMP';
    if (cLower.includes('kukatpally')) return 'GHKP';
    if (cLower.includes('serilingampally')) return 'GHSL';
    if (cLower.includes('lb nagar')) return 'GHLB';
    if (cLower.includes('uppal')) return 'GHUP';

    const constAbbr = getAbbr(constClean);
    return `GH${constAbbr}`;
  }

  if (distClean && constClean && constClean.toLowerCase() !== distClean.toLowerCase()) {
    const dAbbr = getAbbr(distClean);
    const cAbbr = getAbbr(constClean);
    return `${dAbbr}${cAbbr}`;
  }

  return getAbbr(distClean || constClean) || 'STATE';
};

// ============================================================================
// 1. PUBLIC ENDPOINT: Fetch active leaders for public Leadership / Team page
// ============================================================================
router.get('/public', async (req, res) => {
  try {
    await ensureLeadersSeeded();
    const result = await pool.query(`
      SELECT 
        id, 
        full_name, 
        profile_image, 
        organization_id, 
        designation, 
        district, 
        constituency_name, 
        biography, 
        joining_date, 
        display_order, 
        status
      FROM leaders
      WHERE status = 'Active'
      ORDER BY display_order ASC, id ASC
    `);
    res.json({ success: true, leaders: result.rows });
  } catch (err) {
    console.error('🚨 [Fetch Public Leaders Error]:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Alias for backwards compatibility with `/api/join-tvrs/leaders`
router.get('/', async (req, res) => {
  try {
    await ensureLeadersSeeded();
    const result = await pool.query(`
      SELECT 
        id, 
        full_name, 
        profile_image, 
        organization_id, 
        designation, 
        district, 
        constituency_name, 
        biography, 
        joining_date, 
        display_order, 
        status
      FROM leaders
      WHERE status = 'Active'
      ORDER BY display_order ASC, id ASC
    `);
    res.json({ success: true, leaders: result.rows });
  } catch (err) {
    console.error('🚨 [Fetch Leaders Error]:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 2. DEV TOOLS CMS ENDPOINTS (Supreme Admin & Dev Only)
// ============================================================================

// GET /api/dev/leaders - Admin list with search, filter, pagination
router.get('/admin/list', requireAuth, requireRole(['supreme_admin', 'dev']), async (req, res) => {
  const { search, status, district, constituency, page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  try {
    await ensureLeadersSeeded();
    let whereClause = [];
    let params = [];
    let paramIdx = 1;

    if (search && search.trim()) {
      whereClause.push(`(
        full_name ILIKE $${paramIdx} OR 
        designation ILIKE $${paramIdx} OR 
        organization_id ILIKE $${paramIdx} OR 
        district ILIKE $${paramIdx} OR 
        constituency_name ILIKE $${paramIdx} OR
        email ILIKE $${paramIdx}
      )`);
      params.push(`%${search.trim()}%`);
      paramIdx++;
    }

    if (status && status !== 'All') {
      whereClause.push(`status = $${paramIdx}`);
      params.push(status);
      paramIdx++;
    }

    if (district && district.trim()) {
      whereClause.push(`district ILIKE $${paramIdx}`);
      params.push(`%${district.trim()}%`);
      paramIdx++;
    }

    if (constituency && constituency.trim()) {
      whereClause.push(`constituency_name ILIKE $${paramIdx}`);
      params.push(`%${constituency.trim()}%`);
      paramIdx++;
    }

    const whereStr = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

    const countRes = await pool.query(`SELECT COUNT(*) FROM leaders ${whereStr}`, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const queryStr = `
      SELECT * 
      FROM leaders 
      ${whereStr}
      ORDER BY display_order ASC, id ASC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;
    params.push(parseInt(limit, 10), offset);

    const result = await pool.query(queryStr, params);

    res.json({
      success: true,
      leaders: result.rows,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (err) {
    console.error('🚨 [Dev Fetch Leaders Error]:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/dev/leaders/admin/add - Add new leader + create login user credentials
router.post('/admin/add', requireAuth, requireRole(['supreme_admin', 'dev']), async (req, res) => {
  const {
    full_name,
    profile_image,
    organization_id,
    designation,
    email,
    password,
    phone,
    college_name,
    district,
    constituency_id,
    constituency_name,
    biography,
    joining_date,
    display_order,
    status
  } = req.body;

  if (!full_name || !designation) {
    return res.status(400).json({ success: false, message: 'Full Name and Designation are required.' });
  }

  if (!email || !email.trim()) {
    return res.status(400).json({ success: false, message: 'Email address is required for leader login credentials.' });
  }

  if (!password || !password.trim()) {
    return res.status(400).json({ success: false, message: 'Password is required so the leader can log in.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    // 1. Check if email already exists in users or leaders
    const checkUserEmail = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (checkUserEmail.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists in the database.' });
    }

    const checkLeaderEmail = await pool.query('SELECT id FROM leaders WHERE LOWER(email) = $1', [cleanEmail]);
    if (checkLeaderEmail.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'A leader with this email address already exists.' });
    }

    // 2. Generate unique, non-recyclable Organization ID with Location Tag (e.g. TRSV-GH-0001, TRSV-GHJB-0001, TRSV-STATE-0001)
    const tag = getLocationTag(district, constituency_name);
    let finalOrgId = organization_id ? organization_id.trim() : '';

    if (!finalOrgId || finalOrgId.startsWith('TRSV-LEAD-')) {
      const maxOrgRes = await pool.query(`
        SELECT MAX(n) as max_num FROM (
          SELECT CAST(SUBSTRING(organization_id FROM '[0-9]+$') AS INTEGER) as n FROM leaders WHERE organization_id LIKE 'TRSV-' || $1 || '-%'
          UNION
          SELECT CAST(SUBSTRING(trsv_member_id FROM '[0-9]+$') AS INTEGER) as n FROM member_identities WHERE trsv_member_id LIKE 'TRSV-' || $1 || '-%'
          UNION
          SELECT MAX(id) as n FROM leaders
        ) sub
      `, [tag]);
      const nextNum = (parseInt(maxOrgRes.rows[0]?.max_num || 0, 10) + 1).toString().padStart(4, '0');
      finalOrgId = `TRSV-${tag}-${nextNum}`;
    } else {
      const checkOrgUsed = await pool.query(
        'SELECT 1 FROM leaders WHERE organization_id = $1 UNION SELECT 1 FROM member_identities WHERE trsv_member_id = $1',
        [finalOrgId]
      );
      if (checkOrgUsed.rows.length > 0) {
        // Auto-increment to next available number for this tag
        const maxOrgRes = await pool.query(`
          SELECT MAX(n) as max_num FROM (
            SELECT CAST(SUBSTRING(organization_id FROM '[0-9]+$') AS INTEGER) as n FROM leaders WHERE organization_id LIKE 'TRSV-' || $1 || '-%'
            UNION
            SELECT CAST(SUBSTRING(trsv_member_id FROM '[0-9]+$') AS INTEGER) as n FROM member_identities WHERE trsv_member_id LIKE 'TRSV-' || $1 || '-%'
            UNION
            SELECT MAX(id) as n FROM leaders
          ) sub
        `, [tag]);
        const nextNum = (parseInt(maxOrgRes.rows[0]?.max_num || 0, 10) + 1).toString().padStart(4, '0');
        finalOrgId = `TRSV-${tag}-${nextNum}`;
      }
    }

    // 3. Determine default display order if not specified
    let finalOrder = parseInt(display_order, 10);
    if (isNaN(finalOrder)) {
      const maxOrderRes = await pool.query('SELECT MAX(display_order) FROM leaders');
      finalOrder = (parseInt(maxOrderRes.rows[0].max || 0, 10)) + 1;
    }

    // 4. Insert into leaders table
    const leaderResult = await pool.query(`
      INSERT INTO leaders (
        full_name, profile_image, organization_id, designation, email, phone, 
        college_name, district, constituency_id, constituency_name, biography, 
        joining_date, display_order, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      full_name.trim(),
      profile_image || '',
      finalOrgId.trim(),
      designation.trim(),
      cleanEmail,
      phone || '',
      college_name || '',
      district || '',
      constituency_id ? parseInt(constituency_id, 10) : null,
      constituency_name || '',
      biography || '',
      joining_date || new Date().toISOString().split('T')[0],
      finalOrder,
      status || 'Active'
    ]);

    // 5. Create user account in 'users' table so leader can log in
    const userRole = mapDesignationToRole(designation);
    const userId = 'tvrs-lead-' + crypto.randomBytes(6).toString('hex');
    const passwordHash = hashPassword(password);

    await pool.query(`
      INSERT INTO users (id, full_name, email, password_hash, role, phone, profile_image, verified, constituency_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, $8)
      ON CONFLICT (email) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        phone = EXCLUDED.phone,
        profile_image = EXCLUDED.profile_image,
        verified = TRUE,
        constituency_id = EXCLUDED.constituency_id
    `, [
      userId,
      full_name.trim(),
      cleanEmail,
      passwordHash,
      userRole,
      phone || null,
      profile_image || '',
      constituency_id ? parseInt(constituency_id, 10) : null
    ]);

    // 6. Bind Digital Identity
    const qrToken = 'qr_' + crypto.randomBytes(16).toString('hex');
    await pool.query(`
      INSERT INTO member_identities (user_id, trsv_member_id, qr_token, verification_status, active)
      VALUES ($1, $2, $3, 'Verified', TRUE)
      ON CONFLICT (user_id) DO UPDATE SET
        trsv_member_id = EXCLUDED.trsv_member_id,
        verification_status = 'Verified',
        active = TRUE
    `, [userId, finalOrgId.trim(), qrToken]);

    // Activity Log
    await pool.query(
      'INSERT INTO realtime_activity_logs (user_id, activity_type, details, ip_address) VALUES ($1, $2, $3, $4)',
      [req.user.uid, 'ADD_LEADER', `Added leader '${full_name}' (${designation}) with login email ${cleanEmail}`, getClientIP(req)]
    );

    res.status(201).json({ success: true, message: 'Leader and login credentials created successfully.', leader: leaderResult.rows[0] });
  } catch (err) {
    console.error('🚨 [Add Leader Error]:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/dev/leaders/admin/edit/:id - Edit existing leader
router.put('/admin/edit/:id', requireAuth, requireRole(['supreme_admin', 'dev']), async (req, res) => {
  const { id } = req.params;
  const {
    full_name,
    profile_image,
    organization_id,
    designation,
    email,
    password,
    phone,
    college_name,
    district,
    constituency_id,
    constituency_name,
    biography,
    joining_date,
    display_order,
    status
  } = req.body;

  if (!full_name || !designation) {
    return res.status(400).json({ success: false, message: 'Full Name and Designation are required.' });
  }

  try {
    const check = await pool.query('SELECT * FROM leaders WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Leader not found.' });
    }
    const prevLeader = check.rows[0];

    const cleanEmail = email ? email.trim().toLowerCase() : prevLeader.email;

    // Check email uniqueness if changed
    if (cleanEmail && cleanEmail !== prevLeader.email) {
      const emailCheck = await pool.query('SELECT 1 FROM leaders WHERE LOWER(email) = $1 AND id != $2', [cleanEmail, id]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'This email address is already in use by another leader.' });
      }
    }

    const result = await pool.query(`
      UPDATE leaders SET
        full_name = $1,
        profile_image = $2,
        organization_id = $3,
        designation = $4,
        email = $5,
        phone = $6,
        college_name = $7,
        district = $8,
        constituency_id = $9,
        constituency_name = $10,
        biography = $11,
        joining_date = $12,
        display_order = $13,
        status = $14,
        updated_at = NOW()
      WHERE id = $15
      RETURNING *
    `, [
      full_name.trim(),
      profile_image || '',
      organization_id || prevLeader.organization_id,
      designation.trim(),
      cleanEmail || '',
      phone || '',
      college_name || '',
      district || '',
      constituency_id ? parseInt(constituency_id, 10) : null,
      constituency_name || '',
      biography || '',
      joining_date || new Date().toISOString().split('T')[0],
      parseInt(display_order || 0, 10),
      status || 'Active',
      id
    ]);

    // Sync changes to 'users' table credentials
    const userRole = mapDesignationToRole(designation);
    const userCheck = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1 OR full_name = $2', [prevLeader.email || '___none___', prevLeader.full_name]);

    if (userCheck.rows.length > 0) {
      const targetUid = userCheck.rows[0].id;
      if (password && password.trim()) {
        const passwordHash = hashPassword(password.trim());
        await pool.query(`
          UPDATE users SET
            full_name = $1, email = $2, role = $3, phone = $4, profile_image = $5, password_hash = $6, updated_at = NOW()
          WHERE id = $7
        `, [full_name.trim(), cleanEmail, userRole, phone || null, profile_image || '', passwordHash, targetUid]);
      } else {
        await pool.query(`
          UPDATE users SET
            full_name = $1, email = $2, role = $3, phone = $4, profile_image = $5, updated_at = NOW()
          WHERE id = $6
        `, [full_name.trim(), cleanEmail, userRole, phone || null, profile_image || '', targetUid]);
      }
    }

    await pool.query(
      'INSERT INTO realtime_activity_logs (user_id, activity_type, details, ip_address) VALUES ($1, $2, $3, $4)',
      [req.user.uid, 'EDIT_LEADER', `Updated details for leader '${full_name}' (#${id})`, getClientIP(req)]
    );

    res.json({ success: true, message: 'Leader updated successfully.', leader: result.rows[0] });
  } catch (err) {
    console.error('🚨 [Edit Leader Error]:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/dev/leaders/admin/delete/:id - Delete leader & erase credentials
router.delete('/admin/delete/:id', requireAuth, requireRole(['supreme_admin', 'dev']), async (req, res) => {
  const { id } = req.params;
  try {
    const check = await pool.query('SELECT * FROM leaders WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Leader not found.' });
    }

    const leader = check.rows[0];

    // 1. Delete from leaders table
    await pool.query('DELETE FROM leaders WHERE id = $1', [id]);

    // 2. Locate and completely erase user credentials and identities
    const userRes = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1) OR full_name = $2', [leader.email || '___none___', leader.full_name]);

    if (userRes.rows.length > 0) {
      for (const u of userRes.rows) {
        await pool.query('DELETE FROM member_identities WHERE user_id = $1', [u.id]);
        await pool.query('DELETE FROM member_profile_metrics WHERE user_id = $1', [u.id]);
        await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [u.id]);
        await pool.query('DELETE FROM users WHERE id = $1', [u.id]);
      }
      console.log(`🧹 Erased user credentials and identity records for leader '${leader.full_name}' (${leader.email})`);
    }

    await pool.query(
      'INSERT INTO realtime_activity_logs (user_id, activity_type, details, ip_address) VALUES ($1, $2, $3, $4)',
      [req.user.uid, 'DELETE_LEADER', `Deleted leader '${leader.full_name}' (#${id}) and completely erased credentials`, getClientIP(req)]
    );

    res.json({ success: true, message: `Leader '${leader.full_name}' and login credentials erased successfully.` });
  } catch (err) {
    console.error('🚨 [Delete Leader Error]:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/dev/leaders/:id/status - Toggle active/inactive/hidden
router.patch('/admin/status/:id', requireAuth, requireRole(['supreme_admin', 'dev']), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['Active', 'Inactive', 'Hidden'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status value.' });
  }

  try {
    const result = await pool.query(
      'UPDATE leaders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Leader not found.' });
    }

    await pool.query(
      'INSERT INTO realtime_activity_logs (user_id, activity_type, details, ip_address) VALUES ($1, $2, $3, $4)',
      [req.user.uid, 'TOGGLE_LEADER_STATUS', `Set leader '${result.rows[0].full_name}' status to '${status}'`, getClientIP(req)]
    );

    res.json({ success: true, message: `Leader status updated to ${status}.`, leader: result.rows[0] });
  } catch (err) {
    console.error('🚨 [Toggle Leader Status Error]:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/dev/leaders/reorder - Swap / reorder display orders
router.patch('/admin/reorder', requireAuth, requireRole(['supreme_admin', 'dev']), async (req, res) => {
  const { orderedIds } = req.body; // Array of IDs in new order

  if (!Array.isArray(orderedIds)) {
    return res.status(400).json({ success: false, message: 'orderedIds must be an array of IDs.' });
  }

  try {
    for (let index = 0; index < orderedIds.length; index++) {
      await pool.query('UPDATE leaders SET display_order = $1 WHERE id = $2', [index + 1, orderedIds[index]]);
    }

    await pool.query(
      'INSERT INTO realtime_activity_logs (user_id, activity_type, details, ip_address) VALUES ($1, $2, $3, $4)',
      [req.user.uid, 'REORDER_LEADERS', `Reordered leadership display sequence (${orderedIds.length} leaders)`, getClientIP(req)]
    );

    res.json({ success: true, message: 'Leadership display order updated successfully.' });
  } catch (err) {
    console.error('🚨 [Reorder Leaders Error]:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
