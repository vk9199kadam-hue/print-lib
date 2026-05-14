import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export async function uploadFileToCloud(file: File, key: string): Promise<string> {
  try {
    const fileRef = ref(storage, key);
    await uploadBytes(fileRef, file, {
      cacheControl: 'public, max-age=3600'
    });
    const downloadUrl = await getDownloadURL(fileRef);
    return downloadUrl;
  } catch (error: any) {
    throw new Error('Cloud upload failed: ' + error.message);
  }
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
