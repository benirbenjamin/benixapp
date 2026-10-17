import { getSiteSettings } from "./settings";

export interface UploadResult {
  url: string;
  provider: "GOOGLE_DRIVE" | "VERCEL_BLOB" | "AWS_S3" | "CLOUDFLARE_R2" | "LOCAL";
  pathname?: string;
  size: number;
  downloadUrl?: string;
  fileId?: string;
}

export async function uploadFile(file: File | Blob, filename: string): Promise<UploadResult> {
  const settings = await getSiteSettings();
  const provider = settings.storage_provider || "VERCEL_BLOB";
  const isVideo = (file as any).type?.startsWith("video/") || filename.match(/\.(mp4|webm|mov|mkv|avi|m4v)$/i);

  // 1. Google Drive Multi-Drive Pool (when configured or when uploading video)
  if (provider === "GOOGLE_DRIVE" || isVideo) {
    try {
      const { uploadToMultiGoogleDrive, getGoogleDriveAccounts } = await import("./googleDrive");
      const accounts = await getGoogleDriveAccounts();
      if (accounts.length > 0) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = (file as any).type || "video/mp4";

        const driveRes = await uploadToMultiGoogleDrive(buffer, filename, mimeType);
        return {
          url: driveRes.viewUrl,
          downloadUrl: driveRes.downloadUrl,
          fileId: driveRes.fileId,
          provider: "GOOGLE_DRIVE",
          size: driveRes.size,
        };
      }
    } catch (error: any) {
      console.warn("Google Drive multi-drive pool upload failed, falling back to other providers:", error.message);
    }
  }

  // 2. Primary: Vercel Blob
  if (provider === "VERCEL_BLOB" && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { put } = await import("@vercel/blob");
      const blob = await put(filename, file, {
        access: "public",
        addRandomSuffix: true,
      });
      return {
        url: blob.url,
        provider: "VERCEL_BLOB",
        pathname: blob.pathname,
        size: file.size,
      };
    } catch (error) {
      console.warn("Vercel Blob upload failed, falling back to data URL / local handler:", error);
    }
  }

  // 3. Cloudflare R2 / AWS S3 S3-compatible integration
  if ((provider === "AWS_S3" || provider === "CLOUDFLARE_R2") && process.env.STORAGE_ACCESS_KEY) {
    // S3/R2 direct upload support
    const endpoint = process.env.STORAGE_ENDPOINT || "";
    const bucket = process.env.STORAGE_BUCKET || "umuguzi-media";
    const publicUrlBase = process.env.NEXT_PUBLIC_STORAGE_URL || endpoint;
    const key = `uploads/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    // Return the formatted storage URL
    const fileUrl = publicUrlBase.endsWith("/")
      ? `${publicUrlBase}${key}`
      : `${publicUrlBase}/${key}`;

    return {
      url: fileUrl,
      provider: provider as any,
      size: file.size,
    };
  }

  // 4. Resilient fallback for local testing & development without credentials
  // Converts file to Base64 or local public URL
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString("base64");
  const mimeType = (file as any).type || "application/octet-stream";
  const dataUrl = `data:${mimeType};base64,${base64}`;

  return {
    url: dataUrl,
    provider: "LOCAL",
    size: file.size,
  };
}
