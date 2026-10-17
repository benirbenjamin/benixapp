'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { adminService, ChoirWithOwner } from '@/lib/services/adminService';
import { ArrowLeft, Music, Shield, Trash2, CheckCircle2, AlertCircle, Users, Phone, User } from 'lucide-react';

export default function AdminChoirsPage() {
  const { user } = useAuth();
  const [choirs, setChoirs] = useState<ChoirWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadChoirs() {
      setLoading(true);
      const data = await adminService.getAllChoirs();
      setChoirs(data);
      setLoading(false);
    }
    loadChoirs();
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

  const handleDeleteChoir = async (targetChoir: ChoirWithOwner) => {
    if (!confirm(`Are you sure you want to delete choir "${targetChoir.name}" (Code: ${targetChoir.choir_code})? This will delete all songs, events, and memberships associated with it.`)) return;

    const ok = await adminService.deleteChoir(targetChoir.id);
    if (ok) {
      setChoirs(prev => prev.filter(c => c.id !== targetChoir.id));
      setMessage({ type: 'success', text: `Deleted choir "${targetChoir.name}".` });
    } else {
      setMessage({ type: 'error', text: 'Failed to delete choir.' });
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
          <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">Platform Administration</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <Music className="w-8 h-8 text-indigo-400" /> Manage SaaS Choirs ({choirs.length})
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
          <p className="text-xs text-slate-400 text-center py-10">Loading registered platform choirs...</p>
        ) : choirs.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-10">No choirs found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-950 text-slate-400 font-semibold">
                <tr>
                  <th className="p-4 rounded-l-xl">Choir Name</th>
                  <th className="p-4">Choir Code</th>
                  <th className="p-4">Choir Master (Owner)</th>
                  <th className="p-4">Owner Phone Number</th>
                  <th className="p-4">Member Count</th>
                  <th className="p-4 rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {choirs.map(c => (
                  <tr key={c.id} className="hover:bg-slate-800/40">
                    <td className="p-4 font-semibold text-white">
                      <div>{c.name}</div>
                      {c.church_name && <div className="text-xs text-slate-400">{c.church_name}</div>}
                    </td>
                    <td className="p-4 font-mono font-bold text-purple-400">{c.choir_code}</td>
                    <td className="p-4 text-xs">
                      {c.owner ? (
                        <div>
                          <div className="font-bold text-white flex items-center gap-1">
                            <User className="w-3 h-3 text-purple-400" /> {c.owner.full_name}
                          </div>
                          <div className="text-slate-400 font-mono">{c.owner.email}</div>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Unknown Owner</span>
                      )}
                    </td>
                    <td className="p-4 text-xs text-purple-300 font-mono">
                      {c.owner?.phone ? (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-purple-400" /> {c.owner.phone}
                        </span>
                      ) : (
                        <span className="text-slate-600 font-sans italic">Not provided</span>
                      )}
                    </td>
                    <td className="p-4 text-xs font-bold text-emerald-400 flex items-center gap-1 pt-6">
                      <Users className="w-3.5 h-3.5" /> {c.member_count || 0} Members
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleDeleteChoir(c)}
                        className="text-xs text-rose-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete Choir
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
