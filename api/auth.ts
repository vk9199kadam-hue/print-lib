/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

// Lazy loaders for environment-sensitive clients
let supabaseAdmin: any = null;
const getSupabase = () => {
  if (!supabaseAdmin) {
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('Supabase ENV missing');
    supabaseAdmin = createClient(url, key);
  }
  return supabaseAdmin;
};

let pool: Pool | null = null;
const getPool = () => {
  if (!pool) {
    const conn = process.env.DATABASE_URL;
    if (!conn) throw new Error('DATABASE_URL missing');
    pool = new Pool({
      connectionString: conn,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 30000,
      max: 10
    });
    pool.on('error', (err) => console.error('Pool Error', err));
  }
  return pool;
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(200).json({ status: 'ready' });
  
  const { action, payload } = req.body || {};
  if (!action) return res.status(400).json({ error: 'Missing action' });

  let client = null;
  try {
    if (action === 'ping') return res.json({ status: 'ok' });

    const p = getPool();
    client = await p.connect();

    switch (action) {
      case 'health': {
        await client.query('SELECT 1');
        return res.json({ status: 'ok', db: true });
      }

      // --- AUTH ---
      case 'verifyShopkeeper': {
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
        if (!user.student_print_id) {
           const id = `SID-${new Date().getFullYear()}-${Math.floor(Math.random()*1000).toString().padStart(3,'0')}`;
           await client.query('UPDATE users SET student_print_id = $1 WHERE id = $2', [id, user.id]);
           user.student_print_id = id;
        }
        delete user.password;
        return res.json({ data: user });
      }

      // --- ORDERS ---
      case 'createOrder': {
        const { student_id, student_name, total_bw_pages, total_color_pages, total_pages, extra_services, service_fee, subtotal, total_amount, payment_status, print_status, qr_code, files, order_type, contact_number, college, department, receiving_date } = payload;
        
        // Generate Order ID
        const order_id = `ORD-${Date.now().toString().slice(-6)}`;
        
        await client.query('BEGIN');
        try {
          const result = await client.query(
            'INSERT INTO orders (order_id, student_id, student_name, total_bw_pages, total_color_pages, total_pages, spiral_binding, stapling, service_fee, subtotal, total_amount, payment_status, print_status, qr_code, order_type, contact_number, college, department, receiving_date, student_print_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19, (SELECT student_print_id FROM users WHERE id = $2)) RETURNING *',
            [order_id, student_id, student_name, total_bw_pages, total_color_pages, total_pages, extra_services?.spiral_binding, extra_services?.stapling, service_fee, subtotal, total_amount, payment_status || 'paid', print_status || 'queued', qr_code, order_type, contact_number, college, department, receiving_date]
          );
          const newOrder = result.rows[0];
          
          if (files) {
            for (const f of files) {
              await client.query(
                'INSERT INTO order_files (order_id, file_name, file_storage_key, file_type, file_extension, page_count, print_type, color_page_ranges, copies, sides, paper_size, bw_pages, color_pages, file_price, student_note) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)',
                [newOrder.id, f.file_name, f.file_storage_key, f.file_type, f.file_extension, f.page_count, f.print_type, f.color_page_ranges, f.copies, f.sides, f.paper_size || 'A4', f.bw_pages, f.color_pages, f.file_price, f.student_note]
              );
            }
          }
          await client.query('COMMIT');
          return res.json({ data: newOrder });
        } catch (e) {
          await client.query('ROLLBACK');
          throw e;
        }
      }

      case 'getPaidOrders': {
        const { rows } = await client.query('SELECT * FROM orders WHERE payment_status = \'paid\' ORDER BY created_at DESC');
        for (const order of rows) {
          const files = await client.query('SELECT * FROM order_files WHERE order_id = $1', [order.id]);
          order.files = files.rows;
        }
        return res.json({ data: rows });
      }

      case 'updateOrderStatus': {
        await client.query('UPDATE orders SET print_status = $2 WHERE order_id = $1', [payload.order_id, payload.print_status]);
        return res.json({ success: true });
      }

      // --- SUBMISSIONS ---
      case 'getSubmissions': {
        const { rows } = await client.query('SELECT * FROM submissions ORDER BY created_at DESC');
        return res.json({ data: rows });
      }

      case 'createSubmission': {
        const { submission_id, student_id, student_name, roll_number, department, academic_year, guide_name, project_title, document_type, remarks, file_name, file_storage_key, validation_status } = payload;
        const result = await client.query(
          'INSERT INTO submissions (submission_id, student_id, student_name, roll_number, department, academic_year, guide_name, project_title, document_type, remarks, file_name, file_storage_key, validation_status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *',
          [submission_id, student_id, student_name, roll_number, department, academic_year, guide_name, project_title, document_type, remarks, file_name, file_storage_key, validation_status || 'pending']
        );
        return res.json({ data: result.rows[0] });
      }

      // --- SETTINGS ---
      case 'getPricing': {
        const { rows } = await client.query("SELECT value FROM settings WHERE key = 'pricing'");
        return res.json({ data: rows[0]?.value || null });
      }
      
      case 'getShopSettings': {
        const { rows } = await client.query('SELECT * FROM shop_settings WHERE id = 1');
        return res.json({ data: rows[0] || { is_open: true } });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err: any) {
    console.error('RPC Error:', err);
    return res.status(500).json({ error: 'Crash', msg: err.message });
  } finally {
    if (client) client.release();
  }
}
