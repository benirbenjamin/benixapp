import { createClient } from '../supabase/client';
import { ArtistProfile, ArtistStatus, MusicTypeCategory } from '../types/database.types';

export interface CreateArtistPayload {
  stage_name: string;
  bio?: string;
  genres: string[];
  music_type: MusicTypeCategory;
  location?: string;
  country?: string;
  social_links?: Record<string, string>;
  payout_details?: Record<string, string>;
  avatar_url?: string;
  banner_url?: string;
}

export const artistService = {
  async getArtistByUserId(userId: string): Promise<ArtistProfile | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('artist_profiles')
      .select('*, profile:profiles(*)')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching artist by user ID:', error);
    }
    return data as ArtistProfile | null;
  },

  async getArtistById(artistId: string): Promise<ArtistProfile | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('artist_profiles')
      .select('*, profile:profiles(*)')
      .eq('id', artistId)
      .single();

    if (error) {
      console.error('Error fetching artist by ID:', error);
      return null;
    }
    return data as ArtistProfile;
  },

  async createArtistProfile(userId: string, payload: CreateArtistPayload): Promise<ArtistProfile> {
    const supabase = createClient();

    // Ensure parent profile row exists in profiles table to satisfy foreign key constraint
    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session?.user;

    const { data: existingProf } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (!existingProf) {
      await supabase.from('profiles').upsert({
        id: userId,
        full_name: currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || payload.stage_name,
        email: currentUser?.email || '',
        user_type: 'artist',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    }

    // Check if auto approval is enabled in marketplace settings
    const { data: settings } = await supabase
      .from('marketplace_settings')
      .select('allow_auto_artist_approval')
      .eq('id', 'global')
      .maybeSingle();

    const initialStatus: ArtistStatus = settings?.allow_auto_artist_approval ? 'approved' : 'pending';

    const { data, error } = await supabase
      .from('artist_profiles')
      .insert({
        user_id: userId,
        stage_name: payload.stage_name,
        bio: payload.bio || '',
        genres: payload.genres || [],
        music_type: payload.music_type || 'gospel',
        location: payload.location || 'Kigali',
        country: payload.country || 'Rwanda',
        social_links: payload.social_links || {},
        payout_details: payload.payout_details || {},
        avatar_url: payload.avatar_url || null,
        banner_url: payload.banner_url || null,
        status: initialStatus,
      })
      .select('*, profile:profiles(*)')
      .single();

    if (error) {
      console.error('Error creating artist profile:', error);
      throw new Error(error.message || 'Failed to create artist profile');
    }

    // Also update profile user_type
    await supabase
      .from('profiles')
      .update({ user_type: 'artist' })
      .eq('id', userId);

    return data as ArtistProfile;
  },

  async updateArtistProfile(artistId: string, payload: Partial<CreateArtistPayload>): Promise<ArtistProfile> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('artist_profiles')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', artistId)
      .select('*, profile:profiles(*)')
      .single();

    if (error) {
      console.error('Error updating artist profile:', error);
      throw new Error(error.message || 'Failed to update artist profile');
    }

    return data as ArtistProfile;
  },

  async listApprovedArtists(limit = 20): Promise<ArtistProfile[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('artist_profiles')
      .select('*, profile:profiles(*)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error listing artists:', error);
      return [];
    }
    return (data || []) as ArtistProfile[];
  },

  async listAllArtistsForAdmin(): Promise<ArtistProfile[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('artist_profiles')
      .select('*, profile:profiles(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error listing artists for admin:', error);
      return [];
    }
    return (data || []) as ArtistProfile[];
  },

  async updateArtistStatus(artistId: string, status: ArtistStatus): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
      .from('artist_profiles')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', artistId);

    if (error) {
      console.error('Error updating artist status:', error);
      return false;
    }
    return true;
  },
};
