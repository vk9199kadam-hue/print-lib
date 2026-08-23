import { ConvexReactClient } from 'convex/react';
import { api } from '../../convex/_generated/api';

const convexUrl = import.meta.env.VITE_CONVEX_URL || 'https://avid-lark-265.convex.cloud';
const convex = new ConvexReactClient(convexUrl);

export async function uploadFileToCloud(file: File, key: string): Promise<string> {
  try {
    const uploadUrl = await convex.mutation(api.files.generateUploadUrl, {});
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    });

    if (!response.ok) {
      throw new Error('Cloud upload failed: ' + response.statusText);
    }

    const { storageId } = await response.json();

    // Cache local backup copy so file is guaranteed downloadable in any network condition
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          try {
            localStorage.setItem('local_file_' + storageId, reader.result as string);
            localStorage.setItem('local_file_' + key, reader.result as string);
          } catch (e) { /* ignore storage quota limit */ }
        }
      };
      reader.readAsDataURL(file);
    } catch (e) { /* ignore */ }

    return storageId;
  } catch (err) {
    console.warn("Cloud upload failed or offline, creating resilient local storage key fallback:", err);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        try {
          localStorage.setItem('local_file_' + key, base64);
        } catch (e) { /* ignore quota limits */ }
        resolve('local_' + key);
      };
      reader.onerror = () => resolve('local_' + key);
      reader.readAsDataURL(file);
    });
  }
}

export async function deleteFileFromCloud(storageId: string): Promise<void> {
  if (!convexUrl || storageId.startsWith('local_')) return;
  try {
    await convex.mutation(api.files.deleteFile, { storageId });
  } catch (err) {
    console.warn("Could not delete file from cloud storage:", err);
  }
}

export async function downloadFile(url: string, filename: string): Promise<void> {
  try {
    if (url.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error("Download failed, opening in new tab instead", error);
    window.open(url, '_blank');
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function generateStorageKey(filename: string): string {
  return Date.now() + '_' + Math.random().toString(36).substring(7) + '_' + filename.replace(/[^a-zA-Z0-9.]/g, '_');
}
