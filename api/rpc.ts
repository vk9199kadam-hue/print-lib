/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'ready', method: req.method });
  }

  const { action, payload } = req.body || {};
  
  try {
    if (action === 'ping') return res.json({ status: 'ok' });

    // Dynamic imports to prevent top-level boot crashes
    const { Pool } = await import('pg');
    const bcrypt = await import('bcryptjs');

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    try {
      if (action === 'health') {
        const r = await client.query('SELECT 1');
        return res.json({ status: 'ok', db: !!r });
      }

      if (action === 'verifyShopkeeper') {
        const { rows } = await client.query('SELECT * FROM shopkeepers WHERE email = $1', [payload.email]);
        if (rows.length === 0) return res.json({ data: null });
        const user = rows[0];
        
        let isValid = false;
        if (user.password === payload.password) {
           isValid = true;
           const newHash = await bcrypt.hash(payload.password, 10);
           await client.query('UPDATE shopkeepers SET password = $1 WHERE id = $2', [newHash, user.id]);
        } else {
           isValid = await bcrypt.compare(payload.password, user.password);
        }

        if (!isValid) return res.json({ data: null });
        delete user.password;
        return res.json({ data: user });
      }

      return res.status(400).json({ error: 'Unknown action' });
    } finally {
      client.release();
      await pool.end(); // Aggressive cleanup for serverless
    }
  } catch (err: any) {
    return res.status(500).json({ error: 'Crash', msg: err.message });
  }
}
