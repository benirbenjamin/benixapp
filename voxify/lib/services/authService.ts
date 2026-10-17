import { createClient } from '../supabase/client';
import { Profile } from '../types/database.types';

export const authService = {
  async getCurrentProfile(): Promise<Profile | null> {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return profile as Profile || {
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      avatar_url: user.user_metadata?.avatar_url || null,
      is_super_admin: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  async signOut(): Promise<void> {
    const supabase = createClient();
    await supabase.auth.signOut();
  }
};
