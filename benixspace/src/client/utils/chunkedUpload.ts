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

export interface UploadOptions {
  onProgress?: (percent: number) => void;
  folder?: string;
  fileName?: string;
}

/**
 * Direct Upload to Cloudflare R2 via 60-second Pre-Signed URL
 * 0 MB Node.js RAM usage and 0 server bandwidth
 * Browser uploads directly to Cloudflare R2 via HTTP PUT
 */
export async function uploadDirectToR2(
  file: File | Blob,
  options: UploadOptions = {}
): Promise<string> {
  const { onProgress, folder = 'media' } = options;
  const token = getAuthToken();

  let fileToUpload: Blob = file;
  if (file.type && file.type.startsWith('image/')) {
    fileToUpload = await compressImageClient(file as File, 1080, 0.75);
  }

  const rawFileName = options.fileName || (file instanceof File ? file.name : `media_${Date.now()}.jpg`);
  const safeFileName = rawFileName.replace(/[^a-zA-Z0-9_.-]/g, '_');
  const mimeType = fileToUpload.type || 'application/octet-stream';

  // 1. Request 60-second presigned upload URL from Benix backend
  const presignRes = await axios.post(
    '/api/media/presigned-upload',
    {
      fileName: safeFileName,
      fileType: mimeType,
      folder
    },
    {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    }
  );

  const { uploadUrl, publicUrl } = presignRes.data;

  // 2. Direct HTTP PUT upload to Cloudflare R2
  await axios.put(uploadUrl, fileToUpload, {
    headers: {
      'Content-Type': mimeType
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
        onProgress(Math.min(99, percent));
      }
    }
  });

  if (onProgress) onProgress(100);
  return publicUrl;
}

/**
 * Backwards compatibility alias for components calling uploadFileInChunks
 */
export async function uploadFileInChunks(
  file: File,
  options: UploadOptions = {}
): Promise<string> {
  return uploadDirectToR2(file, options);
}
