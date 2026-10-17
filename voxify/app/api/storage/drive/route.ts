import { NextResponse } from 'next/server';
import axios from 'axios';
import { getDriveAccounts, getDriveAccessToken } from '@/lib/services/googleDriveService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');
    const accountEmail = searchParams.get('email');

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    const accounts = await getDriveAccounts();
    if (accounts.length === 0) {
      // Fallback to direct public Google Drive file URL if no accounts configured
      const publicUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      return NextResponse.redirect(publicUrl);
    }

    // Sort accounts prioritizing the specified email, then active accounts
    const orderedAccounts = [...accounts].sort((a, b) => {
      if (accountEmail && a.account_email.toLowerCase() === accountEmail.toLowerCase()) return -1;
      if (accountEmail && b.account_email.toLowerCase() === accountEmail.toLowerCase()) return 1;
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (b.status === 'active' && a.status !== 'active') return 1;
      return 0;
    });

    const rangeHeader = request.headers.get('range');
    let lastError: any = null;

    for (const account of orderedAccounts) {
      try {
        const accessToken = await getDriveAccessToken(account.credentials_json);

        const reqHeaders: Record<string, string> = {
          Authorization: `Bearer ${accessToken}`,
        };
        if (rangeHeader) {
          reqHeaders['Range'] = rangeHeader;
        }

        // Use AXIOS to fetch the file content from Google Drive
        const driveRes = await axios.get(
          `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`,
          {
            headers: reqHeaders,
            responseType: 'arraybuffer',
            validateStatus: (status) => (status >= 200 && status < 300) || status === 206,
            timeout: 30000,
          }
        );

        const responseHeaders = new Headers();
        const contentType = driveRes.headers['content-type'] || 'audio/mpeg';
        const contentLength = driveRes.headers['content-length'] || driveRes.data?.byteLength?.toString();
        const contentRange = driveRes.headers['content-range'];
        const acceptRanges = driveRes.headers['accept-ranges'] || 'bytes';

        responseHeaders.set('Content-Type', contentType);
        responseHeaders.set('Accept-Ranges', acceptRanges);
        responseHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');
        if (contentLength) responseHeaders.set('Content-Length', contentLength.toString());
        if (contentRange) responseHeaders.set('Content-Range', contentRange);

        const status = driveRes.status === 206 ? 206 : 200;

        return new NextResponse(driveRes.data, {
          status,
          headers: responseHeaders,
        });
      } catch (err: any) {
        lastError = err.response?.data || err.message;
        console.warn(`[DriveProxy] Account ${account.account_email} failed to stream ${fileId}:`, lastError);
        // Continue to try next account in pool
      }
    }

    // Final fallback: redirect to public Drive download link so file can never miss!
    const publicUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    return NextResponse.redirect(publicUrl);
  } catch (err: any) {
    console.error('Google Drive proxy route error:', err);
    return NextResponse.json({ error: err.message || 'Error streaming Google Drive file' }, { status: 500 });
  }
}
