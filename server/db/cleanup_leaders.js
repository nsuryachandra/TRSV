import pool from '../config/db.js';

const cleanup = async () => {
  console.log('🧹 Cleaning up duplicate/stale leader records...');
  const client = await pool.connect();
  try {
    // Show current state
    const current = await client.query(
      "SELECT id, full_name, email, role, constituency_id FROM users WHERE role != 'student'"
    );
    console.log('\n📋 Current non-student users:');
    current.rows.forEach(u => 
      console.log(`  [${u.id}] ${u.email} | ${u.role} | con_id: ${u.constituency_id}`)
    );

    // Delete stale/duplicate records (old goshamahal-mapped entries replaced by GH entries)
    const toDelete = [
      'gosha-president-kranthi',   // old: kranthi.gh@trsv.gov.in mapped to goshamahal
      'gosha-gs-karthik',          // old: karthik.gh@trsv.gov.in mapped to goshamahal  
      'hyd-president-ramuanna',    // old: ramu.hyd@trsv.gov.in
      'sec-president-ramuanna',    // old: ramu.sec@trsv.gov.in
      'state-vp-akka',             // old: akka statewide entry
    ];

    for (const id of toDelete) {
      const r = await client.query('DELETE FROM users WHERE id = $1 RETURNING email', [id]);
      if (r.rows.length > 0) {
        console.log(`✅ Deleted stale record: ${r.rows[0].email}`);
      }
    }

    // Also delete any orphaned emails from old seeding rounds
    const oldEmails = ['kranthi.gh@trsv.gov.in', 'karthik.gh@trsv.gov.in', 'ramu.hyd@trsv.gov.in', 'ramu.sec@trsv.gov.in', 'surya@trsv.gov.in', 'vijay@trsv.gov.in'];
    for (const email of oldEmails) {
      const r = await client.query('DELETE FROM users WHERE email = $1 RETURNING email', [email]);
      if (r.rows.length > 0) {
        console.log(`✅ Deleted old email record: ${r.rows[0].email}`);
      }
    }

    // Show final clean state
    const final = await client.query(
      "SELECT id, full_name, email, role, constituency_id FROM users WHERE role != 'student'"
    );
    console.log('\n✅ Final clean leader list:');
    final.rows.forEach(u =>
      console.log(`  ${u.full_name} | ${u.email} | ${u.role} | con_id: ${u.constituency_id}`)
    );

    console.log('\n🎉 Cleanup complete!');
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
};

cleanup().catch(e => { console.error(e); process.exit(1); });
