import { createClient } from '../supabase/client';
import { Profile, Choir } from '../types/database.types';

export interface UserWithChoirs extends Profile {
  owned_choirs?: Choir[];
  memberships?: Array<{
    role: string;
    status: string;
    choir: Choir;
  }>;
}

export interface ChoirWithOwner extends Choir {
  owner?: Profile;
  member_count?: number;
}

export const adminService = {
  // Super Admin: Fetch all registered users with their owned choirs and memberships
  async getAllUsers(): Promise<UserWithChoirs[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*, owned_choirs:choirs(*), memberships:choir_members(*, choir:choirs(*))')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data as UserWithChoirs[];
  },

  // Super Admin: Toggle Super Admin privileges
  async toggleSuperAdmin(userId: string, isSuperAdmin: boolean): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ is_super_admin: isSuperAdmin, updated_at: new Date().toISOString() })
      .eq('id', userId);

    return !error;
  },

  // Super Admin: Update User Type (artist, choir_admin, regular)
  async updateUserType(userId: string, userType: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ user_type: userType, updated_at: new Date().toISOString() })
      .eq('id', userId);

    return !error;
  },

  // Super Admin: Delete user profile and memberships
  async deleteUser(userId: string): Promise<boolean> {
    const supabase = createClient();
    // Delete memberships first
    await supabase.from('choir_members').delete().eq('user_id', userId);
    // Delete profile
    const { error } = await supabase.from('profiles').delete().eq('id', userId);

    return !error;
  },

  // Super Admin: Fetch all choirs with full owner info and member count
  async getAllChoirs(): Promise<ChoirWithOwner[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('choirs')
      .select('*, owner:profiles(*), member_count:choir_members(count)')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((c: any) => ({
      ...c,
      member_count: Array.isArray(c.member_count) ? c.member_count[0]?.count || 0 : 0,
    })) as ChoirWithOwner[];
  },

  // Super Admin: Delete choir and all associated resources
  async deleteChoir(choirId: string): Promise<boolean> {
    const supabase = createClient();

    // Cleanup choir records
    await supabase.from('event_songs').delete().filter('event_id', 'in', 
      supabase.from('events').select('id').eq('choir_id', choirId)
    );
    await supabase.from('events').delete().eq('choir_id', choirId);
    await supabase.from('rehearsals').delete().eq('choir_id', choirId);
    await supabase.from('song_parts').delete().filter('song_id', 'in', 
      supabase.from('songs').select('id').eq('choir_id', choirId)
    );
    await supabase.from('songs').delete().eq('choir_id', choirId);
    await supabase.from('announcements').delete().eq('choir_id', choirId);
    await supabase.from('choir_members').delete().eq('choir_id', choirId);
    await supabase.from('subscriptions').delete().eq('choir_id', choirId);

    const { error } = await supabase.from('choirs').delete().eq('id', choirId);

    return !error;
  }
};
