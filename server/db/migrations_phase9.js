import pool from '../config/db.js';

const runPhase9Migrations = async () => {
  console.log('🚀 [Migrations] Starting Phase 9: Dev Tools Schema Setup (Notices, Events, Documents)...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Notices Table
    console.log('🔹 Creating notices table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS notices (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        target_audience VARCHAR(100) DEFAULT 'all',
        priority VARCHAR(50) DEFAULT 'Normal',
        status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Scheduled', 'Archived')),
        scheduled_time TIMESTAMP DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Events Table
    console.log('🔹 Creating events table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        location VARCHAR(255) NOT NULL,
        event_date TIMESTAMP NOT NULL,
        time VARCHAR(100) DEFAULT '10:00 AM',
        organizer VARCHAR(255) DEFAULT 'TRSV Executive Council',
        capacity INT DEFAULT 100,
        attendance_count INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Upcoming',
        banner_url TEXT DEFAULT '',
        images TEXT DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE events ADD COLUMN IF NOT EXISTS time VARCHAR(100) DEFAULT '10:00 AM';
      ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer VARCHAR(255) DEFAULT 'TRSV Executive Council';
      ALTER TABLE events ADD COLUMN IF NOT EXISTS banner_url TEXT DEFAULT '';
      ALTER TABLE events ADD COLUMN IF NOT EXISTS images TEXT DEFAULT '[]';
    `);

    // 2b. Gallery Table
    console.log('🔹 Creating gallery table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS gallery (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) DEFAULT 'Gallery Media',
        caption TEXT DEFAULT '',
        category VARCHAR(100) DEFAULT 'General',
        image_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Event Attendance Table
    console.log('🔹 Creating event_attendance table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS event_attendance (
        id SERIAL PRIMARY KEY,
        event_id INT REFERENCES events(id) ON DELETE CASCADE,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        checked_in_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(event_id, user_id)
      );
    `);

    // 4. Documents Table (Registry for Generated Letters)
    console.log('🔹 Creating documents table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        doc_type VARCHAR(100) NOT NULL, -- 'Appointment', 'Promotion', 'Appreciation', 'Official', 'Circular', 'Authorization'
        doc_number VARCHAR(100) UNIQUE NOT NULL, -- Auto Number like TVRS/APP/2026/0001
        recipient_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
        recipient_name VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        qr_token VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Archived')),
        created_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Add custom branding config key-value table (Portal Management)
    console.log('🔹 Creating portal_branding table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS portal_branding (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    // Seed default branding settings if not present
    await client.query(`
      INSERT INTO portal_branding (key, value)
      VALUES 
        ('logo_url', '/trsvlogo.jpeg'),
        ('banner_url', ''),
        ('footer_text', '© 2026 TVRS (Telangana Vidyarthi Rakshana Sena). All Rights Reserved.'),
        ('announcement_banner', 'Welcome to the TVRS Official Student Safety & Protection Portal.'),
        ('homepage_title', 'Statewide Student Protection Protocol'),
        ('homepage_subtitle', 'Secure. Real-time. Accountable. Empowering the students of Telangana.'),
        ('short_name', 'TVRS'),
        ('full_name', 'Telangana Vidyarthi Rakshana Sena')
      ON CONFLICT (key) DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log('✅ [Migrations] Phase 9 Database Upgrades Completed Successfully!');
    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ [Migrations] Phase 9 Error during migration:', error);
    process.exit(1);
  } finally {
    client.release();
  }
};

runPhase9Migrations();
