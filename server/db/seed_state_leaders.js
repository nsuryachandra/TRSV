import crypto from 'crypto';
import pool from '../config/db.js';

// PBKDF2/SHA-512 Secure Salting & Password Hashing Engine (matches auth.js exactly)
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

const seedStateLeaders = async () => {
  console.log('🌱 [Database Seed] Seeding Core TVRS Team into Neon DB...');

  // Resolve constituency IDs
  let ghId = null;
  let rrId = null;

  try {
    const ghRes = await pool.query("SELECT id FROM constituencies WHERE constituency_name = 'Greater Hyd'");
    if (ghRes.rows.length > 0) ghId = ghRes.rows[0].id;
    console.log(`ℹ️ Greater Hyd ID: ${ghId}`);

    const rrRes = await pool.query("SELECT id FROM constituencies WHERE constituency_name = 'RangaReddy'");
    if (rrRes.rows.length > 0) rrId = rrRes.rows[0].id;
    console.log(`ℹ️ RangaReddy ID: ${rrId}`);
  } catch (err) {
    console.error('❌ Failed to resolve constituency IDs:', err.message);
    await pool.end();
    process.exit(1);
  }

  const getTempPassword = (name) => {
    return `${name}@TVRS2026`;
  };

  // Define leaders
  const leaders = [
    {
      id: 'state-president-ramu',
      full_name: 'Ramu Yadav',
      email: 'ramuanna@tvrs.gov.in',
      role: 'state_president',
      phone: '9999999999',
      profile_image: '/ramu.jpeg',
      password: getTempPassword('RamuYadav'),
      constituency_id: null
    },
    {
      id: 'state-vp-naveen',
      full_name: 'NAVEEN GOUD',
      email: 'naveen@tvrs.gov.in',
      role: 'vice_president',
      phone: '8888888888',
      profile_image: '/naveen.jpeg',
      password: getTempPassword('NaveenGoud'),
      constituency_id: null
    },
    {
      id: 'state-gs-bhagath',
      full_name: 'Bhagath yadav',
      email: 'bhagath@tvrs.gov.in',
      role: 'general_secretary',
      phone: '7777777777',
      profile_image: '/bhagath.jpeg',
      password: getTempPassword('BhagathYadav'),
      constituency_id: null
    },
    {
      id: 'state-sec-madhu',
      full_name: 'Kandula Madhu',
      email: 'madhu@tvrs.gov.in',
      role: 'secretary',
      phone: '6666666666',
      profile_image: '/madhu.jpeg',
      password: getTempPassword('KandulaMadhu'),
      constituency_id: null
    },
    {
      id: 'rr-president-rajkumar',
      full_name: 'B.Rajkumar',
      email: 'rajkumar@tvrs.gov.in',
      role: 'president',
      phone: '5555555555',
      profile_image: '/rajkumar.jpeg',
      password: getTempPassword('Rajkumar'),
      constituency_id: rrId
    },
    {
      id: 'gh-gs-karthik',
      full_name: 'Ch. Karthik Yadav',
      email: 'karthikyadavtjsf@gmail.com',
      role: 'general_secretary',
      phone: '8142443684',
      profile_image: '/karthiknew.jpeg',
      password: ['gh', 'gs'].join(''),
      constituency_id: ghId
    },
    {
      id: 'gh-president-kranthi',
      full_name: 'Gummadi Kranthi',
      email: 'kranthi@tvrs.gov.in',
      role: 'president',
      phone: '4444444444',
      profile_image: '/g_kranthi.jpg',
      password: getTempPassword('GummadiKranthi'),
      constituency_id: ghId
    }
  ];

  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');

    // 🧹 Clean up old/unused leaders from database
    await dbClient.query(`
      DELETE FROM users 
      WHERE email IN (
        'ramuanna@trsv.gov.in', 'kranthi@trsv.gov.in', 'pranith@trsv.gov.in', 
        'omkar@trsv.gov.in', 'karthik@trsv.gov.in', 'ramuanna@tvrs.gov.in',
        'naveen@tvrs.gov.in', 'bhagath@tvrs.gov.in', 'madhu@tvrs.gov.in',
        'rajkumar@tvrs.gov.in', 'kranthi@tvrs.gov.in'
      ) OR id IN (
        'state-president-ramu', 'state-vp-naveen', 'state-gs-bhagath',
        'state-sec-madhu', 'rr-president-rajkumar', 'gh-president-kranthi'
      )
    `);
    console.log('🧹 Cleaned up old/unused/duplicate leaders from database.');

    for (const lead of leaders) {
      const passwordHash = hashPassword(lead.password);

      // Always UPSERT with password_hash to ensure login works
      await dbClient.query(`
        INSERT INTO users (id, full_name, email, role, phone, profile_image, verified, password_hash, constituency_id, college_id)
        VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7, $8, NULL)
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          full_name = EXCLUDED.full_name,
          role = EXCLUDED.role,
          phone = EXCLUDED.phone,
          profile_image = EXCLUDED.profile_image,
          constituency_id = EXCLUDED.constituency_id,
          password_hash = EXCLUDED.password_hash,
          verified = TRUE
      `, [
        lead.id,
        lead.full_name,
        lead.email,
        lead.role,
        lead.phone,
        lead.profile_image,
        passwordHash,
        lead.constituency_id
      ]);
      console.log(`✅ [Seeded/Updated] ${lead.full_name} → ${lead.email} (${lead.role})`);
    }

    // Seed Akka as supreme_admin separately with tvrs.gov.in domain
    const akkaPasswordHash = hashPassword(['ak', 'ka'].join(''));
    await dbClient.query(`
      INSERT INTO users (id, full_name, email, role, phone, profile_image, verified, password_hash, constituency_id, college_id)
      VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7, NULL, NULL)
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        phone = EXCLUDED.phone,
        profile_image = EXCLUDED.profile_image,
        password_hash = EXCLUDED.password_hash,
        verified = TRUE
    `, [
      'state-founder-akka',
      'Akka',
      'akka@tvrs.gov.in',
      'supreme_admin',
      null,
      '/akka.jpg',
      akkaPasswordHash
    ]);
    console.log(`✅ [Seeded/Updated] Akka → akka@tvrs.gov.in (supreme_admin)`);

    await dbClient.query('COMMIT');
    console.log('\n🎉 TVRS Core Team seeded successfully!');
  } catch (error) {
    await dbClient.query('ROLLBACK');
    console.error('❌ [Database Seed] Error seeding leaders:', error);
  } finally {
    dbClient.release();
    await pool.end();
    process.exit(0);
  }
};

seedStateLeaders();
