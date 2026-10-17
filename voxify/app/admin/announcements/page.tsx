'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Sparkles, Shield, Trash2, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';

export default function AdminAnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadGlobalAnnouncements() {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('announcements')
        .select('*, choir:choirs(*), author_profile:profiles(*)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setAnnouncements(data);
      }
      setLoading(false);
    }
    loadGlobalAnnouncements();
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

  const handleDeleteAnnouncement = async (targetAnn: any) => {
    if (!confirm(`Are you sure you want to delete announcement "${targetAnn.title}" from choir "${targetAnn.choir?.name}"?`)) return;

    const supabase = createClient();
    const { error } = await supabase.from('announcements').delete().eq('id', targetAnn.id);

    if (!error) {
      setAnnouncements(prev => prev.filter(a => a.id !== targetAnn.id));
      setMessage({ type: 'success', text: `Deleted announcement "${targetAnn.title}".` });
    } else {
      setMessage({ type: 'error', text: 'Failed to delete announcement.' });
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
          <Sparkles className="w-8 h-8 text-amber-400" /> Global Announcements Control ({announcements.length})
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
          <p className="text-xs text-slate-400 text-center py-10">Loading all global announcements...</p>
        ) : announcements.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-10">No announcements found across any choir.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-950 text-slate-400 font-semibold">
                <tr>
                  <th className="p-4 rounded-l-xl">Announcement Title</th>
                  <th className="p-4">Choir</th>
                  <th className="p-4">Author Profile</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Date Posted</th>
                  <th className="p-4 rounded-r-xl">Super Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {announcements.map(ann => (
                  <tr key={ann.id} className="hover:bg-slate-800/40">
                    <td className="p-4 font-semibold text-white">
                      <div>{ann.title}</div>
                      <div className="text-xs text-slate-400 line-clamp-1">{ann.content}</div>
                    </td>
                    <td className="p-4 text-xs font-semibold text-purple-300">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-purple-400" /> {ann.choir?.name || 'Choir'} ({ann.choir?.choir_code})
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-300">
                      {ann.author_profile?.full_name || 'Choir Director'}
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2.5 py-1 rounded-md font-semibold uppercase ${
                        ann.priority === 'high' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                      }`}>
                        {ann.priority}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-400 font-mono">
                      {new Date(ann.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleDeleteAnnouncement(ann)}
                        className="text-xs text-rose-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hide &amp; Delete
                      </button>
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
