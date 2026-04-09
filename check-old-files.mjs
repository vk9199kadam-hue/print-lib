import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
const { Pool } = pg;

const supabaseUrl = "https://iizvinwuzbidsigqeguj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpenZpbnd1emJpZHNpZ3FlZ3VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyODY1NjgsImV4cCI6MjA4OTg2MjU2OH0.iBVego3vvd7I4BjVo5S-MBojhEJqN7W6BNx5TU9mAWM";
const supabase = createClient(supabaseUrl, supabaseKey);

const pool = new Pool({
  connectionString: "postgresql://viraj:XoUeuB7yX041ya_Li9qbkQ@vexing-fowl-23755.j77.aws-ap-south-1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full"
});

async function checkFiles() {
  try {
    const { data: files, error } = await supabase.storage.from('printease_files').list('', { limit: 10000 });
    if (error) throw error;
    
    const validFiles = files.filter(f => f.name !== '.emptyFolderPlaceholder');
    const totalFiles = validFiles.length;
    
    const now = Date.now();
    const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
    
    const oldFiles = validFiles.filter(f => {
      if (!f.created_at) return false;
      const createdAt = new Date(f.created_at).getTime();
      return (now - createdAt) > fiveDaysMs;
    });
    
    console.log(`TOTAL FILES IN CLOUD STORAGE: ${totalFiles}`);
    console.log(`FILES OLDER THAN 5 DAYS IN CLOUD: ${oldFiles.length}`);
    if (oldFiles.length > 0) {
       console.log(`Example old file: ${oldFiles[0].name} (Created: ${new Date(oldFiles[0].created_at).toLocaleString()})`);
    }

    const { data: orphansCheck } = await supabase.storage.from('printease_files').list('tmp_', { limit: 100 });
    
    const resOrders = await pool.query('SELECT COUNT(*) FROM orders');
    console.log(`TOTAL ORDERS IN DB: ${resOrders.rows[0].count}`);
    
    const resFiles = await pool.query('SELECT COUNT(*) FROM order_files');
    console.log(`TOTAL FILES LINKED IN DB: ${resFiles.rows[0].count}`);

    const resSubs = await pool.query('SELECT COUNT(*) FROM submissions');
    console.log(`TOTAL SUBMISSIONS IN DB: ${resSubs.rows[0].count}`);
    
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}

checkFiles();
