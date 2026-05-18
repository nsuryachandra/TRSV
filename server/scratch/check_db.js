import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    console.log('Connecting to database...');
    // List constraints
    const constraints = await pool.query(`
      SELECT conname, pg_get_constraintdef(c.oid) 
      FROM pg_constraint c 
      JOIN pg_namespace n ON n.oid = c.connamespace 
      WHERE conname LIKE '%role%';
    `);
    console.log('Current constraints:', constraints.rows);

    // Drop old constraint if exists
    console.log('Dropping old role constraint users_role_check if exists...');
    await pool.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    `);

    // Add new constraint allowing 'dev'
    console.log('Adding new users_role_check constraint with dev role allowed...');
    await pool.query(`
      ALTER TABLE users 
      ADD CONSTRAINT users_role_check 
      CHECK (role IN ('student', 'secretary', 'general_secretary', 'vice_president', 'president', 'supreme_admin', 'dev'));
    `);

    console.log('✅ Database role constraints updated successfully!');
  } catch (err) {
    console.error('🚨 Database update failed:', err);
  } finally {
    await pool.end();
  }
}

run();
