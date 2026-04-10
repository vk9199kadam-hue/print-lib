/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

let supabaseAdminResult: any = null;
const getSupabase = () => {
  if (!supabaseAdminResult) {
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
    if (!url || !key) throw new Error('Supabase ENV missing');
    supabaseAdminResult = createClient(url, key);
  }
  return supabaseAdminResult;
};

let poolInstance: Pool | null = null;
const getPool = () => {
  if (!poolInstance) {
    const conn = process.env.DATABASE_URL;
    if (!conn) throw new Error('DATABASE_URL missing');
    poolInstance = new Pool({
      connectionString: conn,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000, 
      idleTimeoutMillis: 30000,
      max: 5
    });
    poolInstance.on('error', (err) => console.error('Pool Error', err));
  }
  return poolInstance;
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'api_ready', method: req.method });
  }
  
  const { action, payload } = req.body || {};
  if (!action) return res.status(400).json({ error: 'Missing action' });

  let client = null;
  try {
    if (action === 'ping') return res.json({ status: 'ok', message: 'pong' });

    const p = getPool();
    client = await p.connect();

    switch (action) {
      case 'health': {
        await client.query('SELECT 1');
        return res.json({ status: 'ok', db: true });
      }
      case 'verifyShopkeeper': {
        const { rows } = await client.query('SELECT * FROM shopkeepers WHERE email = $1', [payload.email]);
        if (rows.length === 0) return res.json({ data: null });
        const shopkeeper = rows[0];
        let isValid = false;
        if (shopkeeper.password === payload.password) {
           isValid = true;
           const newHash = await bcrypt.hash(payload.password, 10);
           await client.query('UPDATE shopkeepers SET password = $1 WHERE id = $2', [newHash, shopkeeper.id]);
        } else {
           isValid = await bcrypt.compare(payload.password, shopkeeper.password);
        }
        if (!isValid) return res.json({ data: null });
        delete shopkeeper.password;
        return res.json({ data: shopkeeper });
      }
      case 'getShopSettings': {
        const { rows } = await client.query('SELECT * FROM shop_settings WHERE id = 1');
        return res.json({ data: rows[0] || { is_open: true, closing_message: null, standard_hours: \'10:00 AM to 8:00 PM\' } });
      }
      case 'getPaidOrders': {
        const { rows } = await client.query('SELECT * FROM orders WHERE payment_status = \'paid\' ORDER BY created_at DESC');
        return res.json({ data: rows });
      }
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err: any) {
    return res.status(500).json({ error: 'Server Error', message: err.message });
  } finally {
    if (client) client.release();
  }
}
