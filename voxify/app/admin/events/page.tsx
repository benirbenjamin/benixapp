'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Event } from '@/lib/types/database.types';
import { ArrowLeft, Calendar, Shield, Trash2, Send, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';

export default function AdminEventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadGlobalEvents() {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('events')
        .select('*, choir:choirs(*)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setEvents(data);
      }
      setLoading(false);
    }
    loadGlobalEvents();
  }, []);

  if (!user?.is_super_admin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 text-white text-center space-y-4">
        <Shield className="w-16 h-16 text-rose-500 mx-auto animate-pulse" />
        <h1 className="text-2xl font-bold">Platform Super Admin Restricted</h1>
        <p className="text-xs text-slate-400">This area is reserved for platform super administrators.</p>
        <Link href="/dashboard" className="bg-purple-600 text-white font-semibold px-4 py-2 rounded-xl text-xs">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const handleDeleteEvent = async (targetEvent: any) => {
    if (!confirm(`Are you sure you want to delete event "${targetEvent.title}" from choir "${targetEvent.choir?.name}"?`)) return;

    const supabase = createClient();
    const { error } = await supabase.from('events').delete().eq('id', targetEvent.id);

    if (!error) {
      setEvents(prev => prev.filter(e => e.id !== targetEvent.id));
      setMessage({ type: 'success', text: `Deleted event "${targetEvent.title}".` });
    } else {
      setMessage({ type: 'error', text: 'Failed to delete event.' });
    }
  };

  const handleTogglePublishStatus = async (targetEvent: any) => {
    const nextStatus = targetEvent.status === 'published' ? 'draft' : 'published';
    const supabase = createClient();
    const { error } = await supabase
      .from('events')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', targetEvent.id);

    if (!error) {
      setEvents(prev => prev.map(e => e.id === targetEvent.id ? { ...e, status: nextStatus } : e));
      setMessage({ type: 'success', text: `Updated event status to ${nextStatus}.` });
    } else {
      setMessage({ type: 'error', text: 'Failed to update status.' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-8 text-white">
      <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Super Admin Portal
      </Link>

      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">Super Admin Platform Control</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <Calendar className="w-8 h-8 text-indigo-400" /> Global Events Management ({events.length})
        </h1>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-xs flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-slate-900/60 p-6 md:p-8 rounded-3xl border border-slate-800 space-y-6">
        {loading ? (
          <p className="text-xs text-slate-400 text-center py-10">Loading all global events...</p>
        ) : events.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-10">No events found across any choir.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-950 text-slate-400 font-semibold">
                <tr>
                  <th className="p-4 rounded-l-xl">Event Title</th>
                  <th className="p-4">Choir</th>
                  <th className="p-4">Event Date &amp; Time</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 rounded-r-xl">Super Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {events.map(ev => (
                  <tr key={ev.id} className="hover:bg-slate-800/40">
                    <td className="p-4 font-semibold text-white">{ev.title}</td>
                    <td className="p-4 text-xs font-semibold text-purple-300">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-purple-400" /> {ev.choir?.name || 'Choir'} ({ev.choir?.choir_code})
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-400 font-mono">
                      {ev.event_date} {ev.start_time}
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2.5 py-1 rounded-md font-semibold uppercase ${
                        ev.status === 'published' ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {ev.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleTogglePublishStatus(ev)}
                          className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <Send className="w-3.5 h-3.5" />
                          {ev.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(ev)}
                          className="text-xs text-rose-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
