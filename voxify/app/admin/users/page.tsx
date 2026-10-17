'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { adminService, UserWithChoirs } from '@/lib/services/adminService';
import { ArrowLeft, Users, Shield, ShieldAlert, Trash2, CheckCircle2, AlertCircle, Phone, Building2 } from 'lucide-react';

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserWithChoirs[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      const data = await adminService.getAllUsers();
      setUsers(data);
      setLoading(false);
    }
    loadUsers();
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

  const handleToggleSuperAdmin = async (targetUser: UserWithChoirs) => {
    const nextStatus = !targetUser.is_super_admin;
    const ok = await adminService.toggleSuperAdmin(targetUser.id, nextStatus);
    if (ok) {
      setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, is_super_admin: nextStatus } : u));
      setMessage({ type: 'success', text: `Updated ${targetUser.full_name}'s super admin privileges.` });
    } else {
      setMessage({ type: 'error', text: 'Failed to update super admin status.' });
    }
  };

  const handleDeleteUser = async (targetUser: UserWithChoirs) => {
    if (!confirm(`Are you sure you want to delete user "${targetUser.full_name}" (${targetUser.email})? This action will permanently remove their profile.`)) return;

    const ok = await adminService.deleteUser(targetUser.id);
    if (ok) {
      setUsers(prev => prev.filter(u => u.id !== targetUser.id));
      setMessage({ type: 'success', text: `Deleted user ${targetUser.full_name}.` });
    } else {
      setMessage({ type: 'error', text: 'Failed to delete user.' });
    }
  };

  const handleUserTypeChange = async (targetUser: UserWithChoirs, newType: string) => {
    const ok = await adminService.updateUserType(targetUser.id, newType);
    if (ok) {
      setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, user_type: newType as any } : u));
      setMessage({ type: 'success', text: `Updated ${targetUser.full_name}'s role to ${newType}.` });
    } else {
      setMessage({ type: 'error', text: 'Failed to update user role.' });
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
          <Users className="w-8 h-8 text-purple-400" /> Manage Registered Users ({users.length})
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
          <p className="text-xs text-slate-400 text-center py-10">Loading registered platform users...</p>
        ) : users.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-10">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-950 text-slate-400 font-semibold">
                <tr>
                  <th className="p-4 rounded-l-xl">User Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Account Type / Role</th>
                  <th className="p-4">Owned Choir(s)</th>
                  <th className="p-4">Super Admin</th>
                  <th className="p-4 rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-800/40">
                    <td className="p-4 font-semibold text-white">
                      {u.full_name}
                      {u.id === user.id && <span className="ml-2 text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-md font-bold">You</span>}
                    </td>
                    <td className="p-4 text-xs font-mono text-slate-300">{u.email}</td>
                    <td className="p-4 text-xs">
                      <select
                        value={u.user_type || 'regular'}
                        onChange={e => handleUserTypeChange(u, e.target.value)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border bg-slate-950 focus:outline-none cursor-pointer ${
                          u.user_type === 'artist'
                            ? 'text-amber-300 border-amber-500/50 bg-amber-950/40'
                            : u.user_type === 'choir_admin'
                            ? 'text-purple-300 border-purple-500/50 bg-purple-950/40'
                            : 'text-slate-300 border-slate-700'
                        }`}
                      >
                        <option value="regular">Regular Listener / Member</option>
                        <option value="artist">🎵 Music Artist / Creator</option>
                        <option value="choir_admin">👑 Choir Master / Admin</option>
                      </select>
                    </td>
                    <td className="p-4 text-xs">
                      {u.owned_choirs && u.owned_choirs.length > 0 ? (
                        <div className="space-y-1">
                          {u.owned_choirs.map(c => (
                            <span key={c.id} className="inline-flex items-center gap-1 text-[11px] bg-purple-950/80 text-purple-300 px-2.5 py-1 rounded-md border border-purple-800/40 font-semibold block">
                              <Building2 className="w-3 h-3 text-purple-400" /> {c.name} ({c.choir_code})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">No Choirs Owned</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2.5 py-1 rounded-md font-semibold uppercase ${
                        u.is_super_admin ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {u.is_super_admin ? 'Super Admin' : 'Standard'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleSuperAdmin(u)}
                          className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          {u.is_super_admin ? 'Revoke Admin' : 'Make Admin'}
                        </button>
                        {u.id !== user.id && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="text-xs text-rose-400 hover:underline flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        )}
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
