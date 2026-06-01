import { query } from '../config/db.js';

async function runAlter() {
  console.log('🚀 Running database schema adjustments for privacy hardening...');
  try {
    // 1. Alter complaints table
    console.log('🔹 Altering complaints table to make complainant_mobile nullable...');
    await query('ALTER TABLE complaints ALTER COLUMN complainant_mobile DROP NOT NULL;');
    
    // 2. Alter users table
    console.log('🔹 Altering users table to make email and phone nullable...');
    await query('ALTER TABLE users ALTER COLUMN email DROP NOT NULL;');
    await query('ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;');
    
    console.log('✅ All database schema adjustments applied successfully!');
    process.exit(0);
  } catch (err) {
    console.error('🚨 Database alter failed:', err.message);
    process.exit(1);
  }
}

runAlter();
