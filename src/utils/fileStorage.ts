import { ConvexReactClient } from 'convex/react';
import { api } from '../../convex/_generated/api';

const convexUrl = import.meta.env.VITE_CONVEX_URL || 'https://placeholder.convex.cloud';
const convex = new ConvexReactClient(convexUrl);

export async function uploadFileToCloud(file: File, key: string): Promise<string> {
  if (!convexUrl) {
    throw new Error('Convex environment variable VITE_CONVEX_URL is missing.');
  }

  // 1. Generate secure upload URL in Convex
  const uploadUrl = await convex.mutation(api.files.generateUploadUrl, {});

  // 2. Upload raw file to Convex storage
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  if (!response.ok) {
    throw new Error('Cloud upload failed: ' + response.statusText);
  }

  // 3. Extract the unique Convex storage ID
  const { storageId } = await response.json();
  return storageId;
}

export async function deleteFileFromCloud(storageId: string): Promise<void> {
  if (!convexUrl) return;
  await convex.mutation(api.files.deleteFile, { storageId });
}

export async function downloadFile(url: string, filename: string): Promise<void> {
  try {
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
