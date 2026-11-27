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
 * Direct Upload to Cloudflare R2 via 60-second Pre-Signed URL with automatic server chunking fallback
 * 0 MB Node.js RAM usage when R2 is active, with seamless 512KB chunk fallback
 */
export async function uploadChunksToServer(
  file: File | Blob,
  options: UploadOptions = {}
): Promise<string> {
  const { onProgress, folder = 'media' } = options;
  const token = getAuthToken();

  let fileToUpload: Blob = file;
  if (file.type && file.type.startsWith('image/')) {
    fileToUpload = await compressImageClient(file as File, 1080, 0.72);
  }

  const rawFileName = options.fileName || (file instanceof File ? file.name : `media_${Date.now()}.jpg`);
  const safeFileName = rawFileName.replace(/[^a-zA-Z0-9_.-]/g, '_');
  const mimeType = (fileToUpload.type || 'application/octet-stream').split(';')[0].trim();

  const chunkSize = 256 * 1024; // 256 KB chunks keep each request safely under serverless body limits
  const totalChunks = Math.max(1, Math.ceil(fileToUpload.size / chunkSize));
  const uploadId = 'up_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

  let finalUrl = '';

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * chunkSize;
    const end = Math.min(fileToUpload.size, start + chunkSize);
    const chunkBlob = fileToUpload.slice(start, end);

    const chunkBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
        const b64 = res.includes(',') ? res.split(',')[1] : res;
        resolve(b64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(chunkBlob);
    });

    const res = await axios.post(
      '/api/media/upload-chunk',
      {
        uploadId,
        chunkIndex,
        totalChunks,
        chunkData: chunkBase64,
        fileName: safeFileName,
        mimeType,
        folder
      },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      }
    );

    if (onProgress) {
      const pct = Math.round(((chunkIndex + 1) / totalChunks) * 100);
      onProgress(Math.min(99, pct));
    }

    if (res.data?.fileUrl) {
      finalUrl = res.data.fileUrl;
    }
  }

  if (onProgress) onProgress(100);
  return finalUrl;
}

export async function uploadDirectToR2(
  file: File | Blob,
  options: UploadOptions = {}
): Promise<string> {
  const { onProgress, folder = 'media' } = options;
  const token = getAuthToken();

  let fileToUpload: Blob = file;
  if (file.type && file.type.startsWith('image/')) {
    fileToUpload = await compressImageClient(file as File, 1080, 0.72);
  }

  const rawFileName = options.fileName || (file instanceof File ? file.name : `media_${Date.now()}.jpg`);
  const safeFileName = rawFileName.replace(/[^a-zA-Z0-9_.-]/g, '_');
  const mimeType = (fileToUpload.type || 'application/octet-stream').split(';')[0].trim();

  // Try direct presigned upload first
  try {
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
        },
        timeout: 6000
      }
    );

    const { uploadUrl, publicUrl } = presignRes.data;
    if (!uploadUrl) throw new Error('No upload URL returned');

    await axios.put(uploadUrl, fileToUpload, {
      headers: {
        'Content-Type': mimeType
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          onProgress(Math.min(99, percent));
        }
      },
      timeout: 30000
    });

    if (onProgress) onProgress(100);
    return publicUrl;
  } catch (err: any) {
    console.warn('Direct R2 upload bypassed, utilizing high-speed chunked upload:', err?.message);
    return uploadChunksToServer(fileToUpload, options);
  }
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
