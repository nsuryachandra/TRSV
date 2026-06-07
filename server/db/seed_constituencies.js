import pool from '../config/db.js';

const seedHyderabadConstituencies = async () => {
  console.log('🌱 [Database Seed] Initializing TVRS constituency nodes...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Rename 'Greater Hyderabad' to 'Greater Hyd' if exists
    await client.query(`
      UPDATE constituencies 
      SET constituency_name = 'Greater Hyd' 
      WHERE constituency_name = 'Greater Hyderabad'
    `);
    
    // Ensure 'Greater Hyd' exists
    let ghRes = await client.query(`
      INSERT INTO constituencies (constituency_name, district, status)
      VALUES ('Greater Hyd', 'Hyderabad', 'active')
      ON CONFLICT (constituency_name) DO UPDATE SET status = 'active'
      RETURNING id
    `);
    const ghId = ghRes.rows[0].id;
    console.log(`📍 Greater Hyd ID: ${ghId}`);

    // Ensure 'RangaReddy' exists
    let rrRes = await client.query(`
      INSERT INTO constituencies (constituency_name, district, status)
      VALUES ('RangaReddy', 'RangaReddy', 'active')
      ON CONFLICT (constituency_name) DO UPDATE SET status = 'active'
      RETURNING id
    `);
    const rrId = rrRes.rows[0].id;
    console.log(`📍 RangaReddy ID: ${rrId}`);

    // Define child mappings
    const subConstituencies = [
      'Secunderabad (Parliament)',
      'Secunderabad Constituency',
      'Amberpet',
      'Amberpet Constituency',
      'Bahadurpura',
      'Chandrayanagutta',
      'Charminar',
      'Goshamahal',
      'Jubilee Hills',
      'Karwan',
      'Khairatabad',
      'Malakpet',
      'Musheerabad',
      'Nampally',
      'Sanathnagar',
      'Secunderabad',
      'Secunderabad Contonment',
      'Yakatpura'
    ];

    for (const name of subConstituencies) {
      const targetName = `Greater Hyd- ${name}`;
      
      // Check if target name already exists
      const checkTarget = await client.query(
        "SELECT id FROM constituencies WHERE constituency_name = $1",
        [targetName]
      );

      if (checkTarget.rows.length > 0) {
        // Already exists, just ensure parent_id is set
        await client.query(
          "UPDATE constituencies SET parent_id = $1 WHERE id = $2",
          [ghId, checkTarget.rows[0].id]
        );
        console.log(`✓ ${targetName} already set.`);
      } else {
        // Check if old name exists to rename
        const checkOld = await client.query(
          "SELECT id FROM constituencies WHERE constituency_name = $1",
          [name]
        );

        if (checkOld.rows.length > 0) {
          await client.query(
            "UPDATE constituencies SET constituency_name = $1, parent_id = $2 WHERE id = $3",
            [targetName, ghId, checkOld.rows[0].id]
          );
          console.log(`⚡ Renamed ${name} → ${targetName}`);
        } else {
          // Insert fresh
          await client.query(
            "INSERT INTO constituencies (constituency_name, district, status, parent_id) VALUES ($1, 'Hyderabad', 'active', $2)",
            [targetName, ghId]
          );
          console.log(`+ Created ${targetName}`);
        }
      }
    }

    await client.query('COMMIT');
    console.log('✅ [Database Seed] Constituency hierarchy synchronized successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ [Database Seed] Error seeding constituencies:', error);
  } finally {
    client.release();
    pool.end();
  }
};

seedHyderabadConstituencies();
