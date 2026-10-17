import { createClient } from '../supabase/client';
import { Announcement, AnnouncementComment, NotificationPriority } from '../types/database.types';
import { notificationService } from './notificationService';

// Metadata helper to parse comments and reactions embedded in announcement's attachment_url field
function parseMetadata(ann: any): {
  realAttachment: string | null;
  comments: AnnouncementComment[];
  reactions: { user_id: string; reaction_type: string }[];
} {
  let realAttachment: string | null = null;
  let comments: AnnouncementComment[] = [];
  let reactions: { user_id: string; reaction_type: string }[] = [];

  if (!ann || !ann.attachment_url) {
    return { realAttachment, comments, reactions };
  }

  const str = ann.attachment_url;
  if (str.startsWith('__META_V2__:')) {
    try {
      const parsed = JSON.parse(str.replace('__META_V2__:', ''));
      realAttachment = parsed.realAttachment || null;
      comments = parsed.comments || [];
      reactions = parsed.reactions || [];
    } catch (e) {
      // ignore
    }
  } else if (!str.startsWith('__VOXIFY_META__:')) {
    realAttachment = str;
  }

  return { realAttachment, comments, reactions };
}

export const announcementService = {
  async getAnnouncements(choirId: string): Promise<Announcement[]> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Query announcements table without PostgREST relation syntax to avoid 404 join errors
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('choir_id', choirId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    // Fetch author profiles in batch
    const creatorIds = Array.from(new Set(data.map((a: any) => a.created_by).filter(Boolean)));
    let profileMap: Record<string, any> = {};

    if (creatorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', creatorIds);

      if (profiles) {
        profiles.forEach((p: any) => {
          profileMap[p.id] = p;
        });
      }
    }

    const announcements = data as Announcement[];

    return announcements.map(ann => {
      const meta = parseMetadata(ann);
      const userReactions = meta.reactions
        .filter(r => r.user_id === user?.id)
        .map(r => r.reaction_type);

      const authorProfile = profileMap[ann.created_by] || null;

      return {
        ...ann,
        author_profile: authorProfile,
        attachment_url: meta.realAttachment,
        comments_count: meta.comments.length,
        reactions_count: meta.reactions.length,
        user_reactions: userReactions,
      };
    });
  },

  async createAnnouncement(payload: {
    choir_id: string;
    title: string;
    content: string;
    priority?: NotificationPriority;
    target_scope?: 'all' | 'section';
    target_section_id?: string;
    attachment_url?: string;
  }): Promise<Announcement | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const initialMeta = '__META_V2__:' + JSON.stringify({
      realAttachment: payload.attachment_url || null,
      comments: [],
      reactions: [],
    });

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        choir_id: payload.choir_id,
        title: payload.title,
        content: payload.content,
        priority: payload.priority || 'normal',
        target_scope: payload.target_scope || 'all',
        target_section_id: payload.target_section_id || null,
        attachment_url: initialMeta,
        created_by: user.id,
      })
      .select()
      .single();

    if (error || !data) return null;

    // Trigger notification to all choir members
    await notificationService.sendNotificationToChoir(
      payload.choir_id,
      `Announcement: ${payload.title}`,
      payload.content.slice(0, 140),
      'announcement',
      '/announcements',
      payload.priority || 'normal'
    );

    return data as Announcement;
  },

  async deleteAnnouncement(announcementId: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', announcementId);

    return !error;
  },

  async getAnnouncementComments(announcementId: string): Promise<AnnouncementComment[]> {
    const supabase = createClient();
    const { data: ann } = await supabase
      .from('announcements')
      .select('attachment_url')
      .eq('id', announcementId)
      .single();

    if (!ann) return [];
    const meta = parseMetadata(ann);
    return meta.comments;
  },

  async addComment(announcementId: string, content: string): Promise<AnnouncementComment | null> {
    try {
      const res = await fetch('/api/announcements/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcementId, content }),
      });
      const data = await res.json();
      if (data.success && data.comment) {
        return data.comment as AnnouncementComment;
      }
      return null;
    } catch (err) {
      return null;
    }
  },

  async deleteComment(commentId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/announcements/comment?commentId=${encodeURIComponent(commentId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      return false;
    }
  },

  async toggleReaction(announcementId: string, reactionType: 'love' | 'amen' | 'clap' | 'fire'): Promise<boolean> {
    try {
      const res = await fetch('/api/announcements/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcementId, reactionType }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      return false;
    }
  }
};
