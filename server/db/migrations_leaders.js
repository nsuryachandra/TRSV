import pool from '../config/db.js';

const seedLeaders = [
  {
    full_name: 'Kavitha Kalvakuntla Garu',
    organization_id: 'TRSV-FOUNDER-001',
    designation: 'Founder & Patron',
    district: 'Statewide',
    constituency_name: 'Telangana',
    joining_date: '2020-01-01',
    display_order: 1,
    status: 'Active',
    profile_image: '/akka.jpg',
    biography: 'Founder & Patron of TRSV. Dedicated to championing student rights, state education reforms, and empowering youth across all districts of Telangana.'
  },
  {
    full_name: 'Aaditya Devanapalli Garu',
    organization_id: 'TRSV-EXEC-002',
    designation: 'Leader',
    district: 'Statewide',
    constituency_name: 'Telangana',
    joining_date: '2021-03-15',
    display_order: 2,
    status: 'Active',
    profile_image: '/aaditya.jpg',
    biography: 'Senior Leader guiding organizational strategies, campus coordination frameworks, and student advocacy operations throughout the state.'
  },
  {
    full_name: 'Karthik Yadav',
    organization_id: 'TRSV-GH-0001',
    designation: 'Greater Hyderabad General Secretary',
    district: 'Hyderabad',
    constituency_name: 'Greater Hyderabad',
    joining_date: '2022-05-10',
    display_order: 3,
    status: 'Active',
    profile_image: '/karthiknew.jpeg',
    biography: 'Commands regional assembly clusters, compliance reporting, and student grievance cells throughout Greater Hyderabad. Main pillar, supporter of this portal.'
  },
  {
    full_name: 'Suryachandra',
    organization_id: 'TRSV-DEV-0004',
    designation: 'Developer & Digital Operations President',
    district: 'Hyderabad',
    constituency_name: 'Statewide Tech',
    joining_date: '2023-01-01',
    display_order: 4,
    status: 'Active',
    profile_image: '/suryachandra.jpeg',
    biography: 'Digital Architect of TRSV - designs, implements, and maintains the portal, database infrastructure, and student safety telemetry systems.'
  },
  {
    full_name: 'Ramu Yadav',
    organization_id: 'TRSV-PRES-0005',
    designation: 'President',
    district: 'Statewide',
    constituency_name: 'Telangana',
    joining_date: '2022-08-20',
    display_order: 5,
    status: 'Active',
    profile_image: '/ramuanna.jpg',
    biography: 'Commands statewide student welfare campaigns, regional coordination committees, and executive campus advocacy cells.'
  },
  {
    full_name: 'Naveen Goud',
    organization_id: 'TRSV-VP-0006',
    designation: 'Vice President',
    district: 'Statewide',
    constituency_name: 'Telangana',
    joining_date: '2023-02-12',
    display_order: 6,
    status: 'Active',
    profile_image: '/naveen_goud.jpg',
    biography: 'Supervises state-level campaigns, campus safety units, and represents student welfare delegations to governing bodies.'
  },
  {
    full_name: 'Bhagath Yadav',
    organization_id: 'TRSV-GS-0007',
    designation: 'General Secretary',
    district: 'Statewide',
    constituency_name: 'Telangana',
    joining_date: '2023-04-18',
    display_order: 7,
    status: 'Active',
    profile_image: '/bhagatyadav.jpg',
    biography: 'Manages compliance auditing, student organization charters, and internal governance workflows across Telangana.'
  },
  {
    full_name: 'Kandula Madhu',
    organization_id: 'TRSV-SEC-0008',
    designation: 'Secretary',
    district: 'Statewide',
    constituency_name: 'Telangana',
    joining_date: '2023-06-25',
    display_order: 8,
    status: 'Active',
    profile_image: '/kandulamadhu.jpg',
    biography: 'Coordinates communication channels, resolves regional student disputes, and leads student awareness assemblies.'
  },
  {
    full_name: 'B.Rajkumar',
    organization_id: 'TRSV-RR-0009',
    designation: 'Rangareddy District President',
    district: 'Rangareddy',
    constituency_name: 'Rangareddy',
    joining_date: '2023-09-05',
    display_order: 9,
    status: 'Active',
    profile_image: '/raj_rangareddy.jpg',
    biography: 'Oversees organizational growth, campus student welfare operations, and local grievance redressal cells in the Rangareddy district.'
  },
  {
    full_name: 'Gummadi Kranthi',
    organization_id: 'TRSV-GH-0010',
    designation: 'Greater Hyderabad President',
    district: 'Hyderabad',
    constituency_name: 'Greater Hyderabad',
    joining_date: '2023-10-15',
    display_order: 10,
    status: 'Active',
    profile_image: '/g_kranthi.jpg',
    biography: 'Oversees campus welfare initiatives, district union coordination, and student advocacy committees throughout Greater Hyderabad.'
  },
  {
    full_name: 'Vogoti Shekar',
    organization_id: 'TRSV-GH-0011',
    designation: 'Greater Hyderabad Vice President',
    district: 'Hyderabad',
    constituency_name: 'Greater Hyderabad',
    joining_date: '2023-11-20',
    display_order: 11,
    status: 'Active',
    profile_image: '/shekar_hydvice.jpg',
    biography: 'Manages student outreach initiatives, campus union activities, and regional support networks across Greater Hyderabad.'
  }
];

export const initLeadersTable = async () => {
  try {
    console.log('🔹 [Database] Setting up leaders table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leaders (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        profile_image TEXT DEFAULT '',
        organization_id VARCHAR(100) DEFAULT '',
        designation VARCHAR(255) NOT NULL,
        email VARCHAR(255) DEFAULT '',
        phone VARCHAR(50) DEFAULT '',
        college_name VARCHAR(255) DEFAULT '',
        district VARCHAR(255) DEFAULT '',
        constituency_id INT DEFAULT NULL,
        constituency_name VARCHAR(255) DEFAULT '',
        biography TEXT DEFAULT '',
        joining_date DATE DEFAULT CURRENT_DATE,
        display_order INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Hidden')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Ensure columns exist if table already exists
    await pool.query(`ALTER TABLE leaders ADD COLUMN IF NOT EXISTS organization_id VARCHAR(100) DEFAULT ''`);
    await pool.query(`ALTER TABLE leaders ADD COLUMN IF NOT EXISTS email VARCHAR(255) DEFAULT ''`);
    await pool.query(`ALTER TABLE leaders ADD COLUMN IF NOT EXISTS phone VARCHAR(50) DEFAULT ''`);
    await pool.query(`ALTER TABLE leaders ADD COLUMN IF NOT EXISTS college_name VARCHAR(255) DEFAULT ''`);
    await pool.query(`ALTER TABLE leaders ADD COLUMN IF NOT EXISTS biography TEXT DEFAULT ''`);
    await pool.query(`ALTER TABLE leaders ADD COLUMN IF NOT EXISTS joining_date DATE DEFAULT CURRENT_DATE`);
    await pool.query(`ALTER TABLE leaders ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0`);
    await pool.query(`ALTER TABLE leaders ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active'`);

    // Seed default leaders if table is empty
    const checkCount = await pool.query('SELECT COUNT(*) FROM leaders');
    if (parseInt(checkCount.rows[0].count, 10) === 0) {
      console.log('🌱 [Database] Seeding initial leaders into database...');
      for (const item of seedLeaders) {
        await pool.query(
          `INSERT INTO leaders 
           (full_name, organization_id, designation, district, constituency_name, joining_date, display_order, status, profile_image, biography)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            item.full_name,
            item.organization_id,
            item.designation,
            item.district,
            item.constituency_name,
            item.joining_date,
            item.display_order,
            item.status,
            item.profile_image,
            item.biography
          ]
        );
      }
      console.log('✅ [Database] Successfully seeded initial leaders!');
    }

    // Also sync any leadership role users from 'users' table if not already present
    const userLeaders = await pool.query(`
      SELECT u.id, u.full_name, u.email, u.phone, u.role, u.profile_image, con.constituency_name, COALESCE(con.district, 'Statewide') as district
      FROM users u
      LEFT JOIN constituencies con ON u.constituency_id = con.id
      WHERE u.role IN ('supreme_admin', 'state_president', 'vice_president', 'general_secretary', 'secretary', 'president', 'district_incharge', 'college_incharge')
    `);

    for (const u of userLeaders.rows) {
      const exists = await pool.query('SELECT 1 FROM leaders WHERE LOWER(full_name) = LOWER($1) OR (email != \'\' AND LOWER(email) = LOWER($2))', [u.full_name, u.email || '']);
      if (exists.rows.length === 0) {
        let desig = u.role.replace(/_/g, ' ').toUpperCase();
        if (u.role === 'supreme_admin') desig = 'Founder & Patron';
        else if (u.role === 'state_president') desig = 'State President';
        else if (u.role === 'vice_president') desig = 'Vice President';
        else if (u.role === 'general_secretary') desig = 'General Secretary';
        else if (u.role === 'secretary') desig = 'Secretary';
        else if (u.role === 'president') desig = 'President';

        const maxOrderRes = await pool.query('SELECT MAX(display_order) FROM leaders');
        const nextOrder = (parseInt(maxOrderRes.rows[0].max || 0, 10)) + 1;

        await pool.query(
          `INSERT INTO leaders (full_name, email, phone, designation, profile_image, constituency_name, district, display_order, status, biography)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Active', $9)`,
          [
            u.full_name,
            u.email || '',
            u.phone || '',
            desig,
            u.profile_image || '',
            u.constituency_name || 'Statewide',
            u.district || 'Statewide',
            nextOrder,
            `${desig} of TRSV union serving ${u.constituency_name || u.district || 'Statewide'} region.`
          ]
        );
      }
    }

    console.log('✅ [Database] Leaders schema synchronized.');
  } catch (err) {
    console.error('🚨 [Database] Leaders schema setup error:', err.message);
  }
};

export default initLeadersTable;
