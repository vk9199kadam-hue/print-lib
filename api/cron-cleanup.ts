/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('cockroachlabs.cloud') ? { rejectUnauthorized: false } : false,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  // Ensure the request is coming from Vercel Cron or via a secure trigger
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const client = await pool.connect();
  try {
    const { data: files, error } = await supabaseAdmin.storage.from('library_print_files').list('', { limit: 10000 });
    if (error) return res.status(500).json({ error: error.message });

    // 1. Filter out files safely based on age (> 5 days)
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const oldBucketFiles = files
      .filter((f) => f.name !== '.emptyFolderPlaceholder')
      .filter((f) => f.created_at ? new Date(f.created_at) < fiveDaysAgo : false)
      .map((f) => f.name);

    // 2. Cross-reference with our database, NEVER delete files paired to a real order (whether paid, queued, or completed)!
    // We only want to delete "Abandoned" files.
    const dbFiles = await client.query('SELECT file_storage_key FROM order_files');
    const submissionFiles = await client.query('SELECT file_storage_key FROM submissions WHERE file_storage_key IS NOT NULL');

    const validKeys = [
      ...dbFiles.rows.map((r) => r.file_storage_key),
      ...submissionFiles.rows.map((r) => r.file_storage_key)
    ];

    const confirmedOrphans = oldBucketFiles.filter((f) => !validKeys.includes(f));

    if (confirmedOrphans.length > 0) {
      for (let i = 0; i < confirmedOrphans.length; i += 100) {
        await supabaseAdmin.storage.from('library_print_files').remove(confirmedOrphans.slice(i, i + 100));
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Automated 5-Day Cleanup completed successfully.',
      deleted_files: confirmedOrphans.length 
    });
  } catch (error) {
    return res.status(500).json({ error: 'Cron Failed', details: String(error) });
  } finally {
    client.release();
  }
}
