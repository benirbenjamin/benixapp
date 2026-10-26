import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Wallet,
  Shield,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  Sparkles
} from 'lucide-react';
import { getAuthToken } from '../../services/api';
import { AdminUserDetailModal } from './AdminUserDetailModal';

export const AdminUsersPanel: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch('/api/admin/users', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (err: any) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q) ||
      (u.id || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header & Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-[#0B0E14] border border-slate-800 space-y-1 shadow-lg">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Total User Accounts</span>
          <div className="text-2xl font-black text-white">{users.length}</div>
          <p className="text-[11px] text-slate-400">Registered unified BenixSpace profiles</p>
        </div>

        <div className="p-5 rounded-3xl bg-[#0B0E14] border border-slate-800 space-y-1 shadow-lg">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Verified Accounts</span>
          <div className="text-2xl font-black text-emerald-400">
            {users.filter(u => u.is_verified).length}
          </div>
          <p className="text-[11px] text-slate-400">Completed 5-digit verification</p>
        </div>

        <div className="p-5 rounded-3xl bg-[#0B0E14] border border-slate-800 space-y-1 shadow-lg">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Cumulative Wallet Balances</span>
          <div className="text-2xl font-black text-amber-400">
            {users.reduce((acc, u) => acc + Number(u.wallet_balance || 0), 0).toLocaleString()} RWF
          </div>
          <p className="text-[11px] text-slate-400">Total active funds in core wallets</p>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="p-6 rounded-3xl bg-[#0B0E14] border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <h3 className="font-extrabold text-white text-sm">
              User Directory & Wallet Control ({filtered.length})
            </h3>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, phone, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs rounded-xl pl-9 pr-3 py-2 text-white outline-none focus:border-blue-500 w-72"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500 text-xs space-y-3">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Loading registered user directory...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs space-y-2">
            <Users className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-white font-bold text-sm">No users match your search.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#121824] text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Phone</th>
                  <th className="p-3.5">Wallet Balance</th>
                  <th className="p-3.5">Verification</th>
                  <th className="p-3.5">Joined</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-[#0E1422]">
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-300 border border-blue-500/30 flex items-center justify-center font-black text-xs shrink-0">
                          {u.name ? u.name[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                          <span className="font-extrabold text-white text-xs block group-hover:text-blue-400 transition-colors">
                            {u.name || 'Anonymous User'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">{u.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        u.role === 'admin'
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {u.role || 'user'}
                      </span>
                    </td>

                    <td className="p-3.5 text-slate-300 font-mono">
                      {u.phone || 'N/A'}
                    </td>

                    <td className="p-3.5">
                      <span className="font-black text-emerald-400 text-xs">
                        {Number(u.wallet_balance || 0).toLocaleString()} RWF
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.is_verified
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {u.is_verified ? 'Verified ✓' : 'Unverified'}
                      </span>
                    </td>

                    <td className="p-3.5 text-slate-400 text-[11px]">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>

                    <td className="p-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUserId(u.id);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold transition-all inline-flex items-center gap-1"
                      >
                        <span>Manage User</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Details & Balance Adjustment Modal */}
      {selectedUserId && (
        <AdminUserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onUserUpdated={fetchUsers}
        />
      )}

    </div>
  );
};
