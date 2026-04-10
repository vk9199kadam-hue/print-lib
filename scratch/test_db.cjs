const { Pool } = require('pg');

async function test() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres.hkuieoczwcioumzlmmvw:Viraj%409199k@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Attempting connection to POOLER (port 6543)...');
    const client = await pool.connect();
    console.log('CONNECTED successfully!');
    client.release();
  } catch (err) {
    console.error('CONNECTION FAILED:', err.message);
  } finally {
    await pool.end();
  }
}

test();
