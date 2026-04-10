/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

// Lazy pool initialization to prevent crashes if env is missing at startup
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any;
  };
}

interface RPCResponse {
  status: (code: number) => RPCResponse;
  json: (body: unknown) => void;
}

export default async function handler(req: RPCRequest, res: RPCResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { action, payload } = req.body;
  let client = null;

  try {
    const activePool = getPool();
    client = await activePool.connect();

    switch (action) {
      case 'health': {
        try {
          await client.query('SELECT 1');
          return res.json({ 
            status: 'ok', 
            db_connected: true, 
            env_url: !!process.env.VITE_SUPABASE_URL,
            env_db: !!process.env.DATABASE_URL
          });
        } catch (dbErr: unknown) {
          return res.status(500).json({ status: 'db_error', message: dbErr instanceof Error ? dbErr.message : String(dbErr) });
        }
      }
      case 'fix_db': {
        await client.query(`
          CREATE TABLE IF NOT EXISTS settings (
            key STRING PRIMARY KEY,
            value JSONB NOT NULL
          )
        `);
        return res.json({ status: 'db_fix_completed' });
      }
      case 'getPricing': {
        const { rows } = await client.query("SELECT value FROM settings WHERE key = 'pricing'");
        if (rows.length > 0) return res.json({ data: rows[0].value });
        
        // Fallback or init
        const defaultPricing = {
          bw_rate: 1,
          color_rate: 4,
          a3_bw_rate: 10,
          a3_color_rate: 15,
          spiral_binding_fee: 20,
          stapling_fee: 0,
          capstone_page_rate: 4,
          capstone_urgent_fee: 180,
          capstone_non_urgent_fee: 140
        };
        await client.query("INSERT INTO settings (key, value) VALUES ('pricing', $1) ON CONFLICT (key) DO NOTHING", [defaultPricing]);
        return res.json({ data: defaultPricing });
      }
      case 'updatePricing': {
        await client.query("UPDATE settings SET value = $1 WHERE key = 'pricing'", [payload]);
        return res.json({ success: true });
      }
      case 'getShopkeeperProfile': {
        const { rows } = await client.query('SELECT * FROM shopkeepers WHERE email = $1', [payload.email]);
        return res.json({ data: rows[0] || null });
      }
      case 'getPublicShopInfo': {
        const { rows } = await client.query('SELECT shop_name, upi_id, contact_number FROM shopkeepers LIMIT 1');
        return res.json({ data: rows[0] || null });
      }
      case 'getShopSettings': {
        const { rows } = await client.query('SELECT * FROM shop_settings WHERE id = 1');
        return res.json({ data: rows[0] || { is_open: true, closing_message: null, standard_hours: '10:00 AM to 8:00 PM' } });
      }
      case 'updateShopSettings': {
        const { is_open, closing_message, standard_hours } = payload;
        await client.query(
          'UPDATE shop_settings SET is_open = $1, closing_message = $2, standard_hours = $3, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
          [is_open, closing_message, standard_hours || '10:00 AM to 8:00 PM']
        );
        return res.json({ success: true });
      }
      case 'updateShopkeeperProfile': {
        const { email, name, shop_name, upi_id, contact_number } = payload;
        const result = await client.query(
          'UPDATE shopkeepers SET name = $2, shop_name = $3, upi_id = $4, contact_number = $5 WHERE email = $1 RETURNING *',
          [email, name, shop_name, upi_id, contact_number]
        );
        return res.json({ data: result.rows[0] });
      }
      case 'getUsers': {
        const { rows } = await client.query('SELECT id, name, email, gender, student_print_id, is_verified, created_at FROM users');
        return res.json({ data: rows });
      }
      case 'getUserById': {
        const { rows } = await client.query('SELECT id, name, email, gender, student_print_id, is_verified, created_at FROM users WHERE id = $1', [payload.id]);
        return res.json({ data: rows[0] || null });
      }
      case 'getUserByEmail': {
        const { rows } = await client.query('SELECT id, name, email, gender, student_print_id, is_verified, created_at FROM users WHERE email = $1', [payload.email]);
        return res.json({ data: rows[0] || null });
      }
      case 'getOrderById': {
        const { rows } = await client.query('SELECT * FROM orders WHERE order_id = $1', [payload.id]);
        if (rows.length > 0) {
          const files = await client.query('SELECT * FROM order_files WHERE order_id = $1', [rows[0].id]);
          rows[0].files = files.rows;
          rows[0].extra_services = { 
            spiral_binding: !!rows[0].spiral_binding,
            stapling: !!rows[0].stapling
          };
        }
        return res.json({ data: rows[0] || null });
      }
      case 'createUser': {
        const { name, email, password, gender, student_print_id, is_verified } = payload;
        const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
        const result = await client.query(
          'INSERT INTO users (name, email, password, gender, student_print_id, is_verified) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, gender, student_print_id, is_verified, created_at',
          [name, email, hashedPassword, gender, student_print_id, is_verified]
        );
        return res.json({ data: result.rows[0] });
      }
      case 'verifyShopkeeper': {
        const { rows } = await client.query('SELECT * FROM shopkeepers WHERE email = $1', [payload.email]);
        if (rows.length === 0) return res.json({ data: null });
        
        const shopkeeper = rows[0];
        // Handle migration: if password matches plain text, update it to hash for the future
        let isValid = false;
        if (shopkeeper.password === payload.password) {
           isValid = true;
           const newHash = await bcrypt.hash(payload.password, 10);
           await client.query('UPDATE shopkeepers SET password = $1 WHERE id = $2', [newHash, shopkeeper.id]);
        } else {
           isValid = await bcrypt.compare(payload.password, shopkeeper.password);
        }
        
        if (!isValid) return res.json({ data: null });
        
        // Remove password from returned object for security
        delete shopkeeper.password;
        return res.json({ data: shopkeeper });
      }
      case 'verifyStudent': {
        const { rows } = await client.query('SELECT * FROM users WHERE email = $1', [payload.email]);
        if (rows.length === 0) return res.json({ data: null });
        
        const user = rows[0];
        let isValid = false;
        // User passwords could be hashed or plain text depending on age of account
        if (user.password === payload.password) {
           isValid = true;
           const newHash = await bcrypt.hash(payload.password, 10);
           await client.query('UPDATE users SET password = $1 WHERE id = $2', [newHash, user.id]);
        } else {
           isValid = await bcrypt.compare(payload.password, user.password);
        }
        
        if (!isValid) return res.json({ data: null });
        
        // Self-healing: If student has no student_print_id, generate one now
        if (!user.student_print_id) {
           const year = new Date().getFullYear();
           const randomId = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
           user.student_print_id = `SID-${year}-${randomId}`;
           await client.query('UPDATE users SET student_print_id = $1 WHERE id = $2', [user.student_print_id, user.id]);
        }

        delete user.password;
        return res.json({ data: user });
      }
      case 'getPaidOrders': {
        const { rows } = await client.query('SELECT id, order_id, student_name, student_print_id, total_pages, total_amount, print_status, created_at, spiral_binding, stapling, order_type FROM orders WHERE payment_status = \'paid\' ORDER BY created_at DESC');
        if (rows.length > 0) {
          const orderIds = rows.map((r: { id: string }) => r.id);
          const { rows: allFiles } = await client.query('SELECT * FROM order_files WHERE order_id = ANY($1::uuid[])', [orderIds]);
          rows.forEach((order: { id: string; spiral_binding?: boolean; stapling?: boolean; files?: unknown[]; extra_services?: { spiral_binding: boolean; stapling: boolean } }) => {
            order.files = allFiles.filter((f: { order_id: string }) => f.order_id === order.id);
            order.extra_services = { 
              spiral_binding: !!order.spiral_binding,
              stapling: !!order.stapling
            };
          });
        }
        return res.json({ data: rows });
      }
      case 'getOrdersByStudentId': {
        const { rows } = await client.query('SELECT id, order_id, student_name, student_print_id, total_pages, total_amount, print_status, created_at, spiral_binding, stapling, order_type FROM orders WHERE student_id = $1 ORDER BY created_at DESC', [payload.student_id]);
        if (rows.length > 0) {
          const orderIds = rows.map((r: { id: string }) => r.id);
          const { rows: allFiles } = await client.query('SELECT * FROM order_files WHERE order_id = ANY($1::uuid[])', [orderIds]);
          rows.forEach((order: { id: string; spiral_binding?: boolean; stapling?: boolean; files?: unknown[]; extra_services?: { spiral_binding: boolean; stapling: boolean } }) => {
            order.files = allFiles.filter((f: { order_id: string }) => f.order_id === order.id);
            order.extra_services = { 
              spiral_binding: !!order.spiral_binding,
              stapling: !!order.stapling
            };
          });
        }
        return res.json({ data: rows });
      }
      case 'getAdminStats': {
        const totalUsers = await client.query('SELECT COUNT(*) FROM users');
        const totalShops = await client.query('SELECT COUNT(*) FROM shopkeepers');
        const totalOrders = await client.query('SELECT COUNT(*) FROM orders');
        const totalRevenue = await client.query("SELECT SUM(total_amount) FROM orders WHERE payment_status = 'paid'");

        return res.json({
          data: {
            total_users: parseInt(totalUsers.rows[0].count, 10),
            total_shops: parseInt(totalShops.rows[0].count, 10),
            total_orders: parseInt(totalOrders.rows[0].count, 10),
            total_revenue: parseFloat(totalRevenue.rows[0].sum || '0').toFixed(2)
          }
        });
      }
      case 'createOrder': {
        const { student_id, student_name: initial_student_name, total_bw_pages, total_color_pages, total_pages, extra_services, service_fee, subtotal, total_amount, payment_status: initial_payment_status, print_status: initial_print_status, qr_code, files, order_type, contact_number, college, department, receiving_date } = payload;
        let { order_id, student_print_id, student_name = initial_student_name, payment_status = initial_payment_status, print_status = initial_print_status } = payload;
        
        // Generate missing metadata on-the-fly to prevent database constraint failures
        if (!order_id) {
            const year = new Date().getFullYear();
            const count = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            order_id = `ORD-${year}-${count}`;
        }
        if (!student_print_id) {
            const year = new Date().getFullYear();
            const count = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            student_print_id = `SID-${year}-${count}`;
            // Update the user record in background
            client.query('UPDATE users SET student_print_id = $1 WHERE id = $2', [student_print_id, student_id]).catch(() => {});
        }
        if (!student_name) student_name = 'Unknown Student';
        if (!payment_status) payment_status = 'paid';
        if (!print_status) print_status = 'queued';

        try {
          await client.query('BEGIN');
          
          const result = await client.query(
            'INSERT INTO orders (order_id, student_id, student_print_id, student_name, total_bw_pages, total_color_pages, total_pages, spiral_binding, stapling, service_fee, subtotal, total_amount, payment_status, print_status, qr_code, order_type, contact_number, college, department, receiving_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) RETURNING *',
            [order_id, student_id, student_print_id, student_name, total_bw_pages || 0, total_color_pages || 0, total_pages || 0, extra_services?.spiral_binding || false, extra_services?.stapling || false, service_fee || 0, subtotal || 0, total_amount || 0, payment_status, print_status, qr_code || '', order_type || 'standard', contact_number, college, department, receiving_date]
          );
          const newOrder = result.rows[0];
          
          if (files && files.length > 0) {
            for (const file of files) {
              await client.query(
                'INSERT INTO order_files (order_id, file_name, file_storage_key, file_type, file_extension, page_count, print_type, color_page_ranges, copies, sides, paper_size, bw_pages, color_pages, file_price, student_note) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)',
                [newOrder.id, file.file_name, file.file_storage_key, file.file_type, file.file_extension, file.page_count, file.print_type, file.color_page_ranges, file.copies, file.sides, file.paper_size || 'A4', file.bw_pages, file.color_pages, file.file_price, file.student_note]
              );
            }
          }
          
          await client.query('COMMIT');
          return res.json({ data: newOrder });
        } catch (txnError) {
          await client.query('ROLLBACK');
          throw txnError;
        }
      }
      case 'updateOrderStatus': {
        const { order_id, print_status } = payload;
        await client.query('UPDATE orders SET print_status = $1 WHERE order_id = $2', [print_status, order_id]);
        
        const cleanupReport = { cloud: 0, database: 0, errors: [] };

        if (print_status === 'completed') {
          try {
            // Find the main order PK 'id' using the display 'order_id' (e.g. ORD-2026-...)
            const orderRes = await client.query('SELECT id FROM orders WHERE order_id = $1', [order_id]);
            if (orderRes.rows.length > 0) {
              const mainId = orderRes.rows[0].id;

              // 1. Get list of files linked to this order
              const filesRes = await client.query('SELECT file_storage_key FROM order_files WHERE order_id = $1', [mainId]);
              const keys = filesRes.rows.map((f: { file_storage_key: string }) => f.file_storage_key).filter(Boolean);
              
              if (keys.length > 0) {
                // 2. Wipe from Supabase
                const { error: storageError } = await supabaseAdmin.storage.from('library_print_files').remove(keys);
                if (storageError) {
                  console.error('SUPABASE_DELETE_FAILED:', storageError.message);
                  // @ts-expect-error - errors property exists on cleanupReport
                  cleanupReport.errors.push('Supabase: ' + storageError.message);
                } else {
                  cleanupReport.cloud = keys.length;
                }
                  
                // 3. Removed legacy CockroachDB file_storage wipe (legacy)

                // 4. Finally wipe the metadata records from order_files
                await client.query('DELETE FROM order_files WHERE order_id = $1', [mainId]);
              }
            }
          } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            console.error('CLEANUP_FATAL_ERROR:', message);
            // @ts-expect-error - errors property exists on cleanupReport
            cleanupReport.errors.push('Fatal: ' + message);
          }
        }
        
        return res.json({ 
          success: true, 
          status: print_status, 
          cleanup: cleanupReport 
        });
      }
      case 'getSubmissions': {
        const { rows } = await client.query('SELECT * FROM submissions ORDER BY created_at DESC');
        if (rows.length > 0) {
          const subIds = rows.map((r: { id: string }) => r.id);
          const { rows: allNotices } = await client.query('SELECT * FROM notices WHERE submission_id = ANY($1::uuid[])', [subIds]);
          rows.forEach((sub: { id: string; notices?: unknown[] }) => {
            sub.notices = allNotices.filter((n: { submission_id: string }) => n.submission_id === sub.id);
          });
        }
        return res.json({ data: rows });
      }
      case 'createSubmission': {
        const { submission_id, student_id, student_name, roll_number, department, academic_year, guide_name, project_title, document_type, remarks, file_name, file_storage_key, validation_status } = payload;
        const result = await client.query(
          'INSERT INTO submissions (submission_id, student_id, student_name, roll_number, department, academic_year, guide_name, project_title, document_type, remarks, file_name, file_storage_key, validation_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *',
          [submission_id, student_id, student_name, roll_number, department, academic_year, guide_name, project_title, document_type, remarks, file_name, file_storage_key, validation_status]
        );
        return res.json({ data: result.rows[0] });
      }
      case 'updateSubmissionStatus': {
        await client.query('UPDATE submissions SET validation_status = $1 WHERE submission_id = $2', [payload.status, payload.submission_id]);
        return res.json({ data: true });
      }
      case 'addNoticeToSubmission': {
        const { rows } = await client.query('SELECT id FROM submissions WHERE submission_id = $1', [payload.submission_id]);
        if (!rows.length) return res.status(404).json({ error: 'Submission not found' });
        await client.query('INSERT INTO notices (submission_id, type, message) VALUES ($1, $2, $3)', [rows[0].id, payload.type, payload.message]);
        return res.json({ data: true });
      }
      case 'uploadFile': {
        return res.json({ data: true });
      }
      case 'downloadFile': {
        const { data: publicUrlData } = supabaseAdmin.storage
          .from('library_print_files')
          .getPublicUrl(payload.key);
        
        return res.json({ data: publicUrlData.publicUrl });
      }
      case 'deleteFile': {
        return res.json({ data: true });
      }
      case 'cleanOrphanedFiles': {
        const { data: files, error } = await supabaseAdmin.storage.from('library_print_files').list('', { limit: 10000 });
        if (error) return res.status(500).json({ error: error.message });
        
        const dbFiles = await client.query('SELECT file_storage_key FROM order_files');
        const submissionFiles = await client.query('SELECT file_storage_key FROM submissions WHERE file_storage_key IS NOT NULL');
        
        const validKeys = [
          ...dbFiles.rows.map((r: { file_storage_key: string }) => r.file_storage_key),
          ...submissionFiles.rows.map((r: { file_storage_key: string }) => r.file_storage_key)
        ];
        
        const now = Date.now();
        const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
        
        const orphans = files.filter((f: { name: string; created_at?: string | null }) => {
          if (f.name === '.emptyFolderPlaceholder') return false;
          if (validKeys.includes(f.name)) return false;
          if (!f.created_at) return false;
          
          const createdAt = new Date(f.created_at).getTime();
          return (now - createdAt) > fiveDaysMs;
        }).map((f: { name: string }) => f.name);

        if (orphans.length > 0) {
          for (let i = 0; i < orphans.length; i += 100) {
            await supabaseAdmin.storage.from('library_print_files').remove(orphans.slice(i, i + 100));
          }
        }
        
        return res.json({ data: { deleted: orphans.length } });
      }
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
