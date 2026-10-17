import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  initDriveResumableUpload,
  finalizeDriveUpload,
  storeFileDual,
  getBucketStorageStats,
  uploadToGoogleDrive,
} from '@/lib/services/googleDriveService';

export async function POST(request: Request) {
  try {
    const supabaseUserClient = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabaseUserClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'User must be authenticated to upload files' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';

    // Handle JSON actions: Resumable Drive upload & Signed Upload URL
    if (contentType.includes('application/json')) {
      const body = await request.json();
      const { action } = body;

      // 1. Resumable Google Drive upload session initialization
      if (action === 'init_drive_upload') {
        const { fileName, mimeType, fileSize } = body;
        const result = await initDriveResumableUpload(fileName, mimeType, Number(fileSize) || 0);
        return NextResponse.json(result);
      }

      // 2. Resumable Google Drive upload finalization
      if (action === 'finalize_drive_upload') {
        const { fileId, accountEmail, fileSizeMb } = body;
        const result = await finalizeDriveUpload(fileId, accountEmail, Number(fileSizeMb) || 0);
        return NextResponse.json({
          success: !result.error,
          url: result.streamUrl,
          driveStreamUrl: result.streamUrl,
          driveFileId: fileId,
          error: result.error,
          provider: 'google_drive',
        });
      }

      // 3. Check bucket capacity status
      if (action === 'check_bucket_status') {
        const stats = await getBucketStorageStats();
        return NextResponse.json(stats);
      }

      // 4. Supabase Signed Upload URL (Only available if Bucket is not full)
      if (action === 'init_signed_upload') {
        const { fileName, bucket = 'song-audio', fileSizeMb = 0 } = body;
        if (!fileName) {
          return NextResponse.json({ error: 'fileName is required' }, { status: 400 });
        }

        const stats = await getBucketStorageStats();
        if (stats.isFull || stats.usedMb + Number(fileSizeMb) > stats.quotaMb) {
          return NextResponse.json({
            bucketFull: true,
            error: 'Bucket storage quota exceeded. Please upload directly to Google Drive.',
          });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mdubljdeimlpntyzektn.supabase.co';
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        const adminSupabase = createClient(supabaseUrl, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        // Ensure bucket exists
        const { data: bucketData } = await adminSupabase.storage.getBucket(bucket);
        if (!bucketData) {
          await adminSupabase.storage
            .createBucket(bucket, {
              public: true,
              fileSizeLimit: 52428800, // 50MB
            })
            .catch(() => {});
        }

        const { data, error } = await adminSupabase.storage.from(bucket).createSignedUploadUrl(fileName);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const { data: publicUrlData } = adminSupabase.storage.from(bucket).getPublicUrl(fileName);

        return NextResponse.json({
          success: true,
          bucketFull: false,
          signedUrl: data.signedUrl,
          path: data.path,
          token: data.token,
          publicUrl: publicUrlData.publicUrl,
        });
      }
    }

    // Direct Multipart Form File Upload
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const bucket = (formData.get('bucket') as string) || 'song-audio';
    const choirId = (formData.get('choirId') as string) || 'default';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // CORE ENGINE EXECUTION:
    // When bucket is not full -> stores into BOTH Drive and Bucket
    // When bucket is full -> stores into Drive ONLY
    // Remove any other storage!
    const storeResult = await storeFileDual({
      fileBuffer,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      bucketName: bucket,
      subfolder: choirId,
    });

    if (storeResult.error && !storeResult.url) {
      return NextResponse.json({ error: storeResult.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      url: storeResult.url,
      bucketUrl: storeResult.bucketUrl,
      driveStreamUrl: storeResult.driveStreamUrl,
      driveFileId: storeResult.driveFileId,
      provider: storeResult.provider,
      bucketFull: storeResult.bucketFull,
      accountEmail: storeResult.accountEmail,
      error: null,
    });
  } catch (err: any) {
    console.error('Server upload API error:', err);
    return NextResponse.json({ error: err.message || 'Server error processing file upload' }, { status: 500 });
  }
}
