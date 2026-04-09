import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://iizvinwuzbidsigqeguj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpenZpbnd1emJpZHNpZ3FlZ3VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyODY1NjgsImV4cCI6MjA4OTg2MjU2OH0.iBVego3vvd7I4BjVo5S-MBojhEJqN7W6BNx5TU9mAWM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function clearBucket() {
  console.log("Fetching files to clear Supabase Object Storage bucket...");
  
  // List objects in the printease_files bucket
  const { data, error } = await supabase.storage.from('printease_files').list('', {
    limit: 1000, 
    offset: 0,
    sortBy: { column: 'name', order: 'asc' }
  });
  
  if (error) {
    console.error("Error listing files:", error);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log("No files found. The bucket is empty!");
    return;
  }

  // Filter out any hidden system files or directories if any (.emptyFolderPlaceholder)
  const filesToRemove = data.filter(file => file.name !== '.emptyFolderPlaceholder').map(file => file.name);
  if (filesToRemove.length === 0) {
    console.log("Only system files remained. Bucket is functionally empty.");
    return;
  }
  
  console.log(`Deleting ${filesToRemove.length} files...`);

  // Max 100 files allowed by Supabase per bulk remove call
  const chunkSize = 100;
  for (let i = 0; i < filesToRemove.length; i += chunkSize) {
    const chunk = filesToRemove.slice(i, i + chunkSize);
    const { error: removeError } = await supabase.storage.from('printease_files').remove(chunk);
    if (removeError) {
      console.error(`Error deleting subset ${i} to ${i+chunkSize}:`, removeError);
    } else {
      console.log(`Successfully deleted ${chunk.length} items.`);
    }
  }
  console.log("Cleanup complete. Supabase bucket is now clear and storage space has been recovered!");
}

clearBucket();
