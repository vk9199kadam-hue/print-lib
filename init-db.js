import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pkg;

// Use import.meta.url to get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple dotenv parser since this is an ES module
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([^=]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let key = match[1].trim();
      let value = match[2] ? match[2].trim() : '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL is not set in your .env file!");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
});

async function makeConnection() {
  try {
    console.log("Connecting to CockroachDB...");
    const client = await pool.connect();
    console.log("✅ Successfully connected to CockroachDB!");

    console.log("Reading schema.sql...");
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log("Applying schema...");
    await client.query(schemaSql);
    console.log("✅ Schema applied successfully! All tables are ready.");

    client.release();
  } catch (err) {
    console.error("❌ Error connecting to CockroachDB or applying schema:", err);
  } finally {
    pool.end();
  }
}

makeConnection();
