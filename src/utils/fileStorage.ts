import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadFileToCloud(file: File, key: string): Promise<string> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are missing.');
  }

  const { data, error } = await supabase.storage
    .from('library_print_files')
    .upload(key, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    throw new Error('Cloud upload failed: ' + error.message);
  }

  const { data: publicUrlData } = supabase.storage
    .from('library_print_files')
    .getPublicUrl(key);

  return publicUrlData.publicUrl;
}

export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function generateStorageKey(filename: string): string {
  return Date.now() + '_' + Math.random().toString(36).substring(7) + '_' + filename.replace(/[^a-zA-Z0-9.]/g, '_');
}
