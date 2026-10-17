import { createClient } from '../supabase/client';
import { Genre, MarketplaceSong, SongComment, MarketplaceSongStatus } from '../types/database.types';

export interface FilterSongsOptions {
  genreId?: string;
  musicType?: 'gospel' | 'secular' | 'all';
  isLocalOnly?: boolean;
  searchQuery?: string;
  artistId?: string;
  sortBy?: 'popular' | 'latest' | 'price_asc' | 'price_desc';
  limit?: number;
  offset?: number;
  hidePurchased?: boolean;
}

export interface CreateSongPayload {
  title: string;
  description?: string;
  genre_id?: string;
  music_type: 'gospel' | 'secular';
  language?: string;
  audio_file_path: string;
  preview_audio_path?: string;
  preview_start_time: number;
  preview_end_time: number;
  cover_image_url?: string;
  lyrics?: string;
  price: number;
  currency?: string;
  status?: MarketplaceSongStatus;
}

export const marketplaceService = {
  async getGenres(): Promise<Genre[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('genres')
      .select('*')
      .eq('is_active', true)
      .order('is_local', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching genres:', error);
      return [];
    }
    return (data || []) as Genre[];
  },

  async getMarketplaceSongs(options: FilterSongsOptions = {}, userId?: string): Promise<MarketplaceSong[]> {
    const supabase = createClient();
    let query = supabase
      .from('marketplace_songs')
      .select('*, artist:artist_profiles(*, profile:profiles(*)), genre:genres(*)')
      .eq('status', 'published');

    if (options.artistId) {
      query = query.eq('artist_id', options.artistId);
    }

    if (options.genreId && options.genreId !== 'all') {
      query = query.eq('genre_id', options.genreId);
    }

    if (options.musicType && options.musicType !== 'all') {
      query = query.eq('music_type', options.musicType);
    }

    if (options.searchQuery && options.searchQuery.trim()) {
      const term = `%${options.searchQuery.trim()}%`;
      query = query.or(`title.ilike.${term},description.ilike.${term}`);
    }

    if (options.hidePurchased) {
      // Exclude any songs that have been purchased (purchases_count > 0)
      query = query.or('purchases_count.eq.0,purchases_count.is.null');
    }

    if (options.sortBy === 'latest') {
      query = query.order('published_at', { ascending: false });
    } else if (options.sortBy === 'price_asc') {
      query = query.order('price', { ascending: true });
    } else if (options.sortBy === 'price_desc') {
      query = query.order('price', { ascending: false });
    } else {
      // Default: popular
      query = query.order('purchases_count', { ascending: false }).order('views_count', { ascending: false });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data: songs, error } = await query;

    if (error) {
      console.error('Error fetching marketplace songs:', error);
      return [];
    }

    let result = (songs || []) as MarketplaceSong[];

    // Filter local genres client side if requested
    if (options.isLocalOnly) {
      result = result.filter(song => song.genre?.is_local === true);
    }

    // Hide purchased songs if requested (double check against user_purchases if logged in)
    if (options.hidePurchased && result.length > 0) {
      result = result.filter(song => !song.purchases_count || song.purchases_count === 0);
      if (userId) {
        const songIds = result.map(s => s.id);
        const { data: purchaseRows } = await supabase
          .from('user_purchases')
          .select('song_id')
          .eq('buyer_id', userId)
          .in('song_id', songIds);
        if (purchaseRows && purchaseRows.length > 0) {
          const purchasedSet = new Set(purchaseRows.map(p => p.song_id));
          result = result.filter(song => !purchasedSet.has(song.id));
        }
      }
    }

    // Check user purchase state & liked state if logged in
    if (userId && result.length > 0) {
      const songIds = result.map(s => s.id);
      
      const [purchasesRes, likesRes] = await Promise.all([
        supabase.from('user_purchases').select('song_id').eq('buyer_id', userId).in('song_id', songIds),
        supabase.from('song_likes').select('song_id').eq('user_id', userId).in('song_id', songIds),
      ]);

      const purchasedSet = new Set((purchasesRes.data || []).map(p => p.song_id));
      const likedSet = new Set((likesRes.data || []).map(l => l.song_id));

      result = result.map(song => ({
        ...song,
        is_purchased: purchasedSet.has(song.id),
        is_liked: likedSet.has(song.id),
      }));
    }

    return result;
  },

  async getMarketplaceSongById(songId: string, userId?: string): Promise<MarketplaceSong | null> {
    const supabase = createClient();
    const { data: song, error } = await supabase
      .from('marketplace_songs')
      .select('*, artist:artist_profiles(*, profile:profiles(*)), genre:genres(*)')
      .eq('id', songId)
      .single();

    if (error || !song) {
      console.error('Error fetching song details:', error);
      return null;
    }

    let isPurchased = false;
    let isLiked = false;

    if (userId) {
      const [pRes, lRes] = await Promise.all([
        supabase.from('user_purchases').select('id').eq('buyer_id', userId).eq('song_id', songId).maybeSingle(),
        supabase.from('song_likes').select('id').eq('user_id', userId).eq('song_id', songId).maybeSingle(),
      ]);
      isPurchased = !!pRes.data;
      isLiked = !!lRes.data;
    }

    return {
      ...(song as MarketplaceSong),
      is_purchased: isPurchased,
      is_liked: isLiked,
    };
  },

  async createMarketplaceSong(artistId: string, payload: CreateSongPayload): Promise<MarketplaceSong> {
    if (!payload.audio_file_path || payload.audio_file_path.startsWith('blob:')) {
      throw new Error('Invalid audio file URL: temporary local blob URLs cannot be saved. Audio track must be uploaded to cloud storage first.');
    }
    const supabase = createClient();
    const { data, error } = await supabase
      .from('marketplace_songs')
      .insert({
        artist_id: artistId,
        title: payload.title,
        description: payload.description || '',
        genre_id: payload.genre_id || null,
        music_type: payload.music_type,
        language: payload.language || 'Kinyarwanda',
        audio_file_path: payload.audio_file_path,
        preview_audio_path: payload.preview_audio_path || null,
        preview_start_time: payload.preview_start_time || 0,
        preview_end_time: payload.preview_end_time || 30,
        cover_image_url: payload.cover_image_url || null,
        lyrics: payload.lyrics || '',
        price: payload.price,
        currency: payload.currency || 'RWF',
        status: payload.status || 'published',
      })
      .select('*, artist:artist_profiles(*), genre:genres(*)')
      .single();

    if (error) {
      console.error('Error creating marketplace song:', error);
      throw new Error(error.message || 'Failed to upload song');
    }
    return data as MarketplaceSong;
  },

  async updateMarketplaceSong(songId: string, payload: Partial<CreateSongPayload>): Promise<MarketplaceSong> {
    if (payload.audio_file_path && payload.audio_file_path.startsWith('blob:')) {
      throw new Error('Invalid audio file URL: temporary local blob URLs cannot be saved. Audio track must be uploaded to cloud storage first.');
    }
    const cleanPayload: Record<string, any> = { ...payload };
    if ('genre_id' in cleanPayload && (!cleanPayload.genre_id || cleanPayload.genre_id === 'all' || cleanPayload.genre_id === '')) {
      cleanPayload.genre_id = null;
    }
    if (cleanPayload.title !== undefined) cleanPayload.title = cleanPayload.title.trim();
    if (cleanPayload.description !== undefined) cleanPayload.description = cleanPayload.description.trim();
    if (cleanPayload.lyrics !== undefined) cleanPayload.lyrics = cleanPayload.lyrics.trim();
    if (cleanPayload.price !== undefined) cleanPayload.price = Number(cleanPayload.price);
    if (cleanPayload.preview_start_time !== undefined) cleanPayload.preview_start_time = Number(cleanPayload.preview_start_time);
    if (cleanPayload.preview_end_time !== undefined) cleanPayload.preview_end_time = Number(cleanPayload.preview_end_time);

    const supabase = createClient();
    const { data, error } = await supabase
      .from('marketplace_songs')
      .update(cleanPayload)
      .eq('id', songId)
      .select('*, artist:artist_profiles(*), genre:genres(*)')
      .single();

    if (error) {
      console.error('Error updating marketplace song:', error);
      throw new Error(error.message || 'Failed to update song');
    }
    return data as MarketplaceSong;
  },

  async getUserPurchasedSongs(userId: string): Promise<MarketplaceSong[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('user_purchases')
      .select('*, song:marketplace_songs(*, artist:artist_profiles(*), genre:genres(*))')
      .eq('buyer_id', userId)
      .order('purchased_at', { ascending: false });

    if (error) {
      console.error('Error fetching user purchases:', error);
      return [];
    }

    return (data || [])
      .filter((p: any) => p && p.song && typeof p.song === 'object' && p.song.id)
      .map((p: any) => ({
        ...(p.song as MarketplaceSong),
        is_purchased: true,
      }));
  },

  async toggleLikeSong(songId: string, userId?: string, sessionId?: string): Promise<{ liked: boolean; count: number }> {
    const supabase = createClient();
    
    // Check if existing like
    let query = supabase.from('song_likes').select('id').eq('song_id', songId);
    if (userId) {
      query = query.eq('user_id', userId);
    } else if (sessionId) {
      query = query.eq('session_id', sessionId);
    } else {
      return { liked: false, count: 0 };
    }

    const { data: existing } = await query.maybeSingle();

    if (existing) {
      // Unlike
      await supabase.from('song_likes').delete().eq('id', existing.id);
      // Decrement song likes_count
      const { data: updatedSong } = await supabase.rpc('decrement_likes_count', { song_id: songId });
      const currentCount = updatedSong?.likes_count ?? 0;
      return { liked: false, count: currentCount };
    } else {
      // Like
      await supabase.from('song_likes').insert({
        song_id: songId,
        user_id: userId || null,
        session_id: sessionId || null,
      });
      // Increment song likes_count
      const { data: song } = await supabase.from('marketplace_songs').select('likes_count').eq('id', songId).single();
      const newCount = (song?.likes_count || 0) + 1;
      await supabase.from('marketplace_songs').update({ likes_count: newCount }).eq('id', songId);
      return { liked: true, count: newCount };
    }
  },

  async recordSongView(songId: string): Promise<void> {
    const supabase = createClient();
    const { data: song } = await supabase.from('marketplace_songs').select('views_count').eq('id', songId).single();
    if (song) {
      await supabase.from('marketplace_songs').update({ views_count: (song.views_count || 0) + 1 }).eq('id', songId);
    }
  },

  async getSongComments(songId: string): Promise<SongComment[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('song_comments')
      .select('*')
      .eq('song_id', songId)
      .eq('status', 'visible')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
    return (data || []) as SongComment[];
  },

  async addSongComment(songId: string, authorName: string, content: string, userId?: string): Promise<SongComment> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('song_comments')
      .insert({
        song_id: songId,
        author_name: authorName,
        content: content.trim(),
        user_id: userId || null,
        status: 'visible',
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error posting comment:', error);
      throw new Error('Failed to post comment');
    }
    return data as SongComment;
  },

  async listAllSongsForAdmin(): Promise<any[]> {
    const supabase = createClient();
    const [songsRes, purchasesRes] = await Promise.all([
      supabase
        .from('marketplace_songs')
        .select('*, artist:artist_profiles(*, profile:profiles(*)), genre:genres(*)')
        .order('created_at', { ascending: false }),
      supabase
        .from('user_purchases')
        .select('*, buyer:profiles(*)')
        .order('purchased_at', { ascending: false }),
    ]);

    if (songsRes.error) {
      console.error('Error listing songs for admin:', songsRes.error);
      return [];
    }

    const songs = songsRes.data || [];
    const purchases = purchasesRes.data || [];

    const purchaseMap = new Map<string, any>();
    purchases.forEach(p => {
      // If multiple purchases (or single purchase), map by song_id
      if (!purchaseMap.has(p.song_id)) {
        purchaseMap.set(p.song_id, p);
      }
    });

    return songs.map(song => {
      const purchase = purchaseMap.get(song.id) || null;
      return {
        ...song,
        is_purchased: !!purchase || (song.purchases_count || 0) > 0,
        purchase,
      };
    });
  },

  async updateSongStatusForAdmin(songId: string, status: 'published' | 'draft' | 'archived'): Promise<boolean> {
    const supabase = createClient();
    const updateData: any = {
      status,
      ...(status === 'published' ? { published_at: new Date().toISOString() } : {}),
    };

    const { error } = await supabase
      .from('marketplace_songs')
      .update(updateData)
      .eq('id', songId);

    if (error) {
      console.error('Error updating song status:', error);
      return false;
    }
    return true;
  },

  async deleteSongForAdmin(songId: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
      .from('marketplace_songs')
      .delete()
      .eq('id', songId);

    if (error) {
      console.error('Error deleting song:', error);
      return false;
    }
    return true;
  },
};
