import { Pool } from 'pg';


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('cockroachlabs.cloud') ? { rejectUnauthorized: false } : false,
});

async function runMigrations() {
  const client = await pool.connect();
  try {
    const migrations = [
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS student_print_id VARCHAR(100)',
      'ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_id VARCHAR(100)',
      'ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type VARCHAR(50) DEFAULT \'standard\'',
      'ALTER TABLE orders ADD COLUMN IF NOT EXISTS contact_number VARCHAR(255)',
      'ALTER TABLE orders ADD COLUMN IF NOT EXISTS college VARCHAR(255)',
      'ALTER TABLE orders ADD COLUMN IF NOT EXISTS department VARCHAR(255)',
      'ALTER TABLE orders ADD COLUMN IF NOT EXISTS receiving_date VARCHAR(50)',
      'ALTER TABLE shopkeepers ADD COLUMN IF NOT EXISTS upi_id VARCHAR(255)',
      'ALTER TABLE shopkeepers ADD COLUMN IF NOT EXISTS contact_number VARCHAR(255)',
      'ALTER TABLE order_files ADD COLUMN IF NOT EXISTS paper_size VARCHAR(50) DEFAULT \'A4\'',
      'ALTER TABLE orders ADD COLUMN IF NOT EXISTS spiral_binding BOOLEAN DEFAULT FALSE',
      'ALTER TABLE orders ADD COLUMN IF NOT EXISTS stapling BOOLEAN DEFAULT FALSE',
      'CREATE INDEX IF NOT EXISTS idx_orders_student_id ON orders(student_id)',
      'CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id)',
      'CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status)',
      'CREATE INDEX IF NOT EXISTS idx_order_files_order_id ON order_files(order_id)',
      'DROP TABLE IF EXISTS file_storage', // Step 8: drop legacy table
    ];

    console.log('Starting migrations...');
    for (const sql of migrations) {
      console.log(`Executing: ${sql}`);
      await client.query(sql).catch((e) => console.error(`Migration Failed: ${sql}`, e.message));
    }
    console.log('Migrations complete.');
  } finally {
    client.release();
    pool.end();
  }
}

runMigrations().catch(console.error);
