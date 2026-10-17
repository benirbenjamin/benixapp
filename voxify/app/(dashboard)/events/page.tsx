'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { useChoir } from '@/lib/context/ChoirContext';
import { eventService } from '@/lib/services/eventService';
import { Event } from '@/lib/types/database.types';
import {
  Calendar,
  Music,
  Clock,
  MapPin,
  Volume2,
  Plus,
  Send,
  Edit3,
  Trash2,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';

export default function EventsPage() {
  const { user } = useAuth();
  const { activeChoir, isAdmin } = useChoir();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit Event Modal State
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<'draft' | 'published' | 'ended' | 'cancelled'>('draft');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function loadEvents() {
      if (!activeChoir) return;
      setLoading(true);
      const data = await eventService.getChoirEvents(activeChoir.id);
      setEvents(data);
      setLoading(false);
    }
    loadEvents();
  }, [activeChoir]);

  const refreshEvents = async () => {
    if (activeChoir) {
      const data = await eventService.getChoirEvents(activeChoir.id);
      setEvents(data);
    }
  };

  const handlePublishEvent = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionId(eventId);
    const ok = await eventService.publishEvent(eventId);
    if (ok) {
      setMessage({ type: 'success', text: 'Event published to all singers!' });
      await refreshEvents();
    } else {
      setMessage({ type: 'error', text: 'Failed to publish event.' });
    }
    setActionId(null);
  };

  const handleUnpublishEvent = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionId(eventId);
    const ok = await eventService.unpublishEvent(eventId);
    if (ok) {
      setMessage({ type: 'success', text: 'Event unpublished (moved to draft).' });
      await refreshEvents();
    } else {
      setMessage({ type: 'error', text: 'Failed to unpublish event.' });
    }
    setActionId(null);
  };

  const handleDeleteEvent = async (eventId: string, eventTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete event "${eventTitle}"?`)) return;
    setActionId(eventId);
    const ok = await eventService.deleteEvent(eventId);
    if (ok) {
      setMessage({ type: 'success', text: `Deleted event "${eventTitle}".` });
      await refreshEvents();
    } else {
      setMessage({ type: 'error', text: 'Failed to delete event.' });
    }
    setActionId(null);
  };

  const openEditModal = (ev: Event) => {
    setEditingEvent(ev);
    setEditTitle(ev.title);
    setEditDate(ev.event_date);
    setEditStartTime(ev.start_time || '');
    setEditEndTime(ev.end_time || '');
    setEditLocation(ev.location || '');
    setEditDescription(ev.description || '');
    setEditStatus(ev.status as any || 'draft');
  };

  const handleSaveEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    setUpdating(true);
    const ok = await eventService.updateEvent(editingEvent.id, {
      title: editTitle.trim(),
      event_date: editDate,
      start_time: editStartTime,
      end_time: editEndTime || undefined,
      location: editLocation.trim() || undefined,
      description: editDescription.trim() || undefined,
      status: editStatus,
    });

    setUpdating(false);
    if (ok) {
      setMessage({ type: 'success', text: 'Event updated successfully!' });
      setEditingEvent(null);
      await refreshEvents();
    } else {
      setMessage({ type: 'error', text: 'Failed to update event.' });
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* Universal Back Button */}
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" /> Worship Services &amp; Rehearsals
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Click any event card to edit details, unpublish, publish or manage worship song assignments</p>
        </div>

        {(isAdmin || user?.is_super_admin) && (
          <Link
            href="/manage/events/new"
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Schedule New Event
          </Link>
        )}
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-xs flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Edit Event Modal */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-3xl space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Edit Event
              </h3>
              <button
                onClick={() => setEditingEvent(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditEvent} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Event Date *</label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="ended">Ended (Completed)</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={editStartTime}
                    onChange={e => setEditStartTime(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">End Time</label>
                  <input
                    type="time"
                    value={editEndTime}
                    onChange={e => setEditEndTime(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Location / Venue</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={e => setEditLocation(e.target.value)}
                  placeholder="Main Sanctuary / Choir Room"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Description / Notes</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md flex items-center gap-1.5"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Events List */}
      {loading ? (
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 py-16">Loading choir events...</p>
      ) : events.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-sm">
          <Calendar className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Events Scheduled</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Check back soon for new Sunday worship services or rehearsals.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {events.map(ev => {
            const isPast = ev.status === 'ended';

            return (
              <div
                key={ev.id}
                onClick={() => (isAdmin || user?.is_super_admin) && openEditModal(ev)}
                className={`bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border transition-all space-y-6 group cursor-pointer shadow-sm ${
                  isPast ? 'border-slate-200 dark:border-slate-800/60 opacity-85 hover:border-slate-300 dark:hover:border-slate-700' : 'border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                        ev.status === 'published'
                          ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
                          : ev.status === 'ended'
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          : ev.status === 'cancelled'
                          ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          : 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40'
                      }`}>
                        {ev.status === 'ended' ? '🔚 Event Ended' : ev.status}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> {ev.start_time} {ev.end_time ? `- ${ev.end_time}` : ''}
                      </span>
                    </div>

                    <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-2">
                      {ev.title}
                      {(isAdmin || user?.is_super_admin) && (
                        <span className="text-[10px] font-semibold text-slate-400 group-hover:text-blue-500 transition-colors">
                          (Click card to Edit)
                        </span>
                      )}
                    </h3>

                    {ev.location && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" /> {ev.location}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 flex-wrap">
                    <div className="bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block font-semibold">Date</span>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-300 font-mono">{ev.event_date}</span>
                    </div>

                    {/* Choir Master & Super Admin Control Buttons */}
                    {(isAdmin || user?.is_super_admin) && (
                      <div className="flex items-center gap-2">
                        {ev.status === 'draft' && (
                          <button
                            onClick={(e) => handlePublishEvent(ev.id, e)}
                            disabled={actionId === ev.id}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-2 rounded-xl shadow-md transition-all flex items-center gap-1"
                            title="Publish Event to Singers"
                          >
                            <Send className="w-3.5 h-3.5" /> Publish
                          </button>
                        )}

                        {ev.status === 'published' && (
                          <button
                            onClick={(e) => handleUnpublishEvent(ev.id, e)}
                            disabled={actionId === ev.id}
                            className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-3 py-2 rounded-xl shadow-md transition-all flex items-center gap-1"
                            title="Unpublish Event (Move to Draft)"
                          >
                            <EyeOff className="w-3.5 h-3.5" /> Unpublish
                          </button>
                        )}

                        <button
                          onClick={(e) => { e.stopPropagation(); openEditModal(ev); }}
                          className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1"
                          title="Edit Event Details"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>

                        <button
                          onClick={(e) => handleDeleteEvent(ev.id, ev.title, e)}
                          className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                          title="Delete Event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {ev.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{ev.description}</p>
                )}

                {/* Assigned Songs for this Event */}
                <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Music className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Assigned Songs for Worship
                  </h4>

                  {!ev.assigned_songs || ev.assigned_songs.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No songs assigned to this event yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {ev.assigned_songs.map((asg: any) => (
                        <Link
                          key={asg.id}
                          href={asg.song ? `/songs/${asg.song.id}` : '#'}
                          className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 hover:border-blue-400 dark:hover:border-blue-500 transition-all group/song"
                        >
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">
                              Track #{asg.order_index} • {asg.song?.category || 'Worship'}
                            </span>
                            <h5 className="font-bold text-slate-900 dark:text-white group-hover/song:text-blue-600 dark:group-hover/song:text-blue-400 transition-colors">
                              {asg.song?.title || 'Assigned Song'}
                            </h5>
                          </div>

                          <div className="bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 p-2 rounded-xl border border-blue-200 dark:border-blue-800/40 shrink-0">
                            <Volume2 className="w-4 h-4" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
