const { Pool } = require('pg');

async function init() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('cockroachlabs.cloud') ? { rejectUnauthorized: false } : false,
  });

  const client = await pool.connect();
  try {
    console.log('Creating settings table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key STRING PRIMARY KEY,
        value JSONB NOT NULL
      )
    `);

    // Check if pricing exists
    const { rows } = await client.query("SELECT * FROM settings WHERE key = 'pricing'");
    if (rows.length === 0) {
      console.log('Inserting default pricing...');
      const defaultPricing = {
        bw_rate: 1,
        color_rate: 4,
        a3_bw_rate: 10,
        a3_color_rate: 15,
        spiral_binding_fee: 20,
        capstone_page_rate: 4,
        capstone_urgent_fee: 180,
        capstone_non_urgent_fee: 140
      };
      await client.query("INSERT INTO settings (key, value) VALUES ('pricing', $1)", [defaultPricing]);
    } else {
        console.log('Pricing already exists, updating to 1 and 4 if they were different...');
        const current = rows[0].value;
        const updated = { ...current, bw_rate: 1, color_rate: 4 };
        await client.query("UPDATE settings SET value = $1 WHERE key = 'pricing'", [updated]);
    }
    console.log('Done.');
  } catch (e) {
    console.error(e);
  } finally {
    client.release();
    pool.end();
  }
}

init();
