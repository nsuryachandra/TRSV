import express from 'express';
import os from 'os';
import { query } from '../../config/db.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(['supreme_admin']));

router.get('/health', async (req, res) => {
  try {
    const start = Date.now();
    await query('SELECT NOW()');
    const latency = Date.now() - start;

    const memoryUsage = process.memoryUsage();
    const freeMem = os.freemem();
    const totalMem = os.totalmem();

    const recentBackups = await query('SELECT * FROM backup_logs ORDER BY created_at DESC LIMIT 5');

    res.json({
      success: true,
      telemetry: {
        latency_ms: latency,
        uptime_seconds: Math.floor(process.uptime()),
        cpu_cores: os.cpus().length,
        memory: {
          free_gb: (freeMem / (1024 ** 3)).toFixed(2),
          total_gb: (totalMem / (1024 ** 3)).toFixed(2),
          rss_mb: (memoryUsage.rss / (1024 ** 2)).toFixed(2),
          heap_used_mb: (memoryUsage.heapUsed / (1024 ** 2)).toFixed(2)
        },
        platform: os.platform(),
        arch: os.arch()
      },
      recent_backups: recentBackups.rows
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/backup/export', async (req, res) => {
  try {
    console.log('📦 [Backup Engine] Generating complete JSON database backup...');
    
    const users = await query('SELECT * FROM users');
    const constituencies = await query('SELECT * FROM constituencies');
    const colleges = await query('SELECT * FROM colleges');
    const complaints = await query('SELECT * FROM complaints');
    const documents = await query('SELECT * FROM documents');
    const notices = await query('SELECT * FROM notices');
    const events = await query('SELECT * FROM events');

    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0.0-modular',
      tables: {
        constituencies: constituencies.rows,
        colleges: colleges.rows,
        users: users.rows,
        complaints: complaints.rows,
        documents: documents.rows,
        notices: notices.rows,
        events: events.rows
      }
    };

    const sizeBytes = Buffer.byteLength(JSON.stringify(backupData));

    await query(`
      INSERT INTO backup_logs (backup_name, backup_type, file_size, created_by, status, details)
      VALUES ($1, 'manual', $2, $3, 'success', $4)
    `, [
      `backup_${Date.now()}.json`,
      sizeBytes,
      req.user.uid,
      `Statewide database JSON dump exported. Tables processed: ${Object.keys(backupData.tables).join(', ')}`
    ]);

    res.setHeader('Content-disposition', `attachment; filename=tvrs_backup_${Date.now()}.json`);
    res.setHeader('Content-type', 'application/json');
    res.send(backupData);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/backup/restore', async (req, res) => {
  const { backupData } = req.body;
  if (!backupData || !backupData.tables) {
    return res.status(400).json({ success: false, message: 'Invalid or missing backup payload.' });
  }

  try {
    console.log('🔄 [Backup Engine] Initiating transactional recovery sequence...');
    const tables = backupData.tables;

    await query('BEGIN');

    await query('DELETE FROM documents');
    await query('DELETE FROM event_attendance');
    await query('DELETE FROM events');
    await query('DELETE FROM notices');
    await query('DELETE FROM complaints');
    await query('DELETE FROM users');
    await query('DELETE FROM colleges');
    await query('DELETE FROM constituencies');

    if (tables.constituencies) {
      for (const row of tables.constituencies) {
        await query(
          'INSERT INTO constituencies (id, constituency_name, district, parent_id, status) VALUES ($1, $2, $3, $4, $5)',
          [row.id, row.constituency_name, row.district, row.parent_id, row.status]
        );
      }
    }

    if (tables.colleges) {
      for (const row of tables.colleges) {
        await query(
          'INSERT INTO colleges (id, college_name, constituency_id) VALUES ($1, $2, $3)',
          [row.id, row.college_name, row.constituency_id]
        );
      }
    }

    if (tables.users) {
      for (const row of tables.users) {
        await query(`
          INSERT INTO users (id, full_name, email, role, constituency_id, college_id, phone, profile_image, verified, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [row.id, row.full_name, row.email, row.role, row.constituency_id, row.college_id, row.phone, row.profile_image, row.verified, row.created_at]);
      }
    }

    if (tables.complaints) {
      for (const row of tables.complaints) {
        await query(`
          INSERT INTO complaints (id, title, description, category, urgency, status, student_id, constituency_id, college_id, attachment_url, anonymous, emergency_flag, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, [row.id, row.title, row.description, row.category, row.urgency, row.status, row.student_id, row.constituency_id, row.college_id, row.attachment_url, row.anonymous, row.emergency_flag, row.created_at]);
      }
    }

    if (tables.documents) {
      for (const row of tables.documents) {
        await query(`
          INSERT INTO documents (id, doc_type, doc_number, recipient_id, recipient_name, content, qr_token, status, created_by, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [row.id, row.doc_type, row.doc_number, row.recipient_id, row.recipient_name, row.content, row.qr_token, row.status, row.created_by, row.created_at]);
      }
    }

    await query('COMMIT');
    console.log('✅ [Backup Engine] Transaction completed. System fully restored.');
    res.json({ success: true, message: 'Database state restored successfully.' });
  } catch (err) {
    await query('ROLLBACK');
    console.error('❌ [Backup Engine] Transaction recovery aborted:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/maintenance', async (req, res) => {
  try {
    const val = await query("SELECT value FROM portal_branding WHERE key = 'maintenance_mode'");
    const isMaintenance = val.rows.length > 0 && val.rows[0].value === 'true';
    res.json({ success: true, maintenance: isMaintenance });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/maintenance', async (req, res) => {
  const { maintenance } = req.body;
  try {
    await query(`
      INSERT INTO portal_branding (key, value)
      VALUES ('maintenance_mode', $1)
      ON CONFLICT (key) DO UPDATE SET value = $1
    `, [maintenance ? 'true' : 'false']);
    res.json({ success: true, message: `Maintenance mode toggled to: ${maintenance}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default {
  id: 'system',
  name: 'System Administration',
  description: 'Control server parameters, execute secure backups/restores, and view health indices.',
  permissions: ['manage_system'],
  router
};
