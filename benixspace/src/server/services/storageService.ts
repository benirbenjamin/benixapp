import https from 'https';
import fs from 'fs';
import path from 'path';
import { query } from '../db/db';
import { EmailService } from './emailService';

export interface GoogleDriveAccount {
  id: string;
  name: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  folderId?: string;
  isPrimary: boolean;
  storageLimitBytes: number; // e.g. 15 GB = 16,106,127,360
  storageUsedBytes: number;
  status: 'active' | 'warning' | 'full' | 'error';
  lastChecked?: string;
}

export class StorageService {
  private static tokenCache: Map<string, { token: string; expiresAt: number }> = new Map();
  private static lastAlertSentAt: Map<string, number> = new Map();

  /**
   * Initialize Database Table for Multi-Drive Management
   */
  static async initStorageTable(): Promise<void> {
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS google_drive_accounts (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          client_id VARCHAR(255) NOT NULL,
          client_secret VARCHAR(255) NOT NULL,
          refresh_token TEXT NOT NULL,
          folder_id VARCHAR(255) DEFAULT 'root',
          is_primary BOOLEAN DEFAULT FALSE,
          storage_limit_bytes BIGINT DEFAULT 16106127360,
          storage_used_bytes BIGINT DEFAULT 0,
          status VARCHAR(50) DEFAULT 'active',
          last_checked TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Seed with initial environment credentials if table is currently empty
      const existing = await query('SELECT id FROM google_drive_accounts LIMIT 1');
      if (existing.rowCount === 0) {
        const envClientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
        const envSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
        const envRefresh = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
        const envFolder = process.env.GOOGLE_DRIVE_FOLDER_ID || 'root';

        if (envClientId && envSecret && envRefresh) {
          await query(
            `INSERT INTO google_drive_accounts (id, name, client_id, client_secret, refresh_token, folder_id, is_primary)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            ['drive-primary', 'Primary Google Drive (Main)', envClientId, envSecret, envRefresh, envFolder, true]
          );
        }
      }
    } catch (err: any) {
      console.warn('Google Drive table init notice:', err.message);
    }
  }

  /**
   * Retrieve all configured Google Drive accounts from database
   */
  static async getAccounts(): Promise<GoogleDriveAccount[]> {
    try {
      await this.initStorageTable();
      const res = await query('SELECT * FROM google_drive_accounts ORDER BY is_primary DESC, name ASC');
      return res.rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        clientId: r.client_id,
        clientSecret: r.client_secret,
        refreshToken: r.refresh_token,
        folderId: r.folder_id || 'root',
        isPrimary: Boolean(r.is_primary),
        storageLimitBytes: Number(r.storage_limit_bytes) || 16106127360,
        storageUsedBytes: Number(r.storage_used_bytes) || 0,
        status: (r.status as any) || 'active',
        lastChecked: r.last_checked
      }));
    } catch {
      return [];
    }
  }

  /**
   * Refreshes OAuth2 access token for a specific Drive account
   */
  private static async getAccessToken(acc: GoogleDriveAccount): Promise<string | null> {
    if (!acc.clientId || !acc.clientSecret || !acc.refreshToken) return null;

    const cached = this.tokenCache.get(acc.id);
    if (cached && Date.now() < cached.expiresAt - 60000) {
      return cached.token;
    }

    return new Promise((resolve) => {
      const postData = new URLSearchParams({
        client_id: acc.clientId,
        client_secret: acc.clientSecret,
        refresh_token: acc.refreshToken,
        grant_type: 'refresh_token'
      }).toString();

      const options = {
        hostname: 'oauth2.googleapis.com',
        path: '/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (data.access_token) {
              const expiresAt = Date.now() + (data.expires_in || 3600) * 1000;
              this.tokenCache.set(acc.id, { token: data.access_token, expiresAt });
              resolve(data.access_token);
            } else {
              console.warn(`[Drive ${acc.name}] Token refresh error:`, data);
              resolve(null);
            }
          } catch {
            resolve(null);
          }
        });
      });

      req.on('error', () => resolve(null));
      req.write(postData);
      req.end();
    });
  }

  /**
   * Live Quota Check: Queries Google Drive API v3 about storage usage & limits
   */
  static async fetchLiveQuota(acc: GoogleDriveAccount): Promise<{
    usedBytes: number;
    limitBytes: number;
    usagePercent: number;
    remainingBytes: number;
    success: boolean;
  }> {
    const token = await this.getAccessToken(acc);
    if (!token) {
      return {
        usedBytes: acc.storageUsedBytes,
        limitBytes: acc.storageLimitBytes,
        usagePercent: Math.round((acc.storageUsedBytes / (acc.storageLimitBytes || 1)) * 100),
        remainingBytes: Math.max(0, acc.storageLimitBytes - acc.storageUsedBytes),
        success: false
      };
    }

    return new Promise((resolve) => {
      const options = {
        hostname: 'www.googleapis.com',
        path: '/drive/v3/about?fields=storageQuota',
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', async () => {
          try {
            const data = JSON.parse(body);
            if (data.storageQuota) {
              const limit = Number(data.storageQuota.limit) || acc.storageLimitBytes || 16106127360;
              const used = Number(data.storageQuota.usage) || 0;
              const percent = limit > 0 ? Math.round((used / limit) * 100) : 0;
              const remaining = Math.max(0, limit - used);

              let status: 'active' | 'warning' | 'full' = 'active';
              if (percent >= 92) status = 'full';
              else if (percent >= 80) status = 'warning';

              // Persist live metrics
              await query(
                `UPDATE google_drive_accounts
                 SET storage_limit_bytes = $1, storage_used_bytes = $2, status = $3, last_checked = CURRENT_TIMESTAMP
                 WHERE id = $4`,
                [limit, used, status, acc.id]
              ).catch(() => {});

              // Trigger alert if running low (> 85% or < 1.5 GB remaining)
              if (percent >= 85 || remaining < 1.5 * 1024 * 1024 * 1024) {
                this.sendStorageLowAlert(acc, used, limit, percent, remaining);
              }

              resolve({
                usedBytes: used,
                limitBytes: limit,
                usagePercent: percent,
                remainingBytes: remaining,
                success: true
              });
              return;
            }
          } catch {}
          resolve({
            usedBytes: acc.storageUsedBytes,
            limitBytes: acc.storageLimitBytes,
            usagePercent: Math.round((acc.storageUsedBytes / (acc.storageLimitBytes || 1)) * 100),
            remainingBytes: Math.max(0, acc.storageLimitBytes - acc.storageUsedBytes),
            success: false
          });
        });
      });

      req.on('error', () => {
        resolve({
          usedBytes: acc.storageUsedBytes,
          limitBytes: acc.storageLimitBytes,
          usagePercent: 0,
          remainingBytes: acc.storageLimitBytes,
          success: false
        });
      });
      req.end();
    });
  }

  /**
   * Dispatch Warning Email to Admin when Google Drive storage is running out
   */
  private static async sendStorageLowAlert(
    acc: GoogleDriveAccount,
    used: number,
    limit: number,
    percent: number,
    remaining: number
  ) {
    const now = Date.now();
    const lastAlert = this.lastAlertSentAt.get(acc.id) || 0;
    // Debounce alerts to once every 12 hours per account
    if (now - lastAlert < 12 * 3600 * 1000) return;
    this.lastAlertSentAt.set(acc.id, now);

    const adminEmail = process.env.SUPERADMIN_EMAIL || 'benirabok@gmail.com';
    const usedGb = (used / (1024 * 1024 * 1024)).toFixed(2);
    const limitGb = (limit / (1024 * 1024 * 1024)).toFixed(2);
    const remGb = (remaining / (1024 * 1024 * 1024)).toFixed(2);

    EmailService.sendEmail({
      to: adminEmail,
      subject: `⚠️ Action Required: Google Drive Storage Running Low (${acc.name} is ${percent}% full)`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #0B0E14; color: #FFFFFF; border-radius: 20px; border: 1px solid #DC2626;">
          <h2 style="color: #EF4444; margin-top: 0; font-size: 22px;">⚠️ Google Drive Storage Running Low!</h2>
          <p style="color: #CBD5E1; font-size: 14px; line-height: 1.6;">
            Google Drive storage account <strong>${acc.name}</strong> has reached <strong>${percent}%</strong> of its quota.
          </p>
          <div style="background: #161D2E; border: 1px solid #1E293B; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0; color: #94A3B8; font-size: 13px;">Storage Details:</p>
            <p style="margin: 4px 0; font-size: 14px; color: #F8FAFC;">• <strong>Used:</strong> ${usedGb} GB / ${limitGb} GB</p>
            <p style="margin: 4px 0; font-size: 14px; color: #F87171;">• <strong>Remaining:</strong> ${remGb} GB</p>
            <p style="margin: 4px 0; font-size: 14px; color: #38BDF8;">• <strong>Account:</strong> ${acc.name} (${acc.id})</p>
          </div>
          <p style="color: #CBD5E1; font-size: 14px; line-height: 1.6;">
            Please log into the <strong>Benix.Space Admin Dashboard -> Storage Settings</strong> to add an additional Google Drive account. BenixSpace will automatically fall back to the new storage account once this one reaches capacity.
          </p>
        </div>
      `
    }).catch((e) => console.warn('Admin storage alert email failed:', e?.message));
  }

  /**
   * Upload File with Multi-Drive Fallback:
   * Tries primary Drive; if full or failed, cascades automatically to secondary/backup Drive,
   * and finally to local public uploads.
   */
  static async uploadFile(
    fileName: string,
    mimeType: string,
    fileBuffer: Buffer
  ): Promise<{ fileUrl: string; fileId: string; provider: 'google_drive' | 'local'; driveAccountName?: string }> {
    const accounts = await this.getAccounts();

    // Iterate through active drives (starting with primary)
    for (const acc of accounts) {
      if (acc.status === 'full') continue;

      const token = await this.getAccessToken(acc);
      if (!token) continue;

      try {
        const result = await this.uploadToDrive(token, acc.folderId || 'root', fileName, mimeType, fileBuffer);

        // Update used bytes
        const newUsed = acc.storageUsedBytes + fileBuffer.length;
        await query(
          'UPDATE google_drive_accounts SET storage_used_bytes = $1, last_checked = CURRENT_TIMESTAMP WHERE id = $2',
          [newUsed, acc.id]
        ).catch(() => {});

        return {
          fileUrl: `https://drive.google.com/uc?id=${result.id}&export=download`,
          fileId: result.id,
          provider: 'google_drive',
          driveAccountName: acc.name
        };
      } catch (err: any) {
        console.warn(`Drive upload failed on [${acc.name}]: ${err.message}. Cascading to fallback storage...`);
        // If error indicates quota exceeded, mark this drive as full
        if (err.message && (err.message.includes('quota') || err.message.includes('storage'))) {
          await query("UPDATE google_drive_accounts SET status = 'full' WHERE id = $1", [acc.id]).catch(() => {});
          this.sendStorageLowAlert(acc, acc.storageLimitBytes, acc.storageLimitBytes, 100, 0);
        }
      }
    }

    // Final Fallback: Local Server Storage
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const safeName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9_\.-]/g, '_')}`;
    const targetPath = path.join(uploadsDir, safeName);
    fs.writeFileSync(targetPath, fileBuffer);

    return {
      fileUrl: `/uploads/${safeName}`,
      fileId: safeName,
      provider: 'local',
      driveAccountName: 'Local Storage Fallback'
    };
  }

  private static uploadToDrive(
    token: string,
    folderId: string,
    fileName: string,
    mimeType: string,
    buffer: Buffer
  ): Promise<{ id: string; name: string }> {
    return new Promise((resolve, reject) => {
      const boundary = '-------314159265358979323846';
      const delimiter = '\r\n--' + boundary + '\r\n';
      const closeDelim = '\r\n--' + boundary + '--';

      const metadata = {
        name: fileName,
        mimeType: mimeType,
        parents: folderId && folderId !== 'root' ? [folderId] : undefined
      };

      const multipartRequestBody = Buffer.concat([
        Buffer.from(
          delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          `Content-Type: ${mimeType}\r\n\r\n`
        ),
        buffer,
        Buffer.from(closeDelim)
      ]);

      const req = https.request(
        {
          hostname: 'www.googleapis.com',
          path: '/upload/drive/v3/files?uploadType=multipart',
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
            'Content-Length': multipartRequestBody.length
          }
        },
        (res) => {
          let body = '';
          res.on('data', (c) => (body += c));
          res.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              if (parsed.id) {
                resolve(parsed);
              } else {
                reject(new Error(parsed.error?.message || 'Drive upload error'));
              }
            } catch (err) {
              reject(err);
            }
          });
        }
      );

      req.on('error', reject);
      req.write(multipartRequestBody);
      req.end();
    });
  }

  /**
   * Add a new Google Drive Account in Admin Settings
   */
  static async addAccount(data: {
    name: string;
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    folderId?: string;
    isPrimary?: boolean;
  }): Promise<GoogleDriveAccount> {
    const id = `drive-${Date.now()}`;
    await this.initStorageTable();

    if (data.isPrimary) {
      await query('UPDATE google_drive_accounts SET is_primary = FALSE');
    }

    await query(
      `INSERT INTO google_drive_accounts (id, name, client_id, client_secret, refresh_token, folder_id, is_primary)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, data.name, data.clientId, data.clientSecret, data.refreshToken, data.folderId || 'root', !!data.isPrimary]
    );

    const accounts = await this.getAccounts();
    const created = accounts.find((a) => a.id === id)!;
    // Live verify and fetch initial quota
    await this.fetchLiveQuota(created);
    return created;
  }

  /**
   * Delete a Google Drive Account
   */
  static async deleteAccount(id: string): Promise<void> {
    await query('DELETE FROM google_drive_accounts WHERE id = $1', [id]);
    this.tokenCache.delete(id);
  }

  /**
   * Set primary account
   */
  static async setPrimaryAccount(id: string): Promise<void> {
    await query('UPDATE google_drive_accounts SET is_primary = FALSE');
    await query('UPDATE google_drive_accounts SET is_primary = TRUE WHERE id = $1', [id]);
  }

  /**
   * Legacy single-account config getter/setter for compatibility
   */
  static async getConfig() {
    const accounts = await this.getAccounts();
    const primary = accounts.find((a) => a.isPrimary) || accounts[0];
    return {
      accounts: accounts.map((a) => ({
        id: a.id,
        name: a.name,
        folderId: a.folderId,
        isPrimary: a.isPrimary,
        storageLimitBytes: a.storageLimitBytes,
        storageUsedBytes: a.storageUsedBytes,
        storageLimitGb: (a.storageLimitBytes / (1024 * 1024 * 1024)).toFixed(1),
        storageUsedGb: (a.storageUsedBytes / (1024 * 1024 * 1024)).toFixed(2),
        remainingGb: (Math.max(0, a.storageLimitBytes - a.storageUsedBytes) / (1024 * 1024 * 1024)).toFixed(2),
        usagePercent: Math.round((a.storageUsedBytes / (a.storageLimitBytes || 1)) * 100),
        status: a.status,
        lastChecked: a.lastChecked
      })),
      isConfigured: accounts.length > 0,
      primaryAccountName: primary ? primary.name : 'None configured'
    };
  }

  static async testConnection(): Promise<{ success: boolean; message: string }> {
    const accounts = await this.getAccounts();
    if (accounts.length === 0) {
      return { success: false, message: 'No Google Drive accounts configured yet. Please add an account.' };
    }
    const results = await Promise.all(accounts.map((a) => this.fetchLiveQuota(a)));
    const anySuccess = results.some((r) => r.success);
    if (anySuccess) {
      return {
        success: true,
        message: `Successfully verified and synced storage quotas across ${accounts.length} Drive account(s)!`
      };
    }
    return {
      success: false,
      message: 'Failed to verify Google Drive credentials. Please verify Client ID and Refresh Token.'
    };
  }
}
