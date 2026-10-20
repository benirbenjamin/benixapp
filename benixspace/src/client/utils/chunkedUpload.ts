import axios from 'axios';
import { getAuthToken } from '../services/api';

/**
 * Client-side Canvas Image Compression
 * Scales image to maximum 1080px and applies JPEG compression to fit < 500KB
 */
export const compressImageClient = (file: File, maxDimension = 1080, quality = 0.75): Promise<Blob> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            resolve(blob || file);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
};

/**
 * Convert Blob or Slice to base64 string
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Strip metadata prefix (data:*/*;base64,) to send raw base64 data
      const commaIdx = result.indexOf(',');
      resolve(commaIdx !== -1 ? result.substring(commaIdx + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export interface ChunkUploadOptions {
  onProgress?: (percent: number) => void;
  folder?: string;
  chunkSize?: number; // default 1,000,000 bytes (~1 MB) to be well under Vercel 4.5MB limit
}

/**
 * Resilient Chunked Upload for Vercel Serverless
 * Slices any file into 1MB chunks, posts to /api/upload/chunk, reassembles on server,
 * and uploads to Google Drive / Multi-Drive with zero payload limit issues!
 */
export async function uploadFileInChunks(
  file: File,
  options: ChunkUploadOptions = {}
): Promise<string> {
  const { onProgress, folder = 'media', chunkSize = 1000000 } = options;
  const token = getAuthToken();

  let fileToUpload: Blob = file;

  // Compress images first to save memory & bandwidth
  if (file.type.startsWith('image/')) {
    fileToUpload = await compressImageClient(file, 1080, 0.75);
  }

  const fileSize = fileToUpload.size;
  const totalChunks = Math.max(1, Math.ceil(fileSize / chunkSize));
  const uploadId = `upl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  if (onProgress) onProgress(5);

  let finalUrl = '';

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(fileSize, start + chunkSize);
    const chunkBlob = fileToUpload.slice(start, end);
    const chunkBase64 = await blobToBase64(chunkBlob);

    const res = await axios.post(
      '/api/upload/chunk',
      {
        uploadId,
        chunkIndex: i,
        totalChunks,
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        chunkData: chunkBase64,
        folder
      },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      }
    );

    const pct = Math.round(((i + 1) / totalChunks) * 95);
    if (onProgress) onProgress(pct);

    if (i === totalChunks - 1) {
      if (res.data?.url) {
        finalUrl = res.data.url;
      } else {
        throw new Error(res.data?.error || 'Failed to assemble uploaded chunks.');
      }
    }
  }

  if (onProgress) onProgress(100);
  return finalUrl;
}
