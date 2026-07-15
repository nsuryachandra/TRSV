import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  try {
    const fullName = 'Test User';
    const email = 'test@trsv.gov.in';
    const phone = '1234567890';
    const memberType = 'Student';
    const collegeName = 'Test College';
    const locality = 'Test Locality';
    const district = 'Hyderabad';
    const constituencyId = 1;
    const reason = 'To support the student wing';
    const dateOfBirth = '2000-01-01';
    const gender = 'Male';

    console.log('Inserting test join request...');
    const result = await pool.query(
      `INSERT INTO join_requests (full_name, email, phone, member_type, college_name, locality, district, constituency_id, reason, date_of_birth, gender)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [fullName, email || null, phone, memberType, memberType === 'Student' ? collegeName : null, locality || null, district, parseInt(constituencyId), reason, dateOfBirth || null, gender || null]
    );

    console.log('Insertion successful:', result.rows[0]);

    // Clean up
    await pool.query('DELETE FROM join_requests WHERE id = $1', [result.rows[0].id]);
    console.log('Cleaned up successfully');

  } catch (err) {
    console.error('INSERTION FAILED with error:', err.message, err.stack);
  } finally {
    await pool.end();
  }
}

main();
