import axios from 'axios';
import { createClient } from '../supabase/client';
import { Song, SongPart, LearningStatus } from '../types/database.types';
import { notificationService } from './notificationService';

export const songService = {
  async getChoirSongs(choirId: string, search = '', category = ''): Promise<Song[]> {
    const supabase = createClient();
    let query = supabase
      .from('songs')
      .select('*, parts:song_parts(*)')
      .eq('choir_id', choirId)
      .order('title');

    if (search.trim()) {
      query = query.ilike('title', `%${search.trim()}%`);
    }
    if (category.trim()) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data as Song[];
  },

  async getSongById(songId: string): Promise<Song | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('songs')
      .select('*, parts:song_parts(*)')
      .eq('id', songId)
      .single();

    if (error || !data) return null;
    return data as Song;
  },

  async createSong(payload: {
    choir_id: string;
    title: string;
    composer?: string;
    arranger?: string;
    category?: string;
    difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Advanced';
    lyrics?: string;
    notes?: string;
    sheet_music_pdf_url?: string;
  }): Promise<{ song: Song | null; error: string | null }> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('songs')
      .insert({
        ...payload,
        created_by: user?.id || null,
      })
      .select()
      .single();

    if (error || !data) {
      return { song: null, error: error?.message || 'Failed to create song' };
    }

    // Trigger notification to all choir members
    await notificationService.sendNotificationToChoir(
      payload.choir_id,
      `New Song Added: ${payload.title}`,
      `New song "${payload.title}" has been uploaded to your choir music library.`,
      'song',
      `/songs/${data.id}`
    );

    return { song: data as Song, error: null };
  },

  async updateSong(songId: string, payload: {
    title?: string;
    composer?: string;
    arranger?: string;
    category?: string;
    difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Advanced';
    lyrics?: string;
    notes?: string;
    sheet_music_pdf_url?: string | null;
  }): Promise<{ success: boolean; error: string | null }> {
    const supabase = createClient();
    const { error } = await supabase
      .from('songs')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', songId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  },

  async addSongPart(payload: {
    song_id: string;
    part_name: string;
    audio_url: string;
    duration_seconds?: number;
    description?: string;
  }): Promise<SongPart | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('song_parts')
      .insert(payload)
      .select()
      .single();

    if (error || !data) return null;
    return data as SongPart;
  },

  async deleteSongPart(partId: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
      .from('song_parts')
      .delete()
      .eq('id', partId);

    return !error;
  },

  async deleteSong(songId: string): Promise<boolean> {
    const supabase = createClient();
    // Delete song parts first
    await supabase.from('song_parts').delete().eq('song_id', songId);
    const { error } = await supabase.from('songs').delete().eq('id', songId);
    return !error;
  },

  async updateLearningStatus(memberId: string, songId: string, partName: string, status: LearningStatus): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
      .from('learning_progress')
      .upsert({
        member_id: memberId,
        song_id: songId,
        part_name: partName,
        status,
        updated_at: new Date().toISOString(),
      });

    return !error;
  },

  async getMemberLearningStatus(memberId: string, songId: string): Promise<Record<string, LearningStatus>> {
    const supabase = createClient();
    const { data } = await supabase
      .from('learning_progress')
      .select('part_name, status')
      .eq('member_id', memberId)
      .eq('song_id', songId);

    const result: Record<string, LearningStatus> = {};
    if (data) {
      data.forEach((row: any) => {
        result[row.part_name] = row.status as LearningStatus;
      });
    }
    return result;
  },

  async getMemberLearningSummary(memberId: string): Promise<{ readyCount: number; learningCount: number }> {
    const supabase = createClient();
    const { data } = await supabase
      .from('learning_progress')
      .select('status')
      .eq('member_id', memberId);

    let readyCount = 0;
    let learningCount = 0;

    (data || []).forEach(row => {
      if (row.status === 'ready') readyCount++;
      else if (row.status === 'learning') learningCount++;
    });

    return { readyCount, learningCount };
  },

  async uploadAudioFile(file: File, choirId: string): Promise<{ url: string | null; error: string | null }> {
    const fileSizeMb = file.size / (1024 * 1024);

    // Tier 1: Try Resumable Google Drive Upload (Bypasses Vercel 4.5MB limit) using AXIOS
    try {
      const initRes = await axios.post('/api/upload', {
        action: 'init_drive_upload',
        fileName: file.name,
        mimeType: file.type || 'audio/mpeg',
        fileSize: file.size,
      });

      const initData = initRes.data;
      if (initData?.success && initData?.resumableUploadUrl) {
        const drivePutRes = await axios.put(initData.resumableUploadUrl, file, {
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
        });

        if (drivePutRes.status >= 200 && drivePutRes.status < 300) {
          const driveFileData = drivePutRes.data || {};
          if (driveFileData?.id) {
            const finRes = await axios.post('/api/upload', {
              action: 'finalize_drive_upload',
              fileId: driveFileData.id,
              accountEmail: initData.accountEmail,
              fileSizeMb,
            });
            if (finRes.data?.url) return { url: finRes.data.url, error: null };
          }
        }
      }
    } catch (driveErr) {
      console.warn('Google Drive direct upload attempt note:', driveErr);
    }

    // Tier 2: If small file (<= 4MB), route through server /api/upload using AXIOS
    if (file.size <= 4 * 1024 * 1024) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', 'song-audio');
        formData.append('choirId', choirId);

        const res = await axios.post('/api/upload', formData);
        if (res.data?.url) return { url: res.data.url, error: null };
      } catch (serverErr) {
        console.warn('Server upload route note:', serverErr);
      }
    }

    // Tier 3: Signed Supabase Upload URL (Handles large files up to 50MB from browser) using AXIOS
    try {
      const cleanFileName = `${choirId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const signRes = await axios.post('/api/upload', {
        action: 'init_signed_upload',
        fileName: cleanFileName,
        bucket: 'song-audio',
        fileSizeMb,
      });

      const signData = signRes.data;
      if (signData?.success && signData?.token) {
        const supabase = createClient();
        const { data, error } = await supabase.storage
          .from('song-audio')
          .uploadToSignedUrl(cleanFileName, signData.token, file);

        if (!error && data) {
          const publicUrl = signData.publicUrl || supabase.storage.from('song-audio').getPublicUrl(cleanFileName).data.publicUrl;
          return { url: publicUrl, error: null };
        }
      }

      // Fallback: direct Supabase client upload
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from('song-audio')
        .upload(cleanFileName, file, { cacheControl: '3600', upsert: true });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage.from('song-audio').getPublicUrl(cleanFileName);
        return { url: publicUrlData.publicUrl, error: null };
      }
      return { url: null, error: error?.message || 'Upload failed' };
    } catch (err: any) {
      return { url: null, error: err.message || 'Error during audio upload' };
    }
  },

  async uploadPdfFile(file: File, choirId: string): Promise<{ url: string | null; error: string | null }> {
    const fileSizeMb = file.size / (1024 * 1024);

    // If small, try server route with AXIOS
    if (file.size <= 4 * 1024 * 1024) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', 'song-documents');
        formData.append('choirId', choirId);

        const res = await axios.post('/api/upload', formData);
        if (res.data?.url) return { url: res.data.url, error: null };
      } catch (serverErr) {
        console.warn('Server PDF upload route note:', serverErr);
      }
    }

    // Signed Supabase client upload for PDFs using AXIOS
    try {
      const cleanFileName = `${choirId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const signRes = await axios.post('/api/upload', {
        action: 'init_signed_upload',
        fileName: cleanFileName,
        bucket: 'song-documents',
        fileSizeMb,
      });

      const signData = signRes.data;
      if (signData?.success && signData?.token) {
        const supabase = createClient();
        const { data, error } = await supabase.storage
          .from('song-documents')
          .uploadToSignedUrl(cleanFileName, signData.token, file);

        if (!error && data) {
          const publicUrl = signData.publicUrl || supabase.storage.from('song-documents').getPublicUrl(cleanFileName).data.publicUrl;
          return { url: publicUrl, error: null };
        }
      }

      // Fallback direct upload
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from('song-documents')
        .upload(cleanFileName, file, { cacheControl: '3600', upsert: true });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage.from('song-documents').getPublicUrl(cleanFileName);
        return { url: publicUrlData.publicUrl, error: null };
      }
      return { url: null, error: error?.message || 'PDF upload failed' };
    } catch (err: any) {
      return { url: null, error: err.message || 'Error uploading PDF file' };
    }
  },
};
