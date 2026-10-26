/**
 * GOOGLE DRIVE MULTI-DRIVE REFRESH-TOKEN STORAGE POOL
 * ----------------------------------------------------------------------------
 * Cascading multi-account Google Drive integration with automatic token refreshing.
 * When Account #1 reaches quota or errors, automatically cascades/falls over to
 * Account #2, #3, etc.
 */

import { getSiteSettings } from "./settings";

export interface GoogleDriveAccountConfig {
  id: string;
  name: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  folderId?: string;
}

export interface DriveUploadSuccess {
  success: true;
  fileId: string;
  viewUrl: string; // Embed/preview link for in-app video playback
  streamUrl: string; // Direct media streaming URL
  downloadUrl: string; // Direct file download URL for authorized buyers
  filename: string;
  driveAccountId: string;
  driveAccountName: string;
  size: number;
  mimeType: string;
}

export interface DriveUploadFailure {
  success: false;
  error: string;
}

/**
 * Retrieves the pool of configured Google Drive accounts.
 * Reads from SiteSettings (dynamic admin settings) or environment variables.
 */
export async function getGoogleDriveAccounts(): Promise<GoogleDriveAccountConfig[]> {
  const settings = await getSiteSettings();
  const accounts: GoogleDriveAccountConfig[] = [];

  // 1. Check if configured in dynamic site settings (JSON format)
  if (settings.google_drive_accounts) {
    try {
      const parsed = JSON.parse(settings.google_drive_accounts);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      console.warn("Invalid JSON in site setting google_drive_accounts");
    }
  }

  // 2. Check Primary Drive in environment variables
  if (process.env.GOOGLE_DRIVE_CLIENT_ID && process.env.GOOGLE_DRIVE_REFRESH_TOKEN) {
    accounts.push({
      id: "drive-primary",
      name: "Primary Google Drive",
      clientId: process.env.GOOGLE_DRIVE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET || "",
      refreshToken: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
      folderId: process.env.GOOGLE_DRIVE_FOLDER_ID,
    });
  }

  // 3. Check Secondary / Failover Drive in environment variables
  if (process.env.GOOGLE_DRIVE_CLIENT_ID_2 && process.env.GOOGLE_DRIVE_REFRESH_TOKEN_2) {
    accounts.push({
      id: "drive-failover-2",
      name: "Secondary Google Drive (Failover 1)",
      clientId: process.env.GOOGLE_DRIVE_CLIENT_ID_2,
      clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET_2 || process.env.GOOGLE_DRIVE_CLIENT_SECRET || "",
      refreshToken: process.env.GOOGLE_DRIVE_REFRESH_TOKEN_2,
      folderId: process.env.GOOGLE_DRIVE_FOLDER_ID_2,
    });
  }

  // 4. Check Tertiary Drive in environment variables
  if (process.env.GOOGLE_DRIVE_CLIENT_ID_3 && process.env.GOOGLE_DRIVE_REFRESH_TOKEN_3) {
    accounts.push({
      id: "drive-failover-3",
      name: "Tertiary Google Drive (Failover 2)",
      clientId: process.env.GOOGLE_DRIVE_CLIENT_ID_3,
      clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET_3 || process.env.GOOGLE_DRIVE_CLIENT_SECRET || "",
      refreshToken: process.env.GOOGLE_DRIVE_REFRESH_TOKEN_3,
      folderId: process.env.GOOGLE_DRIVE_FOLDER_ID_3,
    });
  }

  return accounts;
}

/**
 * Exchanges a Google Drive refresh token for a fresh short-lived access token.
 */
export async function getDriveAccessToken(account: GoogleDriveAccountConfig): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: account.clientId,
      client_secret: account.clientSecret,
      refresh_token: account.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || `Failed to refresh token for ${account.name}`);
  }

  return data.access_token;
}

/**
 * Uploads a file buffer or stream to Google Drive with automatic failover across accounts.
 * If Account 1 is full (quota exceeded) or encounters an error, automatically attempts Account 2, etc.
 */
export async function uploadToMultiGoogleDrive(
  fileBuffer: Buffer,
  filename: string,
  mimeType: string = "video/mp4"
): Promise<DriveUploadSuccess> {
  const accounts = await getGoogleDriveAccounts();

  if (accounts.length === 0) {
    throw new Error(
      "No Google Drive accounts configured. Please add Google Drive OAuth credentials in Admin Settings or .env file."
    );
  }

  const errors: string[] = [];

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    console.log(`[GoogleDrive Pool] Attempting upload to account ${i + 1}/${accounts.length}: "${account.name}"`);

    try {
      // 1. Refresh access token
      const accessToken = await getDriveAccessToken(account);

      // 2. Perform multipart upload to Google Drive v3
      const boundary = "-------umuguzi_drive_boundary_" + Date.now();
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const metadata: Record<string, any> = {
        name: filename,
        mimeType: mimeType,
      };

      if (account.folderId) {
        metadata.parents = [account.folderId];
      }

      const metadataPart =
        delimiter +
        "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${mimeType}\r\n\r\n`;

      const preBuffer = Buffer.from(metadataPart, "utf-8");
      const postBuffer = Buffer.from(closeDelimiter, "utf-8");
      const fullMultipartBuffer = Buffer.concat([preBuffer, fileBuffer, postBuffer]);

      const uploadRes = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,size",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": `multipart/related; boundary=${boundary}`,
            "Content-Length": String(fullMultipartBuffer.length),
          },
          body: fullMultipartBuffer,
        }
      );

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        const errorMsg = uploadData.error?.message || "Google Drive upload failed";
        // Check if error is quota exceeded
        const isQuota =
          uploadRes.status === 403 ||
          uploadRes.status === 507 ||
          errorMsg.toLowerCase().includes("quota") ||
          errorMsg.toLowerCase().includes("storage") ||
          errorMsg.toLowerCase().includes("limit");

        if (isQuota) {
          console.warn(`⚠️ [GoogleDrive Pool] Account "${account.name}" storage quota exceeded! Triggering automatic failover to next drive account...`);
        } else {
          console.warn(`⚠️ [GoogleDrive Pool] Account "${account.name}" failed: ${errorMsg}. Trying next drive in pool...`);
        }

        errors.push(`${account.name}: ${errorMsg}`);
        continue; // Fall over to next drive!
      }

      const fileId = uploadData.id;

      // 3. Make the uploaded video public read-only (so it can be previewed/streamed in web player)
      try {
        await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role: "reader",
            type: "anyone",
          }),
        });
      } catch (permErr) {
        console.warn("Could not set anyone reader permission:", permErr);
      }

      console.log(`✅ [GoogleDrive Pool] Successfully uploaded to "${account.name}" (File ID: ${fileId})`);

      return {
        success: true,
        fileId,
        viewUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        streamUrl: `https://drive.google.com/uc?export=view&id=${fileId}`,
        downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
        filename,
        driveAccountId: account.id,
        driveAccountName: account.name,
        size: fileBuffer.length,
        mimeType,
      };
    } catch (accountErr: any) {
      console.warn(`⚠️ [GoogleDrive Pool] Error with account "${account.name}":`, accountErr.message);
      errors.push(`${account.name}: ${accountErr.message}`);
      // Fall over to next account
      continue;
    }
  }

  throw new Error(`All Google Drive accounts in pool failed to upload: ${errors.join("; ")}`);
}
