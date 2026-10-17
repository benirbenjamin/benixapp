import https from 'https';
import fs from 'fs';
import path from 'path';

interface GoogleDriveConfig {
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  folderId?: string;
}

export class StorageService {
  private static config: GoogleDriveConfig = {
    clientId: process.env.GOOGLE_DRIVE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
    folderId: process.env.GOOGLE_DRIVE_FOLDER_ID || 'root'
  };

  private static cachedAccessToken: string | null = null;
  private static tokenExpiresAt: number = 0;

  /**
   * Refreshes OAuth2 Access Token using the configured Refresh Token
   */
  private static async getAccessToken(): Promise<string | null> {
    const { clientId, clientSecret, refreshToken } = this.config;
    if (!clientId || !clientSecret || !refreshToken) {
      return null;
    }

    if (this.cachedAccessToken && Date.now() < this.tokenExpiresAt - 60000) {
      return this.cachedAccessToken;
    }

    return new Promise((resolve) => {
      const postData = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
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
              this.cachedAccessToken = data.access_token;
              this.tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
              resolve(data.access_token);
            } else {
              console.warn('Google Drive token refresh response error:', data);
              resolve(null);
            }
          } catch (e) {
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
   * Uploads file to Google Drive or falls back to local storage
   */
  static async uploadFile(
    fileName: string,
    mimeType: string,
    fileBuffer: Buffer
  ): Promise<{ fileUrl: string; fileId: string; provider: 'google_drive' | 'local' }> {
    const accessToken = await this.getAccessToken();

    if (accessToken) {
      try {
        const result = await this.uploadToDrive(accessToken, fileName, mimeType, fileBuffer);
        return {
          fileUrl: `https://drive.google.com/uc?id=${result.id}&export=download`,
          fileId: result.id,
          provider: 'google_drive'
        };
      } catch (err: any) {
        console.warn('Google Drive upload failed, falling back to local file storage:', err.message);
      }
    }

    // Local file fallback
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
      provider: 'local'
    };
  }

  private static uploadToDrive(
    token: string,
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
        parents: this.config.folderId ? [this.config.folderId] : undefined
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

  static setConfig(newConfig: Partial<GoogleDriveConfig>) {
    this.config = {
      ...this.config,
      ...(newConfig.clientId ? { clientId: newConfig.clientId } : {}),
      ...(newConfig.clientSecret ? { clientSecret: newConfig.clientSecret } : {}),
      ...(newConfig.refreshToken ? { refreshToken: newConfig.refreshToken } : {}),
      ...(newConfig.folderId ? { folderId: newConfig.folderId } : {})
    };
    this.cachedAccessToken = null;
    this.tokenExpiresAt = 0;
  }

  static getConfig() {
    return {
      clientId: this.config.clientId || '',
      clientSecret: this.config.clientSecret ? '********' : '',
      refreshToken: this.config.refreshToken ? '********' : '',
      folderId: this.config.folderId || 'root',
      isConfigured: !!(this.config.clientId && this.config.clientSecret && this.config.refreshToken)
    };
  }

  static async testConnection(): Promise<{ success: boolean; message: string }> {
    const token = await this.getAccessToken();
    if (token) {
      return { success: true, message: 'Google Drive connected successfully! Refresh token is valid and active.' };
    }
    return { success: false, message: 'Google Drive authentication failed. Please verify Client ID, Client Secret, and Refresh Token.' };
  }
}
