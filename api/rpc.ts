/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

let supabaseAdmin: any = null;
const getSupabase = () => {
  if (!supabaseAdmin) {
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error('Supabase environment variables are MISSING (VITE_SUPABASE_URL/SUPABASE_URL)');
    }
    supabaseAdmin = createClient(url, key);
  }
  return supabaseAdmin;
};

let pool: Pool | null = null;
const getPool = () => {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is MISSING');
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000, 
      idleTimeoutMillis: 30000,
      max: 5
    });
    pool.on('error', (err) => console.error('Unexpected pool error', err));
  }
  return pool;
};

interface RPCRequest {
  method: string;
  body: {
    action: string;
    payload: any;
  };
}

interface RPCResponse {
  status: (code: number) => RPCResponse;
  json: (body: unknown) => void;
}

export default async function handler(req: RPCRequest, res: RPCResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  if (!req.body) {
    return res.status(400).json({ error: 'Missing request body' });
  }

  const { action, payload } = req.body;
  let client = null;

  try {
    if (action === 'ping_simple') {
      return res.json({ status: 'ok', message: 'reached backend' });
    }

    const activePool = getPool();
    client = await activePool.connect();

    switch (action) {
      case 'health': {
        try {
          await client.query('SELECT 1');
          return res.json({ 
            status: 'ok', 
            db_connected: true, 
            env_url: !!(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL),
            env_db: !!process.env.DATABASE_URL
          });
        } catch (dbErr: unknown) {
          return res.status(500).json({ status: 'db_error', message: dbErr instanceof Error ? dbErr.message : String(dbErr) });
        }
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
      case 'verifyStudent': {
        const { rows } = await client.query('SELECT * FROM users WHERE email = $1', [payload.email]);
        if (rows.length === 0) return res.json({ data: null });
        
        const user = rows[0];
        let isValid = false;
        if (user.password === payload.password) {
           isValid = true;
           const newHash = await bcrypt.hash(payload.password, 10);
           await client.query('UPDATE users SET password = $1 WHERE id = $2', [newHash, user.id]);
        } else {
           isValid = await bcrypt.compare(payload.password, user.password);
        }
        
        if (!isValid) return res.json({ data: null });
        delete user.password;
        return res.json({ data: user });
      }
      case 'getPaidOrders': {
        const { rows } = await client.query('SELECT * FROM orders WHERE payment_status = \'paid\' ORDER BY created_at DESC');
        return res.json({ data: rows });
      }
      case 'getShopSettings': {
        const { rows } = await client.query('SELECT * FROM shop_settings WHERE id = 1');
        return res.json({ data: rows[0] || { is_open: true, closing_message: null, standard_hours: \'10:00 AM to 8:00 PM\' } });
      }
      // Add more cases here as needed, simplified for first restore
      default:
        return res.status(400).json({ error: 'Unknown action' });
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[RPC ERROR] Action: ${action} | Message: ${errorMsg}`);
    return res.status(500).json({ 
      error: 'Database operation failed', 
      details: errorMsg,
      action 
    });
  } finally {
    if (client) client.release();
  }
}
