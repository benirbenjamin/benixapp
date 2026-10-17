import { createClient } from '../supabase/client';

export interface PlatformStats {
  totalChoirs: number;
  totalSongs: number;
  totalAudioTracks: number;
  totalMembers: number;
}

export const statsService = {
  async getPlatformStats(): Promise<PlatformStats> {
    const supabase = createClient();

    try {
      const [choirsRes, songsRes, tracksRes, membersRes] = await Promise.all([
        supabase.from('choirs').select('id', { count: 'exact', head: true }),
        supabase.from('songs').select('id', { count: 'exact', head: true }),
        supabase.from('song_parts').select('id', { count: 'exact', head: true }),
        supabase.from('choir_members').select('id', { count: 'exact', head: true }),
      ]);

      const totalChoirs = choirsRes.count ?? 0;
      const totalSongs = songsRes.count ?? 0;
      const totalAudioTracks = tracksRes.count ?? 0;
      const totalMembers = membersRes.count ?? 0;

      return {
        totalChoirs,
        totalSongs,
        totalAudioTracks,
        totalMembers,
      };
    } catch {
      return {
        totalChoirs: 0,
        totalSongs: 0,
        totalAudioTracks: 0,
        totalMembers: 0,
      };
    }
  }
};
