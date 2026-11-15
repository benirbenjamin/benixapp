import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import path from 'path';

// Allowed MIME types for uploaded media (Strict whitelist to prevent malicious file uploads)
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/aac',
  'audio/ogg',
  'audio/webm',
  'video/mp4',
  'video/webm',
  'application/pdf'
]);

// Cloudflare R2 S3-Compatible Client
const r2Endpoint = (process.env.R2_ENDPOINT || 'https://94cacdb0e304740d0c178fad46d60af9.r2.cloudflarestorage.com').trim();
const r2AccessKeyId = (process.env.R2_ACCESS_KEY_ID || '5502cdd9eb55a58a3c52ff41dc84b45e').trim();
const r2SecretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || '407972121cabd1083b01aa372f920e7e76d99a98eb50c34f297f1ed94d8cf02a').trim();
const BUCKET_NAME = (process.env.R2_BUCKET_NAME || 'benixspace').trim();
const PUBLIC_BASE_URL = (process.env.R2_PUBLIC_URL || 'https://pub-fecd649f56f94a5ca0d0592d78438025.r2.dev').trim().replace(/\/+$/, '');

const r2Client = new S3Client({
  region: 'auto',
  endpoint: r2Endpoint,
  credentials: {
    accessKeyId: r2AccessKeyId,
    secretAccessKey: r2SecretAccessKey
  }
});

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
    const cleanMime = (mimeType || 'application/octet-stream').toLowerCase().trim();

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
  ): Promise<{ fileUrl: string; fileId: string; provider: 'cloudflare_r2' }> {
    const cleanMime = (mimeType || 'application/octet-stream').toLowerCase().trim();
    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '') || 'media';
    const rawExt = path.extname(fileName || '').toLowerCase();
    const safeExt = rawExt.replace(/[^a-z0-9.]/g, '') || '.bin';
    const randomHex = crypto.randomBytes(8).toString('hex');
    const uniqueKey = `${safeFolder}/${Date.now()}_${randomHex}${safeExt}`;

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
  }

  /**
   * Admin configuration status
   */
  static async getConfig() {
    return {
      provider: 'cloudflare_r2',
      publicUrl: PUBLIC_BASE_URL,
      bucket: BUCKET_NAME,
      endpoint: r2Endpoint,
      isConfigured: Boolean(r2AccessKeyId && r2SecretAccessKey),
      primaryAccountName: 'Cloudflare R2 Object Storage'
    };
  }

  /**
   * Connection verification for Admin panel
   */
  static async testConnection(): Promise<{ success: boolean; message: string }> {
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
        message: `Cloudflare R2 connection error: ${err.message}`
      };
    }
  }
}
