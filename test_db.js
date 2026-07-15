import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config({ path: 'c:/Users/nsury/Downloads/TRSV/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  try {
    console.log('Testing DB connection...');
    const dbCheck = await pool.query('SELECT NOW()');
    console.log('Database connected:', dbCheck.rows[0].now);

    console.log('\nInspecting join_requests table columns:');
    const cols = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'join_requests'
    `);
    console.table(cols.rows);

    console.log('\nInspecting table constraints:');
    const constraints = await pool.query(`
      SELECT conname, pg_get_constraintdef(c.oid) 
      FROM pg_constraint c 
      JOIN pg_namespace n ON n.oid = c.connamespace 
      WHERE conrelid = 'join_requests'::regclass
    `);
    console.table(constraints.rows);

  } catch (err) {
    console.error('Error during inspection:', err);
  } finally {
    await pool.end();
  }
}

main();
