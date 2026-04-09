import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://iizvinwuzbidsigqeguj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpenZpbnd1emJpZHNpZ3FlZ3VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyODY1NjgsImV4cCI6MjA4OTg2MjU2OH0.iBVego3vvd7I4BjVo5S-MBojhEJqN7W6BNx5TU9mAWM";
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorageSize() {
  try {
    const { data: files, error } = await supabase.storage.from('printease_files').list('', { limit: 10000 });
    if (error) throw error;
    
    let totalBytes = 0;
    files.forEach(f => {
      if (f.name !== '.emptyFolderPlaceholder' && f.metadata && f.metadata.size) {
        totalBytes += f.metadata.size;
      }
    });

    const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
    console.log(`TOTAL_STORAGE_USED_MB: ${totalMB}`);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}

checkStorageSize();
