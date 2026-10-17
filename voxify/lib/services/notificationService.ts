import { createClient } from '../supabase/client';
import { createAdminClient } from '../supabase/admin';
import { NotificationItem, NotificationPriority } from '../types/database.types';

function getDbClient() {
  if (typeof window === 'undefined') {
    try {
      return createAdminClient();
    } catch {
      return createClient();
    }
  }
  return createClient();
}

export const notificationService = {
  async getUserNotifications(userId: string): Promise<NotificationItem[]> {
    const supabase = getDbClient();
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data as NotificationItem[];
  },

  async getUnreadCount(userId: string): Promise<number> {
    const supabase = getDbClient();
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error || count === null) return 0;
    return count;
  },

  async markAsRead(notificationId: string): Promise<boolean> {
    const supabase = getDbClient();
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    return !error;
  },

  async markAllAsRead(userId: string): Promise<boolean> {
    const supabase = getDbClient();
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    return !error;
  },

  async createNotification(payload: {
    user_id: string;
    choir_id?: string;
    title: string;
    message: string;
    type?: string;
    priority?: NotificationPriority;
    link?: string;
  }): Promise<NotificationItem | null> {
    const supabase = getDbClient();
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: payload.user_id,
        choir_id: payload.choir_id || null,
        title: payload.title,
        message: payload.message,
        type: payload.type || 'general',
        priority: payload.priority || 'normal',
        link: payload.link || null,
        is_read: false,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Error creating notification:', error);
      return null;
    }
    return data as NotificationItem;
  },

  async notifyUser(
    userId: string,
    payload: {
      title: string;
      message: string;
      type?: string;
      link?: string;
      priority?: NotificationPriority;
    }
  ): Promise<boolean> {
    const res = await this.createNotification({
      user_id: userId,
      ...payload,
    });
    return !!res;
  },

  async sendNotificationToSuperAdmins(payload: {
    title: string;
    message: string;
    type?: string;
    link?: string;
    priority?: NotificationPriority;
  }): Promise<boolean> {
    try {
      const supabase = getDbClient();
      const { data: admins, error: adminErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_super_admin', true);

      if (adminErr) {
        console.error('Error fetching super admins:', adminErr);
        return false;
      }

      if (!admins || admins.length === 0) return true;

      const notifications = admins.map(a => ({
        user_id: a.id,
        title: payload.title,
        message: payload.message,
        type: payload.type || 'admin_alert',
        priority: payload.priority || 'high',
        link: payload.link || '/admin',
        is_read: false,
      }));

      const { error } = await supabase.from('notifications').insert(notifications);
      if (error) console.error('Error sending notification to super admins:', error);
      return !error;
    } catch (err) {
      console.error('Exception in sendNotificationToSuperAdmins:', err);
      return false;
    }
  },

  async sendNotificationToArtist(
    artistId: string,
    payload: {
      title: string;
      message: string;
      type?: string;
      link?: string;
      priority?: NotificationPriority;
    }
  ): Promise<boolean> {
    try {
      const supabase = getDbClient();
      const { data: artist, error: artistErr } = await supabase
        .from('artist_profiles')
        .select('user_id')
        .eq('id', artistId)
        .maybeSingle();

      if (artistErr || !artist?.user_id) {
        console.warn(`[Notification] Artist ${artistId} user_id lookup note:`, artistErr?.message);
        return false;
      }

      const { error } = await supabase.from('notifications').insert({
        user_id: artist.user_id,
        title: payload.title,
        message: payload.message,
        type: payload.type || 'artist_alert',
        priority: payload.priority || 'high',
        link: payload.link || '/artist/dashboard',
        is_read: false,
      });

      if (error) console.error('Error sending notification to artist:', error);
      return !error;
    } catch (err) {
      console.error('Exception in sendNotificationToArtist:', err);
      return false;
    }
  },

  async sendNotificationToChoir(
    choirId: string,
    title: string,
    message: string,
    type = 'general',
    link?: string,
    priority: NotificationPriority = 'normal'
  ): Promise<boolean> {
    const supabase = createClient();

    // 1. Fetch all active member user IDs in this choir
    const { data: members } = await supabase
      .from('choir_members')
      .select('user_id')
      .eq('choir_id', choirId)
      .eq('status', 'active');

    if (!members || members.length === 0) return true;

    // 2. Bulk insert notifications for each user
    const notifications = members.map(m => ({
      user_id: m.user_id,
      choir_id: choirId,
      title,
      message,
      type,
      priority,
      link: link || null,
      is_read: false,
    }));

    const { error } = await supabase.from('notifications').insert(notifications);
    return !error;
  },

  async sendNotificationToChoirAdmins(
    choirId: string,
    title: string,
    message: string,
    type = 'member_request',
    link = '/manage',
    priority: NotificationPriority = 'high'
  ): Promise<boolean> {
    const supabase = createClient();

    // 1. Fetch all choir owners and admins for this choir
    const { data: admins } = await supabase
      .from('choir_members')
      .select('user_id')
      .eq('choir_id', choirId)
      .in('role', ['owner', 'admin']);

    if (!admins || admins.length === 0) return true;

    // 2. Bulk insert admin notifications
    const notifications = admins.map(a => ({
      user_id: a.user_id,
      choir_id: choirId,
      title,
      message,
      type,
      priority,
      link,
      is_read: false,
    }));

    const { error } = await supabase.from('notifications').insert(notifications);
    return !error;
  }
};
