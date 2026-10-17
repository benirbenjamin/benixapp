import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export interface GoogleDriveAccount {
  id: string;
  account_email: string;
  folder_id: string;
  credentials_json: any;
  status: 'active' | 'full' | 'disabled';
  max_storage_mb: number;
  used_storage_mb: number;
  file_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface PlatformStorageOverview {
  storage_mode: 'dual_storage';
  bucket: {
    quota_mb: number;
    used_mb: number;
    available_mb: number;
    usage_percent: number;
    is_full: boolean;
    file_count: number;
  };
  drive_pool: {
    total_quota_mb: number;
    total_used_mb: number;
    total_available_mb: number;
    usage_percent: number;
    active_count: number;
    total_count: number;
    accounts: GoogleDriveAccount[];
  };
  combined: {
    total_quota_mb: number;
    total_used_mb: number;
    total_available_mb: number;
    usage_percent: number;
    total_files: number;
  };
}

export interface StoredFileResult {
  url: string;
  driveStreamUrl?: string;
  driveFileId?: string;
  bucketUrl?: string;
  provider: 'dual' | 'google_drive';
  accountEmail?: string;
  bucketFull: boolean;
  error: string | null;
}

// In-memory access token cache: key = email or client_id -> { token, expiresAt }
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mdubljdeimlpntyzektn.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Obtain an OAuth2 Access Token using Refresh Token or Service Account
 * Uses AXIOS exclusively for reliability.
 */
export async function getDriveAccessToken(creds: any): Promise<string> {
  if (!creds) {
    throw new Error('Google Drive credentials are missing');
  }

  // If a raw string is passed, try parsing it as JSON
  if (typeof creds === 'string') {
    if (creds.trim().startsWith('{')) {
      try {
        creds = JSON.parse(creds);
      } catch (e) {
        throw new Error('Invalid JSON format in Google Drive credentials');
      }
    } else if (creds.length > 50) {
      return creds.trim();
    }
  }

  // Check in-memory cache
  const cacheKey = creds.client_id || creds.client_email || creds.refresh_token || 'default';
  const cached = tokenCache.get(cacheKey);
  const nowMs = Date.now();
  if (cached && cached.expiresAt > nowMs + 60000) {
    return cached.token;
  }

  // 1. PRIMARY METHOD: OAuth 2.0 Refresh Token (Client ID, Client Secret, Refresh Token)
  // This provides access to the full quota of a user's Google Drive (15GB free or 2TB+ Google One)
  if (creds.refresh_token && creds.client_id && creds.client_secret) {
    try {
      const params = new URLSearchParams({
        client_id: creds.client_id.trim(),
        client_secret: creds.client_secret.trim(),
        refresh_token: creds.refresh_token.trim(),
        grant_type: 'refresh_token',
      });

      const response = await axios.post(
        'https://oauth2.googleapis.com/token',
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          timeout: 15000,
        }
      );

      const data = response.data;
      if (!data || !data.access_token) {
        throw new Error(data?.error_description || data?.error || 'No access token returned from Google OAuth');
      }

      const expiresInSec = Number(data.expires_in) || 3600;
      tokenCache.set(cacheKey, {
        token: data.access_token,
        expiresAt: nowMs + expiresInSec * 1000,
      });

      return data.access_token;
    } catch (err: any) {
      const errMsg = err.response?.data?.error_description || err.response?.data?.error || err.message;
      throw new Error(`Google OAuth Refresh Token error: ${errMsg}`);
    }
  }

  // 2. Direct Access Token (if already valid)
  if (creds.access_token) {
    return creds.access_token;
  }

  // 3. Fallback: Service Account JWT Flow (for Google Workspace Shared Drives)
  const clientEmail = creds.client_email;
  let privateKey = creds.private_key;

  if (clientEmail && privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const claimSet = {
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    const base64UrlEncode = (obj: any) =>
      Buffer.from(JSON.stringify(obj))
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    const encodedHeader = base64UrlEncode(header);
    const encodedClaimSet = base64UrlEncode(claimSet);
    const unsignedToken = `${encodedHeader}.${encodedClaimSet}`;

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(unsignedToken);
    const signature = signer
      .sign(privateKey, 'base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const jwt = `${unsignedToken}.${signature}`;

    const params = new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    });

    const tokenRes = await axios.post(
      'https://oauth2.googleapis.com/token',
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        timeout: 15000,
      }
    );

    const tokenData = tokenRes.data;
    if (!tokenData || !tokenData.access_token) {
      throw new Error(`Google Service Account OAuth failed: ${tokenData?.error_description || 'No access token'}`);
    }

    tokenCache.set(cacheKey, {
      token: tokenData.access_token,
      expiresAt: nowMs + 3500 * 1000,
    });

    return tokenData.access_token;
  }

  throw new Error('Invalid credentials: Requires client_id, client_secret, and refresh_token (or Service Account JSON).');
}

/**
 * Backward compatibility alias
 */
export const getAccessTokenFromServiceAccount = getDriveAccessToken;

/**
 * Test Google Drive Connection and retrieve live quota information using AXIOS
 */
export async function testDriveConnection(creds: any): Promise<{
  success: boolean;
  email?: string;
  displayName?: string;
  storageQuota?: {
    limitBytes: number;
    usageBytes: number;
    usageInDriveBytes: number;
    limitGb: number;
    usageGb: number;
    availableGb: number;
  };
  error?: string;
}> {
  try {
    const accessToken = await getDriveAccessToken(creds);

    const res = await axios.get(
      'https://www.googleapis.com/drive/v3/about?fields=user,storageQuota',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
        timeout: 10000,
      }
    );

    const data = res.data;
    const quota = data?.storageQuota || {};
    const limitBytes = Number(quota.limit) || 15 * 1024 * 1024 * 1024;
    const usageBytes = Number(quota.usage) || 0;
    const usageInDriveBytes = Number(quota.usageInDrive) || 0;

    return {
      success: true,
      email: data?.user?.emailAddress,
      displayName: data?.user?.displayName,
      storageQuota: {
        limitBytes,
        usageBytes,
        usageInDriveBytes,
        limitGb: Math.round((limitBytes / (1024 * 1024 * 1024)) * 100) / 100,
        usageGb: Math.round((usageBytes / (1024 * 1024 * 1024)) * 100) / 100,
        availableGb: Math.max(0, Math.round(((limitBytes - usageBytes) / (1024 * 1024 * 1024)) * 100) / 100),
      },
    };
  } catch (err: any) {
    const msg = err.response?.data?.error?.message || err.message || 'Failed to connect to Google Drive API';
    return {
      success: false,
      error: msg,
    };
  }
}

/**
 * Fetch all configured Google Drive accounts from Supabase
 */
export async function getDriveAccounts(): Promise<GoogleDriveAccount[]> {
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from('google_drive_accounts')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching google_drive_accounts:', error);
      return [];
    }

    return (data || []) as GoogleDriveAccount[];
  } catch (err) {
    console.error('Error in getDriveAccounts:', err);
    return [];
  }
}

/**
 * Add a new Google Drive account to the rotation pool
 */
export async function addDriveAccount(account: {
  account_email: string;
  folder_id?: string;
  credentials_json: any;
  max_storage_mb?: number;
}): Promise<{ data: GoogleDriveAccount | null; error: string | null }> {
  try {
    const supabase = getAdminSupabase();
    const creds =
      typeof account.credentials_json === 'string'
        ? JSON.parse(account.credentials_json)
        : account.credentials_json;

    // Test connection first
    const testResult = await testDriveConnection(creds);
    if (!testResult.success) {
      return {
        data: null,
        error: `Could not connect to Google Drive with provided credentials: ${testResult.error}`,
      };
    }

    // Auto-detect max storage if available from quota
    let maxStorageMb = account.max_storage_mb || 15000;
    let initialUsedMb = 0;
    if (testResult.storageQuota) {
      if (testResult.storageQuota.limitGb > 0) {
        maxStorageMb = Math.round(testResult.storageQuota.limitGb * 1024);
      }
      initialUsedMb = Math.round((testResult.storageQuota.usageBytes / (1024 * 1024)) * 100) / 100;
    }

    const { data, error } = await supabase
      .from('google_drive_accounts')
      .insert([
        {
          account_email: (account.account_email || testResult.email || '').trim().toLowerCase(),
          folder_id: (account.folder_id || '').trim(),
          credentials_json: creds,
          status: 'active',
          max_storage_mb: maxStorageMb,
          used_storage_mb: initialUsedMb,
          file_count: 0,
        },
      ])
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as GoogleDriveAccount, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to add Google Drive account' };
  }
}

/**
 * Update an existing Google Drive account
 */
export async function updateDriveAccount(
  id: string,
  updates: Partial<GoogleDriveAccount>
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = getAdminSupabase();
    const payload: any = { ...updates };
    if (typeof payload.credentials_json === 'string') {
      try {
        payload.credentials_json = JSON.parse(payload.credentials_json);
      } catch (e) {
        // keep as is
      }
    }

    const { error } = await supabase.from('google_drive_accounts').update(payload).eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update Google Drive account' };
  }
}

/**
 * Delete a Google Drive account from the pool
 */
export async function deleteDriveAccount(id: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = getAdminSupabase();
    const { error } = await supabase.from('google_drive_accounts').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete account' };
  }
}

/**
 * Mark a Google Drive account as full when capacity is exceeded
 */
export async function markAccountFull(accountId: string): Promise<void> {
  try {
    const supabase = getAdminSupabase();
    await supabase.from('google_drive_accounts').update({ status: 'full' }).eq('id', accountId);
    console.log(`[GoogleDrivePool] Account ${accountId} marked as FULL.`);
  } catch (err) {
    console.error('Error marking account full:', err);
  }
}

/**
 * Reset all accounts falsely marked as full back to active
 */
export async function resetFullAccounts(): Promise<{ count: number; error: string | null }> {
  try {
    const supabase = getAdminSupabase();
    const accounts = await getDriveAccounts();
    const toReset = accounts.filter(
      (a) => a.status === 'full' && (a.used_storage_mb || 0) < (a.max_storage_mb || 15000)
    );

    for (const acc of toReset) {
      await supabase.from('google_drive_accounts').update({ status: 'active' }).eq('id', acc.id);
    }

    return { count: toReset.length, error: null };
  } catch (err: any) {
    return { count: 0, error: err.message || 'Error resetting accounts' };
  }
}

/**
 * Upload file buffer directly to Google Drive using AXIOS
 */
export async function uploadToGoogleDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  preferredAccountId?: string
): Promise<{
  fileId: string;
  streamUrl: string;
  accountEmail: string;
  error: string | null;
}> {
  const accounts = await getDriveAccounts();

  // Find active accounts with space
  let activeAccounts = accounts.filter(
    (acc) => acc.status === 'active' && (acc.used_storage_mb || 0) < (acc.max_storage_mb || 15000)
  );

  // Auto-recovery: if all marked full but actually have space
  if (activeAccounts.length === 0) {
    const recoverable = accounts.filter(
      (acc) => acc.status === 'full' && (acc.used_storage_mb || 0) < (acc.max_storage_mb || 15000)
    );
    if (recoverable.length > 0) {
      for (const rec of recoverable) {
        await updateDriveAccount(rec.id, { status: 'active' });
        rec.status = 'active';
      }
      activeAccounts = recoverable;
    }
  }

  if (preferredAccountId) {
    const idx = activeAccounts.findIndex((a) => a.id === preferredAccountId);
    if (idx > 0) {
      const [pref] = activeAccounts.splice(idx, 1);
      activeAccounts.unshift(pref);
    }
  }

  if (activeAccounts.length === 0) {
    return {
      fileId: '',
      streamUrl: '',
      accountEmail: '',
      error:
        accounts.length === 0
          ? 'No Google Drive accounts are configured in Super Admin -> Storage Management.'
          : 'All Google Drive accounts in the pool have reached maximum capacity.',
    };
  }

  let lastError = '';

  // Helper to send multipart upload via AXIOS
  const sendDriveUploadWithAxios = async (
    accessToken: string,
    metadata: any,
    buffer: Buffer,
    type: string
  ) => {
    const boundary = '-------VoxifyBoundary' + Date.now().toString(16);
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const bodyBuffer = Buffer.concat([
      Buffer.from(
        `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`
      ),
      Buffer.from(`${delimiter}Content-Type: ${type || 'application/octet-stream'}\r\n\r\n`),
      buffer,
      Buffer.from(closeDelimiter),
    ]);

    const res = await axios.post(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,mimeType,size,webViewLink',
      bodyBuffer,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': bodyBuffer.length.toString(),
        },
        timeout: 60000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );

    return res.data;
  };

  for (const account of activeAccounts) {
    try {
      const accessToken = await getDriveAccessToken(account.credentials_json);

      // Attempt 1: Upload with folder_id if provided
      let metadata: any = { name: fileName };
      if (account.folder_id && account.folder_id.trim()) {
        metadata.parents = [account.folder_id.trim()];
      }

      let uploadData: any;
      try {
        uploadData = await sendDriveUploadWithAxios(accessToken, metadata, fileBuffer, mimeType);
      } catch (uploadErr: any) {
        // If folder upload fails with 404 or 403, retry to root drive
        const status = uploadErr.response?.status;
        if (account.folder_id && (status === 404 || status === 403)) {
          console.warn(
            `[GoogleDrivePool] Account ${account.account_email} upload to folder '${account.folder_id}' failed (${status}). Retrying directly to root Drive...`
          );
          metadata = { name: fileName };
          uploadData = await sendDriveUploadWithAxios(accessToken, metadata, fileBuffer, mimeType);
        } else {
          throw uploadErr;
        }
      }

      if (!uploadData || !uploadData.id) {
        throw new Error('Google Drive did not return file ID');
      }

      const fileId = uploadData.id;
      const fileSizeMb = fileBuffer.length / (1024 * 1024);

      // Set public read permission so file is accessible anywhere
      try {
        await axios.post(
          `https://www.googleapis.com/drive/v3/files/${fileId}/permissions?supportsAllDrives=true`,
          {
            role: 'reader',
            type: 'anyone',
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          }
        );
      } catch (permErr) {
        console.warn('Google Drive permission update note:', permErr);
      }

      // Update used storage & file count in Supabase
      const updatedUsedMb = (account.used_storage_mb || 0) + fileSizeMb;
      const updatedCount = (account.file_count || 0) + 1;
      const newStatus = updatedUsedMb >= account.max_storage_mb ? 'full' : 'active';

      await updateDriveAccount(account.id, {
        used_storage_mb: Math.round(updatedUsedMb * 100) / 100,
        file_count: updatedCount,
        status: newStatus,
      });

      const streamUrl = `/api/storage/drive?id=${fileId}&email=${encodeURIComponent(account.account_email)}`;

      return {
        fileId,
        streamUrl,
        accountEmail: account.account_email,
        error: null,
      };
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || err.message || 'Unknown error';
      lastError = errMsg;
      console.warn(`[GoogleDrivePool] Error uploading to account ${account.account_email}:`, errMsg);

      const isQuota =
        errMsg.toLowerCase().includes('storagequotaexceeded') ||
        errMsg.toLowerCase().includes('storage quota exceeded');

      if (isQuota) {
        await markAccountFull(account.id);
        continue;
      }
    }
  }

  return {
    fileId: '',
    streamUrl: '',
    accountEmail: '',
    error: lastError ? `Google Drive upload failed: ${lastError}` : 'All Drive accounts in pool failed to upload.',
  };
}

/**
 * Initialize a resumable upload session for large files using AXIOS
 */
export async function initDriveResumableUpload(
  fileName: string,
  mimeType: string,
  fileSize: number
): Promise<{
  success: boolean;
  resumableUploadUrl?: string;
  accountEmail?: string;
  error?: string;
}> {
  try {
    const accounts = await getDriveAccounts();
    const activeAccount = accounts.find(
      (acc) => acc.status === 'active' && (acc.used_storage_mb || 0) < (acc.max_storage_mb || 15000)
    );

    if (!activeAccount) {
      return {
        success: false,
        error:
          accounts.length === 0
            ? 'No Google Drive accounts configured.'
            : 'All Google Drive accounts in pool have reached maximum limit.',
      };
    }

    const accessToken = await getDriveAccessToken(activeAccount.credentials_json);

    const metadata: any = { name: fileName };
    if (activeAccount.folder_id && activeAccount.folder_id.trim()) {
      metadata.parents = [activeAccount.folder_id.trim()];
    }

    const initRes = await axios.post(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true',
      metadata,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Type': mimeType || 'application/octet-stream',
          'X-Upload-Content-Length': fileSize.toString(),
        },
        timeout: 20000,
      }
    );

    const resumableUploadUrl = initRes.headers['location'] || initRes.headers['Location'];
    if (!resumableUploadUrl) {
      return { success: false, error: 'Google Drive did not return a resumable upload location.' };
    }

    return {
      success: true,
      resumableUploadUrl,
      accountEmail: activeAccount.account_email,
    };
  } catch (err: any) {
    const msg = err.response?.data?.error?.message || err.message || 'Error initializing resumable upload';
    return { success: false, error: msg };
  }
}

/**
 * Finalize Google Drive resumable upload using AXIOS
 */
export async function finalizeDriveUpload(
  fileId: string,
  accountEmail: string,
  fileSizeMb: number
): Promise<{ streamUrl: string; error: string | null }> {
  try {
    const accounts = await getDriveAccounts();
    const account = accounts.find((a) => a.account_email.toLowerCase() === accountEmail.toLowerCase());
    if (account) {
      const accessToken = await getDriveAccessToken(account.credentials_json);

      // Set public read permission
      try {
        await axios.post(
          `https://www.googleapis.com/drive/v3/files/${fileId}/permissions?supportsAllDrives=true`,
          { role: 'reader', type: 'anyone' },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          }
        );
      } catch (e) {
        console.warn('Google Drive permission update note:', e);
      }

      // Update storage tracking
      const updatedUsedMb = (account.used_storage_mb || 0) + fileSizeMb;
      const updatedCount = (account.file_count || 0) + 1;
      const newStatus = updatedUsedMb >= account.max_storage_mb ? 'full' : 'active';
      await updateDriveAccount(account.id, {
        used_storage_mb: Math.round(updatedUsedMb * 100) / 100,
        file_count: updatedCount,
        status: newStatus,
      });
    }

    const streamUrl = `/api/storage/drive?id=${fileId}&email=${encodeURIComponent(accountEmail)}`;
    return { streamUrl, error: null };
  } catch (err: any) {
    return { streamUrl: '', error: err.message || 'Failed to finalize Drive upload' };
  }
}

/**
 * Fetch live Bucket Storage stats (Quota, Used, Available, IsFull)
 * Supabase free tier standard is 1 GB (1000 MB). Admin can configure bucket_quota_mb.
 */
export async function getBucketStorageStats(): Promise<{
  quotaMb: number;
  usedMb: number;
  availableMb: number;
  usagePercent: number;
  isFull: boolean;
  fileCount: number;
}> {
  try {
    const supabase = getAdminSupabase();

    // Fetch quota from platform_settings
    let quotaMb = 1000; // default 1 GB for Supabase free tier
    let trackedUsedMb = 0;
    let trackedCount = 0;

    const { data: settings } = await supabase
      .from('platform_settings')
      .select('bucket_quota_mb, bucket_used_mb, bucket_file_count')
      .limit(1)
      .maybeSingle();

    if (settings) {
      if (settings.bucket_quota_mb && Number(settings.bucket_quota_mb) > 0) {
        quotaMb = Number(settings.bucket_quota_mb);
      }
      if (settings.bucket_used_mb) {
        trackedUsedMb = Number(settings.bucket_used_mb);
      }
      if (settings.bucket_file_count) {
        trackedCount = Number(settings.bucket_file_count);
      }
    }

    // Try counting objects from Supabase storage buckets ('song-audio' and 'song-documents')
    let calculatedUsedBytes = 0;
    let calculatedCount = 0;

    try {
      const buckets = ['song-audio', 'song-documents'];
      for (const b of buckets) {
        const { data: files } = await supabase.storage.from(b).list('', { limit: 1000 });
        if (files) {
          for (const f of files) {
            if (f.metadata && typeof f.metadata.size === 'number') {
              calculatedUsedBytes += f.metadata.size;
              calculatedCount++;
            }
          }
        }
      }
    } catch (listErr) {
      // ignore list errors if bucket is empty or not yet created
    }

    const calculatedUsedMb = Math.round((calculatedUsedBytes / (1024 * 1024)) * 100) / 100;
    const finalUsedMb = Math.max(trackedUsedMb, calculatedUsedMb);
    const finalCount = Math.max(trackedCount, calculatedCount);

    const availableMb = Math.max(0, Math.round((quotaMb - finalUsedMb) * 100) / 100);
    const usagePercent = Math.min(100, Math.round((finalUsedMb / (quotaMb || 1)) * 100));
    const isFull = finalUsedMb >= quotaMb;

    return {
      quotaMb,
      usedMb: finalUsedMb,
      availableMb,
      usagePercent,
      isFull,
      fileCount: finalCount,
    };
  } catch (err) {
    console.error('Error fetching bucket storage stats:', err);
    return {
      quotaMb: 1000,
      usedMb: 0,
      availableMb: 1000,
      usagePercent: 0,
      isFull: false,
      fileCount: 0,
    };
  }
}

/**
 * Increment bucket used storage & file count in platform_settings
 */
export async function recordBucketUpload(fileSizeMb: number): Promise<void> {
  try {
    const supabase = getAdminSupabase();
    const currentStats = await getBucketStorageStats();
    const newUsed = Math.round((currentStats.usedMb + fileSizeMb) * 100) / 100;
    const newCount = currentStats.fileCount + 1;

    const { data: existing } = await supabase.from('platform_settings').select('id').limit(1).maybeSingle();
    if (existing) {
      await supabase
        .from('platform_settings')
        .update({
          bucket_used_mb: newUsed,
          bucket_file_count: newCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await supabase.from('platform_settings').insert([
        {
          id: 'global',
          bucket_quota_mb: 1000,
          bucket_used_mb: newUsed,
          bucket_file_count: newCount,
          storage_mode: 'dual_storage',
        },
      ]);
    }
  } catch (err) {
    console.error('Error recording bucket upload:', err);
  }
}

/**
 * Update bucket quota limit (GB or MB) in platform_settings
 */
export async function updateBucketQuota(quotaMb: number): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = getAdminSupabase();
    const { data: existing } = await supabase.from('platform_settings').select('id').limit(1).maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('platform_settings')
        .update({
          bucket_quota_mb: quotaMb,
          storage_mode: 'dual_storage',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabase.from('platform_settings').insert([
        {
          id: 'global',
          bucket_quota_mb: quotaMb,
          bucket_used_mb: 0,
          bucket_file_count: 0,
          storage_mode: 'dual_storage',
        },
      ]);
      if (error) return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update bucket quota' };
  }
}

/**
 * Get comprehensive platform storage overview
 * Shows:
 * 1. Supabase Bucket Quota, Used, Available
 * 2. Google Drive Pool Quota, Used, Available
 * 3. Combined Total Storage Quota, Used, Available
 */
export async function getPlatformStorageOverview(): Promise<PlatformStorageOverview> {
  const [bucketStats, accounts] = await Promise.all([
    getBucketStorageStats(),
    getDriveAccounts(),
  ]);

  const totalDriveQuotaMb = accounts.reduce((acc, a) => acc + (a.max_storage_mb || 0), 0);
  const totalDriveUsedMb = accounts.reduce((acc, a) => acc + (a.used_storage_mb || 0), 0);
  const totalDriveAvailableMb = Math.max(0, totalDriveQuotaMb - totalDriveUsedMb);
  const driveUsagePercent = totalDriveQuotaMb > 0 ? Math.round((totalDriveUsedMb / totalDriveQuotaMb) * 100) : 0;
  const activeDriveCount = accounts.filter((a) => a.status === 'active').length;
  const totalDriveFiles = accounts.reduce((acc, a) => acc + (a.file_count || 0), 0);

  const combinedQuotaMb = bucketStats.quotaMb + totalDriveQuotaMb;
  const combinedUsedMb = Math.round((bucketStats.usedMb + totalDriveUsedMb) * 100) / 100;
  const combinedAvailableMb = Math.round((bucketStats.availableMb + totalDriveAvailableMb) * 100) / 100;
  const combinedUsagePercent = combinedQuotaMb > 0 ? Math.round((combinedUsedMb / combinedQuotaMb) * 100) : 0;
  const combinedTotalFiles = bucketStats.fileCount + totalDriveFiles;

  return {
    storage_mode: 'dual_storage',
    bucket: {
      quota_mb: bucketStats.quotaMb,
      used_mb: bucketStats.usedMb,
      available_mb: bucketStats.availableMb,
      usage_percent: bucketStats.usagePercent,
      is_full: bucketStats.isFull,
      file_count: bucketStats.fileCount,
    },
    drive_pool: {
      total_quota_mb: totalDriveQuotaMb,
      total_used_mb: Math.round(totalDriveUsedMb * 100) / 100,
      total_available_mb: Math.round(totalDriveAvailableMb * 100) / 100,
      usage_percent: driveUsagePercent,
      active_count: activeDriveCount,
      total_count: accounts.length,
      accounts,
    },
    combined: {
      total_quota_mb: combinedQuotaMb,
      total_used_mb: combinedUsedMb,
      total_available_mb: combinedAvailableMb,
      usage_percent: combinedUsagePercent,
      total_files: combinedTotalFiles,
    },
  };
}

/**
 * CORE STORAGE ENGINE:
 * "MAKE SURE THE FILES ARE STORED INTO DRIVE AND BUCKET WHEN BUCKET IS FULL IT STORES IN DRIVE ONLY
 * BUT WHEN BUCKET IS NOT FULL IT STORES IN BOTH DRIVE AND BUCKET AND REMOVE ANY OTHER STORAGE."
 */
export async function storeFileDual(params: {
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
  bucketName?: string;
  subfolder?: string;
}): Promise<StoredFileResult> {
  const { fileBuffer, fileName, mimeType, bucketName = 'song-audio', subfolder = 'default' } = params;
  const fileSizeMb = fileBuffer.length / (1024 * 1024);

  // Check if bucket is full
  const bucketStats = await getBucketStorageStats();
  const bucketIsFull = bucketStats.isFull || bucketStats.usedMb + fileSizeMb > bucketStats.quotaMb;

  const adminSupabase = getAdminSupabase();
  const cleanFileName = `${subfolder}/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

  // CASE 1: BUCKET IS FULL -> STORE IN DRIVE ONLY
  if (bucketIsFull) {
    console.log(
      `[StorageEngine] Bucket is FULL (${bucketStats.usedMb}MB / ${bucketStats.quotaMb}MB). Storing file '${fileName}' in Google Drive ONLY...`
    );

    const driveResult = await uploadToGoogleDrive(fileBuffer, fileName, mimeType);
    if (driveResult.error) {
      return {
        url: '',
        provider: 'google_drive',
        bucketFull: true,
        error: `Bucket is full and Google Drive upload failed: ${driveResult.error}`,
      };
    }

    return {
      url: driveResult.streamUrl,
      driveStreamUrl: driveResult.streamUrl,
      driveFileId: driveResult.fileId,
      provider: 'google_drive',
      accountEmail: driveResult.accountEmail,
      bucketFull: true,
      error: null,
    };
  }

  // CASE 2: BUCKET IS NOT FULL -> STORE IN BOTH DRIVE AND BUCKET!
  console.log(
    `[StorageEngine] Bucket has available space (${bucketStats.availableMb}MB free). Storing file '${fileName}' in BOTH Drive and Bucket...`
  );

  // 1. Upload to Google Drive
  let driveResult: { fileId: string; streamUrl: string; accountEmail: string; error: string | null } = {
    fileId: '',
    streamUrl: '',
    accountEmail: '',
    error: null,
  };

  try {
    driveResult = await uploadToGoogleDrive(fileBuffer, fileName, mimeType);
    if (driveResult.error) {
      console.warn('[StorageEngine] Note on Drive backup upload:', driveResult.error);
    }
  } catch (driveErr: any) {
    console.warn('[StorageEngine] Drive upload exception:', driveErr.message);
  }

  // 2. Upload to Supabase Bucket
  // Ensure bucket exists
  try {
    const { data: bData } = await adminSupabase.storage.getBucket(bucketName);
    if (!bData) {
      await adminSupabase.storage.createBucket(bucketName, { public: true, fileSizeLimit: 52428800 }).catch(() => {});
    }
  } catch (e) {
    // continue
  }

  const bucketUploadRes = await adminSupabase.storage.from(bucketName).upload(cleanFileName, fileBuffer, {
    contentType: mimeType || 'application/octet-stream',
    cacheControl: '3600',
    upsert: true,
  });

  if (bucketUploadRes.error) {
    console.error(`[StorageEngine] Supabase bucket upload failed: ${bucketUploadRes.error.message}`);

    // If bucket upload failed (e.g. storage full error or permission), but Drive succeeded:
    if (!driveResult.error && driveResult.streamUrl) {
      console.log('[StorageEngine] Falling back to Google Drive stream URL because bucket upload failed.');
      return {
        url: driveResult.streamUrl,
        driveStreamUrl: driveResult.streamUrl,
        driveFileId: driveResult.fileId,
        provider: 'google_drive',
        accountEmail: driveResult.accountEmail,
        bucketFull: true,
        error: null,
      };
    }

    return {
      url: '',
      provider: 'dual',
      bucketFull: false,
      error: `Upload failed on bucket (${bucketUploadRes.error.message}) and drive (${driveResult.error || 'error'})`,
    };
  }

  // Both uploaded successfully!
  const { data: publicUrlData } = adminSupabase.storage.from(bucketName).getPublicUrl(cleanFileName);
  const bucketPublicUrl = publicUrlData.publicUrl;

  // Record bucket usage in background
  recordBucketUpload(fileSizeMb).catch(() => {});

  // Primary URL is the bucket public URL for blazing fast CDN delivery.
  // driveStreamUrl & driveFileId are included so the file can never miss!
  return {
    url: bucketPublicUrl,
    bucketUrl: bucketPublicUrl,
    driveStreamUrl: driveResult.streamUrl || undefined,
    driveFileId: driveResult.fileId || undefined,
    accountEmail: driveResult.accountEmail || undefined,
    provider: 'dual',
    bucketFull: false,
    error: null,
  };
}
