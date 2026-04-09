import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function checkStorage() {
  console.log('Checking Supabase storage for bucket "printease_files"...');
  
  try {
    const { data: files, error } = await supabaseAdmin.storage
      .from('printease_files')
      .list('', { limit: 10000 });

    if (error) {
      console.error('Error fetching files:', error.message);
      return;
    }

    if (!files || files.length === 0) {
      console.log('Bucket is empty.');
      return;
    }

    let totalSizeBytes = 0;
    files.forEach(file => {
       // Filter out empty folder placeholders
       if (file.name !== '.emptyFolderPlaceholder') {
         totalSizeBytes += file.metadata?.size || 0;
       }
    });

    const mb = totalSizeBytes / (1024 * 1024);
    const gb = mb / 1024;

    console.log(`\n========= STORAGE REPORT =========`);
    console.log(`Total Files:       ${files.length}`);
    console.log(`Total Object Size: ${totalSizeBytes} bytes`);
    console.log(`Human Readable:    ${mb.toFixed(2)} MB (${gb.toFixed(4)} GB)`);
    console.log(`==================================\n`);

  } catch (err) {
    console.error('Script crushed:', err);
  }
}

checkStorage();
