const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
pool.query("ALTER TABLE order_files ADD COLUMN IF NOT EXISTS paper_size VARCHAR(50) DEFAULT 'A4'").then(() => { console.log('DB Updated'); process.exit(0); }).catch(console.error);
