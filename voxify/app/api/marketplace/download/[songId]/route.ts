import { NextResponse } from 'next/server';
import axios from 'axios';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ songId: string }> }
) {
  try {
    const { songId } = await params;
    const supabase = await createServerSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required for song downloads.' }, { status: 401 });
    }

    // Verify user purchase in user_purchases
    const { data: purchase } = await supabase
      .from('user_purchases')
      .select('id')
      .eq('buyer_id', session.user.id)
      .eq('song_id', songId)
      .maybeSingle();

    // Or check if user is the artist who uploaded the song
    const { data: song } = await supabase
      .from('marketplace_songs')
      .select('*, artist:artist_profiles(*)')
      .eq('id', songId)
      .single();

    if (!song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }

    const isArtistOwner = song.artist?.user_id === session.user.id;
    const isSuperAdmin = session.user.user_metadata?.is_super_admin === true;

    if (!purchase && !isArtistOwner && !isSuperAdmin) {
      return NextResponse.json({ error: 'You must purchase this song to access full download.' }, { status: 403 });
    }

    // Clean filename for direct download with Voxify prefix
    const cleanTitle = (song.title || 'Track')
      .replace(/[/\\?%*:|"<>]/g, '-')
      .replace(/\s+/g, ' ')
      .trim();
    const cleanArtist = (song.artist?.stage_name || '')
      .replace(/[/\\?%*:|"<>]/g, '-')
      .replace(/\s+/g, ' ')
      .trim();

    const downloadFileName = `Voxify - ${cleanTitle}${cleanArtist ? ` - ${cleanArtist}` : ''}.mp3`;

    // Determine raw file URL (either external URL or Supabase storage signed URL)
    let fileUrl = song.audio_file_path;
    if (!fileUrl.startsWith('http://') && !fileUrl.startsWith('https://')) {
      if (fileUrl.startsWith('/')) {
        // Relative path (e.g. /api/storage/drive?id=...)
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        fileUrl = `${appUrl}${fileUrl}`;
      } else {
        const { data: signedUrlData, error: signedError } = await supabase.storage
          .from('songs')
          .createSignedUrl(song.audio_file_path, 3600, {
            download: downloadFileName,
          });

        if (!signedError && signedUrlData?.signedUrl) {
          fileUrl = signedUrlData.signedUrl;
        } else {
          const { data: publicUrl } = supabase.storage.from('songs').getPublicUrl(song.audio_file_path);
          fileUrl = publicUrl.publicUrl;
        }
      }
    }

    // Fetch and stream directly using AXIOS with attachment Content-Disposition header
    // so the browser automatically downloads the file as "Voxify - [Title] - [Artist].mp3"
    try {
      const audioRes = await axios.get(fileUrl, {
        responseType: 'arraybuffer',
        timeout: 60000,
        maxRedirects: 5,
      });

      if (audioRes.status >= 200 && audioRes.status < 300 && audioRes.data) {
        const headers = new Headers();
        const encodedFileName = encodeURIComponent(downloadFileName).replace(/['()]/g, escape).replace(/\*/g, '%2A');
        headers.set(
          'Content-Disposition',
          `attachment; filename="${downloadFileName.replace(/"/g, '')}"; filename*=UTF-8''${encodedFileName}`
        );
        headers.set('Content-Type', audioRes.headers['content-type'] || 'audio/mpeg');
        const contentLength = audioRes.headers['content-length'] || audioRes.data.byteLength?.toString();
        if (contentLength) {
          headers.set('Content-Length', contentLength.toString());
        }
        headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');

        return new Response(audioRes.data, {
          status: 200,
          headers,
        });
      }
    } catch (axiosErr) {
      console.error('Axios download stream fetch error, falling back to redirect:', axiosErr);
    }

    return NextResponse.redirect(fileUrl);
  } catch (err: any) {
    console.error('Download route error:', err);
    return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 });
  }
}
