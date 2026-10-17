import { createClient } from '../supabase/client';
import { Event, EventSongAssignment } from '../types/database.types';
import { notificationService } from './notificationService';

export const eventService = {
  async getChoirEvents(choirId: string): Promise<Event[]> {
    const supabase = createClient();
    const todayStr = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('events')
      .select('*, assigned_songs:event_songs(*, song:songs(*, parts:song_parts(*)))')
      .eq('choir_id', choirId)
      .order('event_date', { ascending: true });

    if (error || !data) return [];

    // Automatically check and mark past events as "ended"
    const events = data as Event[];
    const updatedEvents = events.map(ev => {
      if (ev.event_date < todayStr && ev.status !== 'cancelled' && ev.status !== 'ended') {
        // Trigger silent async DB update for due events
        supabase
          .from('events')
          .update({ status: 'ended', updated_at: new Date().toISOString() })
          .eq('id', ev.id)
          .then();

        return { ...ev, status: 'ended' as any };
      }
      return ev;
    });

    return updatedEvents;
  },

  async createEvent(payload: {
    choir_id: string;
    title: string;
    event_date: string;
    start_time: string;
    end_time?: string;
    location?: string;
    description?: string;
    status?: 'draft' | 'published';
  }): Promise<{ event: Event | null; error: string | null }> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('events')
      .insert({
        ...payload,
        created_by: user?.id || null,
      })
      .select()
      .single();

    if (error || !data) {
      return { event: null, error: error?.message || 'Failed to create event' };
    }

    // Trigger notification to all choir members
    await notificationService.sendNotificationToChoir(
      payload.choir_id,
      `New Event: ${payload.title}`,
      `Scheduled for ${payload.event_date} at ${payload.start_time}`,
      'event',
      '/events'
    );

    return { event: data as Event, error: null };
  },

  async updateEvent(eventId: string, payload: {
    title?: string;
    event_date?: string;
    start_time?: string;
    end_time?: string;
    location?: string;
    description?: string;
    status?: 'draft' | 'published' | 'ended' | 'cancelled';
  }): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
      .from('events')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    return !error;
  },

  async deleteEvent(eventId: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    return !error;
  },

  async publishEvent(eventId: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
      .from('events')
      .update({ status: 'published', updated_at: new Date().toISOString() })
      .eq('id', eventId);

    return !error;
  },

  async unpublishEvent(eventId: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
      .from('events')
      .update({ status: 'draft', updated_at: new Date().toISOString() })
      .eq('id', eventId);

    return !error;
  },

  async assignSongToEvent(payload: {
    event_id: string;
    song_id: string;
    order_index?: number;
    notes?: string;
    target_scope?: 'all' | 'section' | 'members';
    target_section_id?: string;
  }): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
      .from('event_songs')
      .insert({
        event_id: payload.event_id,
        song_id: payload.song_id,
        order_index: payload.order_index || 1,
        notes: payload.notes || null,
        target_scope: payload.target_scope || 'all',
        target_section_id: payload.target_section_id || null,
      });

    return !error;
  },

  async removeSongFromEvent(eventId: string, songId: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
      .from('event_songs')
      .delete()
      .eq('event_id', eventId)
      .eq('song_id', songId);

    return !error;
  }
};
