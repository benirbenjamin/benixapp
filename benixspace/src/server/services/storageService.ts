import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Allowed MIME types for uploaded media (Strict whitelist to prevent malicious file uploads)
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/heic',
  'image/heif',
  'image/avif',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/aac',
  'audio/ogg',
  'audio/webm',
  'audio/m4a',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/ogg',
  'video/3gpp',
  'video/x-m4v',
  'video/x-msvideo',
  'video/x-matroska',
  'application/pdf'
]);

// Cloudflare R2 S3-Compatible Client
// NOTE: Credentials come ONLY from environment variables. Hardcoded fallbacks
// were removed for security (previously leaked live R2 secret keys in source).
const r2Endpoint = (process.env.R2_ENDPOINT || '').trim();
const r2AccessKeyId = (process.env.R2_ACCESS_KEY_ID || '').trim();
const r2SecretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || '').trim();
const BUCKET_NAME = (process.env.R2_BUCKET_NAME || 'benixspace').trim();
const PUBLIC_BASE_URL = (process.env.R2_PUBLIC_URL || '').trim().replace(/\/+$/, '');

const isR2Configured = Boolean(r2Endpoint && r2AccessKeyId && r2SecretAccessKey && BUCKET_NAME);

const r2Client = isR2Configured
  ? new S3Client({
      region: 'auto',
      endpoint: r2Endpoint,
      credentials: {
        accessKeyId: r2AccessKeyId,
        secretAccessKey: r2SecretAccessKey
      }
    })
  : null;

// Local disk uploads directory (fallback when Cloudflare R2 is unavailable)
const LOCAL_UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

export class StorageService {
  /**
   * Generates a secure, 60-second direct pre-signed upload URL for Cloudflare R2
   * Browser uploads directly via HTTP PUT with 0 MB Node.js RAM and 0 server bandwidth
   */
  static async generatePresignedUploadUrl(
    fileName: string,
    mimeType: string,
    folder = 'media'
  ): Promise<{
    uploadUrl: string;
    publicUrl: string;
    key: string;
    expiresIn: number;
  }> {
    if (!isR2Configured || !r2Client) {
      throw new Error('Cloudflare R2 is not configured. Local upload fallback will be used.');
    }

    const baseMime = (mimeType || 'application/octet-stream').split(';')[0].toLowerCase().trim();
    const cleanMime = baseMime === 'video/mov' ? 'video/quicktime' : baseMime;

    // Strict Security Whitelist Check
    if (!ALLOWED_MIME_TYPES.has(cleanMime)) {
      throw new Error(`File type '${cleanMime}' is not permitted. Only standard images, audio, and media are allowed.`);
    }

    // Sanitize folder path (prevent directory traversal)
    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '') || 'media';

    // Sanitize extension and generate cryptographically secure random key
    const rawExt = path.extname(fileName || '').toLowerCase();
    const safeExt = rawExt.replace(/[^a-z0-9.]/g, '') || (cleanMime.startsWith('image/') ? '.jpg' : '.bin');
    const randomHex = crypto.randomBytes(8).toString('hex');
    const uniqueKey = `${safeFolder}/${Date.now()}_${randomHex}${safeExt}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueKey,
      ContentType: cleanMime
    });

    // 60-second direct upload link
    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 60 });
    const publicUrl = `${PUBLIC_BASE_URL}/${uniqueKey}`;

    return {
      uploadUrl,
      publicUrl,
      key: uniqueKey,
      expiresIn: 60
    };
  }

  /**
   * Direct server-side upload to Cloudflare R2 (for automated server tasks)
   */
  static async uploadFile(
    fileName: string,
    mimeType: string,
    fileBuffer: Buffer,
    folder = 'media'
  ): Promise<{ fileUrl: string; fileId: string; provider: 'cloudflare_r2' | 'local' }> {
    const baseMime = (mimeType || 'application/octet-stream').split(';')[0].toLowerCase().trim();
    const cleanMime = baseMime === 'video/mov' ? 'video/quicktime' : baseMime;
    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '') || 'media';
    const rawExt = path.extname(fileName || '').toLowerCase();
    const safeExt = rawExt.replace(/[^a-z0-9.]/g, '') || '.bin';
    const randomHex = crypto.randomBytes(8).toString('hex');
    const uniqueKey = `${safeFolder}/${Date.now()}_${randomHex}${safeExt}`;

    // 1. Try Cloudflare R2 (primary provider)
    if (isR2Configured && r2Client) {
      try {
        const command = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: uniqueKey,
          ContentType: cleanMime,
          Body: fileBuffer
        });
        await r2Client.send(command);
        return {
          fileUrl: `${PUBLIC_BASE_URL}/${uniqueKey}`,
          fileId: uniqueKey,
          provider: 'cloudflare_r2'
        };
      } catch (err: any) {
        console.warn('[StorageService] Cloudflare R2 upload failed, falling back to local disk:', err?.message);
      }
    }

    // 2. Local disk fallback (always available, works offline)
    return this.saveLocalFile(uniqueKey, fileBuffer);
  }

  /**
   * Local disk fallback storage — saves to public/uploads and returns a local URL.
   * Served by the existing /uploads/:filename route.
   */
  static saveLocalFile(
    key: string,
    fileBuffer: Buffer
  ): { fileUrl: string; fileId: string; provider: 'local' } {
    try {
      const fullPath = path.join(LOCAL_UPLOADS_DIR, key);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, fileBuffer);
      return {
        fileUrl: `/uploads/${key}`,
        fileId: key,
        provider: 'local'
      };
    } catch (err: any) {
      console.error('[StorageService] Local file save failed:', err?.message);
      throw err;
    }
  }

  /**
   * Directly delete a file from Cloudflare R2 storage (e.g. expired stories)
   */
  static async deleteFile(fileUrlOrKey: string): Promise<boolean> {
    if (!fileUrlOrKey) return false;
    try {
      let key = String(fileUrlOrKey).trim();
      if (key.startsWith('http://') || key.startsWith('https://')) {
        try {
          const u = new URL(key);
          key = u.pathname.replace(/^\/+/, '');
        } catch {
          const parts = key.split(PUBLIC_BASE_URL);
          if (parts[1]) key = parts[1].replace(/^\/+/, '');
        }
      }
      if (!key) return false;

      // Delete from Cloudflare R2 if configured
      if (isR2Configured && r2Client) {
        const command = new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key
        });
        await r2Client.send(command);
      } else {
        // Local fallback: delete from public/uploads
        const localPath = path.join(LOCAL_UPLOADS_DIR, key);
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
      }
      return true;
    } catch (err: any) {
      console.warn('Notice: File deletion warning:', err?.message);
      return false;
    }
  }

  /**
   * Admin configuration status
   */
  static async getConfig() {
    return {
      provider: isR2Configured ? 'cloudflare_r2' : 'local_fallback',
      publicUrl: PUBLIC_BASE_URL,
      bucket: BUCKET_NAME,
      endpoint: r2Endpoint,
      isConfigured: isR2Configured,
      localFallback: true,
      primaryAccountName: isR2Configured ? 'Cloudflare R2 Object Storage' : 'Local Disk Storage (R2 not configured)'
    };
  }

  /**
   * Connection verification for Admin panel
   */
  static async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!isR2Configured || !r2Client) {
      return {
        success: true,
        message: 'Cloudflare R2 is not configured. Local disk storage fallback is active and ready.'
      };
    }
    try {
      const testKey = `test/_ping_${Date.now()}.txt`;
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: testKey,
        ContentType: 'text/plain',
        Body: Buffer.from('Cloudflare R2 connection test OK')
      });
      await r2Client.send(command);
      return {
        success: true,
        message: 'Successfully connected to Cloudflare R2 Object Storage! Direct browser upload and public CDN are active.'
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Cloudflare R2 connection error: ${err.message}. Local disk fallback remains active.`
      };
    }
  }
}
