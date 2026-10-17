import { createClient } from '../supabase/client';
import { Choir, ChoirMember, Section, ChoirSettings } from '../types/database.types';
import { subscriptionService } from './subscriptionService';
import { notificationService } from './notificationService';

export const choirService = {
  async getMyChoirs(): Promise<Choir[]> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: memberRows, error } = await supabase
      .from('choir_members')
      .select('choir_id, choirs(*)')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (error || !memberRows) return [];
    return memberRows.map((r: any) => r.choirs).filter(Boolean) as Choir[];
  },

  async createChoir(payload: {
    name: string;
    description?: string;
    location?: string;
    church_name?: string;
    logo_url?: string;
  }): Promise<{ choir: Choir | null; error: string | null }> {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { choir: null, error: 'User not logged in' };

      // Ensure profile exists in profiles table before inserting choir
      const userFullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Choir Owner';
      await supabase.from('profiles').upsert({
        id: user.id,
        full_name: userFullName,
        email: user.email!,
        phone: user.user_metadata?.phone || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        is_super_admin: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      // Generate a unique 5-character alphanumeric choir code
      const choirCode = Math.random().toString(36).substring(2, 7).toUpperCase();

      const { data: choir, error } = await supabase
        .from('choirs')
        .insert({
          ...payload,
          owner_id: user.id,
          choir_code: choirCode,
        })
        .select()
        .single();

      if (error || !choir) {
        return { choir: null, error: error?.message || 'Failed to insert choir record' };
      }

      // Automatically assign owner as Choir Master (Role: owner, Status: active)
      await supabase.from('choir_members').upsert({
        choir_id: choir.id,
        user_id: user.id,
        role: 'owner',
        status: 'active',
      }, { onConflict: 'choir_id,user_id' });

      // Initialize free subscription if available
      const { plan: freePlan } = await subscriptionService.getChoirSubscription(choir.id);
      if (freePlan) {
        await subscriptionService.setChoirPlan(choir.id, freePlan.id);
      }

      // Double check full object
      const { data: fullChoir } = await supabase
        .from('choirs')
        .select('*')
        .eq('id', choir.id)
        .single();

      if (fullChoir) {
        return { choir: fullChoir as Choir, error: null };
      }

      return { choir: choir as Choir, error: null };
    } catch (err: any) {
      return { choir: null, error: err.message || 'Network error creating choir' };
    }
  },

  async findChoirByCode(code: string): Promise<Choir | null> {
    const supabase = createClient();
    const { data } = await supabase
      .from('choirs')
      .select('*')
      .eq('choir_code', code.trim().toUpperCase())
      .single();

    return data as Choir | null;
  },

  async joinChoirByCode(choirId: string): Promise<{ success: boolean; status: string; alreadyMember?: boolean; error: string | null }> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, status: '', error: 'User must be authenticated' };

    // Ensure profile exists
    const userFullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Choir Member';
    await supabase.from('profiles').upsert({
      id: user.id,
      full_name: userFullName,
      email: user.email!,
      phone: user.user_metadata?.phone || null,
      avatar_url: user.user_metadata?.avatar_url || null,
      is_super_admin: false,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    // Check if user is ALREADY a member
    const { data: existingMember } = await supabase
      .from('choir_members')
      .select('status, role')
      .eq('choir_id', choirId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingMember) {
      return {
        success: true,
        status: existingMember.status,
        alreadyMember: true,
        error: null,
      };
    }

    // Check choir details and auto-approve setting
    const { data: choir } = await supabase
      .from('choirs')
      .select('name, settings')
      .eq('id', choirId)
      .single();

    const autoApprove = (choir?.settings as ChoirSettings)?.auto_approve_members ?? false;
    const initialStatus = autoApprove ? 'active' : 'pending';

    const { error } = await supabase.from('choir_members').upsert({
      choir_id: choirId,
      user_id: user.id,
      role: 'member',
      status: initialStatus,
    }, { onConflict: 'choir_id,user_id' });

    if (error) return { success: false, status: '', error: error.message };

    // Notify Choir Master / Admins of join request!
    await notificationService.sendNotificationToChoirAdmins(
      choirId,
      `New Membership Request: ${userFullName}`,
      `${userFullName} (${user.email}) has requested to join ${choir?.name || 'your choir'}. Click to review and approve.`,
      'member_request',
      '/manage'
    );

    return { success: true, status: initialStatus, alreadyMember: false, error: null };
  },

  async getChoirMembers(choirId: string): Promise<ChoirMember[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('choir_members')
      .select('*, profile:profiles(*)')
      .eq('choir_id', choirId)
      .order('joined_at', { ascending: false });

    if (error || !data) return [];
    return data as ChoirMember[];
  },

  async updateMemberStatus(memberId: string, status: 'active' | 'rejected' | 'suspended'): Promise<boolean> {
    const supabase = createClient();
    const { data: member } = await supabase
      .from('choir_members')
      .select('user_id, choir_id')
      .eq('id', memberId)
      .single();

    const { error } = await supabase
      .from('choir_members')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', memberId);

    if (!error && member) {
      // Notify the member of their approval status!
      const statusTitle = status === 'active' ? 'Choir Membership Approved!' : status === 'rejected' ? 'Membership Request Update' : 'Membership Status Change';
      const statusMsg = status === 'active'
        ? 'Congratulations! Your membership request has been approved by the Choir Master. You now have full access to practice tracks.'
        : `Your choir membership status has been updated to ${status}.`;

      await notificationService.createNotification({
        user_id: member.user_id,
        choir_id: member.choir_id,
        title: statusTitle,
        message: statusMsg,
        type: 'status_update',
        priority: 'high',
        link: '/dashboard',
      });
    }

    return !error;
  },

  async getChoirSections(choirId: string): Promise<Section[]> {
    const supabase = createClient();
    const { data } = await supabase
      .from('sections')
      .select('*, leader_profile:profiles(*)')
      .eq('choir_id', choirId)
      .order('name');

    return (data as Section[]) || [];
  }
};
